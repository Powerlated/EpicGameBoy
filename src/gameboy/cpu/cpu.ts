import Ops from "./cpu_ops";
import GameBoy from "../gameboy";
import Disassembler from "../tools/disassembler";
import { writeDebug } from "../tools/debug";
import { hex, pad, hexN_LC, hexN, r_pad } from "../tools/util";
import { VBLANK_VECTOR, LCD_STATUS_VECTOR, TIMER_OVERFLOW_VECTOR, SERIAL_LINK_VECTOR, JOYPAD_PRESS_VECTOR } from "../core/components/interrupt-controller";
import Decoder from './decoder';

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

function check(cpu: CPU) {
    if (cpu._r.a < 0 || cpu._r.a > 255)
        overflow8bErr(cpu, "A", cpu._r.a);
    if (cpu._r.b < 0 || cpu._r.b > 255)
        overflow8bErr(cpu, "B", cpu._r.b);
    if (cpu._r.c < 0 || cpu._r.c > 255)
        overflow8bErr(cpu, "C", cpu._r.c);
    if (cpu._r.d < 0 || cpu._r.d > 255)
        overflow8bErr(cpu, "D", cpu._r.d);
    if (cpu._r.e < 0 || cpu._r.e > 255)
        overflow8bErr(cpu, "E", cpu._r.e);
    if (cpu._r.f < 0 || cpu._r.f > 255)
        overflow8bErr(cpu, "F", cpu._r.f);
    if (cpu._r.h < 0 || cpu._r.h > 255)
        overflow8bErr(cpu, "H", cpu._r.h);
    if (cpu._r.l < 0 || cpu._r.l > 255)
        overflow8bErr(cpu, "L", cpu._r.l);
    if (cpu._r.af < 0 || cpu._r.af > 65535)
        overflow8bErr(cpu, "AF", cpu._r.af);
    if (cpu._r.bc < 0 || cpu._r.bc > 65535)
        overflow8bErr(cpu, "BC", cpu._r.bc);
    if (cpu._r.de < 0 || cpu._r.de > 65535)
        overflow8bErr(cpu, "DE", cpu._r.de);
    if (cpu._r.hl < 0 || cpu._r.hl > 65535)
        overflow8bErr(cpu, "HL", cpu._r.hl);

    if (isNaN(cpu._r.a))
        undefErr(cpu, "A");
    if (isNaN(cpu._r.b))
        undefErr(cpu, "B");
    if (isNaN(cpu._r.c))
        undefErr(cpu, "C");
    if (isNaN(cpu._r.d))
        undefErr(cpu, "D");
    if (isNaN(cpu._r.e))
        undefErr(cpu, "E");
    if (isNaN(cpu._r.f))
        undefErr(cpu, "F");
    if (isNaN(cpu._r.h))
        undefErr(cpu, "H");
    if (isNaN(cpu._r.l))
        undefErr(cpu, "L");
    if (isNaN(cpu._r.af))
        undefErr(cpu, "AF");
    if (isNaN(cpu._r.bc))
        undefErr(cpu, "BC");
    if (isNaN(cpu._r.de))
        undefErr(cpu, "DE");
    if (isNaN(cpu._r.hl))
        undefErr(cpu, "HL");

}

class Registers {
    cpu: CPU;

    _f = new FlagsRegister();

    get f() {
        let flagN = 0;
        if (this._f.zero) {
            flagN = flagN | 0b10000000;
        }
        if (this._f.negative) {
            flagN = flagN | 0b01000000;
        }
        if (this._f.half_carry) {
            flagN = flagN | 0b00100000;
        }
        if (this._f.carry) {
            flagN = flagN | 0b00010000;
        }
        return flagN;
    }

    set f(i: number) {
        this._f.zero = (i & (1 << 7)) != 0;
        this._f.negative = (i & (1 << 6)) != 0;
        this._f.half_carry = (i & (1 << 5)) != 0;
        this._f.carry = (i & (1 << 4)) != 0;
    }

