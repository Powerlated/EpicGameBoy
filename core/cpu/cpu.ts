import GameBoy from "../gameboy";
import Disassembler from "../../src/gameboy/tools/disassembler";

import { writeDebug } from "../../src/gameboy/tools/debug";
import { hex, pad, hexN_LC, hexN, r_pad, assert, unTwo8b } from "../../src/gameboy/tools/util";
import { VBLANK_VECTOR, LCD_STATUS_VECTOR, TIMER_OVERFLOW_VECTOR, SERIAL_LINK_VECTOR, JOYPAD_PRESS_VECTOR } from "../components/interrupt-controller";
import UNPREFIXED_EXECUTORS, { Executor } from "./unprefixed_executors";
import CB_PREFIXED_EXECUTORS from "./cb_prefixed_executors";
import Decoder from "./legacy_decoder";
import { BIT_7, BIT_6, BIT_5, BIT_4 } from "../bit_constants";
import { R16, R8, CC } from "./cpu_types";

function undefErr(cpu: CPU, name: string) {
    alert(`
    ${name} undefined
    
    Total Instructions: #${cpu.totalI}
    PC: 0x${cpu.pc.toString(16)}
    Opcode: 0x${cpu.gb.bus.read(cpu.pc).toString(16)}
    Op: ${UNPREFIXED_EXECUTORS[cpu.gb.bus.read(cpu.pc)].name}
    `);
}

function overflow8bErr(cpu: CPU, name: string, overflow: any) {
    alert(`
    ${name} was set out of 0-255 (${overflow})
    
    Total Instructions: #${cpu.totalI}
    PC: 0x${cpu.pc.toString(16)}
    Opcode: 0x${cpu.gb.bus.read(cpu.pc).toString(16)}
    Op: ${UNPREFIXED_EXECUTORS[cpu.gb.bus.read(cpu.pc)].name}
    `);
}

