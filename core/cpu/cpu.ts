import GameBoy from "../gameboy";
import Disassembler from "../../src/gameboy/tools/disassembler";

import { writeDebug } from "../../src/gameboy/tools/debug";
import { hex, pad, hexN_LC, hexN, r_pad, assert, unTwo8b } from "../../src/gameboy/tools/util";
import { VBLANK_VECTOR, LCD_STATUS_VECTOR, TIMER_OVERFLOW_VECTOR, SERIAL_LINK_VECTOR, JOYPAD_PRESS_VECTOR } from "../components/interrupt-controller";
import Decoder from './legacy_decoder';

function undefErr(cpu: CPU, name: string) {
    alert(`
    ${name} undefined
    
    Total Instructions: #${cpu.totalI}
    PC: 0x${cpu.pc.toString(16)}
    Opcode: 0x${cpu.gb.bus.readMem8(cpu.pc).toString(16)}
    Op: ${Decoder.rgOpcode(cpu.gb.bus.readMem8(cpu.pc)).op.name}
    `);
}

function overflow8bErr(cpu: CPU, name: string, overflow: any) {
    alert(`
    ${name} was set out of 0-255 (${overflow})
    
    Total Instructions: #${cpu.totalI}
    PC: 0x${cpu.pc.toString(16)}
    Opcode: 0x${cpu.gb.bus.readMem8(cpu.pc).toString(16)}
    Op: ${Decoder.rgOpcode(cpu.gb.bus.readMem8(cpu.pc)).op.name}
    `);
}

function overflow16bErr(cpu: CPU, name: string, overflow: any) {
    alert(`
    ${name} was set out of 0-65535 (${overflow})
    
    Total Instructions: #${cpu.totalI}
    PC: 0x${cpu.pc.toString(16)}
    Opcode: 0x${cpu.gb.bus.readMem8(cpu.pc).toString(16)}
    Op: ${Decoder.rgOpcode(cpu.gb.bus.readMem8(cpu.pc)).op.name}
    `);
}

class Registers {
    cpu: CPU;

    _f = {
        zero: false,
        negative: false,
        half_carry: false,
        carry: false
    };

    get f() {
        let flagN = 0;

        if (this._f.zero) flagN |= (1 << 7);
        if (this._f.negative) flagN |= (1 << 6);
        if (this._f.half_carry) flagN |= (1 << 5);
        if (this._f.carry) flagN |= (1 << 4);

        return flagN;
    }

    set f(i: number) {
        this._f.zero = (i & (1 << 7)) !== 0;
        this._f.negative = (i & (1 << 6)) !== 0;
        this._f.half_carry = (i & (1 << 5)) !== 0;
        this._f.carry = (i & (1 << 4)) !== 0;
    }

    sp = 0;

    /*
    * R8 internal magic numbers
    * 
    * A: 
    * B: 0x0
    * C: 0x1
    * D: 0x2
    * E: 0x3
    * H: 0x4
    * L: 0x5
    * (HL): 0x6
    * A: 0x7
    * 
    */
    0x0 = 0;
    0x1 = 0;
    0x2 = 0;
    0x3 = 0;
    0x4 = 0;
    0x5 = 0;
    get 0x6(): number { return this.cpu.fetchMem8(this.cpu.reg[R16.HL]); }
    set 0x6(i: number) { this.cpu.writeMem8(this.cpu.reg[R16.HL], i); }
    0x7 = 0;

    /*
    * R16 internal magic numbers:
    *
    * AF: 0x10
    * BC: 0x11
    * DE: 0x12
    * HL: 0x13
    * SP: 0x14
    */
    get 0x10() {
        return this[R8.A] << 8 | this.cpu.reg.f;
    }
    get 0x11() {
        return this[R8.B] << 8 | this[R8.C];
    }
    get 0x12() {
        return this[R8.D] << 8 | this[R8.E];
    }
    get 0x13() {
        return this[R8.H] << 8 | this[R8.L];
    }
    get 0x14() {
        return this.cpu.reg.sp;
    }
    set 0x10(i: number) {
        this[R8.A] = i >> 8;
        this.cpu.reg.f = i & 0xFF;
    }
    set 0x11(i: number) {
        this[R8.B] = i >> 8;
        this[R8.C] = i & 0xFF;
    }
    set 0x12(i: number) {
        this[R8.D] = i >> 8;
        this[R8.E] = i & 0xFF;
    }
    set 0x13(i: number) {
        this[R8.H] = i >> 8;
        this[R8.L] = i & 0xFF;
    }
    set 0x14(i: number) {
        this.cpu.reg.sp = i;
    }

    constructor(cpu: CPU) {
        this.cpu = cpu;
    }
}

export enum R8 {
    B = 0, C = 1, D = 2, E = 3, H = 4, L = 5, iHL = 6, A = 7
}

export enum R16 {
    AF = 0x10, BC = 0x11, DE = 0x12, HL = 0x13, SP = 0x14
}

export type R = R8 | R16;

export enum CC {
    UNCONDITIONAL = -1,
    NZ = 0,
    Z = 1,
    NC = 2,
    C = 3,
}

export type OperandType = R8 | R16 | CC | number;

export interface OpFunction {
    (cpu: CPU, ...others: any): void;
}

export interface Op {
    op: OpFunction, type?: OperandType, type2?: OperandType, length: number;
};

export default class CPU {
    constructor(gb: GameBoy) {
        this.gb = gb;
        writeDebug("CPU Bootstrap!");
    }

    halted = false;
    haltBug = false;

    invalidOpcodeExecuted = false;
    gb: GameBoy;

    logging = false;

    log: Array<string> = [];
    fullLog: Array<string> = [];

    // jumpLog: Array<string> = [];

    reg = new Registers(this);
    pc: number = 0x0000;

    breakpoints = new Array<boolean>(65536).fill(false);

    scheduleEnableInterruptsForNextTick = false;

    // #region

    cycles = 0;

    lastSerialOut = 0;
    lastInstructionDebug = "";
    lastOperandDebug = "";
    currentIns = "";

    lastOpcode = 0;
    lastOpcodeReps = 0;

    totalI = 0;
    time = 0;

    debugging = false;

    opcodesRan = new Set();

    minDebug = false;
    jumpLog: string[] = [];

    reset() {
        this.reg = new Registers(this);
        this.totalI = 0;
        this.time = 0;
        this.pc = 0;
        this.cycles = 0;
        this.haltBug = false;
        this.halted = false;
        this.scheduleEnableInterruptsForNextTick = false;
        this.invalidOpcodeExecuted = false;
    }

    // #endregion

    tick(i: number) {
        this.cycles += i;
        this.gb.tick(i);
    }

    fetchMem8(addr: number): number {
        this.tick(4);

        // The CPU can only access high RAM during OAM DMA
        if (this.gb.oamDmaTCyclesRemaining > 0) {
            if (addr >= 0xFF80 && addr <= 0xFFFE) {
                return this.gb.bus.readMem8(addr);
            } else {
                return 0xFF;
            }
        } else {
            return this.gb.bus.readMem8(addr);
        }
    }

    // Timing already satisfied by fetchMem8
    fetchMem16(addr: number): number {
        return this.fetchMem8(addr) | this.fetchMem8(addr + 1) << 8;
    }

    writeMem8(addr: number, value: number) {
        this.tick(4);
        if (this.gb.oamDmaTCyclesRemaining > 0) {
            if (addr >= 0xFF80 && addr <= 0xFF7F) {
                this.gb.bus.writeMem8(addr, value);
            }
        } else {
            this.gb.bus.writeMem8(addr, value);
        }
    }