    a: number;
    b: number;
    c: number;
    d: number;
    e: number;

    h: number;
    l: number;

    sp: number;

    get af() {
        return this.a << 8 | this.f;
    }
    get bc() {
        return this.b << 8 | this.c;
    }
    get de() {
        return this.d << 8 | this.e;
    }
    get hl() {
        return this.h << 8 | this.l;
    }

    set af(i: number) {
        this.a = i >> 8;
        this.f = i & 0xFF;
    }
    set bc(i: number) {
        this.b = i >> 8;
        this.c = i & 0xFF;
    }
    set de(i: number) {
        this.d = i >> 8;
        this.e = i & 0xFF;
    }
    set hl(i: number) {
        this.h = i >> 8;
        this.l = i & 0xFF;
    }

    constructor(cpu: CPU) {
        this.a = 0;
        this.b = 0;
        this.c = 0;
        this.d = 0;
        this.e = 0;

        this.h = 0;
        this.l = 0;
        this.sp = 0;

        this.cpu = cpu;
    }
}

class FlagsRegister {
    zero: boolean;
    negative: boolean;
    half_carry: boolean;
    carry: boolean;

    constructor() {
        this.zero = false;
        this.negative = false;
        this.half_carry = false;
        this.carry = false;
    }
}

export enum R8 {
    A = "A", B = "B", C = "C", D = "D", E = "E", H = "H", L = "L", iHL = "(HL)"
}

export enum R16 {
    AF = "AF", BC = "BC", DE = "DE", HL = "HL", SP = "SP"
}

export enum CC {
    UNCONDITIONAL = "UNCONDITIONAL",
    Z = "Z",
    NZ = "NZ",
    C = "C",
    NC = "NC"
}

export type OperandType = R8 | R16 | CC | number;

export interface OpFunction {
    (cpu: CPU, ...others: any): void;
}

export interface Op {
    op: OpFunction, type?: OperandType, type2?: OperandType, length: number, cyclesOffset?: number;
};

export default class CPU {
    halted = false;
    haltBug = false;

    gb: GameBoy;

    logging = false;

    log: Array<string> = [];
    fullLog: Array<string> = [];

    // jumpLog: Array<string> = [];

    _r = new Registers(this);
    pc: number = 0x0000;

    breakpoints = new Set<number>();

    stopNow = false;

    scheduleEnableInterruptsForNextTick = false;

    constructor(gb: GameBoy) {
        this.gb = gb;
        writeDebug("CPU Bootstrap!");

        // Generate all possible opcodes including invalids
        for (let i = 0; i <= 0xFF; i++) {
            this.opCacheRg[i] = Decoder.rgOpcode(i);
            this.opCacheCb[i] = Decoder.cbOpcode(i);
        }
    }

    // #region

    cycles = 0;

    lastSerialOut = 0;
    lastInstructionDebug = "";
    lastOperandDebug = "";
    lastInstructionCycles = 0;
    currentIns = "";

    lastOpcode = 0;
    lastOpcodeReps = 0;

    totalI = 0;
    time = 0;

    debugging = false;

    opCacheRg: Array<Op> = new Array(256);
    opCacheCb: Array<Op> = new Array(256);

    opcodesRan = new Set();


    reset() {
        this._r.a = 0;
        this._r.b = 0;
        this._r.c = 0;
        this._r.d = 0;
        this._r.e = 0;
        this._r.f = 0;
        this._r.h = 0;
        this._r.l = 0;
        this._r.af = 0;
        this._r.bc = 0;
        this._r.de = 0;
        this._r.hl = 0;
        this._r.sp = 0;
        this.totalI = 0;
        this.time = 0;
        this.pc = 0;
        this.cycles = 0;
        this.haltBug = false;
        this.halted = false;
        this.scheduleEnableInterruptsForNextTick = false;
        this.lastInstructionCycles = 0;
    }