function overflow16bErr(cpu: CPU, name: string, overflow: any) {
    alert(`
    ${name} was set out of 0-65535 (${overflow})
    
    Total Instructions: #${cpu.totalI}
    PC: 0x${cpu.pc.toString(16)}
    Opcode: 0x${cpu.gb.bus.read(cpu.pc).toString(16)}
    Op: ${UNPREFIXED_EXECUTORS[cpu.gb.bus.read(cpu.pc)].name}
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

        if (this._f.zero) flagN |= BIT_7;
        if (this._f.negative) flagN |= BIT_6;
        if (this._f.half_carry) flagN |= BIT_5;
        if (this._f.carry) flagN |= BIT_4;

        return flagN;
    }

    set f(i: number) {
        this._f.zero = (i & BIT_7) !== 0;
        this._f.negative = (i & BIT_6) !== 0;
        this._f.half_carry = (i & BIT_5) !== 0;
        this._f.carry = (i & BIT_4) !== 0;
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
    get 0x6(): number { return this.cpu.read_tick(this.cpu.reg[R16.HL]); }
    set 0x6(i: number) { this.cpu.write_tick(this.cpu.reg[R16.HL], i); }
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

export type OperandType = R8 | R16 | CC | number;

export interface OpFunction {
    (cpu: CPU, ...others: any): void;
}

export interface Op {
    op: Function, type?: OperandType, type2?: OperandType, length: number;
};

export default class CPU {
    constructor(gb: GameBoy) {
        this.gb = gb;
        writeDebug("CPU Bootstrap!");
    }

    halted = false;
    haltBugQueued = false;
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
    pendingCycles = 0;

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

    tick(cycles: number) {
        this.cycles += cycles;
        this.pendingCycles += cycles;
        this.gb.tick(cycles);
    }

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

    read_tick(addr: number): number {
        this.tick(4);

        // The CPU can only access high RAM during OAM DMA
        if (this.gb.oamDmaCyclesRemaining > 0 && this.gb.oamDmaCyclesRemaining <= 640) {
            if (addr >= 0xFF80 && addr <= 0xFFFE) {
                return this.gb.bus.read(addr);
            } else {
                return 0xFF;
            }
        } else {
            return this.gb.bus.read(addr);
        }
    }

    // Timing already satisfied by fetchMem8
    read16_tick(addr: number): number {
        const b0 = this.read_tick(addr);
        const b1 = this.read_tick(addr + 1);

        return b1 << 8 | b0;
    }

    write_tick(addr: number, value: number): void {
        this.tick(4);
        if (this.gb.oamDmaCyclesRemaining > 0) {
            if (addr >= 0xFF80 && addr <= 0xFF7F) {
                this.gb.bus.write(addr, value);
            }
        } else {
            this.gb.bus.write(addr, value);
        }
    }

    // Timing already satisfied by fetchMem8
    write16_tick(addr: number, value: number): void {
        this.write_tick(addr, value & 0xFF);
        this.write_tick(addr + 1, value >> 8);
    }

    execute(): number {
        this.pendingCycles = 0;

        // // Run the debug information collector
        // if (this.debugging || this.logging)
        //     this.stepDebug();

        if (this.halted === false) {
            if (this.invalidOpcodeExecuted === true) {
                this.tick(4);
                return 4;
            }
            if (this.scheduleEnableInterruptsForNextTick === true) {
                this.scheduleEnableInterruptsForNextTick = false;
                this.gb.interrupts.masterEnabled = true;

                // if (this.minDebug)
                //     this.addToLog(`--- INTERRUPTS ENABLED ---`);
            }

            // if (this.minDebug) {
            //     if (Disassembler.isControlFlow(ins)) {
            //         if (Disassembler.willJump(ins, this)) {
            //             const disasm = Disassembler.disassembleOp(ins, pcTriplet, this);
            //             const to = Disassembler.willJumpTo(ins, pcTriplet, this);
            //             this.addToLog(`[${hex(this.pc, 4)}] ${disasm} => ${hex(to, 4)}`);
            //         }
            //     }
            // }


            if (this.haltBugQueued === true) {
                this.haltBugQueued = false;

                this.haltBug = true;
            }

            const length = UNPREFIXED_EXECUTORS[this.read_tick(this.pc)](this);

            if (this.haltBug === false) {
                this.pc += length;
                this.pc &= 0xFFFF;
            } else {
                this.haltBug = false;
                console.log("PC NO INCREMENT");
            }

            this.totalI++;

            // Checking for proper timings below here

            // if (b0 !== 0xCB) {
            //     // These are variable length instructions / control flow
            //     const dontcare = [0x20, 0x30, 0x28, 0x38, 0xCB, 0xC0, 0xD0, 0xC2, 0xD2, 0xC4, 0xD4, 0xCA, 0xDA, 0xC8, 0x76, 0xD8, 0x10, 0xCC, 0xDC];

            //     if (!dontcare.includes(b0)) {

            //         const success = assert(this.cycles - c, Timings.NORMAL_TIMINGS[b0] * 4, "CPU timing");

            //         if (success == false) {
            //             console.log(hex(b0, 2));
            //             this.gb.speedStop();
            //         }
            //     }
            // } else {
            //     const dontcare: any[] = [];
            //     const b1 = this.gb.bus.readMem8(this.pc + 1);

            //     if (dontcare.includes(b1)) {

            //         const success = assert(this.cycles - c, Timings.CB_TIMINGS[b1] * 4, "[CB] CPU timing");

            //         if (success == false) {
            //             console.log(`${hex(b0, 2)},${hex(b1, 2)}`);
            //             this.gb.speedStop();
            //         }
            //     }
            // }

            // this.opcodesRan.add(pcTriplet[0]);
        } else {
            if (this.gb.doubleSpeedShift === 1) {
                this.tick(8);
            } else {
                this.tick(4);
            }
        }


        const requested = this.gb.interrupts.requested;
        const enabled = this.gb.interrupts.enabled;
        // If the CPU is HALTed and there are requested interrupts, unHALT
        if ((requested.numerical & enabled.numerical & 0x1F) !== 0) {
            this.halted = false;

            if (this.gb.interrupts.masterEnabled === true) {

                // 1 M-cycles doing nothing
                this.tick(4);

                // If servicing any interrupt, disable the master flag
                this.gb.interrupts.masterEnabled = false;

                let vector = 0;
                if (requested.vblank === true && enabled.vblank === true) {
                    requested.vblank = false;

                    // if (this.minDebug)
                    //     this.addToLog(`--- VBLANK INTERRUPT ---`);

                    vector = VBLANK_VECTOR;
                } else if (requested.lcdStat === true && enabled.lcdStat === true) {
                    requested.lcdStat = false;

                    // if (this.minDebug)
                    //     this.addToLog(`--- LCDSTAT INTERRUPT ---`);

                    vector = LCD_STATUS_VECTOR;
                } else if (requested.timer === true && enabled.timer === true) {
                    requested.timer = false;

                    // if (this.minDebug)
                    //     this.addToLog(`--- TIMER INTERRUPT ---`);

                    vector = TIMER_OVERFLOW_VECTOR;
                } else if (requested.serial === true && enabled.serial === true) {
                    requested.serial = false;
                    vector = SERIAL_LINK_VECTOR;
                } else if (requested.joypad === true && enabled.joypad === true) {
                    requested.joypad = false;
                    vector = JOYPAD_PRESS_VECTOR;
                }

                this.push_tick(this.pc);

                // Setting PC takes 1 M-cycle
                this.tick(4);

                this.pc = vector;
            }
        }

        return this.pendingCycles;
    }

    addToLog(s: string) {
        this.jumpLog.unshift(s);
        this.jumpLog = this.jumpLog.slice(0, 1000);
    }

    stepDebug() {
        const isCB = this.gb.bus.read(this.pc) === 0xCB;

        const ins = isCB ? Decoder.cbOpcode(this.gb.bus.read(this.pc + 1)) : Decoder.rgOpcode(this.gb.bus.read(this.pc));

        if (!ins) {
            alert(`[DEBUGGER] Implementation error: ${isCB ? hex((0xCB << 8 | this.gb.bus.read(this.pc + 1)), 4) : hex(this.gb.bus.read(this.pc), 2)} is a null op`);
        }

        const opcode = isCB ? this.gb.bus.read(this.pc + 1) : this.gb.bus.read(this.pc);

        if (opcode === this.lastOpcode) {
            this.lastOpcodeReps++;
        } else {
            this.lastOpcodeReps = 0;
        }
        this.lastOpcode = opcode;

        if (!ins) {
            console.error("Reading error at: 0x" + this.pc.toString(16));
        }

        // if (ins.length === undefined) {
        //     alert(`[${ins.op.name}] Op has no length specified.`);
        // }

        // if ((ins.op.length === 1 && (!ins.type)) || (ins.op.length === 2 && (!ins.type || !ins.type2))) {
        //     alert(`[Arg length 1 || 2] Implementation error: ${ins.op.name} 0x${this.fetchMem8(this.pc).toString(16)}`);
        // }
        // if (ins.op.length === 3 && (ins.type ==== undefined || ins.type2 ==== undefined)) {
        //     alert(`[Arg length 3] Implementation error: ${ins.op.name} 0x${this.fetchMem8(this.pc).toString(16)}`);
        // }

        if (this.debugging) {
            console.debug(`PC: ${this.pc}`);
            writeDebug(`[OPcode: ${hex(this.gb.bus.readMem16(this.pc), 2)}, OP: ${ins.op.name}] ${isCB ? "[0xCB Prefix] " : ""}Executing op: 0x` + pad(this.gb.bus.read(this.pc).toString(16), 2, '0'));
            writeDebug("Instruction length: " + ins.length);
        }

        const pcTriplet = Uint8Array.of(this.gb.bus.read(this.pc + 0), this.gb.bus.read(this.pc + 1), this.gb.bus.read(this.pc + 2));

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

    enableBreakpoints = false;

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
        this.enableBreakpoints = true;
    }
    clearBreakpoint(point: number) {
        writeDebug("Cleared breakpoint at " + hex(point, 4));
        this.breakpoints[point] = false;
        this.enableBreakpoints = true;
    }

    push_tick(n16: number): void {
        // 4 cycle penalty
        this.tick(4);

        this.reg.sp = (this.reg.sp - 2) & 0xFFFF;
        this.write16_tick(this.reg.sp, n16);
    }

    pop_tick(): number {
        const value = this.read16_tick(this.reg.sp);
        this.reg.sp = (this.reg.sp + 2) & 0xFFFF;
        return value;
    }
}

