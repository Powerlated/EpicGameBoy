import GameBoy from "../gameboy";
import Disassembler from "../../src/gameboy/tools/disassembler";

import { writeDebug } from "../../src/gameboy/tools/debug";
import { hex, pad, hexN_LC, hexN, r_pad, assert, unTwo8b } from "../../src/gameboy/tools/util";
import UNPREFIXED_EXECUTORS, { Executor } from "./unprefixed_executors";
import CB_PREFIXED_EXECUTORS from "./cb_prefixed_executors";
import Decoder from "./legacy_decoder";
import { BIT_7, BIT_6, BIT_5, BIT_4, BIT_0, BIT_1, BIT_2, BIT_3 } from "../bit_constants";
import { R16, R8, CC } from "./cpu_types";
import { Serializer } from "../serialize";

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

class InterruptFlag {
    isIe = false;
    cpu: CPU;

    constructor(cpu: CPU, ie: boolean) {
        this.cpu = cpu;
        this.isIe = ie;
    }

    _vblank = false;
    _lcdStat = false;
    _timer = false;
    _serial = false;
    _joypad = false;

    get vblank() { return this._vblank; };
    get lcdStat() { return this._lcdStat; };
    get timer() { return this._timer; };
    get serial() { return this._serial; };
    get joypad() { return this._joypad; };

    set vblank(i: boolean) {
        this._vblank = i;
        if (i === true)
            this.numerical |= BIT_0;
        else
            this.numerical &= ~BIT_0;

        this.cpu.calculateAvailableInterrupts();
    }
    set lcdStat(i: boolean) {
        this._lcdStat = i;
        if (i === true)
            this.numerical |= BIT_1;
        else
            this.numerical &= ~BIT_1;

        this.cpu.calculateAvailableInterrupts();
    }
    set timer(i: boolean) {
        this._timer = i;
        if (i === true)
            this.numerical |= BIT_2;
        else
            this.numerical &= ~BIT_2;

        this.cpu.calculateAvailableInterrupts();
    }
    set serial(i: boolean) {
        this._serial = i;
        if (i === true)
            this.numerical |= BIT_3;
        else
            this.numerical &= ~BIT_3;

        this.cpu.calculateAvailableInterrupts();
    }
    set joypad(i: boolean) {
        this._joypad = i;
        if (i === true)
            this.numerical |= BIT_4;
        else
            this.numerical &= ~BIT_4;

        this.cpu.calculateAvailableInterrupts();
    };

    numerical = 0;

    getNumerical(): number {
        return this.numerical;
    }

    setNumerical(i: number) {
        this.vblank = (i & BIT_0) !== 0;
        this.lcdStat = (i & BIT_1) !== 0;
        this.timer = (i & BIT_2) !== 0;
        this.serial = (i & BIT_3) !== 0;
        this.joypad = (i & BIT_4) !== 0;

        // Just store this flag and return it later, it's faster
        this.numerical = i;

        // Interrupt Flag is external to the SM83 core, so it only has 5 lines
        if (!this.isIe)
            this.numerical |= 0b11100000;
    }
}