    // #endregion

    fetchMem8(addr: number): number {
        this.cycles += 4;
        return this.gb.bus.readMem8(addr);
    }

    // Timing already satisfied by fetchMem8
    fetchMem16(addr: number): number {
        return this.fetchMem8(addr) | this.fetchMem8(addr + 1) << 8;
    }

    writeMem8(addr: number, value: number) {
        this.cycles += 4;
        this.gb.bus.writeMem8(addr, value);
    }


    step() {
        if (this.scheduleEnableInterruptsForNextTick) {
            this.scheduleEnableInterruptsForNextTick = false;
            this.gb.bus.interrupts.masterEnabled = true;
        }

        if (this.breakpoints.has(this.pc)) {
            this.gb.speedStop();
            return;
        };

        let c = this.cycles;

        this.checkBootrom();

        // Run the debug information collector
        if (this.debugging || this.logging)
            this.stepDebug();

        if (this.halted === false) {
            this.executeInstruction();
            this.lastInstructionCycles = this.cycles - c;
        }


        // If the CPU is HALTed and there are requested interrupts, unHALT
        if ((this.gb.bus.interrupts.requestedInterrupts.numerical &
            this.gb.bus.interrupts.enabledInterrupts.numerical) && this.halted === true) {
            this.halted = false;
        }

        this.serviceInterrupts();
        this.haltBug = false;
    }

    checkBootrom() {
        if (this.pc === 0 && this.gb.bus.bootromEnabled === true && this.gb.bus.bootromLoaded === false) {
            console.log("No bootrom is loaded, starting execution at 0x100 with proper values loaded");
            this.pc = 0x100;

            this._r.af = 0x01B0;
            this._r.bc = 0x0013;
            this._r.de = 0x00D8;
            this._r.hl = 0x014D;
            this._r.sp = 0xFFFE;

            this.gb.bus.writeMem8(0xFF05, 0x00); // TIMA
            this.gb.bus.writeMem8(0xFF06, 0x00); // TMA
            this.gb.bus.writeMem8(0xFF07, 0x00); // TAC

            this.gb.bus.writeMem8(0xFF10, 0x80); // NR10 
            this.gb.bus.writeMem8(0xFF11, 0xBF); // NR11
            this.gb.bus.writeMem8(0xFF12, 0xF3); // NR12
            this.gb.bus.writeMem8(0xFF14, 0xBF); // NR14

            this.gb.bus.writeMem8(0xFF16, 0x3F); // NR21
            this.gb.bus.writeMem8(0xFF17, 0x00); // NR22
            this.gb.bus.writeMem8(0xFF19, 0x00); // NR24

            this.gb.bus.writeMem8(0xFF1A, 0x7F); // NR30
            this.gb.bus.writeMem8(0xFF1B, 0xFF); // NR31
            this.gb.bus.writeMem8(0xFF1C, 0x9F); // NR32
            this.gb.bus.writeMem8(0xFF1E, 0xBF); // NR33

            this.gb.bus.writeMem8(0xFF20, 0xFF); // NR41
            this.gb.bus.writeMem8(0xFF21, 0x00); // NR42
            this.gb.bus.writeMem8(0xFF22, 0x00); // NR43
            this.gb.bus.writeMem8(0xFF23, 0xBF); // NR44

            this.gb.bus.writeMem8(0xFF24, 0x77); // NR50
            this.gb.bus.writeMem8(0xFF25, 0xF3); // NR51


            this.gb.bus.writeMem8(0xFF26, 0xF1); // - GB, $F0 - SGB; NR52
            this.gb.bus.writeMem8(0xFF40, 0x91); // LCDC
            this.gb.bus.writeMem8(0xFF42, 0x00); // SCY
            this.gb.bus.writeMem8(0xFF43, 0x00); // SCX
            this.gb.bus.writeMem8(0xFF45, 0x00); // LYC
            this.gb.bus.writeMem8(0xFF47, 0xFC); // BGP
            this.gb.bus.writeMem8(0xFF48, 0xFF); // OBP0
            this.gb.bus.writeMem8(0xFF49, 0xFF); // OBP1
            this.gb.bus.writeMem8(0xFF4A, 0x00); // WY
            this.gb.bus.writeMem8(0xFF4B, 0x00); // WX
            this.gb.bus.writeMem8(0xFFFF, 0x00); // IE;

            // Make a write to disable the bootrom
            this.gb.bus.writeMem8(0xFF50, 1);
        }
    }

