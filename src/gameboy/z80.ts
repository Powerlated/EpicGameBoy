console.log("Hello Z80!");

function mod(a: number, b: number): number {
    let r = a % b;
    return r < 0 ? r + b : r;
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

    _a: number;
    _b: number;
    _c: number;
    _d: number;
    _e: number;

    _h: number;
    _l: number;

    sp: number;

    undefErr(name) {
        alert(`
        ${name} undefined
        
        Total Instructions: #${cpu.totalI}
        PC: 0x${cpu.pc.toString(16)}
        Opcode: 0x${cpu.bus.readMem8(cpu.pc).toString(16)}
        Op: ${cpu.rgOpcode(cpu.bus.readMem8(cpu.pc)).op.name}
        `);
    }

    overflow8bErr(name, overflow) {
        alert(`
        ${name} was set greater than 255 (${overflow})
        
        Total Instructions: #${cpu.totalI}
        PC: 0x${cpu.pc.toString(16)}
        Opcode: 0x${cpu.bus.readMem8(cpu.pc).toString(16)}
        Op: ${cpu.rgOpcode(cpu.bus.readMem8(cpu.pc)).op.name}
        `);
    }

    overflow16bErr(name, overflow) {
        alert(`
        ${name} was set greater than 65535 (${overflow})
        
        Total Instructions: #${cpu.totalI}
        PC: 0x${cpu.pc.toString(16)}
        Opcode: 0x${cpu.bus.readMem8(cpu.pc).toString(16)}
        Op: ${cpu.rgOpcode(cpu.bus.readMem8(cpu.pc)).op.name}
        `);
    }

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

    get a(): number {
        return this._a;
    }
    set a(i: number) {
        if (isNaN(i))
            this.undefErr('A');

        if (i > 255)
            this.overflow8bErr('A', i);

        this._a = i;
    }

    get b(): number {
        return this._b;
    }
    set b(i: number) {
        if (isNaN(i))
            this.undefErr('B');

        if (i > 255)
            this.overflow8bErr('B', i);

        this._b = i;
    }

    get c(): number {
        return this._c;
    }
    set c(i: number) {
        if (isNaN(i))
            this.undefErr('C');

        if (i > 255)
            this.overflow8bErr('C', i);

        this._c = i;
    }


    get d(): number {
        return this._d;
    }
    set d(i: number) {
        if (isNaN(i))
            this.undefErr('D');

        if (i > 255)
            this.overflow8bErr('D', i);

        this._d = i;
    }

    get e(): number {
        return this._e;
    }
    set e(i: number) {
        if (isNaN(i))
            this.undefErr('E');

        if (i > 255)
            this.overflow8bErr('E', i);

        this._e = i;
    }

    get h(): number {
        return this._h;
    }
    set h(i: number) {
        if (isNaN(i))
            this.undefErr('H');

        if (i > 255)
            this.overflow8bErr('H', i);

        this._h = i;
    }

    get l(): number {
        return this._l;
    }
    set l(i: number) {
        if (isNaN(i))
            this.undefErr('L');

        if (i > 255)
            this.overflow8bErr('L', i);

        this._l = i;
    }

    set af(i: number) {
        if (isNaN(i))
            this.undefErr('AF');

        if (i > 65535)
            this.overflow8bErr('L', i);

        this.a = (i & 0xFF00) >> 8;
        this.f = i & 0xFF;
    }
    set bc(i: number) {
        if (isNaN(i))
            this.undefErr('BC');

        if (i > 65535)
            this.overflow16bErr('DE', i);

        this.b = (i & 0xFF00) >> 8;
        this.c = i & 0xFF;
    }
    set de(i: number) {
        if (isNaN(i))
            this.undefErr('DE');

        if (i > 65535)
            this.overflow16bErr('DE', i);

        this.d = (i & 0xFF00) >> 8;
        this.e = i & 0xFF;
    }
    set hl(i: number) {
        if (isNaN(i))
            this.undefErr('HL');

        if (i > 65535)
            this.overflow16bErr('DE', i);

        this.h = (i & 0xFF00) >> 8;
        this.l = i & 0xFF;
    }

    constructor() {
        this.a = 0;
        this.b = 0;
        this.c = 0;
        this.d = 0;
        this.e = 0;

        this.h = 0;
        this.l = 0;
        this.sp = 0;
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
    A = "A", B = "B", C = "C", D = "D", E = "E", H = "H", L = "L"
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

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

function r_pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : n + new Array(width - n.length + 1).join(z);
}

class CPU {
    bootromLoaded = false;

    logging = false;

    log = [];
    fullLog = [];

    constructor() {
        console.log("CPU Bootstrap!");
        this.bus.cpu = this;
        this.bus.gpu = this.gpu;
        this._r.cpu = this;

    }


    _r = new Registers();
    _pc: number = 0x0000;

    get pc(): number {
        return this._pc;
    }
    set pc(i: number) {
        if (isNaN(i)) {
            alert(`
            PC undefined
            
            PC: 0x${this.pc.toString(16)}
            Opcode: 0x${this.fetchMem8(this.pc).toString(16)}
            Op: ${this.rgOpcode(this.fetchMem8(this.pc)).op.name}
    
            `);
        }
        this._pc = i;
    }

    bus = new MemoryBus();
    gpu = new GPU(this.bus);

    // #region

    cycles = 0;

    haltAt = 0xFFFFF;
    haltWhen = 0xFFFFFFFFF;

    lastSerialOut = 0;
    lastInstructionDebug = "";
    lastOperandDebug = "";
    lastInstructionCycles = 0;
    currentIns = "";

    lastOpcode = 0;
    lastOpcodeReps = 0;

    totalI = 0;
    time = 0;

    debug = true;

    // #endregion

    fetchMem8(addr: number): number {
        this.cycles += 4;
        return this.bus.readMem8(addr);
    }

    // Timing already satisfied by fetchMem8
    fetchMem16(addr: number): number {
        return this.fetchMem8(addr) | this.fetchMem8(addr + 1) << 8;
    }

    writeMem8(addr: number, value: number) {
        this.cycles += 4;
        this.bus.writeMem(addr, value);
    }

    step() {
        let c = this.cycles;

        if (this.bootromLoaded == false && this.pc == 0 && this.bus.readMem8(0xFF50) == 0) {
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

            this.bus.writeMem(0xFF50, 1);
        }

        // #region DEBUG

        if (this.debug)
            console.log("STEP");

        // Divide CPU clock by 4 and send to GPU
        if (this.time % 4 == 0) {
            this.bus.gpu.step();
        }

        let isCB = this.bus.readMem8(this.pc) == 0xCB;

        let ins = isCB ? this.cbOpcode(this.bus.readMem8(this.pc + 1)) : this.rgOpcode(this.bus.readMem8(this.pc));

        if (!ins.op) {
            alert(`Implementation error: ${hex(this.bus.readMem8(this.pc), 2)} is a null op`);
        }

        let opcode = isCB ? this.bus.readMem8(this.pc + 1) : this.bus.readMem8(this.pc);

        if (opcode == this.lastOpcode) {
            this.lastOpcodeReps++;
        } else {
            this.lastOpcodeReps = 0;
        }
        this.lastOpcode = opcode;

        if (!ins) {
            console.error("Reading error at: 0x" + this.pc.toString(16));
        }

        if (!ins.length) {
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


        if (this.debug) {
            console.debug(`PC: ${this.pc}`);
            console.log(`[OPcode: ${hex(this.bus.readMem16(this.pc), 2)}, OP: ${ins.op.name}] ${isCB ? "[0xCB Prefix] " : ""}Executing op: 0x` + pad(this.bus.readMem8(this.pc).toString(16), 2, '0'));

            console.log("Instruction length: " + ins.length);
        }

        if (this.debug || this.logging) {
            if (ins.length == 3) {
                insDebug = `${hexN_LC(this.bus.readMem8(this.pc), 2)} ${hexN_LC(this.bus.readMem8(this.pc + 1), 2)} ${hexN_LC(this.bus.readMem8(this.pc + 2), 2)}`;
                operandDebug = `${hex(this.bus.readMem16(this.pc + 1), 4)}`;
            } else if (ins.length == 2) {
                insDebug = `${hexN_LC(this.bus.readMem8(this.pc), 2)} ${hexN_LC(this.bus.readMem8(this.pc + 1), 2)} ..`;
                operandDebug = `${hex(this.bus.readMem8(this.pc + 1), 2)}`;
            } else {
                insDebug = `${hexN_LC(this.bus.readMem8(this.pc), 2)} .. ..`;
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

        // #endregion

        /** **** ALL STEPPER LOGIC IS BELOW HERE **** */

        isCB = this.fetchMem8(this.pc) == 0xCB;

        ins = isCB ? this.cbOpcode(this.bus.readMem8(++this.pc)) : this.rgOpcode(this.bus.readMem8(this.pc));

        // Rebind the this object
        ins.op = ins.op.bind(this);

        let additionalCycles = 0;

        if (ins.type) {
            if (ins.length == 3) {
                additionalCycles = ins.op(ins.type, this.fetchMem16(this.pc + 1));
            } else if (ins.length == 2) {
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

        if (!isNaN(additionalCycles)) {
            this.cycles += additionalCycles;
        }

        // These instructions set the program counter on their own, no need to increment

        if (!isCB) {
            this.pc = CPU.o16b(this.pc + ins.length);
        } else {
            this.pc = CPU.o16b(this.pc + 1);
        }

        this.totalI++;

        this.lastInstructionCycles = this.cycles - c;
        this.lastOperandDebug = operandDebug;
        this.lastInstructionDebug = insDebug;
    }

    setHalt = false;

    khzInterval = 0;

    khzStop() {
        clearInterval(this.khzInterval);
        this.setHalt = true;
    }

    khz() {

        this.debug = false;
        this.khzInterval = setInterval(() => {
            let i = 0;
            let max = 41940;
            if (this.haltAt == this.pc || this.haltWhen == this.totalI || this.setHalt) {
                clearInterval(this.khzInterval);
            }
            while (i < max && this.haltAt != this.pc && !this.setHalt && this.haltWhen != this.totalI) {
                this.step();
                i++;
            }
            if (this.setHalt) this.setHalt = false;
        }, 10);

    }

    private getReg(t: R8 | R16) {
        if (t == undefined) {
            alert(`[PC ${hex(this.pc, 4)}, opcode: ${hex(this.fetchMem8(this.pc), 2)}] Implementation error: getReg(undefined)`);
        }

        switch (t) {
            case R8.A:
                return this._r.a;
            case R8.B:
                return this._r.b;
            case R8.C:
                return this._r.c;
            case R8.D:
                return this._r.d;
            case R8.E:
                return this._r.e;
            case R8.H:
                return this._r.h;
            case R8.L:
                return this._r.l;
            case R16.AF:
                return this._r.af;
            case R16.BC:
                return this._r.bc;
            case R16.DE:
                return this._r.de;
            case R16.HL:
                return this._r.hl;
            case R16.SP:
                return this._r.sp;

        }
    }

    private setReg(t: R8 | R16, i: number) {
        if (t == undefined) {
            alert(`[PC ${hex(this.pc, 4)}, opcode: ${hex(this.fetchMem8(this.pc), 2)}] Implementation error: setReg(undefined, [any])`);
        }
        if (i == undefined) {
            alert(`[PC ${hex(this.pc, 4)}, opcode: ${hex(this.fetchMem8(this.pc), 2)}] Implementation error: setReg([any], undefined)`);
        }

        switch (t) {
            case R8.A:
                this._r.a = i;
                break;
            case R8.B:
                this._r.b = i;
                break;
            case R8.C:
                this._r.c = i;
                break;
            case R8.D:
                this._r.d = i;
                break;
            case R8.E:
                this._r.e = i;
                break;
            case R8.H:
                this._r.h = i;
                break;
            case R8.L:
                this._r.l = i;
                break;
            case R16.AF:
                this._r.af = i;
                break;
            case R16.BC:
                this._r.bc = i;
                break;
            case R16.DE:
                this._r.de = i;
                break;
            case R16.HL:
                this._r.hl = i;
                break;
            case R16.SP:
                this._r.sp = i;
                break;
        }
    }

    rgOpcode(id): Op {
        let upperNybble = id >> 4;
        let lowerNybble = id & 0b1111;

        switch (id) {
            case 0x31:
                return { op: this.LD_SP, length: 3 };
            case 0x20:
                return { op: this.JR, type: CC.NZ, length: 2 };
            case 0x28:
                return { op: this.JR, type: CC.Z, length: 2 };
            case 0x21:
                return { op: this.LD_R16_N16, type: R16.HL, length: 3 };
            case 0x32:
                return { op: this.LD_iHLdec_A, length: 1 };
            case 0x0E:
                return { op: this.LD_R8_N8, type: R8.C, length: 2 };
            case 0x3E:
                return { op: this.LD_R8_N8, type: R8.A, length: 2 };
            case 0xE2:
                return { op: this.LD_FF00plusC_A, length: 1 };
            case 0x0C:
                return { op: this.INC_R8, type: R8.C, length: 1 };
            case 0xE0:
                return { op: this.LD_FF00plusN8_A, length: 2 };
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
            case 0x17:
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
                return { op: this.LD_N16_A, length: 3 };
            case 0x3D:
                return { op: this.DEC_R8, type: R8.A, length: 1 };
            case 0x0D:
                return { op: this.DEC_R8, type: R8.C, length: 1 };
            case 0x2E:
                return { op: this.LD_R8_N8, type: R8.L, length: 2 };
            case 0x18: // JR e8
                return { op: this.JR, type: CC.UNCONDITIONAL, length: 2 };
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
            case 0xEF: // RST 28h
                return { op: this.RST, type: 0x28, length: 1 };
            case 0xE1: // POP HL
                return { op: this.POP_R16, type: R16.HL, length: 1 };
            case 0x19:
                return { op: this.ADD_HL_R8, type: R16.DE, length: 1 };
            case 0xD5:
                return { op: this.PUSH_R16, type: R16.DE, length: 1 };
            case 0xE9: // JP [HL]
                return { op: this.JP_iR16, type: R16.HL, length: 1 };
            case 0xC7: // RST 00h
                return { op: this.RST, type: 0x00, length: 1 };
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
                return { op: this.JR, type: CC.C, length: 2 };
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
            case 0xF7: // RST 30h
                return { op: this.RST, type: 0x30, length: 1 };
            case 0x1F: // RRA
                return { op: this.RRA, length: 1 };
            case 0x30: // JR NC, E8
                return { op: this.JR, type: CC.NC, length: 2 };
            case 0x25: // DEC H
                return { op: this.DEC_R8, type: R8.H, length: 1 };
            case 0xD1: // POP DE
                return { op: this.POP_R16, type: R16.DE, length: 1 };
            case 0xCC: // CALL Z, N16
                return { op: this.CALL_N16, type: CC.Z, length: 3 };
            case 0xCE: // ADC A, N8
                return { op: this.ADC_N8, length: 2 };
            case 0xD0: // RET NC
                return { op: this.RET, type: CC.NC, length: 1 };
            case 0xC8: // RET Z
                return { op: this.RET, type: CC.Z, length: 1 };
            case 0xEE: // XOR A, N8
                return { op: this.XOR_A_N8, length: 2 };
            case 0xC0: // RET NZ
                return { op: this.RET, type: CC.NZ, length: 1 };
            case 0x35: // DEC [HL]
                return { op: this.DEC_R16, type: R16.HL, length: 1 };
            case 0x29: // ADD HL, HL
                return { op: this.ADD_HL_R16, type: R16.HL, length: 1 };
            case 0x3C: // INC A
                return { op: this.INC_R8, type: R8.A, length: 1 };
            case 0xD8: // RET C
                return { op: this.RET, type: CC.C, length: 1 };
            case 0xF8: // LD HL, SP+e8
                return { op: this.LD_HL_SPaddE8, length: 2 };
            case 0x07: // RLC A
                return { op: this.RLC, type: R8.A, length: 1 };
            case 0x10: // STOP
                return { op: this.NOP, length: 2 };
            // #endregion
            case 0x76: // HALT
                return { op: this.NOP, length: 1 };
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
                return { op: this.RETI, type: CC.NZ, length: 3 };
            case 0x34: // INC [HL]
                return { op: this.INC_R16, type: R16.HL, length: 3 };
            case 0x33: // INC SP
                return { op: this.INC_R16, type: R16.SP, length: 3 };
            case 0x3B: // DEC SP
                return { op: this.DEC_R16, type: R16.SP, length: 3 };
            case 0x39: // ADD HL, SP
                return { op: this.ADD_HL_R16, type: R16.SP, length: 3 };

        }

        // #region Algorithm decoding ADD, ADC, SUB, SBC, AND, XOR, OR, CP in 0x80-0xBF
        if (upperNybble >= 0x8 && upperNybble <= 0xB) {
            let type: OperandType;
            let op: Function;
            switch (lowerNybble & 0b111) {
                case 0x0:
                    type = R8.B;
                    break;
                case 0x1:
                    type = R8.C;
                    break;
                case 0x2:
                    type = R8.D;
                    break;
                case 0x3:
                    type = R8.E;
                    break;
                case 0x4:
                    type = R8.H;
                    break;
                case 0x5:
                    type = R8.L;
                    break;
                // (HL)
                case 0x6:
                    type = R16.HL;
                    break;
                case 0x7:
                    type = R8.A;
                    break;
            }

            const OPDEC = upperNybble & 0b111;
            // Check for [HL]
            if (lowerNybble == 0x6 || lowerNybble == 0xE) {
                if (lowerNybble < 0x8) {
                    switch (OPDEC) {
                        case 0x0:
                            op = this.ADD_A_iHL;
                            break;
                        case 0x1:
                            op = this.SUB_A_iHL;
                            break;
                        case 0x2:
                            op = this.AND_A_iHL;
                            break;
                        case 0x3:
                            op = this.OR_A_iHL;
                            break;
                    }
                } else {
                    switch (OPDEC) {
                        case 0x0:
                            op = this.ADC_A_iHL;
                            break;
                        case 0x1:
                            op = this.SBC_A_iHL;
                            break;
                        case 0x2:
                            op = this.XOR_A_iHL;
                            break;
                        case 0x3:
                            op = this.CP_A_iHL;
                            break;
                    }
                }
                // Not [HL]
            } else {
                if (lowerNybble < 0x8) {
                    switch (OPDEC) {
                        case 0x0:
                            op = this.ADD_A_R8;
                            break;
                        case 0x1:
                            op = this.SUB_A_R8;
                            break;
                        case 0x2:
                            op = this.AND_A_R8;
                            break;
                        case 0x3:
                            op = this.OR_A_R8;
                            break;
                    }
                } else {
                    switch (OPDEC) {
                        case 0x0:
                            op = this.ADC_A_R8;
                            break;
                        case 0x1:
                            op = this.SBC_A_R8;
                            break;
                        case 0x2:
                            op = this.XOR_A_R8;
                            break;
                        case 0x3:
                            op = this.CP_A_R8;
                            break;
                    }
                }
            }

            return { op: op, type: type, length: 1 };

        }
        // #endregion

        // #region Algorithm decoding LD 0x40-0x7F
        if (upperNybble >= 0x4 && upperNybble <= 0x7) {
            let type: OperandType;
            let type2: OperandType;
            let op: Function;
            switch (lowerNybble & 0b111) {
                case 0x0:
                    type2 = R8.B;
                    break;
                case 0x1:
                    type2 = R8.C;
                    break;
                case 0x2:
                    type2 = R8.D;
                    break;
                case 0x3:
                    type2 = R8.E;
                    break;
                case 0x4:
                    type2 = R8.H;
                    break;
                case 0x5:
                    type2 = R8.L;
                    break;
                // (HL)
                case 0x6:
                    break;
                case 0x7:
                    type2 = R8.A;
                    break;
            }

            const OPDEC = upperNybble & 0b11;
            // Check for [HL] at column 0x6 and 0xE
            if (lowerNybble == 0x6 || lowerNybble == 0xE) {
                if (lowerNybble < 0x8) {
                    switch (OPDEC) {
                        case 0x0:
                            op = this.LD_R8_iHL;
                            type = R8.B;
                            break;
                        case 0x1:
                            op = this.LD_R8_iHL;
                            type = R8.D;
                            break;
                        case 0x2:
                            op = this.LD_R8_iHL;
                            type = R8.H;
                            break;
                        case 0x3:
                            op = this.HALT;
                            break;
                    }
                } else {
                    switch (OPDEC) {
                        case 0x0:
                            op = this.LD_R8_iHL;
                            type = R8.C;
                            break;
                        case 0x1:
                            op = this.LD_R8_iHL;
                            type = R8.E;
                            break;
                        case 0x2:
                            op = this.LD_R8_iHL;
                            type = R8.L;
                            break;
                        case 0x3:
                            op = this.LD_R8_iHL;
                            type = R8.A;
                            break;
                    }
                }
                // Not [HL]
            } else {
                if (lowerNybble < 0x8) {
                    switch (OPDEC) {
                        case 0x0:
                            op = this.LD_R8_R8;
                            type = R8.B;
                            break;
                        case 0x1:
                            op = this.LD_R8_R8;
                            type = R8.D;
                            break;
                        case 0x2:
                            op = this.LD_R8_R8;
                            type = R8.H;
                            break;
                        case 0x3:
                            op = this.LD_iHL_R8;
                            type = type2;
                            type2 = null;
                            break;
                    }
                } else {
                    switch (OPDEC) {
                        case 0x0:
                            op = this.LD_R8_R8;
                            type = R8.C;
                            break;
                        case 0x1:
                            op = this.LD_R8_R8;
                            type = R8.E;
                            break;
                        case 0x2:
                            op = this.LD_R8_R8;
                            type = R8.L;
                            break;
                        case 0x3:
                            op = this.LD_R8_R8;
                            type = R8.A;
                            break;
                    }
                }
            }

            return { op: op, type: type, type2: type2, length: 1 };

        }


        alert(`[PC ${hex(this.pc, 4)}] Unknown Opcode in Lookup Table: ` + hex(id, 2));
        clearInterval(this.khzInterval);
    }

    cbOpcode(id): Op {
        let upperNybble = id >> 4;
        let lowerNybble = id & 0b1111;

        let type: OperandType;
        let bit: number;
        let op: Function;

        switch (lowerNybble & 0b111) {
            case 0x0:
                type = R8.B;
                break;
            case 0x1:
                type = R8.C;
                break;
            case 0x2:
                type = R8.D;
                break;
            case 0x3:
                type = R8.E;
                break;
            case 0x4:
                type = R8.H;
                break;
            case 0x5:
                type = R8.L;
                break;
            // (HL)
            case 0x6:
                type = R16.HL;
                break;
            case 0x7:
                type = R8.A;
                break;
        }

        if (upperNybble < 0x4) {
            // 0x0 - 0x3
            if (lowerNybble < 0x4) {
                switch (upperNybble) {
                    case 0x0:
                        op = this.RLC;
                        break;
                    case 0x1:
                        op = this.RL;
                        break;
                    case 0x2:
                        op = this.SLA;
                        break;
                    case 0x3:
                        op = this.SWAP;
                        break;
                }
            } else {
                switch (upperNybble) {
                    case 0x0:
                        op = this.RRC;
                        break;
                    case 0x1:
                        op = this.RR;
                        break;
                    case 0x2:
                        op = this.SRA;
                        break;
                    case 0x3:
                        op = this.SRL;
                        break;
                }
            }
            // 0x40 - 0xF0
        } else {
            switch (upperNybble) {
                case 0x4:
                case 0x5:
                case 0x6:
                case 0x7:
                    op = this.BIT;
                    break;
                case 0x8:
                case 0x9:
                case 0xA:
                case 0xB:
                    op = this.RES;
                    break;
                case 0xC:
                case 0xD:
                case 0xE:
                case 0xF:
                    op = this.SET;
                    break;
            }

            // 0x0 - 0x7
            if (lowerNybble < 0x8) {
                bit = (upperNybble & 0b11) * 2;
                // 0x8 - 0xF
            } else {
                bit = ((upperNybble & 0b11) * 2) + 1;
            }
        }
        // #endregion


        return { op: op, type: type, type2: bit, length: 1 };
    }

    unTwo8b(n: number): number {
        if ((n & 0b10000000) != 0) {
            return n - 256;
        } else {
            return n;
        }
    }

    unTwo16b(n: number): number {
        if ((n & 0b1000000000000000) != 0) {
            return n - 65536;
        } else {
            return n;
        }
    }

    static o4b(i: number): number {
        return mod(i, 0xF + 1);
    }

    static o8b(i: number): number {
        return mod(i, 0xFF + 1);
    }

    static o16b(i: number): number {
        return mod(i, 0xFFFF + 1);
    }

    static do4b(i: number): boolean {
        return i >= 0xF || i < 0;
    }

    static do8b(i: number): boolean {
        return i >= 0xFF || i < 0;
    }

    static do16b(i: number): boolean {
        return i >= 0xFFFF || i < 0;
    }


    // NOP - 0x00
    NOP() {

    }

    // DI - 0xF3
    DI() {

    }

    // EI - 0xFB
    EI() {

    }

    // HALT - 0x76
    HALT() {

    }

    // Load SP into index
    LD_iN16_SP(in16: number) {
        let spUpperByte = this._r.sp >> 8;
        let spLowerByte = this._r.sp & 0b11111111;

        this.writeMem8(in16 + 0, spLowerByte);
        this.writeMem8(in16 + 1, CPU.o16b(spUpperByte));
    }


    RST(vector: number) {
        this.pc = vector - 1;

        let value = this.pc;
        let upperByte = value >> 8;
        let lowerByte = value & 0b11111111;

        this.writeMem8(CPU.o16b(--this._r.sp), upperByte);
        this.writeMem8(CPU.o16b(--this._r.sp), lowerByte);
    }

    LD_A_N16(n16: number) {
        this._r.a = this.fetchMem8(n16);
    }

    LD_R8_iHL(r8: R8) {
        this.setReg(r8, this.fetchMem8(this._r.hl));
    }

    LD_A_iHL_INC() {
        this._r.a = this.fetchMem8(this._r.hl);
        this._r.hl = CPU.o16b(this._r.hl + 1);
    }

    LD_iHL_N8(n8: number) {
        this.writeMem8(this._r.hl, n8);
    }

    LD_iHL_R8(r8: R8) {
        this.writeMem8(this._r.hl, this.getReg(r8));
    }

    ADD_iHL() {
        this._r.a = CPU.o8b(this._r.a + this.fetchMem8(this._r.hl));
    }

    CP_A_iHL() {
        let u8 = this.fetchMem8(this.getReg(R16.HL));
        this._r._f.zero = this._r.a - u8 == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (this._r.a & 0xF) + (u8 & 0xF) > 0xF;
        this._r._f.carry = u8 > this._r.a;
    }

    LD_A_iFF00plusN8(n8: number) {
        this.setReg(R8.A, this.fetchMem8(CPU.o16b(0xFF00 + n8)));
    }

    LD_iR16_A(r16: R16) {
        this.writeMem8(this.getReg(r16), this._r.a);
    }

    // Store value in register A into address n16
    LD_N16_A(n16: number) {
        this.writeMem8(n16, this._r.a);
    }

    /*  PUSH r16 - 0xC5
        Push register r16 onto the stack. */
    PUSH_R16(r16: R16) {
        let value = this.getReg(r16);
        let upperByte = value >> 8;
        let lowerByte = value & 0b11111111;

        this._r.sp = CPU.o16b(this._r.sp - 1);
        this.writeMem8(this._r.sp, upperByte);
        this._r.sp = CPU.o16b(this._r.sp - 1);
        this.writeMem8(this._r.sp, lowerByte);

        return 4;
    }

    /*  PUSH r16 - 0xC1
        Pop off the stack into r16. */
    POP_R16(r16: R16) {
        let lowerByte = this.fetchMem8(this._r.sp);
        this._r.sp = CPU.o16b(this._r.sp + 1);
        let upperByte = this.fetchMem8(this._r.sp);
        this._r.sp = CPU.o16b(this._r.sp + 1);

        this.setReg(r16, (upperByte << 8) | lowerByte);
    }

    // CALL n16 - 0xCD
    CALL_N16(cc: CC, u16: number) {
        if (cc == CC.Z && !this._r._f.zero) return;
        if (cc == CC.NZ && this._r._f.zero) return;
        if (cc == CC.C && !this._r._f.carry) return;
        if (cc == CC.NC && this._r._f.carry) return;

        let pcUpperByte = CPU.o16b(this.pc + 3) >> 8;
        let pcLowerByte = CPU.o16b(this.pc + 3) & 0xFF;

        // console.info(`Calling 0x${u16.toString(16)} from 0x${this.pc.toString(16)}`);

        this._r.sp = CPU.o16b(this._r.sp - 1);
        this.writeMem8(this._r.sp, pcUpperByte);
        this._r.sp = CPU.o16b(this._r.sp - 1);
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

    JP_iR16(r16: R16) {
        this.pc = this.getReg(r16) - 1;
    }


    RET(cc: CC) {
        if (cc == CC.Z && !this._r._f.zero) return;
        if (cc == CC.NZ && this._r._f.zero) return;
        if (cc == CC.C && !this._r._f.carry) return;
        if (cc == CC.NC && this._r._f.carry) return;

        let stackLowerByte = this.fetchMem8(CPU.o16b(this._r.sp++));
        let stackUpperByte = this.fetchMem8(CPU.o16b(this._r.sp++));

        let returnAddress = CPU.o16b(((stackUpperByte << 8) | stackLowerByte) - 1);
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
        this._r._f.zero = false;
        this._r._f.negative = false;
        this._r._f.half_carry = (this._r.a & 0b111) + (this._r.sp & 0b111) > 0b111;
        this._r._f.carry = (this._r.a & 0b1111111) + (this._r.sp & 0b1111111) > 0b1111111;

        this._r.hl = CPU.o16b(e8 + this._r.sp);
    }

    // LD [$FF00+u8],A
    LD_FF00plusN8_A(u8: number) {
        let value = this._r.a;
        this.writeMem8(CPU.o16b(0xFF00 + u8), value);
        // console.log(0xFF00 + u8);
    }

    // LD [$FF00+C],A
    LD_FF00plusC_A() {
        let value = this._r.a;
        this.writeMem8(CPU.o16b(0xFF00 + this._r.c), value);
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
        this._r.hl = CPU.o16b(this._r.hl + 1);
    }
    // LD [HL-],A | Store value in register A into byte pointed by HL and post-decrement HL. 
    LD_iHLdec_A() {
        this.writeMem8(this._r.hl, this._r.a);
        this._r.hl = CPU.o16b(this._r.hl - 1);
    }


    // JR
    JR(cc: CC, n8: number) {
        if (cc == CC.Z && !this._r._f.zero) return;
        if (cc == CC.NZ && this._r._f.zero) return;
        if (cc == CC.C && !this._r._f.carry) return;
        if (cc == CC.NC && this._r._f.carry) return;

        this.pc += this.unTwo8b(n8);

        return 4;
    }

    // LD SP,u16 - 0x31 
    LD_SP(n16: number) {
        this._r.sp = n16;
    }

    LD_SP_HL(n16: number) {
        this._r.sp = this._r.hl;
    }

    // ADD A, r8
    ADD_A_R8(t: R8) {
        let value = this.getReg(t);
        this._r._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;

        let newValue = CPU.o8b(value + this._r.a);
        let didOverflow = CPU.do8b(value + this._r.a);

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
    }

    // ADD A, [HL]
    ADD_A_iHL() {
        let value = this.fetchMem8(this._r.hl);
        this._r._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;

        let newValue = CPU.o8b(value + this._r.a);
        let didOverflow = CPU.do8b(value + this._r.a);

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
        this._r._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;

        let newValue = CPU.o8b(value + this._r.a);
        let didOverflow = CPU.do8b(value + this._r.a);

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;

    }

    // ADC A, r8
    ADC_A_R8(t: R8) {
        let value = this.getReg(t);
        this._r._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;

        // Add the carry flag as well for ADC
        let newValue = CPU.o8b(value + this._r.a + (this._r._f.carry ? 1 : 0));
        let didOverflow = CPU.do8b(value + this._r.a + (this._r._f.carry ? 1 : 0));

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
    }

    // ADC A, [HL]
    ADC_A_iHL(t: R8) {
        let value = this.fetchMem8(this._r.hl);
        this._r._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;

        // Add the carry flag as well for ADC
        let newValue = CPU.o8b(value + this._r.a + (this._r._f.carry ? 1 : 0));
        let didOverflow = CPU.do8b(value + this._r.a + (this._r._f.carry ? 1 : 0));

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
    }

    // ADC A, n8
    ADC_N8(n8: number) {
        let value = n8;

        // Add the carry flag as well for ADC
        let newValue = CPU.o8b(value + this._r.a + (this._r._f.carry ? 1 : 0));
        let didOverflow = CPU.do8b(value + this._r.a + (this._r._f.carry ? 1 : 0));

        // Set flags
        this._r._f.carry = (this._r.a & 0b1111111) + (value & 0b1111111) + (this._r._f.carry ? 1 : 0) > 0b1111111;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = (this._r.a & 0b111) + (value & 0b111) + (this._r._f.carry ? 1 : 0) > 0b111;

        // Set register values
        this._r.a = newValue;
    }

    ADD_HL_R8(t: R8) {
        let value = this.getReg(t);

        let newValue = CPU.o16b(value + this._r.hl);
        let didOverflow = CPU.do16b(value + this._r.hl);

        // Set register values
        this._r.hl = newValue;

        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;
    }

    ADD_HL_R16(r16: R16) {
        let value = this.getReg(r16);

        let newValue = CPU.o16b(value + this._r.hl);
        let didOverflow = CPU.do16b(value + this._r.hl);

        // Set register values
        this._r.hl = newValue;

        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;
    }

    SUB_A_R8(t: R8) {
        let value = this.getReg(t);

        let newValue = CPU.o8b(this._r.a - value);
        let didOverflow = CPU.do8b(this._r.a - value);

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (value & 0xF) - (1 & 0xF) < 0;
    }

    SUB_A_iHL(t: R8) {
        let value = this.fetchMem8(this._r.hl);

        let newValue = CPU.o8b(this._r.a - value);
        let didOverflow = CPU.do8b(this._r.a - value);

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (value & 0xF) - (1 & 0xF) < 0;
    }

    SUB_A_N8(n8: number) {
        let newValue = CPU.o8b(this._r.a - n8);
        let didOverflow = CPU.do8b(this._r.a - n8);

        // Set flags
        this._r._f.half_carry = (this._r.a & 0xF) - (n8 & 0xF) < 0;
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;

        // Set register values
        this._r.a = newValue;
    }

    SBC_A_R8(t: R8) {
        let value = this.getReg(t);

        // Also subtract the carry flag for SBC
        let newValue = CPU.o8b(this._r.a - value - (this._r._f.carry ? 1 : 0));
        let didOverflow = CPU.do8b(this._r.a - value - (this._r._f.carry ? 1 : 0));

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
    }

    SBC_A_iHL(t: R8) {
        let value = this.fetchMem8(this._r.hl);

        // Also subtract the carry flag for SBC
        let newValue = CPU.o8b(this._r.a - value - (this._r._f.carry ? 1 : 0));
        let didOverflow = CPU.do8b(this._r.a - value - (this._r._f.carry ? 1 : 0));

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
    }


    AND_A_R8(t: R8) {
        let value = this.getReg(t);

        let final = value & this._r.a;
        this._r.a = final;
    }

    AND_A_iHL(t: R8) {
        let value = this.fetchMem8(this._r.hl);

        let final = value & this._r.a;
        this._r.a = final;
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

    OR_A_iHL() {
        let value = this.fetchMem8(this._r.hl);

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

    XOR_A_iHL() {
        let value = this.fetchMem8(this._r.hl);

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

        let newValue = CPU.o8b(this._r.a - r8);
        let didOverflow = CPU.do8b(this._r.a - r8);

        // DO not set register values for CP

        // Set flags
        this._r._f.carry = r8 > this._r.a;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (this._r.a & 0xF) + (r8 & 0xF) > 0xF;
    }


    CP_A_N8(n8: number) {
        let value = n8;

        let newValue = CPU.o8b(this._r.a - value);
        let didOverflow = CPU.do8b(this._r.a - value);


        // Set flags
        this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (this._r.a & 0xF) - (n8 & 0xF) < 0;
    }

    INC_R8(t: R8) {
        let target = this.getReg(t);

        let newValue = CPU.o8b(target + 1);
        let didOverflow = CPU.do8b(target + 1);

        this.setReg(t, newValue);

        // UNMODIFIED this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
    }


    // Increment in register r16
    INC_R16(r16: R16) {
        this.setReg(r16, CPU.o16b(this.getReg(r16) + 1));

        return 4;
    }

    DEC_R8(t: R8) {
        let target = this.getReg(t);

        let newValue = CPU.o8b(target - 1);
        let didOverflow = CPU.do8b(target - 1);

        this.setReg(t, newValue);

        // UNMODIFIED this._r._f.carry = didOverflow;
        this._r._f.zero = newValue == 0;
        this._r._f.negative = true;
        this._r._f.half_carry = (target & 0xF) - (1 & 0xF) < 0;
    }

    DEC_R16(tt: R16) {
        this.setReg(tt, CPU.o16b(this.getReg(tt)));
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

    // Rotate A right through carry
    RRA() {
        let carryMask = (this._r.f & 0b00010000) << 3;

        let newValue = CPU.o8b((this._r.a >> 1) | carryMask);
        let didOverflow = CPU.do8b((this._r.a >> 1) | carryMask);

        this._r._f.carry = (this._r.a & 0b00000001) == 0b1;
        this._r._f.zero = false;
        this._r._f.negative = false;
        this._r._f.half_carry = false;

        this._r.a = newValue;
    }

    // Rotate A left through carry
    RLA() {
        let carryMask = (this._r.f & 0b00010000) >> 4;

        let newValue = CPU.o8b((this._r.a << 1) | carryMask);
        let didOverflow = CPU.do8b((this._r.a << 1) | carryMask);

        this._r._f.carry = (this._r.a & 0b10000000) >> 7 == 0b1;

        this._r.a = newValue;

        this._r._f.zero = false;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
    }

    // Rotate register A right
    RRCA() {
        let rightmostBit = (this._r.a & 0b00000001) << 7;

        let newValue = CPU.o8b((this._r.a >> 1) | rightmostBit);
        let didOverflow = CPU.do8b((this._r.a >> 1) | rightmostBit);

        this._r.a = newValue;

        this._r._f.zero = false;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = didOverflow;
    }

    // Rotate register A left
    RRLA() {
        let leftmostBit = (this._r.a & 0b10000000) >> 7;

        let newValue = CPU.o8b((this._r.a << 1) | leftmostBit);
        let didOverflow = CPU.do8b((this._r.a << 1) | leftmostBit);

        this._r.a = newValue;

        this._r._f.zero = false;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = didOverflow;
    }

    CPL() {
        this._r.a = this._r.a ^ 0b11111111;
    }

    BIT(t: R8, selectedBit) {
        let value = this.getReg(t);
        let mask = 0b1 << selectedBit;

        this._r._f.zero = (value & mask) == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = true;
    }

    BIT_HL(t: R8, selectedBit) {
        let value = this.fetchMem8(this._r.hl);

        let mask = 0b1 << selectedBit;

        this._r._f.zero = (value & mask) == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = true;
    }

    RES(t: R8, selectedBit) {
        let value = this.getReg(t);
        let mask = 0b1 << selectedBit;

        let final = value & ~(mask);

        this.setReg(t, final);
    }

    SET(t: R8, selectedBit) {
        let value = this.getReg(t);
        let mask = 0b1 << selectedBit;

        let final = value | ~(mask);

        this.setReg(t, final);
    }

    SRL_R8(t: R8) {
        let value = this.getReg(t);
        this.setReg(t, value >> 1);
    }

    // Rotate TARGET right through carry
    RR(t: R8) {
        let value = this.getReg(t);

        let carryMask = (this._r.f & 0b00010000) << 3;

        let newValue = CPU.o8b((value >> 1) | carryMask);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = !!(value & 1);
    }

    // Rotate TARGET left through carry
    RL(t: R8) {
        let carryMask = (this._r.f & 0b00010000) >> 4;

        let newValue = CPU.o8b((this.getReg(t) << 1) | carryMask);
        let didOverflow = CPU.do8b((this.getReg(t) << 1) | carryMask);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = didOverflow;
    }

    // Rotate TARGET right
    RRC(t: R8) {
        let rightmostBit = (this._r.a & 0b00000001) << 7;

        let newValue = CPU.o8b((this._r.a >> 1) | rightmostBit);
        let didOverflow = CPU.do8b((this._r.a >> 1) | rightmostBit);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = didOverflow;
    }

    // Rotate TARGET left
    RLC(t: R8) {
        let leftmostBit = (this._r.a & 0b10000000) >> 7;

        let newValue = CPU.o8b((this._r.a << 1) | leftmostBit);
        let didOverflow = CPU.do8b((this._r.a << 1) | leftmostBit);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = didOverflow;
    }

    // Shift TARGET right
    SRA(t: R8) {
        let newValue = CPU.o8b(this.getReg(t) >> 1);
        let didOverflow = CPU.do8b(this.getReg(t) >> 1);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = didOverflow;
    }

    // Shift TARGET left 
    SLA(t: R8) {
        let newValue = CPU.o8b(this.getReg(t) << 1);
        let didOverflow = CPU.do8b(this.getReg(t) << 1);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = didOverflow;
    }

    // Shift right logic register
    SRL(t: R8) {
        let value = this.getReg(t);

        let newValue = CPU.o8b(value >> 1);

        this.setReg(t, newValue);

        this._r._f.zero = newValue == 0;
        this._r._f.negative = false;
        this._r._f.half_carry = false;
        this._r._f.carry = !!(value & 1);
    }

    // SWAP 
    SWAP(r8: R8) {
        let original = this.getReg(r8);
        let lowerNybble = original & 0b00001111;
        let upperNybble = (original >> 4) & 0b00001111;

        this.setReg(r8, (lowerNybble << 4) | upperNybble);

        this._r._f.zero = this.getReg(r8) == 0;
    }

}

let cpu = new CPU();

function hex(i: number, digits: number) {
    return `0x${pad(i.toString(16), digits, '0').toUpperCase()}`;
}

function hexN(i: number, digits: number) {
    return pad(i.toString(16), digits, '0').toUpperCase();
}

function hexN_LC(i: number, digits: number) {
    return pad(i.toString(16), digits, '0');
}

function isNode(): boolean {
    // @ts-ignore
    return (typeof process !== 'undefined') && (process.release.name === 'node');
}

if (isNode()) {
    // @ts-ignore
    module.exports = { CPU, MemoryBus, GPU };
}