export const VBLANK_VECTOR = 0x40;
export const LCD_STATUS_VECTOR = 0x48;
export const TIMER_OVERFLOW_VECTOR = 0x50;
export const SERIAL_LINK_VECTOR = 0x58;
export const JOYPAD_PRESS_VECTOR = 0x60;

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


    ie = new InterruptFlag(this, true);
    if = new InterruptFlag(this, false);
    ime = false;
    interruptAvailable = false;

    joypadAvailable = false;
    serialAvailable = false;
    timerAvailable = false;
    vblankAvailable = false;
    lcdStatAvailable = false;

    calculateAvailableInterrupts() {
        const joypad = this.if._joypad && this.ie._joypad;
        const serial = this.if._serial && this.ie._serial;
        const timer = this.if._timer && this.ie._timer;
        const vblank = this.if._vblank && this.ie._vblank;
        const lcdStat = this.if._lcdStat && this.ie._lcdStat;

        this.joypadAvailable = joypad;
        this.serialAvailable = serial;
        this.timerAvailable = timer;
        this.vblankAvailable = vblank;
        this.lcdStatAvailable = lcdStat;

        this.interruptAvailable = joypad || serial || timer || vblank || lcdStat;
    }

    cycles = 0;
    pendingCycles = 0;
    halted = false;
    haltBug = false;
    pc: number = 0x0000;
    scheduleEnableInterruptsForNextTick = false;
    totalI = 0;

    gb: GameBoy;

    logging = false;

    log: Array<string> = [];
    fullLog: Array<string> = [];

    // jumpLog: Array<string> = [];

    breakpoints = new Array<boolean>(65536).fill(false);


    // #region

    lastSerialOut = 0;
    lastInstructionDebug = "";
    lastOperandDebug = "";
    currentIns = "";

    lastOpcode = 0;
    lastOpcodeReps = 0;

    time = 0;

    debugging = false;

    opcodesRan = new Set();

    minDebug = false;
    jumpLog: string[] = [];

    zero = false;
    negative = false;
    half_carry = false;
    carry = false;

    get f() {
        let flagN = 0;

        if (this.zero) flagN |= BIT_7;
        if (this.negative) flagN |= BIT_6;
        if (this.half_carry) flagN |= BIT_5;
        if (this.carry) flagN |= BIT_4;

        return flagN;
    }

    set f(i: number) {
        this.zero = (i & BIT_7) !== 0;
        this.negative = (i & BIT_6) !== 0;
        this.half_carry = (i & BIT_5) !== 0;
        this.carry = (i & BIT_4) !== 0;
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
    get 0x6(): number { return this.read_tick(this[R16.HL]); }
    set 0x6(i: number) { this.write_tick(this[R16.HL], i); }
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
        return this[R8.A] << 8 | this.f;
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
        return this.sp;
    }
    set 0x10(i: number) {
        this[R8.A] = i >> 8;
        this.f = i & 0xFF;
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
        this.sp = i;
    }

    reset() {
        this[R16.AF] = 0;
        this[R16.BC] = 0;
        this[R16.DE] = 0;
        this[R16.HL] = 0;
        this[R16.SP] = 0;

        this.totalI = 0;
        this.time = 0;
        this.pc = 0;
        this.cycles = 0;
        this.pendingCycles = 0;
        this.haltBug = false;
        this.halted = false;
        this.scheduleEnableInterruptsForNextTick = false;

        this.ie = new InterruptFlag(this, true);
        this.if = new InterruptFlag(this, false);
        this.ime = false;

        this.interruptAvailable = false;

        this.joypadAvailable = false;
        this.serialAvailable = false;
        this.timerAvailable = false;
        this.vblankAvailable = false;
        this.lcdStatAvailable = false;
    }


    tick(cycles: number) {
        this.cycles += cycles;
        this.gb.tick(cycles);
    }

    tick_addPending(cycles: number) {
        this.cycles += cycles;
        this.pendingCycles += cycles;
    }

    read_tick(addr: number): number {
        this.cycles += 4;

        this.gb.tick(this.pendingCycles + 4);
        this.pendingCycles = 0;

        return this.gb.bus.read(addr);
    }

    // Timing already satisfied by fetchMem8
    read16_tick(addr: number): number {
        const b0 = this.read_tick(addr);
        const b1 = this.read_tick(addr + 1);

        return b1 << 8 | b0;
    }

    write_tick(addr: number, value: number): void {
        this.cycles += 4;

        this.gb.tick(this.pendingCycles + 4);
        this.pendingCycles = 0;

        this.gb.bus.write(addr, value);
    }

    // Timing already satisfied by fetchMem8
    write16_tick(addr: number, value: number): void {
        this.write_tick(addr + 1, value >> 8);
        this.write_tick(addr, value & 0xFF);
    };

    execute(): number {
        const c = this.cycles;
        // // Run the debug information collector
        // if (this.debugging || this.logging)
        //     this.stepDebug();

        if (this.halted === false) {
            if (this.scheduleEnableInterruptsForNextTick === true) {
                this.scheduleEnableInterruptsForNextTick = false;
                this.ime = true;

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

            const op = UNPREFIXED_EXECUTORS[this.read_tick(this.pc)];

            if (this.haltBug === true) {
                this.haltBug = false;
                this.pc--;
                this.pc &= 0xFFFF;
            }

            const length = op(this);

            this.pc += length;
            this.pc &= 0xFFFF;

            this.totalI++;

            /** Checking for proper timings below here

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
            */
        } else {
            this.tick(4 << this.gb.doubleSpeedShift);
        }

        if (this.pendingCycles > 0) {
            this.gb.tick(this.pendingCycles);
            this.pendingCycles = 0;
        }

        // If the CPU is HALTed and there are requested interrupts, unHALT
        if (this.interruptAvailable === true) {
            if (this.ime === true) {

                if (this.halted) this.tick_addPending(4);

                // 1 M-cycles doing nothing
                this.tick_addPending(4);

                const pcUpper = this.pc >> 8;
                const pcLower = this.pc & 0xFF;

                this.sp = (this.sp - 1) & 0xFFFF;
                this.write_tick(this.sp, pcUpper);

                // If servicing any interrupt, disable the master flag
                this.ime = false;

                let vector = 0;
                if (this.vblankAvailable) {
                    this.if.vblank = false;

                    // if (this.minDebug)
                    //     this.addToLog(`--- VBLANK INTERRUPT ---`);

                    vector = VBLANK_VECTOR;
                } else if (this.lcdStatAvailable) {
                    this.if.lcdStat = false;

                    // if (this.minDebug)
                    //     this.addToLog(`--- LCDSTAT INTERRUPT ---`);

                    vector = LCD_STATUS_VECTOR;
                } else if (this.timerAvailable) {
                    this.if.timer = false;

                    // if (this.minDebug)
                    //     this.addToLog(`--- TIMER INTERRUPT ---`);

                    vector = TIMER_OVERFLOW_VECTOR;
                } else if (this.serialAvailable) {
                    this.if.serial = false;
                    vector = SERIAL_LINK_VECTOR;
                } else if (this.joypadAvailable) {
                    this.if.joypad = false;
                    vector = JOYPAD_PRESS_VECTOR;
                }

                this.sp = (this.sp - 1) & 0xFFFF;
                this.write_tick(this.sp, pcLower);

                // Setting PC takes 1 M-cycle
                this.tick_addPending(4);

                this.pc = vector;
            }

            this.halted = false;
        }

        return this.cycles - c;
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

            const flags = `${this.zero ? 'Z' : '-'}${this.negative ? 'N' : '-'}${this.half_carry ? 'H' : '-'}${this.carry ? 'C' : '-'}`;

            // this.log.push(`A:${hexN(this._r.a, 2)} F:${flags} BC:${hexN(this._r.bc, 4)} DE:${hexN_LC(this._r.de, 4)} HL:${hexN_LC(this._r.hl, 4)
            // } SP:${hexN_LC(this._r.sp, 4)} PC:${hexN_LC(this.pc, 4)} (cy: ${this.cycles})`);

            /*
            this.log.push(`A:${hexN(this[R8.A], 2)} F:${flags} BC:${hexN(this[R16.BC], 4)} DE:${hexN_LC(this[R16.DE], 4)} HL:${hexN_LC(this[R16.HL], 4)
                } SP:${hexN_LC(this.sp, 4)} PC:${hexN_LC(this.pc, 4)}`); */
            this.fullLog.push(`A:${hexN(this[R8.A], 2)} F:${flags} BC:${hexN(this[R16.BC], 4)} DE:${hexN_LC(this[R16.DE], 4)} HL:${hexN_LC(this[R16.HL], 4)
                } SP:${hexN_LC(this.sp, 4)} PC:${hexN_LC(this.pc, 4)} (cy: ${this.cycles}) |[00]0x${hexN_LC(this.pc, 4)}: ${Disassembler.disassembleOp(ins, pcTriplet, this, this.pc)}`);
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
        this.updateEnableBreakpoints();
    }
    clearBreakpoint(point: number) {
        writeDebug("Cleared breakpoint at " + hex(point, 4));
        this.breakpoints[point] = false;
        this.updateEnableBreakpoints();
    }

    private updateEnableBreakpoints() {
        let found = false;
        for (let i = 0; i < 65536; i++) {
            if (this.breakpoints[i] === true) {
                found = true;
            }
        }
        this.enableBreakpoints = found;
    }

    // 4 cycle penalty
    push_tick(n16: number): void {
        this.tick(4);

        this.sp = (this.sp - 2) & 0xFFFF;
        this.write16_tick(this.sp, n16);
    };

    pop_tick(): number {
        const value = this.read16_tick(this.sp);
        this.sp = (this.sp + 2) & 0xFFFF;
        return value;
    }

    serialize(state: Serializer) {
        state.PUT_32LE(this.cycles);
        state.PUT_32LE(this.pendingCycles);
        state.PUT_BOOL(this.halted);
        state.PUT_BOOL(this.haltBug);
        state.PUT_16LE(this.pc);
        state.PUT_BOOL(this.scheduleEnableInterruptsForNextTick);
        state.PUT_32LE(this.totalI);

        state.PUT_16LE(this.sp);

        state.PUT_8(this[R8.A]);
        state.PUT_8(this[R8.B]);
        state.PUT_8(this[R8.C]);
        state.PUT_8(this[R8.D]);
        state.PUT_8(this[R8.E]);
        state.PUT_8(this[R8.H]);
        state.PUT_8(this[R8.L]);

        state.PUT_BOOL(this.carry);
        state.PUT_BOOL(this.half_carry);
        state.PUT_BOOL(this.negative);
        state.PUT_BOOL(this.zero);

        state.PUT_BOOL(this.ime);

        state.PUT_BOOL(this.ie.isIe);
        state.PUT_BOOL(this.ie._vblank);
        state.PUT_BOOL(this.ie._lcdStat);
        state.PUT_BOOL(this.ie._timer);
        state.PUT_BOOL(this.ie._serial);
        state.PUT_BOOL(this.ie._joypad);
        state.PUT_8(this.ie.numerical);

        state.PUT_BOOL(this.if.isIe);
        state.PUT_BOOL(this.if._vblank);
        state.PUT_BOOL(this.if._lcdStat);
        state.PUT_BOOL(this.if._timer);
        state.PUT_BOOL(this.if._serial);
        state.PUT_BOOL(this.if._joypad);
        state.PUT_8(this.if.numerical);

        state.PUT_BOOL(this.interruptAvailable);

        state.PUT_BOOL(this.joypadAvailable);
        state.PUT_BOOL(this.serialAvailable);
        state.PUT_BOOL(this.timerAvailable);
        state.PUT_BOOL(this.vblankAvailable);
        state.PUT_BOOL(this.lcdStatAvailable);
    }

    deserialize(state: Serializer) {
        this.cycles = state.GET_32LE();
        this.pendingCycles = state.GET_32LE();
        this.halted = state.GET_BOOL();
        this.haltBug = state.GET_BOOL();
        this.pc = state.GET_16LE();
        this.scheduleEnableInterruptsForNextTick = state.GET_BOOL();
        this.totalI = state.GET_32LE();

        this.sp = state.GET_16LE();

        this[R8.A] = state.GET_8();
        this[R8.B] = state.GET_8();
        this[R8.C] = state.GET_8();
        this[R8.D] = state.GET_8();
        this[R8.E] = state.GET_8();
        this[R8.H] = state.GET_8();
        this[R8.L] = state.GET_8();

        this.carry = state.GET_BOOL();
        this.half_carry = state.GET_BOOL();
        this.negative = state.GET_BOOL();
        this.zero = state.GET_BOOL();

        this.ime = state.GET_BOOL();

        this.ie.isIe = state.GET_BOOL();
        this.ie._vblank = state.GET_BOOL();
        this.ie._lcdStat = state.GET_BOOL();
        this.ie._timer = state.GET_BOOL();
        this.ie._serial = state.GET_BOOL();
        this.ie._joypad = state.GET_BOOL();
        this.ie.numerical = state.GET_8();

        this.if.isIe = state.GET_BOOL();
        this.if._vblank = state.GET_BOOL();
        this.if._lcdStat = state.GET_BOOL();
        this.if._timer = state.GET_BOOL();
        this.if._serial = state.GET_BOOL();
        this.if._joypad = state.GET_BOOL();
        this.if.numerical = state.GET_8();

        this.interruptAvailable = state.GET_BOOL();

        this.joypadAvailable = state.GET_BOOL();
        this.serialAvailable = state.GET_BOOL();
        this.timerAvailable = state.GET_BOOL();
        this.vblankAvailable = state.GET_BOOL();
        this.lcdStatAvailable = state.GET_BOOL();
    }
}