    minDebug = false;

    executeInstruction() {
        let pcTriplet = [this.gb.bus.readMem8(this.pc), this.gb.bus.readMem8(this.pc + 1), this.gb.bus.readMem8(this.pc + 2)];
        let isCB = pcTriplet[0] === 0xCB;

        if (isCB) this.cycles += 4; // 0xCB prefix decoding penalty

        // Lookup decoded
        let ins = isCB ? this.opCacheCb[pcTriplet[1]] : this.opCacheRg[pcTriplet[0]];
        this.cycles += 4; // Decoding time penalty

        if (ins.cyclesOffset) this.cycles += ins.cyclesOffset;

        if (this.minDebug) {
            if (Disassembler.isControlFlow(ins)) {
                if (Disassembler.willJump(ins, this)) {
                    let disasm = Disassembler.disassembleOp(ins, new Uint8Array(pcTriplet), this.pc, this);
                    let to = Disassembler.willJumpTo(ins, new Uint8Array(pcTriplet), this.pc, this);
                    // this.jumpLog.unshift(`[${hex(this.pc, 4)}] ${disasm} => ${hex(to, 4)}`);
                    // this.jumpLog = this.jumpLog.slice(0, 100);
                }
            }
        }

        if (ins.type != undefined) {
            if (ins.length === 3) {
                ins.op(this, ins.type, pcTriplet[2] << 8 | pcTriplet[1]);
                this.cycles += 8;
            } else if (ins.length === 2 && (ins.type2 === undefined)) {
                ins.op(this, ins.type, pcTriplet[1]);
                this.cycles += 4;
            } else {
                ins.op(this, ins.type, ins.type2);
            }
        } else {
            if (ins.length === 3) {
                ins.op(this, pcTriplet[2] << 8 | pcTriplet[1]);
                this.cycles += 8;
            } else if (ins.length === 2) {
                ins.op(this, pcTriplet[1]);
                this.cycles += 4;
            } else {
                ins.op(this);
            }
        }

        if (!this.haltBug) {
            this.pc = (this.pc + ins.length) & 0xFFFF;
        }

        this.totalI++;

        // this.opcodesRan.add(pcTriplet[0]);
    }

    serviceInterrupts() {
        // Service interrupts
        let happened = this.gb.bus.interrupts.requestedInterrupts;
        let enabled = this.gb.bus.interrupts.enabledInterrupts;
        if (this.gb.bus.interrupts.masterEnabled) {

            // If servicing any interrupt, disable the master flag
            if ((this.gb.bus.interrupts.requestedInterrupts.numerical & this.gb.bus.interrupts.enabledInterrupts.numerical) > 0) {
                this.gb.bus.interrupts.masterEnabled = false;
            }

            if (happened.vblank && enabled.vblank) {
                // this.jumpLog.unshift(`----- INTERRUPT VBLANK -----`);
                if (!this.haltBug)
                    happened.vblank = false;
                this.jumpToInterrupt(VBLANK_VECTOR);
            } else if (happened.lcdStat && enabled.lcdStat) {
                // this.jumpLog.unshift(`----- INTERRUPT LCDSTAT -----`);
                if (!this.haltBug)
                    happened.lcdStat = false;
                this.jumpToInterrupt(LCD_STATUS_VECTOR);
            } else if (happened.timer && enabled.timer) {
                // this.jumpLog.unshift(`----- INTERRUPT TIMER -----`);
                if (!this.haltBug)
                    happened.timer = false;
                this.jumpToInterrupt(TIMER_OVERFLOW_VECTOR);
            } else if (happened.serial && enabled.serial) {
                if (!this.haltBug)
                    happened.serial = false;
                this.jumpToInterrupt(SERIAL_LINK_VECTOR);
            } else if (happened.joypad && enabled.joypad) {
                if (!this.haltBug)
                    happened.joypad = false;
                this.jumpToInterrupt(JOYPAD_PRESS_VECTOR);
            }
        }
    }