    step(): number {
        if (this.invalidOpcodeExecuted) {
            this.tick(4);
        }

        const c = this.cycles;

        if (this.scheduleEnableInterruptsForNextTick) {
            this.scheduleEnableInterruptsForNextTick = false;
            this.gb.interrupts.masterEnabled = true;

            // if (this.minDebug)
            //     this.addToLog(`--- INTERRUPTS ENABLED ---`);
        }


        // // Run the debug information collector
        // if (this.debugging || this.logging)
        //     this.stepDebug();

        if (this.halted === false) {

            // if (this.minDebug) {
            //     if (Disassembler.isControlFlow(ins)) {
            //         if (Disassembler.willJump(ins, this)) {
            //             const disasm = Disassembler.disassembleOp(ins, pcTriplet, this);
            //             const to = Disassembler.willJumpTo(ins, pcTriplet, this);
            //             this.addToLog(`[${hex(this.pc, 4)}] ${disasm} => ${hex(to, 4)}`);
            //         }
            //     }
            // }

            // Call this one beautiful function that executes one instruction
            this.fetchDecodeExecute();
            this.pc &= 0xFFFF;

            this.totalI++;

            // Checking for proper timings below here

            // if (b0 !== 0xCB) {
            //     // These are variable length instructions / control flow
            //     const dontcare = [0x20, 0x30, 0x28, 0x38, 0xCB, 0xC0, 0xD0, 0xC2, 0xD2, 0xC4, 0xD4, 0xCA, 0xDA, 0xC8, 0x76, 0xD8, 0x10, 0xCC, 0xDC];

            //     if (!dontcare.includes(b0)) {

            //         let success = assert(this.cycles - c, Timings.NORMAL_TIMINGS[b0] * 4, "CPU timing");

            //         if (success == false) {
            //             console.log(hex(b0, 2));
            //             this.gb.speedStop();
            //         }
            //     }
            // } else {
            //     const dontcare: any[] = [];
            //     const b1 = this.gb.bus.readMem8(this.pc + 1);

            //     if (dontcare.includes(b1)) {

            //         let success = assert(this.cycles - c, Timings.CB_TIMINGS[b1] * 4, "[CB] CPU timing");

            //         if (success == false) {
            //             console.log(`${hex(b0, 2)},${hex(b1, 2)}`);
            //             this.gb.speedStop();
            //         }
            //     }
            // }

            // this.opcodesRan.add(pcTriplet[0]);
        } else {
            this.tick(4);
        }

        // If the CPU is HALTed and there are requested interrupts, unHALT
        if ((this.gb.interrupts.requested.numerical &
            this.gb.interrupts.enabled.numerical) && this.halted === true) {
            this.halted = false;


            this.tick(4);
            // UnHALTing takes 4 cycles
        }

        //#region Service interrupts
        const happened = this.gb.interrupts.requested;
        const enabled = this.gb.interrupts.enabled;
        if (this.gb.interrupts.masterEnabled) {

            // If servicing any interrupt, disable the master flag
            if ((this.gb.interrupts.requested.numerical & this.gb.interrupts.enabled.numerical) > 0) {
                this.gb.interrupts.masterEnabled = false;

                let vector = 0;
                if (happened.vblank && enabled.vblank) {
                    happened.vblank = false;

                    // if (this.minDebug)
                    //     this.addToLog(`--- VBLANK INTERRUPT ---`);

                    vector = VBLANK_VECTOR;
                } else if (happened.lcdStat && enabled.lcdStat) {
                    happened.lcdStat = false;

                    // if (this.minDebug)
                    //     this.addToLog(`--- LCDSTAT INTERRUPT ---`);

                    vector = LCD_STATUS_VECTOR;
                } else if (happened.timer && enabled.timer) {
                    happened.timer = false;

                    // if (this.minDebug)
                    //     this.addToLog(`--- TIMER INTERRUPT ---`);

                    vector = TIMER_OVERFLOW_VECTOR;
                } else if (happened.serial && enabled.serial) {
                    happened.serial = false;
                    vector = SERIAL_LINK_VECTOR;
                } else if (happened.joypad && enabled.joypad) {
                    happened.joypad = false;
                    vector = JOYPAD_PRESS_VECTOR;
                }

                // 2 M-cycles doing nothing
                // this.tick(8);

                const pcUpperByte = ((this.pc) & 0xFFFF) >> 8;
                const pcLowerByte = ((this.pc) & 0xFFFF) & 0xFF;

                this.reg.sp = (this.reg.sp - 1) & 0xFFFF;
                this.writeMem8(this.reg.sp, pcUpperByte);
                this.reg.sp = (this.reg.sp - 1) & 0xFFFF;
                this.writeMem8(this.reg.sp, pcLowerByte);

                // Setting PC takes 1 M-cycle
                // this.tick(4);

                this.pc = vector;
            }
        }
        //#endregion
        this.haltBug = false;

        let lastInstructionCycles = this.cycles - c;
        return lastInstructionCycles;
    }

    addToLog(s: string) {
        this.jumpLog.unshift(s);
        this.jumpLog = this.jumpLog.slice(0, 1000);
    }

    stepDebug() {
        const isCB = this.gb.bus.readMem8(this.pc) === 0xCB;

        const ins = isCB ? Decoder.cbOpcode(this.gb.bus.readMem8(this.pc + 1)) : Decoder.rgOpcode(this.gb.bus.readMem8(this.pc));

        if (!ins.op) {
            alert(`[DEBUGGER] Implementation error: ${isCB ? hex((0xCB << 8 | this.gb.bus.readMem8(this.pc + 1)), 4) : hex(this.gb.bus.readMem8(this.pc), 2)} is a null op`);
        }

        const opcode = isCB ? this.gb.bus.readMem8(this.pc + 1) : this.gb.bus.readMem8(this.pc);

        if (opcode === this.lastOpcode) {
            this.lastOpcodeReps++;
        } else {
            this.lastOpcodeReps = 0;
        }
        this.lastOpcode = opcode;

        if (!ins) {
            console.error("Reading error at: 0x" + this.pc.toString(16));
        }

        if (ins.length === undefined) {
            alert(`[${ins.op.name}] Op has no length specified.`);
        }

        // if ((ins.op.length === 1 && (!ins.type)) || (ins.op.length === 2 && (!ins.type || !ins.type2))) {
        //     alert(`[Arg length 1 || 2] Implementation error: ${ins.op.name} 0x${this.fetchMem8(this.pc).toString(16)}`);
        // }
        // if (ins.op.length === 3 && (ins.type ==== undefined || ins.type2 ==== undefined)) {
        //     alert(`[Arg length 3] Implementation error: ${ins.op.name} 0x${this.fetchMem8(this.pc).toString(16)}`);
        // }

        if (this.debugging) {
            console.debug(`PC: ${this.pc}`);
            writeDebug(`[OPcode: ${hex(this.gb.bus.readMem16(this.pc), 2)}, OP: ${ins.op.name}] ${isCB ? "[0xCB Prefix] " : ""}Executing op: 0x` + pad(this.gb.bus.readMem8(this.pc).toString(16), 2, '0'));
            writeDebug("Instruction length: " + ins.length);
        }

        const pcTriplet = Uint8Array.of(this.gb.bus.readMem8(this.pc + 0), this.gb.bus.readMem8(this.pc + 1), this.gb.bus.readMem8(this.pc + 2));

        if (this.logging) {

            const flags = `${this.reg._f.zero ? 'Z' : '-'}${this.reg._f.negative ? 'N' : '-'}${this.reg._f.half_carry ? 'H' : '-'}${this.reg._f.carry ? 'C' : '-'}`;

            // this.log.push(`A:${hexN(this._r.a, 2)} F:${flags} BC:${hexN(this._r.bc, 4)} DE:${hexN_LC(this._r.de, 4)} HL:${hexN_LC(this._r.hl, 4)
            // } SP:${hexN_LC(this._r.sp, 4)} PC:${hexN_LC(this.pc, 4)} (cy: ${this.cycles})`);

            /*
            this.log.push(`A:${hexN(this.reg[R8.A], 2)} F:${flags} BC:${hexN(this.reg[R16.BC], 4)} DE:${hexN_LC(this.reg[R16.DE], 4)} HL:${hexN_LC(this.reg[R16.HL], 4)
                } SP:${hexN_LC(this.reg.sp, 4)} PC:${hexN_LC(this.pc, 4)}`); */
            this.fullLog.push(`A:${hexN(this.reg[R8.A], 2)} F:${flags} BC:${hexN(this.reg[R16.BC], 4)} DE:${hexN_LC(this.reg[R16.DE], 4)} HL:${hexN_LC(this.reg[R16.HL], 4)
                } SP:${hexN_LC(this.reg.sp, 4)} PC:${hexN_LC(this.pc, 4)} (cy: ${this.cycles}) |[00]0x${hexN_LC(this.pc, 4)}: ${Disassembler.disassembleOp(ins, pcTriplet, this, this.pc)}`);
        }
    }

