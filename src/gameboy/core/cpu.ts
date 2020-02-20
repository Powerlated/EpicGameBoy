

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

enum R8 {
    A = "A", B = "B", C = "C", D = "D", E = "E", H = "H", L = "L", iHL = "(HL)"
}

enum R16 {
    AF = "AF", BC = "BC", DE = "DE", HL = "HL", SP = "SP"
}

enum CC {
    UNCONDITIONAL = "UNCONDITIONAL",
    Z = "Z",
    NZ = "NZ",
    C = "C",
    NC = "NC"
}

type OperandType = R8 | R16 | CC | number;

interface Op {
    op: Function, type?: OperandType, type2?: OperandType, length: number;
};

enum Operand {
    b16, b8
}

function pad(n: string, width: number, z: string) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function r_pad(n: string, width: number, z: string) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : n + new Array(width - n.length + 1).join(z);
}

class CPU {
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
            this._r._f.zero = true;
            this._r._f.negative = false;
            this._r._f.half_carry = true;
            this._r._f.carry = true;

            this._r.a = 0x11;
            this._r.bc = 0x0013;
            this._r.de = 0x00d8;
            this._r.hl = 0x014d;
            this._r.sp = 0xfffe;

            // Make a write to disable the bootrom
            this.gb.bus.writeMem(0xFF50, 1);
        }


        // Run the debug information collector
        if (this.debugging)
            this.stepDebug();

        // #region  **** ALL STEPPER LOGIC IS BELOW HERE **** 
        if (this.halted == false) {
            let isCB = this.gb.bus.readMem8(this.pc) == 0xCB;

            // Use decoder based on prefix
            let ins = isCB ? this.cbOpcode(this.gb.bus.readMem8(this.pc + 1)) : this.rgOpcode(this.gb.bus.readMem8(this.pc));
            let opcode = isCB ? this.gb.bus.readMem8(this.pc + 1) : this.gb.bus.readMem8(this.pc);

            let isControlFlow = Disassembler.isControlFlow(ins, this);

            let pcTriplet = [this.gb.bus.readMem8(this.pc), this.gb.bus.readMem8(this.pc + 1), this.gb.bus.readMem8(this.pc + 2)];

            if (ins.op == this.INVALID_OPCODE) {

            }

            if (!ins.op) {
                alert(`Implementation error: ${isCB ? hex((0xCB << 8 | this.gb.bus.readMem8(this.pc + 1)), 4) : hex(this.gb.bus.readMem8(this.pc), 2)} is a null op`);
            }



            isCB = this.gb.bus.readMem8(this.pc) == 0xCB;
            
            if (isCB) this.cycles += 4;

            ins = isCB ? this.cbOpcode(this.fetchMem8(this.pc + 1)) : this.rgOpcode(this.fetchMem8(this.pc));

            // Rebind the this object
            ins.op = ins.op.bind(this);

            let additionalCycles = 0;

            if (ins.type != undefined) {
                if (ins.length == 3) {
                    additionalCycles = ins.op(ins.type, this.fetchMem16(this.pc + 1));
                } else if (ins.length == 2 && (ins.type2 == undefined)) {
                    additionalCycles = ins.op(ins.type, this.fetchMem8(this.pc + 1));
                } else {
                    additionalCycles = ins.op(ins.type, ins.type2);
                }
            } else {
                if (ins.length == 3) {
                    additionalCycles = ins.op(this.fetchMem16(this.pc + 1));
                } else if (ins.length == 2) {
                    additionalCycles = ins.op(this.fetchMem8(this.pc + 1));
                } else {
                    additionalCycles = ins.op();
                }
            }

            if (!isNaN(additionalCycles))
                this.cycles += additionalCycles;

            this.pc = o16b(this.pc + ins.length);

            this.totalI++;

            this.lastInstructionCycles = this.cycles - c;

            // ---------------------------

            if (!isCB) {
                if (NORMAL_TIMINGS[opcode] * 4 != this.lastInstructionCycles && isControlFlow == false && opcode != 0x76) {
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
                // TODO Screw it, i'll handle this later
                if (false && CB_TIMINGS[opcode] * 4 != this.lastInstructionCycles && isControlFlow == false) {
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


        check(this);
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

    singleFrame() {

    }

    private getReg(t: R8 | R16) {
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

    private setReg(t: R8 | R16, i: number) {
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
            case 0x31:
                return { op: this.LD_SP, length: 3 };
            case 0x20:
                return { op: this.JR_E8, type: CC.NZ, length: 2 };
            case 0x28:
                return { op: this.JR_E8, type: CC.Z, length: 2 };
            case 0x21:
                return { op: this.LD_R16_N16, type: R16.HL, length: 3 };
            case 0x32:
                return { op: this.LD_iHLdec_A, length: 1 };
            case 0x0E:
                return { op: this.LD_R8_N8, type: R8.C, length: 2 };
            case 0x3E:
                return { op: this.LD_R8_N8, type: R8.A, length: 2 };
            case 0xE2:
                return { op: this.LD_iFF00plusC_A, length: 1 };
            case 0x0C:
                return { op: this.INC_R8, type: R8.C, length: 1 };
            case 0xE0:
                return { op: this.LD_iFF00plusN8_A, length: 2 };
            case 0x11:
                return { op: this.LD_R16_N16, type: R16.DE, length: 3 };
            case 0x1A:
                return { op: this.LD_A_iR16, type: R16.DE, length: 1 };
            case 0xCD: // CALL u16
                return { op: this.CALL_N16, type: CC.UNCONDITIONAL, length: 3 };
            case 0x00:
                return { op: this.NOP, length: 1 };
            case 0xC5: // PUSH B
                return { op: this.PUSH_R16, type: R16.BC, length: 1 };
            case 0x17: // RLA
                return { op: this.RLA, length: 1 };
            case 0xC1: // POP BC
                return { op: this.POP_R16, type: R16.BC, length: 1 };
            case 0x05:
                return { op: this.DEC_R8, type: R8.B, length: 1 };
            case 0x22:
                return { op: this.LD_iHLinc_A, length: 1 };
            case 0x23:
                return { op: this.INC_R16, type: R16.HL, length: 1 };
            case 0xC9:
                return { op: this.RET, type: CC.UNCONDITIONAL, length: 1 };
            case 0x06:
                return { op: this.LD_R8_N8, type: R8.B, length: 2 };
            case 0x13:
                return { op: this.INC_R16, type: R16.DE, length: 1 };
            case 0xFE:
                return { op: this.CP_A_N8, length: 2 };
            case 0xEA:
                return { op: this.LD_iN16_A, length: 3 };
            case 0x3D:
                return { op: this.DEC_R8, type: R8.A, length: 1 };
            case 0x0D:
                return { op: this.DEC_R8, type: R8.C, length: 1 };
            case 0x2E:
                return { op: this.LD_R8_N8, type: R8.L, length: 2 };
            case 0x18: // JR e8
                return { op: this.JR_E8, type: CC.UNCONDITIONAL, length: 2 };
            case 0x04: // INC B
                return { op: this.INC_R8, type: R8.B, length: 1 };
            case 0x1E: // LD E, n8
                return { op: this.LD_R8_N8, type: R8.E, length: 2 };
            case 0x02: // LD (BC),A
                return { op: this.LD_iR16_A, type: R16.BC, length: 1 };
            case 0xF0: // LD A,[$FF00+n8]
                return { op: this.LD_A_iFF00plusN8, length: 2 };
            case 0x1D: // DEC E
                return { op: this.DEC_R8, type: R8.E, length: 1 };
            case 0x24: // INC H
                return { op: this.INC_R8, type: R8.H, length: 1 };
            case 0x15: // DEC D
                return { op: this.DEC_R8, type: R8.D, length: 1 };
            case 0x16: // LD D, n8
                return { op: this.LD_R8_N8, type: R8.D, length: 2 };
            case 0xc3: // JP n16
                return { op: this.JP_N16, type: CC.UNCONDITIONAL, length: 3 };
            case 0xF3: // DI - 0xF3 Disable interrupts?
                return { op: this.DI, length: 1 };
            case 0x36:
                return { op: this.LD_iHL_N8, length: 2 };
            case 0x2A:
                return { op: this.LD_A_iHL_INC, length: 1 };
            case 0x01:
                return { op: this.LD_R16_N16, type: R16.BC, length: 3 };
            case 0x0B:
                return { op: this.DEC_R16, type: R16.BC, length: 1 };
            case 0xFB: // DI - 0xFB Enable interrupts
                return { op: this.EI, length: 1 };
            case 0x2F: // CPL
                return { op: this.CPL, length: 1 };
            case 0xE6: // AND A, u8
                return { op: this.AND_N8, length: 2 };
            case 0xE1: // POP HL
                return { op: this.POP_R16, type: R16.HL, length: 1 };
            case 0xD5:
                return { op: this.PUSH_R16, type: R16.DE, length: 1 };
            case 0xE9: // JP HL
                return { op: this.JP_HL, length: 1 };
            case 0x12: // LD [DE],A
                return { op: this.LD_iR16_A, type: R16.DE, length: 1 };
            case 0x1C: // INC E
                return { op: this.INC_R8, type: R8.E, length: 1 };
            case 0x14: // INC D
                return { op: this.INC_R8, type: R8.D, length: 1 };
            case 0xE5: // PUSH HL
                return { op: this.PUSH_R16, type: R16.HL, length: 1 };
            case 0xF5: // PUSH AF 
                return { op: this.PUSH_R16, type: R16.AF, length: 1 };
            case 0xF1: // POP AF 
                return { op: this.POP_R16, type: R16.AF, length: 1 };
            case 0x03: // INC BC
                return { op: this.INC_R16, type: R16.BC, length: 1 };
            case 0xFA: // LD A, [N16]
                return { op: this.LD_A_N16, length: 3 };
            case 0xC4: // CALL NZ, N16
                return { op: this.CALL_N16, type: CC.NZ, length: 3 };
            case 0x2C: // INC L
                return { op: this.INC_R8, type: R8.L, length: 1 };
            case 0x38: // JR C, E8
                return { op: this.JR_E8, type: CC.C, length: 2 };
            case 0x08: // LD [N16], SP
                return { op: this.LD_iN16_SP, length: 3 };
            case 0xC6: // ADD A, N8
                return { op: this.ADD_A_N8, length: 2 };
            case 0xD6: // SUB A, N8
                return { op: this.SUB_A_N8, length: 2 };
            case 0xC2: // JP NZ, N16
                return { op: this.JP_N16, type: CC.NZ, length: 3 };
            case 0x2D: // DEC L
                return { op: this.DEC_R8, type: R8.L, length: 1 };
            case 0x26: // LD H, N8
                return { op: this.LD_R8_N8, type: R8.H, length: 2 };
            case 0x1F: // RRA
                return { op: this.RRA, length: 1 };
            case 0x30: // JR NC, E8
                return { op: this.JR_E8, type: CC.NC, length: 2 };
            case 0x25: // DEC H
                return { op: this.DEC_R8, type: R8.H, length: 1 };
            case 0xD1: // POP DE
                return { op: this.POP_R16, type: R16.DE, length: 1 };
            case 0xCC: // CALL Z, N16
                return { op: this.CALL_N16, type: CC.Z, length: 3 };
            case 0xCE: // ADC A, N8
                return { op: this.ADC_A_N8, length: 2 };
            case 0xD0: // RET NC
                return { op: this.RET, type: CC.NC, length: 1 };
            case 0xC8: // RET Z
                return { op: this.RET, type: CC.Z, length: 1 };
            case 0xEE: // XOR A, N8
                return { op: this.XOR_A_N8, length: 2 };
            case 0xC0: // RET NZ
                return { op: this.RET, type: CC.NZ, length: 1 };
            case 0x35: // DEC [HL]
                return { op: this.DEC_R8, type: R8.iHL, length: 1 };
            case 0x3C: // INC A
                return { op: this.INC_R8, type: R8.A, length: 1 };
            case 0xD8: // RET C
                return { op: this.RET, type: CC.C, length: 1 };
            case 0xF8: // LD HL, SP+e8
                return { op: this.LD_HL_SPaddE8, length: 2 };
            case 0x07: // RLC A
                return { op: this.RLCA, length: 1 };
            case 0x10: // STOP
                return { op: this.STOP, length: 2 };
            case 0x76: // HALT
                return { op: this.HALT, length: 1 };
            case 0x37: // SCF
                return { op: this.SCF, length: 1 };
            case 0x3F: // CCF
                return { op: this.CCF, length: 1 };
            case 0x1B: // DEC DE 
                return { op: this.DEC_R16, type: R16.DE, length: 1 };
            case 0xF9: // LD SP, HL
                return { op: this.LD_SP_HL, length: 1 };
            case 0xCA: // JP Z, N16
                return { op: this.JP_N16, type: CC.Z, length: 3 };
            case 0xD2: // JP NC, N16
                return { op: this.JP_N16, type: CC.NC, length: 3 };
            case 0xDA: // JP C, N16
                return { op: this.JP_N16, type: CC.C, length: 3 };
            case 0xC4: // JP NZ, N16
                return { op: this.JP_N16, type: CC.NZ, length: 3 };
            case 0xD4: // CALL NC, N16
                return { op: this.CALL_N16, type: CC.NC, length: 3 };
            case 0xDC: // CALL C, N16
                return { op: this.CALL_N16, type: CC.C, length: 3 };
            case 0xD9: // RETI
                return { op: this.RETI, length: 1 };
            case 0x34: // INC [HL]
                return { op: this.INC_R8, type: R8.iHL, length: 1 };
            case 0x33: // INC SP
                return { op: this.INC_R16, type: R16.SP, length: 3 };
            case 0x3B: // DEC SP
                return { op: this.DEC_R16, type: R16.SP, length: 3 };
            case 0x39: // ADD HL, SP
                return { op: this.ADD_HL_R16, type: R16.SP, length: 3 };
            case 0x0A: // LD A, [BC]
                return { op: this.LD_A_iR16, type: R16.BC, length: 1 };
            case 0x3A: // LD A, [HL-]
                return { op: this.LD_A_iHLdec, length: 1 };
            case 0x27: // DAA
                return { op: this.DA_A, length: 1 };
            case 0xF2: // LD A, [FF00+C]
                return { op: this.LD_A_iFF00plusC, length: 1 };
            case 0x0F: // RRCA
                return { op: this.RRCA, length: 1 };
            case 0xE8: // AP SP, E8
                return { op: this.ADD_SP_E8, length: 2 };
            case 0xF6: // OR A, N8
                return { op: this.OR_A_N8, length: 2 };
            case 0xDE: // SBC A, N8
                return { op: this.SBC_A_N8, length: 2 };
            case 0x2B: // DEC HL
                return { op: this.DEC_R16, type: R16.HL, length: 1 };
            case 0x09: // ADD HL, BC
                return { op: this.ADD_HL_R16, type: R16.BC, length: 1 };
            case 0x19: // ADD HL, DE
                return { op: this.ADD_HL_R16, type: R16.DE, length: 1 };
            case 0x29: // ADD HL, HL
                return { op: this.ADD_HL_R16, type: R16.HL, length: 1 };
            case 0xDF: // RST 18h
                return { op: this.RST, type: 0x18, length: 1 };
            case 0xE7: // RST 20h
                return { op: this.RST, type: 0x20, length: 1 };
            case 0xD7: // RST 10h
                return { op: this.RST, type: 0x10, length: 1 };
            case 0xEF: // RST 28h
                return { op: this.RST, type: 0x28, length: 1 };
            case 0xC7: // RST 00h
                return { op: this.RST, type: 0x00, length: 1 };
            case 0xCF: // RST 08h
                return { op: this.RST, type: 0x08, length: 1 };
            case 0xFF: // RST 38h
                return { op: this.RST, type: 0x38, length: 1 };
            case 0xF7: // RST 30h
                return { op: this.RST, type: 0x30, length: 1 };
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
                return { op: this.INVALID_OPCODE, length: 1 };
        }

        let typeTable = [R8.B, R8.C, R8.D, R8.E, R8.H, R8.L, R8.iHL, R8.A];


        // #region Algorithm decoding ADD, ADC, SUB, SBC, AND, XOR, OR, CP in 0x80-0xBF
        if (upperNybble >= 0x8 && upperNybble <= 0xB) {
            let type: OperandType;
            let op: Function;

            type = typeTable[lowerNybble & 0b111];

            const OPDEC = upperNybble & 0b11;
            if (lowerNybble < 0x8) {
                switch (OPDEC) {
                    case 0x0: op = this.ADD_A_R8; break;
                    case 0x1: op = this.SUB_A_R8; break;
                    case 0x2: op = this.AND_A_R8; break;
                    case 0x3: op = this.OR_A_R8; break;
                }
            } else {
                switch (OPDEC) {
                    case 0x0: op = this.ADC_A_R8; break;
                    case 0x1: op = this.SBC_A_R8; break;
                    case 0x2: op = this.XOR_A_R8; break;
                    case 0x3: op = this.CP_A_R8; break;
                }
            }

            return { op: op!, type: type, length: 1 };

        }
        // #endregion

        // #region Algorithm decoding LD 0x40-0x7F
        if (upperNybble >= 0x4 && upperNybble <= 0x7) {
            let type: OperandType;
            let type2: OperandType;
            let op: Function;

            type2 = typeTable[lowerNybble & 0b111];

            const OPDEC = upperNybble & 0b11;
            if (lowerNybble < 0x8) {
                // Left side of table
                switch (OPDEC) {
                    case 0x0: op = this.LD_R8_R8; type = R8.B; break;
                    case 0x1: op = this.LD_R8_R8; type = R8.D; break;
                    case 0x2: op = this.LD_R8_R8; type = R8.H; break;
                    case 0x3: op = this.LD_R8_R8; type = R8.iHL;
                }
            } else {
                // Right side of table
                switch (OPDEC) {
                    case 0x0: op = this.LD_R8_R8; type = R8.C; break;
                    case 0x1: op = this.LD_R8_R8; type = R8.E; break;
                    case 0x2: op = this.LD_R8_R8; type = R8.L; break;
                    case 0x3: op = this.LD_R8_R8; type = R8.A; break;
                }
            }


            return { op: op!, type: type!, type2: type2, length: 1 };

        }


        alert(`[PC ${hex(this.pc, 4)}] Unknown Opcode in Lookup Table: ` + hex(id, 2));
        this.gb.speedStop();
        return { op: this.UNKNOWN_OPCODE, length: 1 };
        
    }

    cbOpcode(id: number): Op {
        let upperNybble = id >> 4;
        let lowerNybble = id & 0b1111;

        let type: OperandType;
        let bit: number;
        let op: Function;

        // 0x0 - 0x7
        if (lowerNybble < 0x8) {
            bit = (upperNybble & 0b11) * 2;
            // 0x8 - 0xF
        } else {
            bit = ((upperNybble & 0b11) * 2) + 1;
        }


        let typeTable = [R8.B, R8.C, R8.D, R8.E, R8.H, R8.L, R8.iHL, R8.A];

        type = typeTable[lowerNybble & 0b111];

        if (upperNybble < 0x4) {
            if (lowerNybble < 0x8) {
                // 0x0 - 0x7
                switch (upperNybble) {
                    case 0x0: op = this.RLC_R8; break;
                    case 0x1: op = this.RL_R8; break;
                    case 0x2: op = this.SLA_R8; break;
                    case 0x3: op = this.SWAP_R8; break;
                }
            } else {
                // 0x8 - 0xF
                switch (upperNybble) {
                    case 0x0: op = this.RRC_R8; break;
                    case 0x1: op = this.RR_R8; break;
                    case 0x2: op = this.SRA_R8; break;
                    case 0x3: op = this.SRL_R8; break;
                }
            }

            bit = null!;
            // 0x40 - 0xF0
        } else {
            switch (upperNybble >> 2) {
                case 0x1: op = this.BIT_R8; break;
                case 0x2: op = this.RES_R8; break;
                case 0x3: op = this.SET_R8; break;
            }
        }
        // #endregion




        return { op: op!, type: type, type2: bit, length: 2 };
    }

    UNKNOWN_OPCODE() {
        this.pc--;
        this.gb.speedStop();
    }


    INVALID_OPCODE() {
        this.pc--;
        this.gb.speedStop();
    }

    // #region INSTRUCTIONS

    // NOP - 0x00
    NOP() {

    }

    // DI - 0xF3
    DI() {
        this.gb.bus.interrupts.masterEnabled = false;

        // console.log("Disabled interrupts");
    }


    // EI - 0xFB
    EI() {
        this.scheduleEnableInterruptsForNextTick = true;

        // console.log("Enabled interrupts");
    }

    // HALT - 0x76
    HALT() {
        this.halted = true;
    }

    STOP() {
        // alert(`[PC: ${hex(this.pc, 4)}] CPU has been stopped`);
    }

    // wtf is a DAA?
    // Decimal adjust A
    DA_A() {
        if (!this._r._f.negative) {
            if (this._r._f.carry || this._r.a > 0x99) {
                this._r.a = o8b(this._r.a + 0x60);
                this._r._f.carry = true;
            }
            if (this._r._f.half_carry || (this._r.a & 0x0f) > 0x09) {
                this._r.a = o8b(this._r.a + 0x6);
            }
        }
        else {
            if (this._r._f.carry) {
                this._r.a = o8b(this._r.a - 0x60);
                this._r._f.carry = true;
            }
            if (this._r._f.half_carry) {
                this._r.a = o8b(this._r.a - 0x6);
            }
        }

        this._r._f.zero = this._r.a == 0;
        this._r._f.half_carry = false;
    }

    // Load SP into index
    LD_iN16_SP(in16: number) {
        let spUpperByte = this._r.sp >> 8;
        let spLowerByte = this._r.sp & 0b11111111;

        this.writeMem8(in16 + 0, spLowerByte);
        this.writeMem8(in16 + 1, o16b(spUpperByte));
    }


    RST(vector: number) {
        let pcUpperByte = o16b(this.pc + 1) >> 8;
        let pcLowerByte = o16b(this.pc + 1) & 0xFF;

        this._r.sp = o16b(this._r.sp - 1);
        this.writeMem8(this._r.sp, pcUpperByte);
        this._r.sp = o16b(this._r.sp - 1);
        this.writeMem8(this._r.sp, pcLowerByte);

        this.pc = vector - 1;
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

    LD_A_N16(n16: number) {
        this._r.a = this.fetchMem8(n16);
    }

    LD_A_iHL_INC() {
        this._r.a = this.fetchMem8(this._r.hl);
        this._r.hl = o16b(this._r.hl + 1);
    }

    LD_iHL_N8(n8: number) {
        this.writeMem8(this._r.hl, n8);
    }

    LD_iHL_R8(r8: R8) {
        this.writeMem8(this._r.hl, this.getReg(r8));
    }

    ADD_iHL() {
        this._r.a = o8b(this._r.a + this.fetchMem8(this._r.hl));
    }

    CP_A_iHL() {
        let u8 = this.fetchMem8(this.getReg(R16.HL));
        this._r._f.zero = this._r.a - u8 == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (this._r.a & 0xF) + (u8 & 0xF) > 0xF;
        this._r._f.carry = u8 > this._r.a;
    }

    LD_A_iFF00plusN8(n8: number) {
        this._r.a = this.fetchMem8(o16b(0xFF00 + n8));
    }

    LD_A_iFF00plusC() {
        this._r.a = this.fetchMem8(o16b(0xFF00 + this._r.c));
    }

    LD_iR16_A(r16: R16) {
        this.writeMem8(this.getReg(r16), this._r.a);
    }

    // Store value in register A into address n16
    LD_iN16_A(n16: number) {
        this.writeMem8(n16, this._r.a);
    }

    /*  PUSH r16 - 0xC5
        Push register r16 onto the stack. */
    PUSH_R16(r16: R16) {
        let value = this.getReg(r16);
        let upperByte = value >> 8;
        let lowerByte = value & 0b11111111;

        this._r.sp = o16b(this._r.sp - 1);
        this.writeMem8(this._r.sp, upperByte);
        this._r.sp = o16b(this._r.sp - 1);
        this.writeMem8(this._r.sp, lowerByte);

        return 4;
    }

    /*  PUSH r16 - 0xC1
        Pop off the stack into r16. */
    POP_R16(r16: R16) {
        let lowerByte = this.fetchMem8(this._r.sp);
        this._r.sp = o16b(this._r.sp + 1);
        let upperByte = this.fetchMem8(this._r.sp);
        this._r.sp = o16b(this._r.sp + 1);

        this.setReg(r16, (upperByte << 8) | lowerByte);
    }

    // CALL n16 - 0xCD
    CALL_N16(cc: CC, u16: number) {
        if (cc == CC.Z && !this._r._f.zero) return;
        if (cc == CC.NZ && this._r._f.zero) return;
        if (cc == CC.C && !this._r._f.carry) return;
        if (cc == CC.NC && this._r._f.carry) return;

        let pcUpperByte = o16b(this.pc + 3) >> 8;
        let pcLowerByte = o16b(this.pc + 3) & 0xFF;

        // console.info(`Calling 0x${u16.toString(16)} from 0x${this.pc.toString(16)}`);

        this._r.sp = o16b(this._r.sp - 1);
        this.writeMem8(this._r.sp, pcUpperByte);
        this._r.sp = o16b(this._r.sp - 1);
        this.writeMem8(this._r.sp, pcLowerByte);

        this.pc = u16 - 3;

        return 4;
    }

    JP_N16(cc: CC, n16: number) {
        if (cc == CC.Z && !this._r._f.zero) return;
        if (cc == CC.NZ && this._r._f.zero) return;
        if (cc == CC.C && !this._r._f.carry) return;
        if (cc == CC.NC && this._r._f.carry) return;

        this.pc = n16 - 3;

        return 4;
    }

    JP_HL() {
        this.pc = this._r.hl - 1;
    }


    RET(cc: CC) {
        if (cc == CC.Z && !this._r._f.zero) return;
        if (cc == CC.NZ && this._r._f.zero) return;
        if (cc == CC.C && !this._r._f.carry) return;
        if (cc == CC.NC && this._r._f.carry) return;

        let stackLowerByte = this.fetchMem8(o16b(this._r.sp++));
        let stackUpperByte = this.fetchMem8(o16b(this._r.sp++));

        let returnAddress = o16b(((stackUpperByte << 8) | stackLowerByte) - 1);
        // console.info(`Returning to 0x${returnAddress.toString(16)}`);

        this.pc = returnAddress;

        return 4;
    }

    RETI() {
        this.RET(CC.UNCONDITIONAL);
        this.EI();
    }

    // LD A,(R16)
    LD_A_iR16(r16: R16) {
        this.setReg(R8.A, this.fetchMem8(this.getReg(r16)));

    }

    LD_R16_A(t: R8) {
        this.writeMem8(this.fetchMem8(this.getReg(t)), this._r.a);
    }

    LD_HL_SPaddE8(e8: number) {
        let signedVal = unTwo8b(e8);

        this._r._f.zero = false;
        this._r._f.negative = false;
        this._r._f.half_carry = (signedVal & 0xF) + (this._r.sp & 0xF) > 0xF;
        this._r._f.carry = (signedVal & 0xFF) + (this._r.sp & 0xFF) > 0xFF;

        this._r.hl = o16b(unTwo8b(e8) + this._r.sp);

        return 4; // Internal time
    }

    // LD [$FF00+u8],A
    LD_iFF00plusN8_A(u8: number) {
        let value = this._r.a;
        this.writeMem8(o16b(0xFF00 + u8), value);
        // console.log(0xFF00 + u8);
    }

    // LD [$FF00+C],A
    LD_iFF00plusC_A() {
        let value = this._r.a;
        this.writeMem8(o16b(0xFF00 + this._r.c), value);
    }

    LD_R8_N8(r8: R8, n8: number) {
        this.setReg(r8, n8);
    }

    // Store value in register on the right into register on the left
    LD_R8_R8(r8: R8, r8_2: R8) {
        this.setReg(r8, this.getReg(r8_2));
    }

    // LD r16,n16 - 0x21, 
    LD_R16_N16(r16: R16, n16: number) {
        this.setReg(r16, n16);
    }


    // LD [HL+],A | Store value in register A into byte pointed by HL and post-increment HL.  
    LD_iHLinc_A() {
        this.writeMem8(this._r.hl, this._r.a);
        this._r.hl = o16b(this._r.hl + 1);
    }
    // LD [HL-],A | Store value in register A into byte pointed by HL and post-decrement HL. 
    LD_iHLdec_A() {
        this.writeMem8(this._r.hl, this._r.a);
        this._r.hl = o16b(this._r.hl - 1);
    }

    // LD A,[HL+] | Store value in byte pointed by HL into A, then post-increment HL.
    LD_A_iHLinc() {
        this._r.a = this.fetchMem8(this._r.hl);
        this._r.hl = o16b(this._r.hl + 1);
    }
    // LD A,[HL-] | Store value in byte pointed by HL into A, then post-decrement HL.
    LD_A_iHLdec() {
        this._r.a = this.fetchMem8(this._r.hl);
        this._r.hl = o16b(this._r.hl - 1);
    }

    // ADD SP, e8
    ADD_SP_E8(e8: number) {
        let value = unTwo8b(e8);

        this._r._f.zero = false;
        this._r._f.negative = false;
        this._r._f.half_carry = ((value & 0xF) + (this._r.sp & 0xF)) > 0xF;
        this._r._f.carry = ((value & 0xFF) + (this._r.sp & 0xFF)) > 0xFF;

        this._r.sp = o16b(this._r.sp + value);
    }

    // JR
    JR_E8(cc: CC, n8: number) {
        if (cc == CC.Z && !this._r._f.zero) return;
        if (cc == CC.NZ && this._r._f.zero) return;
        if (cc == CC.C && !this._r._f.carry) return;
        if (cc == CC.NC && this._r._f.carry) return;

        this.pc += unTwo8b(n8);

        return 4;
    }

    // LD SP,u16 - 0x31 
    LD_SP(n16: number) {
        this._r.sp = n16;
    }

    LD_SP_HL() {
        this._r.sp = this._r.hl;
    }

    // ADD A, r8
    ADD_A_R8(t: R8) {
        let value = this.getReg(t);
        this._r._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;

        let newValue = o8b(value + this._r.a);
        let didOverflow = do8b(value + this._r.a);

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
    }

    // ADD A, N8
    ADD_A_N8(n8: number) {
        let value = n8;

        let newValue = o8b(value + this._r.a);
        let didOverflow = do8b(value + this._r.a);

        // Set flags
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;
        this._r._f.carry = didOverflow;

        // Set register values
        this._r.a = newValue;
    }

    // ADC A, r8
    ADC_A_R8(t: R8) {
        let value = this.getReg(t);

        let newValue = o8b(value + this._r.a + (this._r._f.carry ? 1 : 0));
        let didOverflow = do8b(value + this._r.a + (this._r._f.carry ? 1 : 0));

        // Set flags
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = (this._r.a & 0xF) + (value & 0xF) + (this._r._f.carry ? 1 : 0) > 0xF;
        this._r._f.carry = didOverflow;

        // Set register values
        this._r.a = newValue;
    }

    // ADC A, n8
    ADC_A_N8(n8: number) {
        let value = n8;

        let newValue = o8b(value + this._r.a + (this._r._f.carry ? 1 : 0));
        let didOverflow = do8b(value + this._r.a + (this._r._f.carry ? 1 : 0));

        // Set flags
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = (this._r.a & 0xF) + (value & 0xF) + (this._r._f.carry ? 1 : 0) > 0xF;
        this._r._f.carry = didOverflow;

        // Set register values
        this._r.a = newValue;
    }

    ADD_HL_R8(t: R8) {
        let value = this.getReg(t);

        let newValue = o16b(value + this._r.hl);
        let didOverflow = do16b(value + this._r.hl);

        // Set register values
        this._r.hl = newValue;

        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;
    }

    ADD_HL_R16(r16: R16) {
        let r16Value = this.getReg(r16);

        let newValue = o16b(r16Value + this._r.hl);
        let didOverflow = do16b(r16Value + this._r.hl);

        // Set flag
        this._r._f.negative = false;
        this._r._f.half_carry = (this._r.hl & 0xFFF) + (r16Value & 0xFFF) > 0xFFF;
        this._r._f.carry = didOverflow;

        // Set register values
        this._r.hl = newValue;

        return 4;
    }

    SUB_A_R8(t: R8) {
        let value = this.getReg(t);

        let newValue = o8b(this._r.a - value);

        // Set flags
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (value & 0xF) > (this._r.a & 0xF);
        this._r._f.carry = value > this._r.a;

        // Set register values
        this._r.a = newValue;
    }


    SUB_A_N8(n8: number) {
        let value = n8;

        let newValue = o8b(this._r.a - value);

        // Set flags
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (value & 0xF) > (this._r.a & 0xF);
        this._r._f.carry = value > this._r.a;

        // Set register values
        this._r.a = newValue;
    }

    SBC_A_R8(t: R8) {
        let value = this.getReg(t);

        let newValue = o8b(this._r.a - value - (this._r._f.carry ? 1 : 0));

        // Set flags
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (value & 0xF) > (this._r.a & 0xF) - (this._r._f.carry ? 1 : 0);
        this._r._f.carry = value > this._r.a - (this._r._f.carry ? 1 : 0);

        // Set register values
        this._r.a = newValue;
    }

    SBC_A_N8(n8: number) {
        let value = n8;

        let newValue = o8b(this._r.a - value - (this._r._f.carry ? 1 : 0));

        // Set flags
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (value & 0xF) > (this._r.a & 0xF) - (this._r._f.carry ? 1 : 0);
        this._r._f.carry = value > this._r.a - (this._r._f.carry ? 1 : 0);

        // Set register values
        this._r.a = newValue;
    }

    AND_A_R8(t: R8) {
        let value = this.getReg(t);

        let final = value & this._r.a;
        this._r.a = final;

        // Set flags
        this._r._f.zero = this._r.a == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = true;
        this._r._f.carry = false;
    }

    AND_N8(n8: number) {
        let value = n8;

        let final = value & this._r.a;
        this._r.a = final;

        this._r._f.zero = this._r.a == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = true;
        this._r._f.carry = false;
    }

    OR_A_R8(t: R8) {
        let value = this.getReg(t);

        let final = value | this._r.a;
        this._r.a = final;

        this._r._f.zero = final == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = false;
    }

    OR_A_N8(n8: number) {
        let value = n8;

        let final = value | this._r.a;
        this._r.a = final;

        this._r._f.zero = final == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = false;
    }

    XOR_A_R8(t: R8) {
        let value = this.getReg(t);

        let final = value ^ this._r.a;
        this._r.a = final;

        this._r._f.zero = final == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = false;
    }

    XOR_A_N8(n8: number) {
        let value = n8;

        let final = value ^ this._r.a;
        this._r.a = final;

        this._r._f.zero = final == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = false;
    }

    // CP A,r8
    CP_A_R8(t: R8) {
        let r8 = this.getReg(t);

        let newValue = o8b(this._r.a - r8);
        let didOverflow = do8b(this._r.a - r8);

        // DO not set register values for CP

        // Set flags
        this._r._f.carry = r8 > this._r.a;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (this._r.a & 0xF) - (r8 & 0xF) < 0;
    }


    CP_A_N8(n8: number) {
        let value = n8;

        let newValue = o8b(this._r.a - value);
        let didOverflow = do8b(this._r.a - value);


        // Set flags
        this._r._f.carry = value > this._r.a;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (this._r.a & 0xF) - (n8 & 0xF) < 0;
    }

    INC_R8(t: R8) {
        let target = this.getReg(t);

        let newValue = o8b(target + 1);
        let didOverflow = do8b(target + 1);

        this.setReg(t, newValue);

        // UNMODIFIED this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
    }


    // Increment in register r16
    INC_R16(r16: R16) {
        this.setReg(r16, o16b(this.getReg(r16) + 1));

        return 4;
    }

    DEC_R8(t: R8) {
        let target = this.getReg(t);

        let newValue = o8b(target - 1);

        this.setReg(t, newValue);

        // UNMODIFIED this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (1 & 0xF) > (target & 0xF);
    }

    DEC_R16(tt: R16) {
        this.setReg(tt, o16b(this.getReg(tt) - 1));

        return 4;
    }

    CCF() {
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = !this._r._f.carry;
    }

    SCF() {
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = true;
    }


    CPL() {
        this._r.a = this._r.a ^ 0b11111111;

        this._r._f.negative = true;
        this._r._f.half_carry = true;
    }

    // #region 0xCB Opcodes

    BIT_R8(t: R8, selectedBit: number) {
        let value = this.getReg(t);

        this._r._f.zero = (value & (1 << selectedBit)) == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = true;
    }

    RES_R8(t: R8, selectedBit: number) {
        let value = this.getReg(t);
        let mask = 0b1 << selectedBit;

        let final = value & ~(mask);

        this.setReg(t, final);
    }

    SET_R8(t: R8, selectedBit: number) {
        let value = this.getReg(t);
        let mask = 0b1 << selectedBit;

        let final = value |= mask;

        this.setReg(t, final);
    }

    // Rotate A right through carry
    RRA() {
        let value = this._r.a;

        let carryMask = (this._r.f & 0b00010000) << 3;

        let newValue = o8b((value >> 1) | carryMask);

        this._r.a = newValue;

        this._r._f.zero = false;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = !!(value & 1);
    }


    // Rotate TARGET right through carry
    RR_R8(t: R8) {
        let value = this.getReg(t);

        let carryMask = (this._r.f & 0b00010000) << 3;

        let newValue = o8b((value >> 1) | carryMask);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = !!(value & 1);
    }

    // Rotate A left through carry
    RLA() {
        let value = this._r.a;

        let carryMask = (this._r.f & 0b00010000) >> 4;

        let newValue = o8b((value << 1) | carryMask);

        this._r.a = newValue;

        this._r._f.zero = false;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = (value >> 7) == 1;
    }

    // Rotate TARGET left through carry
    RL_R8(t: R8) {
        let value = this.getReg(t);

        let carryMask = (this._r.f & 0b00010000) >> 4;

        let newValue = o8b((value << 1) | carryMask);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = (value >> 7) == 1;
    }

    // Rotate A right
    RRCA() {
        let value = this._r.a;

        let rightmostBit = (value & 1) << 7;
        let newValue = o8b((value >> 1) | rightmostBit);

        this._r.a = newValue;

        this._r._f.zero = false;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = (value & 1) == 1;
    }


    // Rotate TARGET right
    RRC_R8(t: R8) {
        let value = this.getReg(t);

        let rightmostBit = (value & 1) << 7;
        let newValue = o8b((value >> 1) | rightmostBit);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = !!(value & 1);
    }

    // Rotate A left
    RLCA() {
        let value = this._r.a;

        let leftmostBit = (value & 0b10000000) >> 7;

        let newValue = o8b((value << 1) | leftmostBit);

        this._r.a = newValue;

        this._r._f.zero = false;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = (value >> 7) == 1;
    }

    // Rotate TARGET left
    RLC_R8(t: R8) {
        let value = this.getReg(t);

        let leftmostBit = (value & 0b10000000) >> 7;

        let newValue = o8b((value << 1) | leftmostBit);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = (value >> 7) == 1;
    }

    // Shift TARGET right
    SRA_R8(t: R8) {
        let value = this.getReg(t);

        let leftmostBit = value & 0b10000000;
        let newValue = (value >> 1) | leftmostBit;

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = !!(value & 1);
    }

    // Shift TARGET left 
    SLA_R8(t: R8) {
        let newValue = o8b(this.getReg(t) << 1);
        let didOverflow = do8b(this.getReg(t) << 1);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = didOverflow;
    }

    // Shift right logic register
    SRL_R8(t: R8) {
        let value = this.getReg(t);

        let newValue = o8b(value >> 1);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = !!(value & 1);
    }

    // SWAP 
    SWAP_R8(r8: R8) {
        let original = this.getReg(r8);
        let lowerNybble = original & 0b00001111;
        let upperNybble = (original >> 4) & 0b00001111;

        this.setReg(r8, (lowerNybble << 4) | upperNybble);

        this._r._f.zero = this.getReg(r8) == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = false;
    }
}

function unTwo4b(n: number): number {
    if ((n & 0b1000) != 0) {
        return n - 16;
    } else {
        return n;
    }
}

function unTwo8b(n: number): number {
    if ((n & 0b10000000) != 0) {
        return n - 256;
    } else {
        return n;
    }
}

function unTwo16b(n: number): number {
    if ((n & 0b1000000000000000) != 0) {
        return n - 65536;
    } else {
        return n;
    }
}

function o4b(i: number): number {
    return i & 0xF;
}

function o8b(i: number): number {
    return i & 0xFF;
}

function o16b(i: number): number {
    return i & 0xFFFF;
}

function do4b(i: number): boolean {
    return i > 0xF || i < 0;
}

function do8b(i: number): boolean {
    return i > 0xFF || i < 0;
}

function do16b(i: number): boolean {
    return i > 0xFFFF || i < 0;
}

function hex(i: any, digits: number) {
    return `0x${pad(i.toString(16), digits, '0').toUpperCase()}`;
}

function hexN(i: any, digits: number) {
    return pad(i.toString(16), digits, '0').toUpperCase();
}

function hexN_LC(i: any, digits: number) {
    return pad(i.toString(16), digits, '0');
}