    stepDebug() {
        let isCB = this.gb.bus.readMem8(this.pc) === 0xCB;

        let ins = isCB ? Decoder.cbOpcode(this.gb.bus.readMem8(this.pc + 1)) : Decoder.rgOpcode(this.gb.bus.readMem8(this.pc));

        if (!ins.op) {
            alert(`[DEBUGGER] Implementation error: ${isCB ? hex((0xCB << 8 | this.gb.bus.readMem8(this.pc + 1)), 4) : hex(this.gb.bus.readMem8(this.pc), 2)} is a null op`);
        }

        let opcode = isCB ? this.gb.bus.readMem8(this.pc + 1) : this.gb.bus.readMem8(this.pc);

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

        let insDebug = "";
        let operandDebug = "";


        if (this.debugging) {
            console.debug(`PC: ${this.pc}`);
            writeDebug(`[OPcode: ${hex(this.gb.bus.readMem16(this.pc), 2)}, OP: ${ins.op.name}] ${isCB ? "[0xCB Prefix] " : ""}Executing op: 0x` + pad(this.gb.bus.readMem8(this.pc).toString(16), 2, '0'));
            writeDebug("Instruction length: " + ins.length);
        }

        if (this.debugging || this.logging) {
            if (ins.length === 3) {
                insDebug = `${hexN_LC(this.gb.bus.readMem8(this.pc), 2)} ${hexN_LC(this.gb.bus.readMem8(this.pc + 1), 2)} ${hexN_LC(this.gb.bus.readMem8(this.pc + 2), 2)}`;
                operandDebug = `${hex(this.gb.bus.readMem16(this.pc + 1), 4)}`;
            } else if (ins.length === 2) {
                insDebug = `${hexN_LC(this.gb.bus.readMem8(this.pc), 2)} ${hexN_LC(this.gb.bus.readMem8(this.pc + 1), 2)} ..`;
                operandDebug = `${hex(this.gb.bus.readMem8(this.pc + 1), 2)}`;
            } else {
                insDebug = `${hexN_LC(this.gb.bus.readMem8(this.pc), 2)} .. ..`;
            }
            this.currentIns = `${ins.op.name} ${ins.type === undefined ? "" : ins.type}${ins.type2 === undefined ? "" : ins.type2}`;
        }

        if (this.logging) {

            let flags = `${this._r._f.zero ? 'Z' : '-'}${this._r._f.negative ? 'N' : '-'}${this._r._f.half_carry ? 'H' : '-'}${this._r._f.carry ? 'C' : '-'}`;

            // this.log.push(`A:${hexN(this._r.a, 2)} F:${flags} BC:${hexN(this._r.bc, 4)} DE:${hexN_LC(this._r.de, 4)} HL:${hexN_LC(this._r.hl, 4)
            // } SP:${hexN_LC(this._r.sp, 4)} PC:${hexN_LC(this.pc, 4)} (cy: ${this.cycles})`);

            this.log.push(`A:${hexN(this._r.a, 2)} F:${flags} BC:${hexN(this._r.bc, 4)} DE:${hexN_LC(this._r.de, 4)} HL:${hexN_LC(this._r.hl, 4)
                } SP:${hexN_LC(this._r.sp, 4)} PC:${hexN_LC(this.pc, 4)}`);
            this.fullLog.push(`A:${hexN(this._r.a, 2)} F:${flags} BC:${hexN(this._r.bc, 4)} DE:${hexN_LC(this._r.de, 4)} HL:${hexN_LC(this._r.hl, 4)
                } SP:${hexN_LC(this._r.sp, 4)} PC:${hexN_LC(this.pc, 4)} (cy: ${this.cycles}) |[00]0x${hexN_LC(this.pc, 4)}: ${r_pad(insDebug, 8, ' ')} ${this.currentIns} ${operandDebug}`);
        }

        this.lastOperandDebug = operandDebug;
        this.lastInstructionDebug = insDebug;
    }

