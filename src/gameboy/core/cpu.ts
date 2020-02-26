import Ops from "./cpu_ops";
import GameBoy from "../gameboy";
import { VBLANK_VECTOR, LCD_STATUS_VECTOR, TIMER_OVERFLOW_VECTOR, SERIAL_LINK_VECTOR, JOYPAD_PRESS_VECTOR } from "../components/interrupt-controller";
import Disassembler from "../tools/disassembler";


function undefErr(cpu: CPU, name: string) {
    alert(`
    ${name} undefined
    
    Total Instructions: #${cpu.totalI}
    PC: 0x${cpu.pc.toString(16)}
    Opcode: 0x${cpu.gb.bus.readMem8(cpu.pc).toString(16)}
    Op: ${cpu.rgOpcode(cpu.gb.bus.readMem8(cpu.pc)).op.name}
    `);
}

function overflow8bErr(cpu: CPU, name: string, overflow: any) {
    alert(`
    ${name} was set out of 0-255 (${overflow})
    
    Total Instructions: #${cpu.totalI}
    PC: 0x${cpu.pc.toString(16)}
    Opcode: 0x${cpu.gb.bus.readMem8(cpu.pc).toString(16)}
    Op: ${cpu.rgOpcode(cpu.gb.bus.readMem8(cpu.pc)).op.name}
    `);
}