    toggleBreakpoint(point: number) {
        if (!this.breakpoints[point]) {
            this.setBreakpoint(point);
        } else {
            this.clearBreakpoint(point);
        }
    }
    setBreakpoint(point: number) {
        writeDebug("Set breakpoint at " + hex(point, 4));
        this.breakpoints[point] = true;
    }
    clearBreakpoint(point: number) {
        writeDebug("Cleared breakpoint at " + hex(point, 4));
        this.breakpoints[point] = false;
    }

    /**
     * Executes an instruction.
     * 
     * Timings are atomic by instruction in this emulator, so running components in between fetch, decode, and execute I just don't care about.
     * In more accurate emulators, sub-instruction timings are important. About this? I don't care. My emulator isn't striving to be the most accurate.
     * 
     */
    fetchDecodeExecute(): void {
        const b0 = this.fetchMem8(this.pc + 0);

        switch (b0) {
            /** LD R16, N16 */
            case 0x01: // LD BC, N16
            case 0x11: // LD DE, N16
            case 0x21: // LD HL, N16
            case 0x31: // LD SP, N16
                {
                    const n16 = this.fetchMem16(this.pc + 1);

                    const target = [R16.BC, R16.DE, R16.HL, R16.SP][(b0 & 0b110000) >> 4];
                    this.reg[target] = n16;
                }
                this.pc += 3;
                return;

            case 0xFA: // LD A, [N16]
                {
                    const n16 = this.fetchMem16(this.pc + 1);

                    this.reg[R8.A] = this.fetchMem8(n16);
                }
                this.pc += 3;
                return;
            case 0xEA: // LD [N16], A
                {
                    const n16 = this.fetchMem16(this.pc + 1);

                    this.writeMem8(n16, this.reg[R8.A]);
                }
                this.pc += 3;
                return;
            case 0x08: // LD [N16], SP
                {
                    const n16 = this.fetchMem16(this.pc + 1);

                    const spUpperByte = this.reg.sp >> 8;
                    const spLowerByte = this.reg.sp & 0b11111111;

                    this.writeMem8(n16 + 0, spLowerByte);
                    this.writeMem8(n16 + 1, (spUpperByte) & 0xFFFF);
                }
                this.pc += 3;
                return;

            case 0xC3: // JP N16
            case 0xC2: // JP NZ, N16
            case 0xCA: // JP Z, N16
            case 0xD2: // JP NC, N16
            case 0xDA: // JP C, N16
                {
                    // If unconditional, don't check
                    if (b0 !== 0xC3) {
                        const cc: CC = (b0 & 0b11000) >> 3;
                        if (cc === CC.NZ && this.reg._f.zero) { this.pc += 3; this.tick(8); return; }
                        else if (cc === CC.Z && !this.reg._f.zero) { this.pc += 3; this.tick(8); return; }
                        else if (cc === CC.NC && this.reg._f.carry) { this.pc += 3; this.tick(8); return; }
                        else if (cc === CC.C && !this.reg._f.carry) { this.pc += 3; this.tick(8); return; }
                    }

                    const n16 = this.fetchMem16(this.pc + 1);
                    this.pc = n16 - 3;

                    this.tick(4); // Branching takes 4 cycles
                }
                this.pc += 3;
                return;

            /** CALL */
            case 0xCD: // CALL N16
            case 0xDC: // CALL C, N16
            case 0xD4: // CALL NC, N16
            case 0xCC: // CALL Z, N16
            case 0xC4: // CALL NZ, N16
                {
                    if (b0 !== 0xCD) {
                        const cc: CC = (b0 & 0b11000) >> 3;
                        if (cc === CC.NZ && this.reg._f.zero) { this.pc += 3; this.tick(8); return; }
                        else if (cc === CC.Z && !this.reg._f.zero) { this.pc += 3; this.tick(8); return; }
                        else if (cc === CC.NC && this.reg._f.carry) { this.pc += 3; this.tick(8); return; }
                        else if (cc === CC.C && !this.reg._f.carry) { this.pc += 3; this.tick(8); return; }
                    }

                    const pcUpperByte = ((this.pc + 3) & 0xFFFF) >> 8;
                    const pcLowerByte = ((this.pc + 3) & 0xFFFF) & 0xFF;

                    // console.info(`Calling 0x${u16.toString(16)} from 0x${this.pc.toString(16)}`);

                    this.reg.sp = (this.reg.sp - 1) & 0xFFFF;
                    this.writeMem8(this.reg.sp, pcUpperByte);
                    this.reg.sp = (this.reg.sp - 1) & 0xFFFF;
                    this.writeMem8(this.reg.sp, pcLowerByte);

                    const n16 = this.fetchMem16(this.pc + 1);
                    this.pc = n16 - 3;

                    this.tick(4); // Branching takes 4 cycles
                }
                this.pc += 3;
                return;

            /** Interrupts */
            case 0x10: // STOP
                if (this.gb.prepareSpeedSwitch) {
                    this.gb.doubleSpeed = !this.gb.doubleSpeed;
                }
                this.pc += 2;
                return;

            /** LD between A and High RAM */
            case 0xF0: // LD A, [$FF00+N8]
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    this.reg[R8.A] = this.fetchMem8((0xFF00 | b1) & 0xFFFF);
                }
                this.pc += 2;
                return;
            case 0xE0: // LD [$FF00+N8], A
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    this.writeMem8((0xFF00 | b1) & 0xFFFF, this.reg[R8.A]);
                }
                this.pc += 2;
                return;
            case 0x36: // LD [HL], N8
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    this.writeMem8(this.reg[R16.HL], b1);
                }
                this.pc += 2;
                return;

            /** SP ops */
            case 0xF8: // LD HL, SP+e8
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    const signedVal = unTwo8b(b1);

                    this.reg._f.zero = false;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = (signedVal & 0xF) + (this.reg.sp & 0xF) > 0xF;
                    this.reg._f.carry = (signedVal & 0xFF) + (this.reg.sp & 0xFF) > 0xFF;

                    this.reg[R16.HL] = (unTwo8b(b1) + this.reg.sp) & 0xFFFF;

                    // Register read timing
                    this.tick(4);
                }
                this.pc += 2;
                return;
            case 0xE8: // ADD SP, E8
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    const value = unTwo8b(b1);

                    this.reg._f.zero = false;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = ((value & 0xF) + (this.reg.sp & 0xF)) > 0xF;
                    this.reg._f.carry = ((value & 0xFF) + (this.reg.sp & 0xFF)) > 0xFF;

                    this.reg.sp = (this.reg.sp + value) & 0xFFFF;

                    // Extra time
                    this.tick(8);
                }
                this.pc += 2;
                return;


            /** A ops */
            case 0xE6: // AND A, N8
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    const value = b1;

                    const final = value & this.reg[R8.A];
                    this.reg[R8.A] = final;

                    this.reg._f.zero = this.reg[R8.A] === 0;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = true;
                    this.reg._f.carry = false;
                }
                this.pc += 2;
                return;
            case 0xF6: // OR A, N8
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    const value = b1;

                    const final = value | this.reg[R8.A];
                    this.reg[R8.A] = final;

                    this.reg._f.zero = final === 0;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = false;
                    this.reg._f.carry = false;
                    this.pc += 2;
                    return;
                }
            case 0xEE: // XOR A, N8
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    const value = b1;

                    const final = value ^ this.reg[R8.A];
                    this.reg[R8.A] = final;

                    this.reg._f.zero = final === 0;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = false;
                    this.reg._f.carry = false;
                }
                this.pc += 2;
                return;
            case 0xFE: // CP A, N8
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    const value = b1;

                    const newValue = (this.reg[R8.A] - value) & 0xFF;

                    // Set flags
                    this.reg._f.carry = value > this.reg[R8.A];
                    this.reg._f.zero = newValue === 0;
                    this.reg._f.negative = true;
                    this.reg._f.half_carry = (this.reg[R8.A] & 0xF) - (b1 & 0xF) < 0;
                }
                this.pc += 2;
                return;

            /** JR */
            case 0x18: // JR E8
            case 0x20: // JR NZ, E8
            case 0x28: // JR Z, E8
            case 0x30: // JR NC, E8
            case 0x38: // JR C, E8
                {
                    if (b0 !== 0x18) {
                        const cc: CC = (b0 & 0b11000) >> 3;
                        if (cc === CC.NZ && this.reg._f.zero) { this.pc += 2; this.tick(4); return; }
                        else if (cc === CC.Z && !this.reg._f.zero) { this.pc += 2; this.tick(4); return; }
                        else if (cc === CC.NC && this.reg._f.carry) { this.pc += 2; this.tick(4); return; }
                        else if (cc === CC.C && !this.reg._f.carry) { this.pc += 2; this.tick(4); return; }
                    }

                    const b1 = this.fetchMem8(this.pc + 1);
                    this.pc += unTwo8b(b1);

                    this.tick(4); // Branching takes 4 cycles
                }
                this.pc += 2;
                return;
            /** Arithmetic */
            case 0xC6: // ADD A, N8
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    const value = b1;

                    const newValue = (value + this.reg[R8.A]) & 0xFF;
                    const didOverflow = ((value + this.reg[R8.A]) >> 8) !== 0;

                    // Set flags
                    this.reg._f.zero = newValue === 0;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = (this.reg[R8.A] & 0xF) + (value & 0xF) > 0xF;
                    this.reg._f.carry = didOverflow;

                    // Set register values
                    this.reg[R8.A] = newValue;
                }
                this.pc += 2;
                return;
            case 0xCE: // ADC A, N8
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    const value = b1;

                    const newValue = (value + this.reg[R8.A] + (this.reg._f.carry ? 1 : 0)) & 0xFF;
                    const didOverflow = ((value + this.reg[R8.A] + (this.reg._f.carry ? 1 : 0)) >> 8) !== 0;

                    // Set flags
                    this.reg._f.zero = newValue === 0;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = (this.reg[R8.A] & 0xF) + (value & 0xF) + (this.reg._f.carry ? 1 : 0) > 0xF;
                    this.reg._f.carry = didOverflow;

                    // Set register values
                    this.reg[R8.A] = newValue;
                }
                this.pc += 2;
                return;
            case 0xD6: // SUB A, N8
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    const value = b1;

                    const newValue = (this.reg[R8.A] - value) & 0xFF;

                    // Set flags
                    this.reg._f.zero = newValue === 0;
                    this.reg._f.negative = true;
                    this.reg._f.half_carry = (value & 0xF) > (this.reg[R8.A] & 0xF);
                    this.reg._f.carry = value > this.reg[R8.A];

                    // Set register values
                    this.reg[R8.A] = newValue;
                }
                this.pc += 2;
                return;
            case 0xDE: // SBC A, N8
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    const value = b1;

                    const newValue = (this.reg[R8.A] - value - (this.reg._f.carry ? 1 : 0)) & 0xFF;

                    // Set flags
                    this.reg._f.zero = newValue === 0;
                    this.reg._f.negative = true;
                    this.reg._f.half_carry = (value & 0xF) > (this.reg[R8.A] & 0xF) - (this.reg._f.carry ? 1 : 0);
                    this.reg._f.carry = value > this.reg[R8.A] - (this.reg._f.carry ? 1 : 0);

                    // Set register values
                    this.reg[R8.A] = newValue;
                }
                this.pc += 2;
                return;


            /** LD R8, N8 */
            case 0x06: // LD B, N8
            case 0x0E: // LD C, N8
            case 0x16: // LD D, N8
            case 0x1E: // LD E, n8
            case 0x26: // LD H, N8
            case 0x2E: // LD L, N8
            case 0x36: // LD (HL), N8
            case 0x3E: // LD A, N8
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    const target: R8 = (b0 & 0b111000) >> 3;
                    this.reg[target] = b1;
                }
                this.pc += 2;
                return;

            case 0xF9: // LD SP, HL
                {
                    this.reg.sp = this.reg[R16.HL];
                    // Register read timing
                    this.tick(4);
                }
                this.pc += 1;
                return;

            // LD R8, R8
            case 0x40: case 0x41: case 0x42: case 0x43: case 0x44: case 0x45: case 0x46: case 0x47: case 0x48: case 0x49: case 0x4A: case 0x4B: case 0x4C: case 0x4D: case 0x4E: case 0x4F:
            case 0x50: case 0x51: case 0x52: case 0x53: case 0x54: case 0x55: case 0x56: case 0x57: case 0x58: case 0x59: case 0x5A: case 0x5B: case 0x5C: case 0x5D: case 0x5E: case 0x5F:
            case 0x60: case 0x61: case 0x62: case 0x63: case 0x64: case 0x65: case 0x66: case 0x67: case 0x68: case 0x69: case 0x6A: case 0x6B: case 0x6C: case 0x6D: case 0x6E: case 0x6F:
            case 0x70: case 0x71: case 0x72: case 0x73: case 0x74: case 0x75: /* HALT */ case 0x77: case 0x78: case 0x79: case 0x7A: case 0x7B: case 0x7C: case 0x7D: case 0x7E: case 0x7F:
                {
                    const source: R8 = b0 & 0b111;
                    const dest: R8 = (b0 & 0b111000) >> 3;
                    this.reg[dest] = this.reg[source];
                }
                this.pc += 1;
                return;

            /** PUSH R16 */
            case 0xF5: // PUSH AF 
            case 0xC5: // PUSH BC
            case 0xD5: // PUSH DE
            case 0xE5: // PUSH HL
                {
                    const target = [R16.BC, R16.DE, R16.HL, R16.AF][(b0 & 0b110000) >> 4];

                    const value = this.reg[target];
                    const upperByte = value >> 8;
                    const lowerByte = value & 0b11111111;

                    this.reg.sp = (this.reg.sp - 1) & 0xFFFF;
                    this.writeMem8(this.reg.sp, upperByte);
                    this.reg.sp = (this.reg.sp - 1) & 0xFFFF;
                    this.writeMem8(this.reg.sp, lowerByte);

                    // 4 cycle penalty
                    this.tick(4);
                }
                this.pc += 1;
                return;

            /** POP R16 */
            case 0xC1: // POP BC
            case 0xD1: // POP DE
            case 0xE1: // POP HL
            case 0xF1: // POP AF 
                {
                    const target = [R16.BC, R16.DE, R16.HL, R16.AF][(b0 & 0b110000) >> 4];

                    const lowerByte = this.fetchMem8(this.reg.sp);
                    this.reg.sp = (this.reg.sp + 1) & 0xFFFF;
                    const upperByte = this.fetchMem8(this.reg.sp);
                    this.reg.sp = (this.reg.sp + 1) & 0xFFFF;

                    this.reg[target] = (upperByte << 8) | lowerByte;
                }
                this.pc += 1;
                return;

            /** INC R8 */
            case 0x04: // INC B
            case 0x0C: // INC C
            case 0x14: // INC D
            case 0x1C: // INC E
            case 0x24: // INC H
            case 0x2C: // INC L
            case 0x34: // INC [HL]
            case 0x3C: // INC A
                {
                    const dest: R8 = (b0 & 0b111000) >> 3;

                    const oldValue = this.reg[dest];
                    const newValue = (oldValue + 1) & 0xFF;
                    this.reg[dest] = newValue;
                    this.reg._f.zero = newValue === 0;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = (oldValue & 0xF) + (1 & 0xF) > 0xF;
                }
                this.pc += 1;
                return;

            /** DEC R8 */
            case 0x05: // DEC B
            case 0x0D: // DEC C
            case 0x15: // DEC D
            case 0x1D: // DEC E
            case 0x25: // DEC H
            case 0x2D: // DEC L
            case 0x35: // DEC [HL]
            case 0x3D: // DEC A
                {
                    const dest: R8 = (b0 & 0b111000) >> 3;

                    const oldValue = this.reg[dest];
                    const newValue = (oldValue - 1) & 0xFF;
                    this.reg[dest] = newValue;

                    this.reg._f.zero = newValue === 0;
                    this.reg._f.negative = true;
                    this.reg._f.half_carry = (1 & 0xF) > (oldValue & 0xF);
                }
                this.pc += 1;
                return;

            /** INC R16 */
            case 0x03: // INC BC
            case 0x13: // INC DE 
            case 0x23: // INC HL
            case 0x33: // INC SP
                {
                    const target = [R16.BC, R16.DE, R16.HL, R16.SP][(b0 & 0b110000) >> 4];
                    this.reg[target] = (this.reg[target] + 1) & 0xFFFF;
                    this.tick(4);
                }
                this.pc += 1;
                return;

            /** DEC R16 */
            case 0x0B: // DEC BC
            case 0x1B: // DEC DE 
            case 0x2B: // DEC HL
            case 0x3B: // DEC SP
                {
                    const target = [R16.BC, R16.DE, R16.HL, R16.SP][(b0 & 0b110000) >> 4];
                    this.reg[target] = (this.reg[target] - 1) & 0xFFFF;
                    this.tick(4);
                }
                this.pc += 1;
                return;

            // #region Accumulator Arithmetic
            case 0x80: // ADD A, B
            case 0x81: // ADD A, C
            case 0x82: // ADD A, D
            case 0x83: // ADD A, E
            case 0x84: // ADD A, H
            case 0x85: // ADD A, L
            case 0x86: // ADD A, (HL)
            case 0x87: // ADD A, A
                {
                    const source: R8 = b0 & 0b111;

                    let value = this.reg[source];
                    this.reg._f.half_carry = (this.reg[R8.A] & 0xF) + (value & 0xF) > 0xF;

                    let newValue = (value + this.reg[R8.A]) & 0xFF;
                    let didOverflow = ((value + this.reg[R8.A]) >> 8) !== 0;

                    // Set register values
                    this.reg[R8.A] = newValue;

                    // Set flags
                    this.reg._f.carry = didOverflow;
                    this.reg._f.zero = newValue === 0;
                    this.reg._f.negative = false;
                }

                this.pc += 1;
                return;

            case 0x88: // ADC A, B
            case 0x89: // ADC A, C
            case 0x8A: // ADC A, D
            case 0x8B: // ADC A, E
            case 0x8C: // ADC A, H
            case 0x8D: // ADC A, L
            case 0x8E: // ADC A, (HL)
            case 0x8F: // ADC A, A
                {
                    const source: R8 = b0 & 0b111;

                    let value = this.reg[source];

                    let newValue = (value + this.reg[R8.A] + (this.reg._f.carry ? 1 : 0)) & 0xFF;
                    let didOverflow = ((value + this.reg[R8.A] + (this.reg._f.carry ? 1 : 0)) >> 8) !== 0;

                    // Set flags
                    this.reg._f.zero = newValue === 0;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = (this.reg[R8.A] & 0xF) + (value & 0xF) + (this.reg._f.carry ? 1 : 0) > 0xF;
                    this.reg._f.carry = didOverflow;

                    // Set register values
                    this.reg[R8.A] = newValue;
                }

                this.pc += 1;
                return;

            case 0x90: // SUB A, B
            case 0x91: // SUB A, C
            case 0x92: // SUB A, D
            case 0x93: // SUB A, E
            case 0x94: // SUB A, H
            case 0x95: // SUB A, L
            case 0x96: // SUB A, (HL)
            case 0x97: // SUB A, A
                {
                    const source: R8 = b0 & 0b111;

                    const value = this.reg[source];

                    const newValue = (this.reg[R8.A] - value) & 0xFF;

                    // Set flags
                    this.reg._f.zero = newValue === 0;
                    this.reg._f.negative = true;
                    this.reg._f.half_carry = (value & 0xF) > (this.reg[R8.A] & 0xF);
                    this.reg._f.carry = value > this.reg[R8.A];

                    // Set register values
                    this.reg[R8.A] = newValue;
                }

                this.pc += 1;
                return;

            case 0x98: // SBC A, B
            case 0x99: // SBC A, C
            case 0x9A: // SBC A, D
            case 0x9B: // SBC A, E
            case 0x9C: // SBC A, H
            case 0x9D: // SBC A, L
            case 0x9E: // SBC A, (HL)
            case 0x9F: // SBC A, A
                {
                    const source: R8 = b0 & 0b111;

                    const value = this.reg[source];

                    const newValue = (this.reg[R8.A] - value - (this.reg._f.carry ? 1 : 0)) & 0xFF;

                    // Set flags
                    this.reg._f.zero = newValue === 0;
                    this.reg._f.negative = true;
                    this.reg._f.half_carry = (value & 0xF) > (this.reg[R8.A] & 0xF) - (this.reg._f.carry ? 1 : 0);
                    this.reg._f.carry = value > this.reg[R8.A] - (this.reg._f.carry ? 1 : 0);

                    // Set register values
                    this.reg[R8.A] = newValue;
                }

                this.pc += 1;
                return;

            case 0xA0: // AND A, B
            case 0xA1: // AND A, C
            case 0xA2: // AND A, D
            case 0xA3: // AND A, E
            case 0xA4: // AND A, H
            case 0xA5: // AND A, L
            case 0xA6: // AND A, (HL)
            case 0xA7: // AND A, A
                {
                    const source: R8 = b0 & 0b111;

                    const value = this.reg[source];

                    const final = value & this.reg[R8.A];
                    this.reg[R8.A] = final;

                    // Set flags
                    this.reg._f.zero = this.reg[R8.A] === 0;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = true;
                    this.reg._f.carry = false;
                }

                this.pc += 1;
                return;

            case 0xA8: // XOR A, B
            case 0xA9: // XOR A, C
            case 0xAA: // XOR A, D
            case 0xAB: // XOR A, E
            case 0xAC: // XOR A, H
            case 0xAD: // XOR A, L
            case 0xAE: // XOR A, (HL)
            case 0xAF: // XOR A, A
                {
                    const source: R8 = b0 & 0b111;

                    const value = this.reg[source];

                    const final = value ^ this.reg[R8.A];
                    this.reg[R8.A] = final;

                    this.reg._f.zero = final === 0;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = false;
                    this.reg._f.carry = false;
                }

                this.pc += 1;
                return;

            case 0xB0: // OR A, B
            case 0xB1: // OR A, C
            case 0xB2: // OR A, D
            case 0xB3: // OR A, E
            case 0xB4: // OR A, H
            case 0xB5: // OR A, L
            case 0xB6: // OR A, (HL)
            case 0xB7: // OR A, A
                {
                    const source: R8 = b0 & 0b111;

                    const value = this.reg[source];

                    const final = value | this.reg[R8.A];
                    this.reg[R8.A] = final;

                    this.reg._f.zero = final === 0;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = false;
                    this.reg._f.carry = false;
                }

                this.pc += 1;
                return;

            case 0xB8: // CP A, B
            case 0xB9: // CP A, C
            case 0xBA: // CP A, D
            case 0xBB: // CP A, E
            case 0xBC: // CP A, H
            case 0xBD: // CP A, L
            case 0xBE: // CP A, (HL)
            case 0xBF: // CP A, A
                {
                    const source: R8 = b0 & 0b111;

                    const r8 = this.reg[source];

                    const newValue = (this.reg[R8.A] - r8) & 0xFF;

                    // DO not set register values for CP

                    // Set flags
                    this.reg._f.carry = r8 > this.reg[R8.A];
                    this.reg._f.zero = newValue === 0;
                    this.reg._f.negative = true;
                    this.reg._f.half_carry = (this.reg[R8.A] & 0xF) - (r8 & 0xF) < 0;
                }

                this.pc += 1;
                return;


            case 0x2F: // CPL
                this.reg[R8.A] = this.reg[R8.A] ^ 0b11111111;

                this.reg._f.negative = true;
                this.reg._f.half_carry = true;
                this.pc += 1;
                return;
            case 0xD9: // RETI
                const stackLowerByte = this.fetchMem8((this.reg.sp++) & 0xFFFF);
                const stackUpperByte = this.fetchMem8((this.reg.sp++) & 0xFFFF);

                const returnAddress = ((stackUpperByte << 8) | stackLowerByte) & 0xFFFF;
                // console.info(`Returning to 0x${returnAddress.toString(16)}`);

                this.pc = returnAddress - 1;

                this.tick(4); // Branching takes 4 cycles
                this.scheduleEnableInterruptsForNextTick = true;
                this.pc += 1;
                return;
            case 0x27: // DAA
                if (!this.reg._f.negative) {
                    if (this.reg._f.carry || this.reg[R8.A] > 0x99) {
                        this.reg[R8.A] = (this.reg[R8.A] + 0x60) & 0xFF;
                        this.reg._f.carry = true;
                    }
                    if (this.reg._f.half_carry || (this.reg[R8.A] & 0x0f) > 0x09) {
                        this.reg[R8.A] = (this.reg[R8.A] + 0x6) & 0xFF;
                    }
                }
                else {
                    if (this.reg._f.carry) {
                        this.reg[R8.A] = (this.reg[R8.A] - 0x60) & 0xFF;
                        this.reg._f.carry = true;
                    }
                    if (this.reg._f.half_carry) {
                        this.reg[R8.A] = (this.reg[R8.A] - 0x6) & 0xFF;
                    }
                }

                this.reg._f.zero = this.reg[R8.A] === 0;
                this.reg._f.half_carry = false;
                this.pc += 1;
                return;
            case 0x00: // NOP
                this.pc += 1;
                return;

            /** LD between A and R16 */
            case 0x02: // LD [BC], A
                this.writeMem8(this.reg[R16.BC], this.reg[R8.A]);
                this.pc += 1;
                return;
            case 0x12: // LD [DE], A
                this.writeMem8(this.reg[R16.DE], this.reg[R8.A]);
                this.pc += 1;
                return;
            case 0x22: // LD [HL+], A
                this.writeMem8(this.reg[R16.HL], this.reg[R8.A]);
                this.reg[R16.HL] = (this.reg[R16.HL] + 1) & 0xFFFF;
                this.pc += 1;
                return;
            case 0x32: // LD [HL-], A
                this.writeMem8(this.reg[R16.HL], this.reg[R8.A]);
                this.reg[R16.HL] = (this.reg[R16.HL] - 1) & 0xFFFF;
                this.pc += 1;
                return;
            case 0x0A: // LD A, [BC]
                this.reg[R8.A] = this.fetchMem8(this.reg[R16.BC]);
                this.pc += 1;
                return;
            case 0x1A: // LD A, [DE]
                this.reg[R8.A] = this.fetchMem8(this.reg[R16.DE]);
                this.pc += 1;
                return;
            case 0x2A: // LD A, [HL+]
                this.reg[R8.A] = this.fetchMem8(this.reg[R16.HL]);
                this.reg[R16.HL] = (this.reg[R16.HL] + 1) & 0xFFFF;
                this.pc += 1;
                return;
            case 0x3A: // LD A, [HL-]
                this.reg[R8.A] = this.fetchMem8(this.reg[R16.HL]);
                this.reg[R16.HL] = (this.reg[R16.HL] - 1) & 0xFFFF;
                this.pc += 1;
                return;

            case 0xF2: // LD A, [$FF00+C]
                this.reg[R8.A] = this.fetchMem8((0xFF00 | this.reg[R8.C]) & 0xFFFF);
                this.pc += 1;
                return;
            case 0xE2: // LD [$FF00+C], A
                this.writeMem8((0xFF00 | this.reg[R8.C]) & 0xFFFF, this.reg[R8.A]);
                this.pc += 1;
                return;

            case 0xF3: // DI - Disable interrupts master flag
                this.gb.interrupts.masterEnabled = false;
                this.pc += 1;
                return;
            case 0xFB: // EI - Enable interrupts master flag
                this.scheduleEnableInterruptsForNextTick = true;
                this.pc += 1;
                return;

            /** JP */
            case 0xE9: // JP HL
                this.pc = this.reg[R16.HL] - 1;
                this.pc += 1;
                return;


            /** A rotate */
            case 0x07: // RLC A
                {
                    const value = this.reg[R8.A];

                    const leftmostBit = (value & 0b10000000) >> 7;

                    const newValue = ((value << 1) | leftmostBit) & 0xFF;

                    this.reg[R8.A] = newValue;

                    this.reg._f.zero = false;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = false;
                    this.reg._f.carry = (value >> 7) === 1;
                }
                this.pc += 1;
                return;
            case 0x0F: // RRC A
                {
                    const value = this.reg[R8.A];

                    const rightmostBit = (value & 1) << 7;
                    const newValue = ((value >> 1) | rightmostBit) & 0xFF;

                    this.reg[R8.A] = newValue;

                    this.reg._f.zero = false;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = false;
                    this.reg._f.carry = (value & 1) === 1;
                }
                this.pc += 1;
                return;
            case 0x1F: // RR A
                {
                    const value = this.reg[R8.A];

                    const carryMask = (this.reg.f & 0b00010000) << 3;

                    const newValue = ((value >> 1) | carryMask) & 0xFF;

                    this.reg[R8.A] = newValue;

                    this.reg._f.zero = false;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = false;
                    this.reg._f.carry = !!(value & 1);
                }
                this.pc += 1;
                return;
            case 0x17: // RL A
                {
                    const value = this.reg[R8.A];

                    const carryMask = (this.reg.f & 0b00010000) >> 4;

                    const newValue = ((value << 1) | carryMask) & 0xFF;

                    this.reg[R8.A] = newValue;

                    this.reg._f.zero = false;
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = false;
                    this.reg._f.carry = (value >> 7) === 1;
                }
                this.pc += 1;
                return;

            case 0x76: // HALT
                if (
                    (
                        this.gb.interrupts.enabled.numerical &
                        this.gb.interrupts.requested.numerical &
                        0x1F
                    ) !== 0
                ) {
                    // HALT bug
                    this.haltBug = true;
                    this.pc++; this.pc &= 0xFFFF;
                } else (
                    this.gb.interrupts.enabled.numerical &
                    this.gb.interrupts.requested.numerical &
                    0x1F) === 0;
                {
                    this.halted = true;
                }
                this.pc += 1;
                return;

            /** Carry flag */
            case 0x37: // SCF
                this.reg._f.negative = false;
                this.reg._f.half_carry = false;
                this.reg._f.carry = true;
                this.pc += 1;
                return;
            case 0x3F: // CCF
                this.reg._f.negative = false;
                this.reg._f.half_carry = false;
                this.reg._f.carry = !this.reg._f.carry;
                this.pc += 1;
                return;



            /** RET */
            case 0xC9: // RET
            case 0xD8: // RET C
            case 0xD0: // RET NC
            case 0xC8: // RET Z
            case 0xC0: // RET NZ
                {
                    if (b0 !== 0xC9) {
                        this.tick(4); // Branch decision?

                        const cc: CC = (b0 & 0b11000) >> 3;
                        if (cc === CC.NZ && this.reg._f.zero) { this.pc += 1; return; }
                        if (cc === CC.Z && !this.reg._f.zero) { this.pc += 1; return; }
                        if (cc === CC.NC && this.reg._f.carry) { this.pc += 1; return; }
                        if (cc === CC.C && !this.reg._f.carry) { this.pc += 1; return; }
                    }

                    const stackLowerByte = this.fetchMem8((this.reg.sp++) & 0xFFFF);
                    const stackUpperByte = this.fetchMem8((this.reg.sp++) & 0xFFFF);

                    const returnAddress = (((stackUpperByte << 8) | stackLowerByte)) & 0xFFFF;
                    // console.info(`Returning to 0x${returnAddress.toString(16)}`);

                    this.pc = returnAddress - 1;

                    this.tick(4); // Branching takes 4 cycles
                }
                this.pc += 1;
                return;



            /** ADD HL, R16 */
            case 0x09: // ADD HL, BC
            case 0x19: // ADD HL, DE
            case 0x29: // ADD HL, HL
            case 0x39: // ADD HL, SP
                {
                    const target = [R16.BC, R16.DE, R16.HL, R16.SP][(b0 & 0b110000) >> 4];
                    const r16Value = this.reg[target];

                    const newValue = (r16Value + this.reg[R16.HL]) & 0xFFFF;
                    const didOverflow = ((r16Value + this.reg[R16.HL]) >> 16) !== 0;

                    // Set flag
                    this.reg._f.negative = false;
                    this.reg._f.half_carry = (this.reg[R16.HL] & 0xFFF) + (r16Value & 0xFFF) > 0xFFF;
                    this.reg._f.carry = didOverflow;

                    // Set register values
                    this.reg[R16.HL] = newValue;

                    // Register read takes 4 more cycles
                    this.tick(4);
                }
                this.pc += 1;
                return;

            /** Reset Vectors */
            case 0xC7: // RST 00h 
            case 0xCF: // RST 08h
            case 0xD7: // RST 10h
            case 0xDF: // RST 18h
            case 0xE7: // RST 20h
            case 0xEF: // RST 28h
            case 0xF7: // RST 30h
            case 0xFF: // RST 38h
                {
                    const target = b0 & 0b111000;
                    const pcUpperByte = ((this.pc + 1) & 0xFFFF) >> 8;
                    const pcLowerByte = ((this.pc + 1) & 0xFFFF) & 0xFF;

                    this.reg.sp = (this.reg.sp - 1) & 0xFFFF;
                    this.writeMem8(this.reg.sp, pcUpperByte);
                    this.reg.sp = (this.reg.sp - 1) & 0xFFFF;
                    this.writeMem8(this.reg.sp, pcLowerByte);

                    this.pc = target - 1;

                    this.tick(4);
                }
                this.pc += 1;
                return;

            // Invalid
            case 0xD3:
            case 0xDB:
            case 0xDD:
            case 0xE3:
            case 0xE4:
            case 0xEB:
            case 0xEC:
            case 0xED:
            case 0xF4:
            case 0xFC:
            case 0xFD:
                this.pc--;
                this.invalidOpcodeExecuted = true;
                this.pc += 1;
                return;

            case 0xCB:
                {
                    const b1 = this.fetchMem8(this.pc + 1);

                    const t: R8 = b1 & 0b111;

                    switch (b1) {
                        // RLC r8
                        case 0x00:
                        case 0x01:
                        case 0x02:
                        case 0x03:
                        case 0x04:
                        case 0x05:
                        case 0x06:
                        case 0x07:
                            {
                                const value = this.reg[t];

                                const leftmostBit = (value & 0b10000000) >> 7;
                                const newValue = ((value << 1) | leftmostBit) & 0xFF;

                                this.reg[t] = newValue;

                                this.reg._f.zero = newValue === 0;
                                this.reg._f.negative = false;
                                this.reg._f.half_carry = false;
                                this.reg._f.carry = (value >> 7) === 1;
                            }
                            this.pc += 2;
                            return;

                        // RRC r8
                        case 0x08:
                        case 0x09:
                        case 0x0A:
                        case 0x0B:
                        case 0x0C:
                        case 0x0D:
                        case 0x0E:
                        case 0x0F:
                            {
                                const value = this.reg[t];

                                const rightmostBit = (value & 1) << 7;
                                const newValue = ((value >> 1) | rightmostBit) & 0xFF;

                                this.reg[t] = newValue;

                                this.reg._f.zero = newValue === 0;
                                this.reg._f.negative = false;
                                this.reg._f.half_carry = false;
                                this.reg._f.carry = !!(value & 1);
                            }
                            this.pc += 2;
                            return;


                        // RL r8
                        case 0x10:
                        case 0x11:
                        case 0x12:
                        case 0x13:
                        case 0x14:
                        case 0x15:
                        case 0x16:
                        case 0x17:
                            {
                                const value = this.reg[t];

                                const carryMask = (this.reg.f & 0b00010000) >> 4;

                                const newValue = ((value << 1) | carryMask) & 0xFF;

                                this.reg[t] = newValue;

                                this.reg._f.zero = newValue === 0;
                                this.reg._f.negative = false;
                                this.reg._f.half_carry = false;
                                this.reg._f.carry = (value >> 7) === 1;
                            }
                            this.pc += 2;
                            return;

                        // RR r8
                        case 0x18:
                        case 0x19:
                        case 0x1A:
                        case 0x1B:
                        case 0x1C:
                        case 0x1D:
                        case 0x1E:
                        case 0x1F:
                            {
                                const value = this.reg[t];

                                const carryMask = (this.reg.f & 0b00010000) << 3;

                                const newValue = ((value >> 1) | carryMask) & 0xFF;

                                this.reg[t] = newValue;

                                this.reg._f.zero = newValue === 0;
                                this.reg._f.negative = false;
                                this.reg._f.half_carry = false;
                                this.reg._f.carry = !!(value & 1);
                            }
                            this.pc += 2;
                            return;

                        // SLA r8
                        case 0x20:
                        case 0x21:
                        case 0x22:
                        case 0x23:
                        case 0x24:
                        case 0x25:
                        case 0x26:
                        case 0x27:
                            {
                                const value = this.reg[t];

                                const newValue = (value << 1) & 0xFF;
                                const didOverflow = ((value << 1) >> 8) !== 0;

                                this.reg[t] = newValue;

                                this.reg._f.zero = newValue === 0;
                                this.reg._f.negative = false;
                                this.reg._f.half_carry = false;
                                this.reg._f.carry = didOverflow;
                            }
                            this.pc += 2;
                            return;

                        // SRA r8
                        case 0x28:
                        case 0x29:
                        case 0x2A:
                        case 0x2B:
                        case 0x2C:
                        case 0x2D:
                        case 0x2E:
                        case 0x2F:
                            {
                                const value = this.reg[t];

                                const leftmostBit = value & 0b10000000;
                                const newValue = (value >> 1) | leftmostBit;

                                this.reg[t] = newValue;

                                this.reg._f.zero = newValue === 0;
                                this.reg._f.negative = false;
                                this.reg._f.half_carry = false;
                                this.reg._f.carry = !!(value & 1);
                            }
                            this.pc += 2;
                            return;

                        // SWAP r8
                        case 0x30:
                        case 0x31:
                        case 0x32:
                        case 0x33:
                        case 0x34:
                        case 0x35:
                        case 0x36:
                        case 0x37:
                            {
                                const value = this.reg[t];

                                const lowerNybble = value & 0b00001111;
                                const upperNybble = (value >> 4) & 0b00001111;

                                this.reg[t] = (lowerNybble << 4) | upperNybble;

                                this.reg._f.zero = value === 0;
                                this.reg._f.negative = false;
                                this.reg._f.half_carry = false;
                                this.reg._f.carry = false;
                            }
                            this.pc += 2;
                            return;

                        // SRL r8 r8
                        case 0x38:
                        case 0x39:
                        case 0x3A:
                        case 0x3B:
                        case 0x3C:
                        case 0x3D:
                        case 0x3E:
                        case 0x3F:
                            {
                                const value = this.reg[t];

                                const newValue = value >> 1;

                                this.reg[t] = newValue;

                                this.reg._f.zero = newValue === 0;
                                this.reg._f.negative = false;
                                this.reg._f.half_carry = false;
                                this.reg._f.carry = !!(value & 1);
                            }
                            this.pc += 2;
                            return;

                        // BIT r8
                        case 0x40: case 0x41: case 0x42: case 0x43: case 0x44: case 0x45: case 0x46: case 0x47: case 0x48: case 0x49: case 0x4A: case 0x4B: case 0x4C: case 0x4D: case 0x4E: case 0x4F:
                        case 0x50: case 0x51: case 0x52: case 0x53: case 0x54: case 0x55: case 0x56: case 0x57: case 0x58: case 0x59: case 0x5A: case 0x5B: case 0x5C: case 0x5D: case 0x5E: case 0x5F:
                        case 0x60: case 0x61: case 0x62: case 0x63: case 0x64: case 0x65: case 0x66: case 0x67: case 0x68: case 0x69: case 0x6A: case 0x6B: case 0x6C: case 0x6D: case 0x6E: case 0x6F:
                        case 0x70: case 0x71: case 0x72: case 0x73: case 0x74: case 0x75: case 0x76: case 0x77: case 0x78: case 0x79: case 0x7A: case 0x7B: case 0x7C: case 0x7D: case 0x7E: case 0x7F:
                            {
                                const bit = (b1 & 0b111000) >> 3;

                                const value = this.reg[t];

                                this.reg._f.zero = (value & (1 << bit)) === 0;
                                this.reg._f.negative = false;
                                this.reg._f.half_carry = true;
                            }
                            this.pc += 2;
                            return;

                        // RES r8
                        case 0x80: case 0x81: case 0x82: case 0x83: case 0x84: case 0x85: case 0x86: case 0x87: case 0x88: case 0x89: case 0x8A: case 0x8B: case 0x8C: case 0x8D: case 0x8E: case 0x8F:
                        case 0x90: case 0x91: case 0x92: case 0x93: case 0x94: case 0x95: case 0x96: case 0x97: case 0x98: case 0x99: case 0x9A: case 0x9B: case 0x9C: case 0x9D: case 0x9E: case 0x9F:
                        case 0xA0: case 0xA1: case 0xA2: case 0xA3: case 0xA4: case 0xA5: case 0xA6: case 0xA7: case 0xA8: case 0xA9: case 0xAA: case 0xAB: case 0xAC: case 0xAD: case 0xAE: case 0xAF:
                        case 0xB0: case 0xB1: case 0xB2: case 0xB3: case 0xB4: case 0xB5: case 0xB6: case 0xB7: case 0xB8: case 0xB9: case 0xBA: case 0xBB: case 0xBC: case 0xBD: case 0xBE: case 0xBF:
                            {
                                const bit = (b1 & 0b111000) >> 3;

                                const value = this.reg[t];
                                const mask = 0b1 << bit;

                                const final = value & ~(mask);

                                this.reg[t] = final;
                            }
                            this.pc += 2;
                            return;

                        // SET r8
                        case 0xC0: case 0xC1: case 0xC2: case 0xC3: case 0xC4: case 0xC5: case 0xC6: case 0xC7: case 0xC8: case 0xC9: case 0xCA: case 0xCB: case 0xCC: case 0xCD: case 0xCE: case 0xCF:
                        case 0xD0: case 0xD1: case 0xD2: case 0xD3: case 0xD4: case 0xD5: case 0xD6: case 0xD7: case 0xD8: case 0xD9: case 0xDA: case 0xDB: case 0xDC: case 0xDD: case 0xDE: case 0xDF:
                        case 0xE0: case 0xE1: case 0xE2: case 0xE3: case 0xE4: case 0xE5: case 0xE6: case 0xE7: case 0xE8: case 0xE9: case 0xEA: case 0xEB: case 0xEC: case 0xED: case 0xEE: case 0xEF:
                        case 0xF0: case 0xF1: case 0xF2: case 0xF3: case 0xF4: case 0xF5: case 0xF6: case 0xF7: case 0xF8: case 0xF9: case 0xFA: case 0xFB: case 0xFC: case 0xFD: case 0xFE: case 0xFF:
                            {
                                const bit = (b1 & 0b111000) >> 3;

                                const value = this.reg[t];
                                const mask = 0b1 << bit;

                                const final = value | mask;

                                this.reg[t] = final;
                            }
                            this.pc += 2;
                            return;

                    }
                }
                return;


            default:
                alert(`execute1 oops: ${hex(b0, 1)}`);
                this.pc += 1;
                return;


        }
    }
}