    jumpToInterrupt(vector: number) {
        let pcUpperByte = ((this.pc) & 0xFFFF) >> 8;
        let pcLowerByte = ((this.pc) & 0xFFFF) & 0xFF;

        this._r.sp = (this._r.sp - 1) & 0xFFFF;
        this.writeMem8(this._r.sp, pcUpperByte);
        this._r.sp = (this._r.sp - 1) & 0xFFFF;
        this.writeMem8(this._r.sp, pcLowerByte);

        this.pc = vector;
    }

    toggleBreakpoint(point: number) {
        if (!this.breakpoints.has(point)) {
            this.setBreakpoint(point);
        } else {
            this.clearBreakpoint(point);
        }
    }
    setBreakpoint(point: number) {
        writeDebug("Set breakpoint at " + hex(point, 4));
        this.breakpoints.add(point);
    }
    clearBreakpoint(point: number) {
        writeDebug("Cleared breakpoint at " + hex(point, 4));
        this.breakpoints.delete(point);
    }

    getReg8(t: R8) {
        // if (t === undefined) {
        //     alert(`[PC ${hex(this.pc, 4)}, opcode: ${hex(this.gb.bus.readMem8(this.pc), 2)}] Implementation error: getReg(undefined)`);
        // }

        switch (t) {
            case R8.A: return this._r.a;
            case R8.B: return this._r.b;
            case R8.C: return this._r.c;
            case R8.D: return this._r.d;
            case R8.E: return this._r.e;
            case R8.H: return this._r.h;
            case R8.L: return this._r.l;
            case R8.iHL: return this.fetchMem8(this._r.hl);
        }
    }

    getReg16(t: R16) {
        switch (t) {
            case R16.AF: return this._r.af;
            case R16.BC: return this._r.bc;
            case R16.DE: return this._r.de;
            case R16.HL: return this._r.hl;
            case R16.SP: return this._r.sp;
        }
    }

    setReg8(t: R8, i: number) {
        // if (t === undefined) {
        //     alert(`[PC ${hex(this.pc, 4)}, opcode: ${hex(this.gb.bus.readMem8(this.pc), 2)}] Implementation error: setReg(undefined, [any])`);
        // }
        // if (i === undefined) {
        //     alert(`[PC ${hex(this.pc, 4)}, opcode: ${hex(this.gb.bus.readMem8(this.pc), 2)}] Implementation error: setReg([any], undefined)`);
        // }

        switch (t) {
            case R8.A: this._r.a = i; break;
            case R8.B: this._r.b = i; break;
            case R8.C: this._r.c = i; break;
            case R8.D: this._r.d = i; break;
            case R8.E: this._r.e = i; break;
            case R8.H: this._r.h = i; break;
            case R8.L: this._r.l = i; break;
            case R8.iHL: this.writeMem8(this._r.hl, i); break;
        }
    }

    setReg16(t: R16, i: number) {
        switch (t) {
            case R16.AF: this._r.af = i; break;
            case R16.BC: this._r.bc = i; break;
            case R16.DE: this._r.de = i; break;
            case R16.HL: this._r.hl = i; break;
            case R16.SP: this._r.sp = i; break;
        }
    }
}