function overflow16bErr(cpu: CPU, name: string, overflow: any) {
    alert(`
    ${name} was set out of 0-65535 (${overflow})
    
    Total Instructions: #${cpu.totalI}
    PC: 0x${cpu.pc.toString(16)}
    Opcode: 0x${cpu.gb.bus.readMem8(cpu.pc).toString(16)}
    Op: ${cpu.rgOpcode(cpu.gb.bus.readMem8(cpu.pc)).op.name}
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
        this.a = (i & 0xFF00) >> 8;
        this.f = i & 0xFF;
    }
    set bc(i: number) {
        this.b = (i & 0xFF00) >> 8;
        this.c = i & 0xFF;
    }
    set de(i: number) {
        this.d = (i & 0xFF00) >> 8;
        this.e = i & 0xFF;
    }
    set hl(i: number) {
        this.h = (i & 0xFF00) >> 8;
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

export interface Op {
    op(cpu: CPU, ...others: any): void, type?: OperandType, type2?: OperandType, length: number, cyclesOffset?: number;
};

export enum Operand {
    b16, b8
}

export function pad(n: string, width: number, z: string) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

export function r_pad(n: string, width: number, z: string) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : n + new Array(width - n.length + 1).join(z);
}

export default class CPU {
    halted = false;

    gb: GameBoy;

    logging = false;

    log: Array<string> = [];
    fullLog: Array<string> = [];

    _r = new Registers(this);
    _pc: number = 0x0000;

    breakpoints = new Set<number>();

    stopNow = false;

    scheduleEnableInterruptsForNextTick = false;

    constructor(gb: GameBoy) {
        this.gb = gb;
        console.log("CPU Bootstrap!");

        // Generate all possible opcodes including invalids
        for (let i = 0; i <= 0xFF; i++) {
            this.opCacheRg[i] = this.rgOpcode(i);
            this.opCacheCb[i] = this.cbOpcode(i);
        }
    }

    get pc(): number {
        return this._pc;
    }
    set pc(i: number) {
        if (isNaN(i)) {
            alert(`
            PC undefined (${i})
            
            PC: 0x${this.pc.toString(16)}
            Opcode: 0x${this.fetchMem8(this.pc).toString(16)}
            Op: ${this.rgOpcode(this.fetchMem8(this.pc)).op.name}
    
            `);
        }
        this._pc = i;
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
        this.gb.bus.writeMem(addr, value);
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

        if (this.pc == 0 && this.gb.bus.bootromEnabled == true && this.gb.bus.bootromLoaded == false) {
            console.log("No bootrom is loaded, starting execution at 0x100 with proper values loaded");
            this.pc = 0x100;

            this._r.af = 0x01B0;
            this._r.bc = 0x0013;
            this._r.de = 0x00D8;
            this._r.hl = 0x014D;
            this._r.sp = 0xFFFE;

            // Make a write to disable the bootrom
            this.gb.bus.writeMem(0xFF50, 1);
        }


        // Run the debug information collector
        if (this.debugging)
            this.stepDebug();

        // #region  **** ALL STEPPER LOGIC IS BELOW HERE **** 
        if (this.halted == false) {
            let pcTriplet = [this.gb.bus.readMem8(this.pc), this.gb.bus.readMem8(this.pc + 1), this.gb.bus.readMem8(this.pc + 2)];
            let isCB = pcTriplet[0] == 0xCB;

            if (isCB) this.cycles += 4; // 0xCB prefix decoding penalty

            // Lookup decoded
            let ins = isCB ? this.opCacheCb[pcTriplet[1]] : this.opCacheRg[pcTriplet[0]];
            this.cycles += 4; // Decoding time penalty
            let opcode = isCB ? pcTriplet[1] : pcTriplet[0];

            if (!ins.op) {
                alert(`Implementation error: ${isCB ? hex((0xCB << 8 | this.gb.bus.readMem8(this.pc + 1)), 4) : hex(this.gb.bus.readMem8(this.pc), 2)} is a null op`);
            }

            if (ins.cyclesOffset) this.cycles += ins.cyclesOffset;


            if (ins.type != undefined) {
                if (ins.length == 3) {
                    ins.op(this, ins.type, pcTriplet[2] << 8 | pcTriplet[1]);
                    this.cycles += 8;
                } else if (ins.length == 2 && (ins.type2 == undefined)) {
                    ins.op(this, ins.type, pcTriplet[1]);
                    this.cycles += 4;
                } else {
                    ins.op(this, ins.type, ins.type2);
                }
            } else {
                if (ins.length == 3) {
                    ins.op(this, pcTriplet[2] << 8 | pcTriplet[1]);
                    this.cycles += 8;
                } else if (ins.length == 2) {
                    ins.op(this, pcTriplet[1]);
                    this.cycles += 4;
                } else {
                    ins.op(this);
                }
            }

            this.pc += ins.length;
            this.pc &= 0xFFFF;

            this.totalI++;

            this.lastInstructionCycles = this.cycles - c;

            // this.opcodesRan.add(pcTriplet[0]);

            // ---------------------------

            if (false) {
                let isControlFlow = Disassembler.isControlFlow(ins, this);
                if (!isCB) {
                    if (DMG_OPS.Unprefixed[opcode].Length != ins.length) {
                        alert(`
                    Length error:
                    
                    Instruction: ${Disassembler.disassembleOp(ins, pcTriplet, this.pc, this)}
                    Opcode: ${hex(opcode, 2)}

                    Instruction Length: ${ins.length}
                    Proper Length: ${DMG_OPS.Unprefixed[opcode].Length}
                    
                    `);
                        this.gb.speedStop();
                    }

                    if (NORMAL_TIMINGS[opcode] * 4 != this.lastInstructionCycles &&
                        isControlFlow == false &&
                        opcode != 0x76 &&
                        NORMAL_TIMINGS[opcode] != 0
                    ) {
                        alert(`
                    Timings error:
                    
                    Instruction: ${Disassembler.disassembleOp(ins, pcTriplet, this.pc, this)}
                    Opcode: ${hex(opcode, 2)}

                    Instruction Timing: ${this.lastInstructionCycles}
                    Proper Timing: ${NORMAL_TIMINGS[opcode] * 4}
                    
                    `);
                        this.gb.speedStop();
                    }
                } else {
                    if (DMG_OPS.CBPrefixed[opcode].Length != ins.length) {
                        alert(`
                    Length error:
                    
                    Instruction: ${Disassembler.disassembleOp(ins, pcTriplet, this.pc, this)}
                    Opcode: ${hex(opcode, 2)}

                    Instruction Length: ${ins.length}
                    Proper Length: ${DMG_OPS.CBPrefixed[opcode].Length}
                    
                    `);
                        this.gb.speedStop();
                    }

                    // TODO Screw it, i'll handle this later
                    if (CB_TIMINGS[opcode] * 4 != this.lastInstructionCycles && isControlFlow == false) {
                        alert(`
                    Timings error:
                    
                    Instruction: ${Disassembler.disassembleOp(ins, pcTriplet, this.pc, this)}
                    Opcode: [CB] ${hex(opcode, 2)}

                    Instruction Timing: ${this.lastInstructionCycles}
                    Proper Timing: ${CB_TIMINGS[opcode] * 4}
                    
                    `);
                        this.gb.speedStop();
                    }
                }
            }
        }
        //#endregion

        // If the CPU is HALTed and there are requested interrupts, unHALT
        if (this.gb.bus.interrupts.requestedInterrupts.numerical > 0 && this.halted == true) {
            this.halted = false;
        }

        // Service interrupts
        let happened = this.gb.bus.interrupts.requestedInterrupts;
        let enabled = this.gb.bus.interrupts.enabledInterrupts;
        if (this.gb.bus.interrupts.masterEnabled) {

            // If servicing any interrupt, disable the master flag
            if ((this.gb.bus.interrupts.requestedInterrupts.numerical & this.gb.bus.interrupts.enabledInterrupts.numerical) > 0) {
                this.gb.bus.interrupts.masterEnabled = false;
                // console.log("Handling interrupt, disabling IME")

                // Stop
                // this.khzStop();
            }

            if (happened.vblank && enabled.vblank) {
                happened.vblank = false;
                this.jumpToInterrupt(VBLANK_VECTOR);
            } else if (happened.lcdStat && enabled.lcdStat) {
                happened.lcdStat = false;
                this.jumpToInterrupt(LCD_STATUS_VECTOR);
            } else if (happened.timer && enabled.timer) {
                happened.timer = false;
                this.jumpToInterrupt(TIMER_OVERFLOW_VECTOR);
            } else if (happened.serial && enabled.serial) {
                happened.serial = false;
                this.jumpToInterrupt(SERIAL_LINK_VECTOR);
            } else if (happened.joypad && enabled.joypad) {
                happened.joypad = false;
                this.jumpToInterrupt(JOYPAD_PRESS_VECTOR);
            }
        }
    }

    stepDebug() {
        let isCB = this.gb.bus.readMem8(this.pc) == 0xCB;

        let ins = isCB ? this.cbOpcode(this.gb.bus.readMem8(this.pc + 1)) : this.rgOpcode(this.gb.bus.readMem8(this.pc));

        if (!ins.op) {
            alert(`[DEBUGGER] Implementation error: ${isCB ? hex((0xCB << 8 | this.gb.bus.readMem8(this.pc + 1)), 4) : hex(this.gb.bus.readMem8(this.pc), 2)} is a null op`);
        }

        let opcode = isCB ? this.gb.bus.readMem8(this.pc + 1) : this.gb.bus.readMem8(this.pc);

        if (opcode == this.lastOpcode) {
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

        // if ((ins.op.length == 1 && (!ins.type)) || (ins.op.length == 2 && (!ins.type || !ins.type2))) {
        //     alert(`[Arg length 1 || 2] Implementation error: ${ins.op.name} 0x${this.fetchMem8(this.pc).toString(16)}`);
        // }
        // if (ins.op.length == 3 && (ins.type === undefined || ins.type2 === undefined)) {
        //     alert(`[Arg length 3] Implementation error: ${ins.op.name} 0x${this.fetchMem8(this.pc).toString(16)}`);
        // }

        let insDebug = "";
        let operandDebug = "";


        if (this.debugging) {
            console.debug(`PC: ${this.pc}`);
            console.log(`[OPcode: ${hex(this.gb.bus.readMem16(this.pc), 2)}, OP: ${ins.op.name}] ${isCB ? "[0xCB Prefix] " : ""}Executing op: 0x` + pad(this.gb.bus.readMem8(this.pc).toString(16), 2, '0'));
            console.log("Instruction length: " + ins.length);
        }

        if (this.debugging || this.logging) {
            if (ins.length == 3) {
                insDebug = `${hexN_LC(this.gb.bus.readMem8(this.pc), 2)} ${hexN_LC(this.gb.bus.readMem8(this.pc + 1), 2)} ${hexN_LC(this.gb.bus.readMem8(this.pc + 2), 2)}`;
                operandDebug = `${hex(this.gb.bus.readMem16(this.pc + 1), 4)}`;
            } else if (ins.length == 2) {
                insDebug = `${hexN_LC(this.gb.bus.readMem8(this.pc), 2)} ${hexN_LC(this.gb.bus.readMem8(this.pc + 1), 2)} ..`;
                operandDebug = `${hex(this.gb.bus.readMem8(this.pc + 1), 2)}`;
            } else {
                insDebug = `${hexN_LC(this.gb.bus.readMem8(this.pc), 2)} .. ..`;
            }
            this.currentIns = `${ins.op.name} ${ins.type == undefined ? "" : ins.type}${ins.type2 == undefined ? "" : ins.type2}`;
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
        let pcUpperByte = o16b(this.pc) >> 8;
        let pcLowerByte = o16b(this.pc) & 0xFF;

        this._r.sp = o16b(this._r.sp - 1);
        this.writeMem8(this._r.sp, pcUpperByte);
        this._r.sp = o16b(this._r.sp - 1);
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
        console.log("Set breakpoint at " + hex(point, 4));
        this.breakpoints.add(point);
    }
    clearBreakpoint(point: number) {
        console.log("Cleared breakpoint at " + hex(point, 4));
        this.breakpoints.delete(point);
    }

    getReg(t: R8 | R16) {
        if (t == undefined) {
            alert(`[PC ${hex(this.pc, 4)}, opcode: ${hex(this.gb.bus.readMem8(this.pc), 2)}] Implementation error: getReg(undefined)`);
        }

        switch (t) {
            case R8.A: return this._r.a;
            case R8.B: return this._r.b;
            case R8.C: return this._r.c;
            case R8.D: return this._r.d;
            case R8.E: return this._r.e;
            case R8.H: return this._r.h;
            case R8.L: return this._r.l;
            case R16.AF: return this._r.af;
            case R16.BC: return this._r.bc;
            case R16.DE: return this._r.de;
            case R16.HL: return this._r.hl;
            case R16.SP: return this._r.sp;
            case R8.iHL: return this.fetchMem8(this._r.hl);
        }
    }

    setReg(t: R8 | R16, i: number) {
        if (t == undefined) {
            alert(`[PC ${hex(this.pc, 4)}, opcode: ${hex(this.gb.bus.readMem8(this.pc), 2)}] Implementation error: setReg(undefined, [any])`);
        }
        if (i == undefined) {
            alert(`[PC ${hex(this.pc, 4)}, opcode: ${hex(this.gb.bus.readMem8(this.pc), 2)}] Implementation error: setReg([any], undefined)`);
        }

        switch (t) {
            case R8.A: this._r.a = i; break;
            case R8.B: this._r.b = i; break;
            case R8.C: this._r.c = i; break;
            case R8.D: this._r.d = i; break;
            case R8.E: this._r.e = i; break;
            case R8.H: this._r.h = i; break;
            case R8.L: this._r.l = i; break;
            case R16.AF: this._r.af = i; break;
            case R16.BC: this._r.bc = i; break;
            case R16.DE: this._r.de = i; break;
            case R16.HL: this._r.hl = i; break;
            case R16.SP: this._r.sp = i; break;
            case R8.iHL: this.writeMem8(this._r.hl, i); break;
        }
    }

    rgOpcode(id: number): Op {

        let upperNybble = id >> 4;
        let lowerNybble = id & 0b1111;

        switch (id) {
            /** Misc - Organize some later */
            case 0x32:
                return { op: Ops.LD_iHLdec_A, length: 1 };
            case 0xE2:
                return { op: Ops.LD_iFF00plusC_A, length: 1 };
            case 0xE0:
                return { op: Ops.LD_iFF00plusN8_A, length: 2 };
            case 0x1A:
                return { op: Ops.LD_A_iR16, type: R16.DE, length: 1 };
            case 0x00: // NOP
                return { op: Ops.NOP, length: 1 };
            case 0x22:
                return { op: Ops.LD_iHLinc_A, length: 1 };
            case 0xEA:
                return { op: Ops.LD_iN16_A, length: 3 };
            case 0x02: // LD (BC),A
                return { op: Ops.LD_iR16_A, type: R16.BC, length: 1 };
            case 0xF0: // LD A,[$FF00+n8]
                return { op: Ops.LD_A_iFF00plusN8, length: 2 };
            case 0xF3: // DI - Disable interrupts master flag
                return { op: Ops.DI, length: 1 };
            case 0x36:
                return { op: Ops.LD_iHL_N8, length: 2 };
            case 0x2A:
                return { op: Ops.LD_A_iHL_INC, length: 1 };
            case 0xFB: // EI - Enable interrupts master flag
                return { op: Ops.EI, length: 1 };
            case 0x2F: // CPL
                return { op: Ops.CPL, length: 1 };
            case 0xE6: // AND A, u8
                return { op: Ops.AND_N8, length: 2 };





            /** JR */
            case 0x18: // JR E8
                return { op: Ops.JR_E8, type: CC.UNCONDITIONAL, length: 2 };
            case 0x38: // JR C, E8
                return { op: Ops.JR_E8, type: CC.C, length: 2 };
            case 0x30: // JR NC, E8
                return { op: Ops.JR_E8, type: CC.NC, length: 2 };
            case 0x28: // JR Z, E8
                return { op: Ops.JR_E8, type: CC.Z, length: 2 };
            case 0x20: // JR NZ, E8
                return { op: Ops.JR_E8, type: CC.NZ, length: 2 };

            /** LD R8, N8 */
            case 0x3E: // LD A, N8
                return { op: Ops.LD_R8_N8, type: R8.A, length: 2 };
            case 0x06: // LD B, N8
                return { op: Ops.LD_R8_N8, type: R8.B, length: 2 };
            case 0x0E: // LD C, N8
                return { op: Ops.LD_R8_N8, type: R8.C, length: 2 };
            case 0x16: // LD D, N8
                return { op: Ops.LD_R8_N8, type: R8.D, length: 2 };
            case 0x1E: // LD E, n8
                return { op: Ops.LD_R8_N8, type: R8.E, length: 2 };
            case 0x26: // LD H, N8
                return { op: Ops.LD_R8_N8, type: R8.H, length: 2 };
            case 0x2E: // LD L, N8
                return { op: Ops.LD_R8_N8, type: R8.L, length: 2 };

            /** LD R16, N16 */
            case 0x01: // LD BC, N16
                return { op: Ops.LD_R16_N16, type: R16.BC, length: 3 };
            case 0x11: // LD DE, N16
                return { op: Ops.LD_R16_N16, type: R16.DE, length: 3 };
            case 0x21: // LD HL, N16
                return { op: Ops.LD_R16_N16, type: R16.HL, length: 3 };
            case 0x31: // LD SP, N16
                return { op: Ops.LD_R16_N16, type: R16.SP, length: 3 };

            /** PUSH R16 */
            case 0xF5: // PUSH AF 
                return { op: Ops.PUSH_R16, type: R16.AF, length: 1, cyclesOffset: 4 };
            case 0xC5: // PUSH BC
                return { op: Ops.PUSH_R16, type: R16.BC, length: 1, cyclesOffset: 4 };
            case 0xD5: // PUSH DE
                return { op: Ops.PUSH_R16, type: R16.DE, length: 1, cyclesOffset: 4 };
            case 0xE5: // PUSH HL
                return { op: Ops.PUSH_R16, type: R16.HL, length: 1, cyclesOffset: 4 };

            /** POP R16 */
            case 0xF1: // POP AF 
                return { op: Ops.POP_R16, type: R16.AF, length: 1 };
            case 0xC1: // POP BC
                return { op: Ops.POP_R16, type: R16.BC, length: 1 };
            case 0xD1: // POP DE
                return { op: Ops.POP_R16, type: R16.DE, length: 1 };
            case 0xE1: // POP HL
                return { op: Ops.POP_R16, type: R16.HL, length: 1 };

            /** INC R8 */
            case 0x3C: // INC A
                return { op: Ops.INC_R8, type: R8.A, length: 1 };
            case 0x04: // INC B
                return { op: Ops.INC_R8, type: R8.B, length: 1 };
            case 0x0C: // INC C
                return { op: Ops.INC_R8, type: R8.C, length: 1 };
            case 0x14: // INC D
                return { op: Ops.INC_R8, type: R8.D, length: 1 };
            case 0x1C: // INC E
                return { op: Ops.INC_R8, type: R8.E, length: 1 };
            case 0x24: // INC H
                return { op: Ops.INC_R8, type: R8.H, length: 1 };
            case 0x2C: // INC L
                return { op: Ops.INC_R8, type: R8.L, length: 1 };
            case 0x34: // INC [HL]
                return { op: Ops.INC_R8, type: R8.iHL, length: 1 };

            /** DEC R8 */
            case 0x3D: // DEC A
                return { op: Ops.DEC_R8, type: R8.A, length: 1 };
            case 0x05: // DEC B
                return { op: Ops.DEC_R8, type: R8.B, length: 1 };
            case 0x0D: // DEC C
                return { op: Ops.DEC_R8, type: R8.C, length: 1 };
            case 0x15: // DEC D
                return { op: Ops.DEC_R8, type: R8.D, length: 1 };
            case 0x1D: // DEC E
                return { op: Ops.DEC_R8, type: R8.E, length: 1 };
            case 0x25: // DEC H
                return { op: Ops.DEC_R8, type: R8.H, length: 1 };
            case 0x2D: // DEC L
                return { op: Ops.DEC_R8, type: R8.L, length: 1 };
            case 0x35: // DEC [HL]
                return { op: Ops.DEC_R8, type: R8.iHL, length: 1 };

            /** INC R16 */
            case 0x03: // INC BC
                return { op: Ops.INC_R16, type: R16.BC, length: 1, cyclesOffset: 4 };
            case 0x13: // INC DE 
                return { op: Ops.INC_R16, type: R16.DE, length: 1, cyclesOffset: 4 };
            case 0x23: // INC HL
                return { op: Ops.INC_R16, type: R16.HL, length: 1, cyclesOffset: 4 };
            case 0x33: // INC SP
                return { op: Ops.INC_R16, type: R16.SP, length: 1, cyclesOffset: 4 };

            /** DEC R16 */
            case 0x0B: // DEC BC
                return { op: Ops.DEC_R16, type: R16.BC, length: 1, cyclesOffset: 4 };
            case 0x1B: // DEC DE 
                return { op: Ops.DEC_R16, type: R16.DE, length: 1, cyclesOffset: 4 };
            case 0x2B: // DEC HL
                return { op: Ops.DEC_R16, type: R16.HL, length: 1, cyclesOffset: 4 };
            case 0x3B: // DEC SP
                return { op: Ops.DEC_R16, type: R16.SP, length: 1, cyclesOffset: 4 };

            /** Arithmetic */
            case 0xC6: // ADD A, N8
                return { op: Ops.ADD_A_N8, length: 2 };
            case 0xCE: // ADC A, N8
                return { op: Ops.ADC_A_N8, length: 2 };
            case 0xD6: // SUB A, N8
                return { op: Ops.SUB_A_N8, length: 2 };
            case 0xDE: // SBC A, N8
                return { op: Ops.SBC_A_N8, length: 2 };

            /** RET */
            case 0xC9: // RET
                return { op: Ops.RET, type: CC.UNCONDITIONAL, length: 1 };
            case 0xD8: // RET C
                return { op: Ops.RET, type: CC.C, length: 1 };
            case 0xD0: // RET NC
                return { op: Ops.RET, type: CC.NC, length: 1 };
            case 0xC8: // RET Z
                return { op: Ops.RET, type: CC.Z, length: 1 };
            case 0xC0: // RET NZ
                return { op: Ops.RET, type: CC.NZ, length: 1 };

            /** SP/HL ops */
            case 0xF8: // LD HL, SP+e8
                return { op: Ops.LD_HL_SPaddE8, length: 2, cyclesOffset: 4 };
            case 0xF9: // LD SP, HL
                return { op: Ops.LD_SP_HL, length: 1, cyclesOffset: 4 };

            /** A rotate */
            case 0x07: // RLC A
                return { op: Ops.RLCA, length: 1 };
            case 0x0F: // RRC A
                return { op: Ops.RRCA, length: 1 };
            case 0x1F: // RR A
                return { op: Ops.RRA, length: 1 };
            case 0x17: // RL A
                return { op: Ops.RLA, length: 1 };

            /** A ops */
            case 0xEE: // XOR A, N8
                return { op: Ops.XOR_A_N8, length: 2 };
            case 0xFE: // CP A, N8
                return { op: Ops.CP_A_N8, length: 2 };

            /** Interrupts */
            case 0x10: // STOP
                return { op: Ops.STOP, length: 2 };
            case 0x76: // HALT
                return { op: Ops.HALT, length: 1 };

            /** Carry flag */
            case 0x37: // SCF
                return { op: Ops.SCF, length: 1 };
            case 0x3F: // CCF
                return { op: Ops.CCF, length: 1 };

            /** JP */
            case 0xE9: // JP HL
                return { op: Ops.JP_HL, length: 1 };
            case 0xC3: // JP N16
                return { op: Ops.JP_N16, type: CC.UNCONDITIONAL, length: 3 };
            case 0xDA: // JP C, N16
                return { op: Ops.JP_N16, type: CC.C, length: 3 };
            case 0xD2: // JP NC, N16
                return { op: Ops.JP_N16, type: CC.NC, length: 3 };
            case 0xCA: // JP Z, N16
                return { op: Ops.JP_N16, type: CC.Z, length: 3 };
            case 0xC2: // JP NZ, N16
                return { op: Ops.JP_N16, type: CC.NZ, length: 3 };

            /** CALL */
            case 0xCD: // CALL N16
                return { op: Ops.CALL_N16, type: CC.UNCONDITIONAL, length: 3 };
            case 0xDC: // CALL C, N16
                return { op: Ops.CALL_N16, type: CC.C, length: 3 };
            case 0xD4: // CALL NC, N16
                return { op: Ops.CALL_N16, type: CC.NC, length: 3 };
            case 0xCC: // CALL Z, N16
                return { op: Ops.CALL_N16, type: CC.Z, length: 3 };
            case 0xC4: // CALL NZ, N16
                return { op: Ops.CALL_N16, type: CC.NZ, length: 3 };

            /** ADD HL, R16 */
            case 0x09: // ADD HL, BC
                return { op: Ops.ADD_HL_R16, type: R16.BC, length: 1, cyclesOffset: 4 };
            case 0x19: // ADD HL, DE
                return { op: Ops.ADD_HL_R16, type: R16.DE, length: 1, cyclesOffset: 4 };
            case 0x29: // ADD HL, HL
                return { op: Ops.ADD_HL_R16, type: R16.HL, length: 1, cyclesOffset: 4 };

            /** Reset Vectors */
            case 0xDF: // RST 18h
                return { op: Ops.RST, type: 0x18, length: 1 };
            case 0xE7: // RST 20h
                return { op: Ops.RST, type: 0x20, length: 1 };
            case 0xD7: // RST 10h
                return { op: Ops.RST, type: 0x10, length: 1 };
            case 0xEF: // RST 28h
                return { op: Ops.RST, type: 0x28, length: 1 };
            case 0xC7: // RST 00h
                return { op: Ops.RST, type: 0x00, length: 1 };
            case 0xCF: // RST 08h
                return { op: Ops.RST, type: 0x08, length: 1 };
            case 0xFF: // RST 38h
                return { op: Ops.RST, type: 0x38, length: 1 };
            case 0xF7: // RST 30h
                return { op: Ops.RST, type: 0x30, length: 1 };

            /** Miscellaneousjj */
            case 0x12: // LD [DE],A
                return { op: Ops.LD_iR16_A, type: R16.DE, length: 1 };
            case 0xFA: // LD A, [N16]
                return { op: Ops.LD_A_iN16, length: 3 };
            case 0x08: // LD [N16], SP
                return { op: Ops.LD_iN16_SP, length: 3 };
            case 0xD9: // RETI
                return { op: Ops.RETI, length: 1 };
            case 0x39: // ADD HL, SP
                return { op: Ops.ADD_HL_R16, type: R16.SP, length: 1, cyclesOffset: 4 };
            case 0xE8: // ADD SP, E8
                return { op: Ops.ADD_SP_E8, length: 2, cyclesOffset: 8 };
            case 0x0A: // LD A, [BC]
                return { op: Ops.LD_A_iR16, type: R16.BC, length: 1 };
            case 0x3A: // LD A, [HL-]
                return { op: Ops.LD_A_iHLdec, length: 1 };
            case 0x27: // DAA
                return { op: Ops.DA_A, length: 1 };
            case 0xF2: // LD A, [FF00+C]
                return { op: Ops.LD_A_iFF00plusC, length: 1 };
            case 0xF6: // OR A, N8
                return { op: Ops.OR_A_N8, length: 2 };;


            /** Invalid */
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
                return { op: Ops.INVALID_OPCODE, length: 1 };
        }

        let typeTable = [R8.B, R8.C, R8.D, R8.E, R8.H, R8.L, R8.iHL, R8.A];


        // #region Algorithm decoding ADD, ADC, SUB, SBC, AND, XOR, OR, CP in 0x80-0xBF
        if (upperNybble >= 0x8 && upperNybble <= 0xB) {
            let type: OperandType;
            let op: any;

            type = typeTable[lowerNybble & 0b111];

            const OPDEC = upperNybble & 0b11;
            if (lowerNybble < 0x8) {
                switch (OPDEC) {
                    case 0x0: op = Ops.ADD_A_R8; break;
                    case 0x1: op = Ops.SUB_A_R8; break;
                    case 0x2: op = Ops.AND_A_R8; break;
                    case 0x3: op = Ops.OR_A_R8; break;
                }
            } else {
                switch (OPDEC) {
                    case 0x0: op = Ops.ADC_A_R8; break;
                    case 0x1: op = Ops.SBC_A_R8; break;
                    case 0x2: op = Ops.XOR_A_R8; break;
                    case 0x3: op = Ops.CP_A_R8; break;
                }
            }

            return { op: op!, type: type, length: 1 };

        }
        // #endregion

        // #region Algorithm decoding LD 0x40-0x7F
        if (upperNybble >= 0x4 && upperNybble <= 0x7) {
            let type: OperandType;
            let type2: OperandType;
            let op: any;

            type2 = typeTable[lowerNybble & 0b111];

            const OPDEC = upperNybble & 0b11;
            if (lowerNybble < 0x8) {
                // Left side of table
                switch (OPDEC) {
                    case 0x0: op = Ops.LD_R8_R8; type = R8.B; break;
                    case 0x1: op = Ops.LD_R8_R8; type = R8.D; break;
                    case 0x2: op = Ops.LD_R8_R8; type = R8.H; break;
                    case 0x3: op = Ops.LD_R8_R8; type = R8.iHL;
                }
            } else {
                // Right side of table
                switch (OPDEC) {
                    case 0x0: op = Ops.LD_R8_R8; type = R8.C; break;
                    case 0x1: op = Ops.LD_R8_R8; type = R8.E; break;
                    case 0x2: op = Ops.LD_R8_R8; type = R8.L; break;
                    case 0x3: op = Ops.LD_R8_R8; type = R8.A; break;
                }
            }


            return { op: op!, type: type!, type2: type2, length: 1 };

        }

        if (this.debugging) {
            alert(`[PC ${hex(this.pc, 4)}] Unknown Opcode in Lookup Table: ` + hex(id, 2));
            this.gb.speedStop();
        }
        return { op: Ops.UNKNOWN_OPCODE, length: 1 };

    }

    cbOpcode(id: number): Op {
        let upperNybble = id >> 4;
        let lowerNybble = id & 0b1111;

        let type: OperandType;
        let bit: number;
        let op: any;

        // 0x0 - 0x7
        if (lowerNybble < 0x8) {
            bit = (upperNybble & 0b11) * 2;
            // 0x8 - 0xF
        } else {
            bit = ((upperNybble & 0b11) * 2) + 1;
        }

        let cyclesOffset = 0;

        let typeTable = [R8.B, R8.C, R8.D, R8.E, R8.H, R8.L, R8.iHL, R8.A];

        type = typeTable[lowerNybble & 0b111];

        if (upperNybble < 0x4) {
            // TODO: IDK why I need this
            cyclesOffset = -4;

            if (lowerNybble < 0x8) {
                // 0x0 - 0x7
                switch (upperNybble) {
                    case 0x0: op = Ops.RLC_R8; break;
                    case 0x1: op = Ops.RL_R8; break;
                    case 0x2: op = Ops.SLA_R8; break;
                    case 0x3: op = Ops.SWAP_R8; break;
                }
            } else {
                // 0x8 - 0xF
                switch (upperNybble) {
                    case 0x0: op = Ops.RRC_R8; break;
                    case 0x1: op = Ops.RR_R8; break;
                    case 0x2: op = Ops.SRA_R8; break;
                    case 0x3: op = Ops.SRL_R8; break;
                }
            }

            bit = null!;
            // 0x40 - 0xF0
        } else {
            switch (upperNybble >> 2) {
                case 0x1: op = Ops.BIT_R8; break;
                case 0x2: op = Ops.RES_R8; break;
                case 0x3: op = Ops.SET_R8; break;
            }
        }
        // #endregion




        return { op: op!, type: type, type2: bit, length: 2, cyclesOffset: cyclesOffset };
    }
}

export function unTwo4b(n: number): number {
    if ((n & 0b1000) != 0) {
        return n - 16;
    } else {
        return n;
    }
}

export function unTwo8b(n: number): number {
    if ((n & 0b10000000) != 0) {
        return n - 256;
    } else {
        return n;
    }
}

export function unTwo16b(n: number): number {
    if ((n & 0b1000000000000000) != 0) {
        return n - 65536;
    } else {
        return n;
    }
}

export function o4b(i: number): number {
    return i & 0xF;
}

export function o8b(i: number): number {
    return i & 0xFF;
}

export function o16b(i: number): number {
    return i & 0xFFFF;
}

export function do4b(i: number): boolean {
    return i > 0xF || i < 0;
}

export function do8b(i: number): boolean {
    return i > 0xFF || i < 0;
}

export function do16b(i: number): boolean {
    return i > 0xFFFF || i < 0;
}

export function hex(i: any, digits: number) {
    return `0x${pad(i.toString(16), digits, '0').toUpperCase()}`;
}

export function hexN(i: any, digits: number) {
    return pad(i.toString(16), digits, '0').toUpperCase();
}

export function hexN_LC(i: any, digits: number) {
    return pad(i.toString(16), digits, '0');
}
