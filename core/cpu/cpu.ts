import Ops from "./cpu_ops";
import GameBoy from "../gameboy";
import Disassembler from "../../src/gameboy/tools/disassembler";
import { writeDebug } from "../../src/gameboy/tools/debug";
import { hex, pad, hexN_LC, hexN, r_pad, assert } from "../../src/gameboy/tools/util";
import { VBLANK_VECTOR, LCD_STATUS_VECTOR, TIMER_OVERFLOW_VECTOR, SERIAL_LINK_VECTOR, JOYPAD_PRESS_VECTOR } from "../components/interrupt-controller";
import Decoder from './decoder';
import * as Timings from '../../src/gameboy/data/cpu_instruction_timings';

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
        this._f.zero = (i & (1 << 7)) !== 0;
        this._f.negative = (i & (1 << 6)) !== 0;
        this._f.half_carry = (i & (1 << 5)) !== 0;
        this._f.carry = (i & (1 << 4)) !== 0;
    }

    // The 7 general registers + (HL)
    gen: {
        0: number,
        1: number,
        2: number,
        3: number,
        4: number,
        5: number,
        6: number,
        7: number;
    };

    sp = 0;

    get af() {
        return this.gen[R8.A] << 8 | this.f;
    }
    get bc() {
        return this.gen[R8.B] << 8 | this.gen[R8.C];
    }
    get de() {
        return this.gen[R8.D] << 8 | this.gen[R8.E];
    }
    get hl() {
        return this.gen[R8.H] << 8 | this.gen[R8.L];
    }

    get a() { return this.gen[R8.A]; };
    get b() { return this.gen[R8.B]; };
    get c() { return this.gen[R8.C]; };
    get d() { return this.gen[R8.D]; };
    get e() { return this.gen[R8.E]; };
    get h() { return this.gen[R8.H]; };
    get l() { return this.gen[R8.L]; };

    set a(i: number) { this.gen[R8.A] = i; };
    set b(i: number) { this.gen[R8.B] = i; };
    set c(i: number) { this.gen[R8.C] = i; };
    set d(i: number) { this.gen[R8.D] = i; };
    set e(i: number) { this.gen[R8.E] = i; };
    set h(i: number) { this.gen[R8.H] = i; };
    set l(i: number) { this.gen[R8.L] = i; };

    set af(i: number) {
        this.gen[R8.A] = i >> 8;
        this.f = i & 0xFF;
    }
    set bc(i: number) {
        this.gen[R8.B] = i >> 8;
        this.gen[R8.C] = i & 0xFF;
    }
    set de(i: number) {
        this.gen[R8.D] = i >> 8;
        this.gen[R8.E] = i & 0xFF;
    }
    set hl(i: number) {
        this.gen[R8.H] = i >> 8;
        this.gen[R8.L] = i & 0xFF;
    }

    constructor(cpu: CPU) {
        this.cpu = cpu;

        this.gen = {
            0: 0,
            1: 0,
            2: 0,
            3: 0,
            4: 0,
            5: 0,
            get 6(): number {
                return cpu.fetchMem8(cpu._r.hl);
            },
            set 6(i: number) {
                cpu.writeMem8(cpu._r.hl, i);
            },
            7: 0
        };
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
    B = 0, C = 1, D = 2, E = 3, H = 4, L = 5, iHL = 6, A = 7
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

    breakpoints = new Array<boolean>(65536).fill(false);

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
        this._r.gen[R8.A] = 0;
        this._r.gen[R8.B] = 0;
        this._r.gen[R8.C] = 0;
        this._r.gen[R8.D] = 0;
        this._r.gen[R8.E] = 0;
        this._r.gen[R8.H] = 0;
        this._r.gen[R8.L] = 0;

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

        this.checkBootrom();

        // Run the debug information collector
        if (this.debugging || this.logging)
            this.stepDebug();

        if (this.halted === false) {
            this.executeInstruction();
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

            // Games check A for 0x11 to detect a CGB
            if (this.gb.cgb)
                this._r.a = 0x11;

            // this._r.af = 0x01B0;
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
        const c = this.cycles;

        const pcTriplet = Uint8Array.of
            (
                this.gb.bus.readMem8(this.pc + 0),
                this.gb.bus.readMem8(this.pc + 1),
                this.gb.bus.readMem8(this.pc + 2)
            );
        const isCB = pcTriplet[0] === 0xCB;

        if (isCB) this.cycles += 4; // 0xCB prefix decoding penalty

        // Lookup decoded
        const ins = isCB ? this.opCacheCb[pcTriplet[1]] : this.opCacheRg[pcTriplet[0]];
        this.cycles += 4; // Decoding time penalty

        if (ins.cyclesOffset) this.cycles += ins.cyclesOffset;

        if (this.minDebug) {
            if (Disassembler.isControlFlow(ins)) {
                if (Disassembler.willJump(ins, this)) {
                    const disasm = Disassembler.disassembleOp(ins, pcTriplet, this);
                    const to = Disassembler.willJumpTo(ins, pcTriplet, this);
                    // this.jumpLog.unshift(`[${hex(this.pc, 4)}] ${disasm} => ${hex(to, 4)}`);
                    // this.jumpLog = this.jumpLog.slice(0, 100);
                }
            }
        }

        if (ins.type !== undefined) {
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
        this.lastInstructionCycles = this.cycles - c;

        // Checking for proper timings below here
        return;

        let success = true;

        if (!isCB) {
            if (!Disassembler.isControlFlow(ins)) {
                if (!(ins.op == Ops.HALT || ins.op == Ops.STOP)) {
                    success = assert(this.lastInstructionCycles, Timings.NORMAL_TIMINGS[pcTriplet[0]] * 4, "CPU timing");
                }
            }
        } else {
            success = assert(this.lastInstructionCycles, Timings.CB_TIMINGS[pcTriplet[1]] * 4, "[CB] CPU timing");
        }

        if (success == false) {
            console.log(Disassembler.disassembleOp(ins, pcTriplet, this));
            console.log(`Offset: ${ins.cyclesOffset}`);
            this.gb.speedStop();
        }

        // this.opcodesRan.add(pcTriplet[0]);
    }

    serviceInterrupts() {
        // Service interrupts
        const happened = this.gb.bus.interrupts.requestedInterrupts;
        const enabled = this.gb.bus.interrupts.enabledInterrupts;
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

            const flags = `${this._r._f.zero ? 'Z' : '-'}${this._r._f.negative ? 'N' : '-'}${this._r._f.half_carry ? 'H' : '-'}${this._r._f.carry ? 'C' : '-'}`;

            // this.log.push(`A:${hexN(this._r.a, 2)} F:${flags} BC:${hexN(this._r.bc, 4)} DE:${hexN_LC(this._r.de, 4)} HL:${hexN_LC(this._r.hl, 4)
            // } SP:${hexN_LC(this._r.sp, 4)} PC:${hexN_LC(this.pc, 4)} (cy: ${this.cycles})`);

            this.log.push(`A:${hexN(this._r.gen[R8.A], 2)} F:${flags} BC:${hexN(this._r.bc, 4)} DE:${hexN_LC(this._r.de, 4)} HL:${hexN_LC(this._r.hl, 4)
                } SP:${hexN_LC(this._r.sp, 4)} PC:${hexN_LC(this.pc, 4)}`);
            this.fullLog.push(`A:${hexN(this._r.gen[R8.A], 2)} F:${flags} BC:${hexN(this._r.bc, 4)} DE:${hexN_LC(this._r.de, 4)} HL:${hexN_LC(this._r.hl, 4)
                } SP:${hexN_LC(this._r.sp, 4)} PC:${hexN_LC(this.pc, 4)} (cy: ${this.cycles}) |[00]0x${hexN_LC(this.pc, 4)}: ${r_pad(insDebug, 8, ' ')} ${this.currentIns} ${operandDebug}`);
        }

        this.lastOperandDebug = operandDebug;
        this.lastInstructionDebug = insDebug;
    }

    jumpToInterrupt(vector: number) {
        const pcUpperByte = ((this.pc) & 0xFFFF) >> 8;
        const pcLowerByte = ((this.pc) & 0xFFFF) & 0xFF;

        this._r.sp = (this._r.sp - 1) & 0xFFFF;
        this.writeMem8(this._r.sp, pcUpperByte);
        this._r.sp = (this._r.sp - 1) & 0xFFFF;
        this.writeMem8(this._r.sp, pcLowerByte);

        this.pc = vector;
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

    getReg16(t: R16) {
        switch (t) {
            case R16.AF: return this._r.af;
            case R16.BC: return this._r.bc;
            case R16.DE: return this._r.de;
            case R16.HL: return this._r.hl;
            case R16.SP: return this._r.sp;
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
