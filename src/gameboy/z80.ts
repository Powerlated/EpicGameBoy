console.log("Hello Z80!");


function mod(n, m) {
    return ((n % m) + m) % m;
}

class Registers {
    cpu: CPU;

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
        
        PC: 0x${cpu.pc.toString(16)}
        Opcode: 0x${cpu.bus.readMem8(cpu.pc).toString(16)}
        Op: ${cpu.rgOpcode(cpu.bus.readMem8(cpu.pc)).op.name}
        `);
    }

    overflow8bErr(name, overflow) {
        alert(`
        ${name} was set greater than 255 (${overflow})
        
        PC: 0x${cpu.pc.toString(16)}
        Opcode: 0x${cpu.bus.readMem8(cpu.pc).toString(16)}
        Op: ${cpu.rgOpcode(cpu.bus.readMem8(cpu.pc)).op.name}
        `);
    }

    overflow16bErr(name, overflow) {
        alert(`
        ${name} was set greater than 65535 (${overflow})
        
        PC: 0x${cpu.pc.toString(16)}
        Opcode: 0x${cpu.bus.readMem8(cpu.pc).toString(16)}
        Op: ${cpu.rgOpcode(cpu.bus.readMem8(cpu.pc)).op.name}
        `);
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
        if (i === undefined)
            this.undefErr('A');

        if (i > 255)
            this.overflow8bErr('A', i);

        this._a = i;
    }

    get b(): number {
        return this._b;
    }
    set b(i: number) {
        if (i === undefined)
            this.undefErr('B');

        if (i > 255)
            this.overflow8bErr('B', i);

        this._b = i;
    }

    get c(): number {
        return this._c;
    }
    set c(i: number) {
        if (i === undefined)
            this.undefErr('C');

        if (i > 255)
            this.overflow8bErr('C', i);

        this._c = i;
    }


    get d(): number {
        return this._d;
    }
    set d(i: number) {
        if (i === undefined)
            this.undefErr('D');

        if (i > 255)
            this.overflow8bErr('D', i);

        this._d = i;
    }

    get e(): number {
        return this._e;
    }
    set e(i: number) {
        if (i === undefined)
            this.undefErr('E');

        if (i > 255)
            this.overflow8bErr('E', i);

        this._e = i;
    }

    get h(): number {
        return this._h;
    }
    set h(i: number) {
        if (i === undefined)
            this.undefErr('H');

        if (i > 255)
            this.overflow8bErr('H', i);

        this._h = i;
    }

    get l(): number {
        return this._l;
    }
    set l(i: number) {
        if (i === undefined)
            this.undefErr('L');

        if (i > 255)
            this.overflow8bErr('L', i);

        this._l = i;
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

    get numerical() {
        let flagN = 0;
        if (this.zero) {
            flagN = flagN | 0b10000000;
        }
        if (this.negative) {
            flagN = flagN | 0b01000000;
        }
        if (this.half_carry) {
            flagN = flagN | 0b00100000;
        }
        if (this.carry) {
            flagN = flagN | 0b00010000;
        }
        return flagN;
    }

    set numerical(i: number) {
        this.zero = (i & (1 << 7)) != 0;
        this.negative = (i & (1 << 6)) != 0;
        this.half_carry = (i & (1 << 5)) != 0;
        this.carry = (i & (1 << 4)) != 0;
    }
}

enum T {
    A = "A", B = "B", C = "C", D = "D", E = "E", H = "H", L = "L"
}

enum TT {
    AF = "AF", BC = "BC", DE = "DE", HL = "HL"
}

enum CC {
    UNCONDITIONAL = "UNCONDITIONAL",
    Z = "Z",
    NZ = "NZ",
    C = "C",
    NC = "NC"
}

type OperandType = T | TT | CC | number;

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
    logging = false;

    log = [];
    fullLog = [];

    constructor() {
        console.log("CPU Bootstrap!");
        this.bus.cpu = this;
        this.bus.gpu = this.gpu;
        this._r.cpu = this;

    }

    currentIns = "";

    totalI = 0;
    time = 0;

    debug = true;

    _r = new Registers();
    _f = new FlagsRegister();

    _pc: number = 0x0000;

    get pc(): number {
        return this._pc;
    }
    set pc(i: number) {
        if (i == undefined) {
            alert(`
            PC undefined
            
            PC: 0x${this.pc.toString(16)}
            Opcode: 0x${this.bus.readMem8(this.pc).toString(16)}
            Op: ${this.rgOpcode(this.bus.readMem8(this.pc)).op.name}
    
            `);
        }
        this._pc = i;
    }

    bus = new MemoryBus();
    gpu = new GPU(this.bus);

    haltAt = 0xFFFF;
    haltWhen = 0xFFFFFFFF;

    lastSerialOut = 0;

    step() {
        if (this.pc == 0x100) {
            this._f.zero = true;
            this._f.negative = false;
            this._f.half_carry = true;
            this._f.carry = true;

            this._r.a = 0x11;
            this._r.bc = 0x0013;
            this._r.de = 0x00d8;
            this._r.hl = 0x014d;
            this._r.sp = 0xfffe;
        }

        if (this.debug)
            console.log("STEP");

        if (this.time % 50 == 0) {
            this.bus.gpu.step();
        }

        let isCB = this.bus.readMem8(this.pc) == 0xCB;

        let ins = isCB ? this.cbOpcode(this.bus.readMem8(++this.pc)) : this.rgOpcode(this.bus.readMem8(this.pc));

        if (!ins) {
            console.error("Reading error at: 0x" + this.pc.toString(16));
        }

        if (!ins.length) {
            alert(`[${ins.op.name}] Op has no length specified.`);
        }

        // if ((ins.op.length == 1 && (!ins.type)) || (ins.op.length == 2 && (!ins.type || !ins.type2))) {
        //     alert(`[Arg length 1 || 2] Implementation error: ${ins.op.name} 0x${this.bus.readMem8(this.pc).toString(16)}`);
        // }
        // if (ins.op.length == 3 && (ins.type === undefined || ins.type2 === undefined)) {
        //     alert(`[Arg length 3] Implementation error: ${ins.op.name} 0x${this.bus.readMem8(this.pc).toString(16)}`);
        // }

        this.currentIns = `${ins.op.name} ${ins.type == undefined ? "" : ins.type}${ins.type2 == undefined ? "" : ins.type2}`;


        // Rebind the this object
        ins.op = ins.op.bind(this);

        if (this.debug)
            console.log(`${isCB ? "[0xCB Prefix] " : ""}Executing op: 0x` + pad(this.bus.readMem8(this.pc).toString(16), 2, '0'));

        let insDebug = "";
        let operandDebug = "";

        if (this.logging) {
            if (ins.length == 3) {
                insDebug = `${hexN_LC(this.bus.readMem8(this.pc), 2)} ${hexN_LC(this.bus.readMem8(this.pc + 1), 2)} ${hexN_LC(this.bus.readMem8(this.pc + 2), 2)}`;
                operandDebug = `${hex(this.bus.readMem16(this.pc + 1), 4)}`;
            } else if (ins.length == 2) {
                insDebug = `${hexN_LC(this.bus.readMem8(this.pc), 2)} ${hexN_LC(this.bus.readMem8(this.pc + 1), 2)} xx`;
                operandDebug = `${hex(this.bus.readMem8(this.pc + 1), 2)}`;
            } else {
                insDebug = `${hexN_LC(this.bus.readMem8(this.pc), 2)} xx xx`;
            }

            let flags = `${this._f.zero ? 'Z' : '-'}${this._f.negative ? 'N' : '-'}${this._f.half_carry ? 'H' : '-'}${this._f.carry ? 'C' : '-'}`;

            if (this.pc >= 0x100) {
                this.log.push(`A:${hexN(this._r.a, 2)} F:${flags} BC:${hexN(this._r.bc, 4)} DE:${hexN_LC(this._r.de, 4)} HL:${hexN_LC(this._r.hl, 4)} SP:${hexN_LC(this._r.sp, 4)} PC:${hexN_LC(this.pc, 4)}`);
                this.fullLog.push(`A:${hexN(this._r.a, 2)} F:${flags} BC:${hexN(this._r.bc, 4)} DE:${hexN_LC(this._r.de, 4)} HL:${hexN_LC(this._r.hl, 4)} SP:${hexN_LC(this._r.sp, 4)} PC:${hexN_LC(this.pc, 4)} |[00]0x${hexN_LC(this.pc, 4)}: ${r_pad(insDebug, 8, ' ')} ${this.currentIns} ${operandDebug}`);
            }

        }



        if (ins.type) {
            if (ins.length == 3) {
                ins.op(ins.type, this.bus.readMem16(this.pc + 1));
            } else if (ins.length == 2) {
                ins.op(ins.type, this.bus.readMem8(this.pc + 1));
            } else {
                ins.op(ins.type, ins.type2);
            }
        } else {
            if (ins.length == 3) {
                ins.op(this.bus.readMem16(this.pc + 1));
            } else if (ins.length == 2) {
                ins.op(this.bus.readMem8(this.pc + 1));
            } else {
                ins.op();
            }
        }

        // These instructions set the program counter on their own, no need to increment

        if (!isCB) {
            this.pc = CPU.o16b(this.pc + ins.length);
        } else {
            this.pc = CPU.o16b(this.pc + 1);
        }




        if (this.debug)
            console.log("Instruction length: " + ins.length);

        this.totalI++;
        this.time++;


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
            let max = 4194;
            if (this.haltAt == this.pc || this.haltWhen == this.totalI || this.setHalt) {
                clearInterval(this.khzInterval);
            }
            while (i < max && this.haltAt != this.pc && !this.setHalt && this.haltWhen != this.totalI) {
                this.step();
                i++;
            }
            if (this.setHalt) this.setHalt = false;
        }, 1);

    }

    private getReg(t: T | TT) {
        if (t == undefined) {
            alert(`[PC ${hex(this.pc, 4)}, opcode: ${hex(this.bus.readMem8(this.pc), 2)}] Implementation error: getReg(undefined)`);
        }

        switch (t) {
            case T.A:
                return this._r.a;
            case T.B:
                return this._r.b;
            case T.C:
                return this._r.c;
            case T.D:
                return this._r.d;
            case T.E:
                return this._r.e;
            case T.H:
                return this._r.h;
            case T.L:
                return this._r.l;
            case TT.BC:
                return this._r.bc;
            case TT.DE:
                return this._r.de;
            case TT.HL:
                return this._r.hl;
        }
    }



    private setReg(t: T | TT, i: number) {
        if (t == undefined) {
            alert(`[PC ${hex(this.pc, 4)}, opcode: ${hex(this.bus.readMem8(this.pc), 2)}] Implementation error: setReg(undefined, [any])`);
        }
        if (i == undefined) {
            alert(`[PC ${hex(this.pc, 4)}, opcode: ${hex(this.bus.readMem8(this.pc), 2)}] Implementation error: setReg([any], undefined)`);
        }

        switch (t) {
            case T.A:
                this._r.a = i;
                break;
            case T.B:
                this._r.b = i;
                break;
            case T.C:
                this._r.c = i;
                break;
            case T.D:
                this._r.d = i;
                break;
            case T.E:
                this._r.e = i;
                break;
            case T.H:
                this._r.h = i;
                break;
            case T.L:
                this._r.l = i;
                break;
            case TT.BC:
                this._r.bc = i;
                break;
            case TT.DE:
                this._r.de = i;
                break;
            case TT.HL:
                this._r.hl = i;
                break;
        }
    }

    rgOpcode(id): Op {
        switch (id) {
            case 0x31:
                return { op: this.LD_SP, length: 3 };
            case 0x20:
                return { op: this.JR, type: CC.NZ, length: 2 };
            case 0x28:
                return { op: this.JR, type: CC.Z, length: 2 };
            case 0xAF:
                return { op: this.XOR_A, type: T.A, length: 1 };
            case 0xA8:
                return { op: this.XOR_A, type: T.B, length: 1 };
            case 0xA9:
                return { op: this.XOR_A, type: T.C, length: 1 };
            case 0xAA:
                return { op: this.XOR_A, type: T.D, length: 1 };
            case 0xAB:
                return { op: this.XOR_A, type: T.E, length: 1 };
            case 0xAC:
                return { op: this.XOR_A, type: T.H, length: 1 };
            case 0xAD:
                return { op: this.XOR_A, type: T.L, length: 1 };
            case 0xAE:
                return { op: this.XOR_A_iHL, length: 1 };
            case 0x21:
                return { op: this.LD_R16_N16, type: TT.HL, length: 3 };
            case 0x32:
                return { op: this.LD_HL_SUB_A, length: 1 };
            case 0x0E:
                return { op: this.LD_R8_N8, type: T.C, length: 2 };
            case 0x3E:
                return { op: this.LD_R8_N8, type: T.A, length: 2 };
            case 0xE2:
                return { op: this.LD_FF00_C_A, length: 1 };
            case 0x0C:
                return { op: this.INC_R8, type: T.C, length: 1 };
            case 0x77:
                return { op: this.LD_R16_A, type: TT.HL, length: 1 };
            case 0xE0:
                return { op: this.LD_FF00_N8_A, length: 2 };
            case 0x11:
                return { op: this.LD_R16_N16, type: TT.DE, length: 3 };
            case 0x1A:
                return { op: this.LD_A_iR16, type: TT.DE, length: 1 };
            case 0xCD: // CALL u16
                return { op: this.CALL_N16, type: CC.UNCONDITIONAL, length: 3 };
            case 0x00:
                return { op: this.NOP, length: 1 };
            case 0xC5: // PUSH B
                return { op: this.PUSH_R16, type: TT.BC, length: 1 };
            case 0x17:
                return { op: this.RLA, length: 1 };
            case 0xC1: // POP BC
                return { op: this.POP_R16, type: TT.BC, length: 1 };
            case 0x05:
                return { op: this.DEC_R8, type: T.B, length: 1 };
            case 0x22:
                return { op: this.LD_HL_INC_A, length: 1 };
            case 0x23:
                return { op: this.INC_HL, length: 1 };
            case 0xC9:
                return { op: this.RET, length: 1 };
            case 0x4F:
                return { op: this.LD_R8_R8, type: T.C, type2: T.A, length: 1 };
            case 0x06:
                return { op: this.LD_R8_N8, type: T.B, length: 2 };
            case 0x13:
                return { op: this.INC_R16, type: TT.DE, length: 1 };
            case 0x7B:
                return { op: this.LD_R8_R8, type: T.A, type2: T.E, length: 1 };
            case 0xFE:
                return { op: this.CP_A_N8, length: 2 };
            case 0xEA:
                return { op: this.LD_N16_A, length: 3 };
            case 0x3D:
                return { op: this.DEC_R8, type: T.A, length: 1 };
            case 0x0D:
                return { op: this.DEC_R8, type: T.C, length: 1 };
            case 0x2E:
                return { op: this.LD_R8_N8, type: T.L, length: 2 };
            case 0x18: // JR n8
                return { op: this.JR_E8, length: 2 };
            case 0x67: // LD H, A
                return { op: this.LD_R8_R8, type: T.H, type2: T.A, length: 1 };
            case 0x57: // LD D, A
                return { op: this.LD_R8_R8, type: T.D, type2: T.A, length: 1 };
            case 0x5F: // LD E, A
                return { op: this.LD_R8_R8, type: T.E, type2: T.A, length: 1 };
            case 0x04: // INC B
                return { op: this.INC_R8, type: T.B, length: 1 };
            case 0x1E: // LD E, n8
                return { op: this.LD_R8_N8, type: T.E, length: 2 };
            case 0x02: // LD (BC),A
                return { op: this.LD__R16__A, type: TT.BC, length: 1 };
            case 0xF0: // LD A,[$FF00+n8]
                return { op: this.LD_A__FF00_n8_, length: 2 };
            case 0x1D: // DEC E
                return { op: this.DEC_R8, type: T.E, length: 1 };
            case 0x24: // INC H
                return { op: this.INC_R8, type: T.H, length: 1 };
            case 0x7C: // LD A, H
                return { op: this.LD_R8_R8, type: T.A, type2: T.H, length: 1 };
            case 0x90: // SUB A, B
                return { op: this.SUB_A_R8, type: T.B, length: 1 };
            case 0x15: // DEC D
                return { op: this.DEC_R8, type: T.D, length: 1 };
            case 0x16: // LD D, n8
                return { op: this.LD_R8_N8, type: T.D, length: 2 };
            case 0xBE: // CP A, [HL]
                return { op: this.CP_A__HL_, length: 1 };
            case 0x7D: // LD A, L
                return { op: this.LD_R8_R8, type: T.A, type2: T.L, length: 1 };
            case 0x78: // LD A, B
                return { op: this.LD_R8_R8, type: T.A, type2: T.B, length: 1 };
            case 0x86: // ADD A, [HL]
                return { op: this.ADD__HL_, length: 1 };
            case 0xc3: // JP n16
                return { op: this.JP_N16, length: 3 };
            case 0xF3: // DI - 0xF3 Disable interrupts?
                return { op: this.DI, length: 1 };
            case 0x36:
                return { op: this.LD__HL__N8, length: 2 };
            case 0x2A:
                return { op: this.LD_A__HL_INC_, length: 1 };
            case 0x01:
                return { op: this.LD_R16_N16, type: TT.BC, length: 3 };
            case 0x0B:
                return { op: this.DEC_R16, type: TT.BC, length: 1 };
            case 0xB1: // OR C
                return { op: this.OR_A_R8, type: T.C, length: 1 };
            case 0xFB: // DI - 0xFB Enable interrupts
                return { op: this.EI, length: 1 };
            case 0x2F: // CPL
                return { op: this.CPL, length: 1 };
            case 0xE6: // AND A, u8
                return { op: this.AND_N8, length: 2 };
            case 0x47:
                return { op: this.LD_R8_R8, type: T.B, type2: T.A, length: 1 };
            case 0xB0:
                return { op: this.OR_A_R8, type: T.B, length: 1 };
            case 0xA1:
                return { op: this.AND_R8, type: T.C, length: 1 };
            case 0x79:
                return { op: this.LD_R8_R8, type: T.A, type2: T.C, length: 1 };
            case 0xEF: // RST 28h
                return { op: this.RST, type: 0x28, length: 1 };
            case 0x87:
                return { op: this.ADD_A_R8, type: T.A, length: 1 };
            case 0xE1:
                return { op: this.POP_HL, length: 1 };
            case 0x19:
                return { op: this.ADD_HL_R8, type: TT.DE, length: 1 };
            case 0x5E:
                return { op: this.LD_R8_iHL, type: T.E, length: 1 };
            case 0x56:
                return { op: this.LD_R8_iHL, type: T.D, length: 1 };
            case 0xD5:
                return { op: this.PUSH_R16, type: TT.DE, length: 1 };
            case 0xE9: // JP [HL]
                return { op: this.JP_iR16, type: TT.HL, length: 1 };
            case 0x9F: // SBC A,A
                return { op: this.SBC_A_R8, type: T.A, length: 1 };
            case 0xC7: // RST 00h
                return { op: this.RST, type: 0x00, length: 1 };
            case 0x12: // LD [DE],A
                return { op: this.LD__R16__A, type: TT.DE, length: 1 };
            case 0x1C: // INC E
                return { op: this.INC_R8, type: T.E, length: 1 };
            case 0x14: // INC D
                return { op: this.INC_R8, type: T.D, length: 1 };
            case 0xE5: // PUSH HL
                return { op: this.PUSH_HL, length: 1 };
            case 0xF5: // PUSH AF 
                return { op: this.PUSH_R16, type: TT.AF, length: 1 };
            case 0xF1: // POP AF 
                return { op: this.POP_R16, type: TT.AF, length: 1 };
            case 0x03: // INC BC
                return { op: this.INC_R16, type: TT.BC, length: 1 };
            case 0xFA: // LD A, [N16]
                return { op: this.LD_A_N16, length: 3 };
            case 0xC4: // CALL NZ, N16
                return { op: this.CALL_N16, type: CC.NZ, length: 3 };
            case 0x2C: // INC L
                return { op: this.INC_R8, type: T.L, length: 1 };
            case 0x69: // LD L, C
                return { op: this.LD_R8_R8, type: T.L, type2: T.C, length: 1 };
            case 0x91: // SUB C
                return { op: this.SUB_A_R8, type: T.C, length: 1 };
            case 0x38: // JR C, E8
                return { op: this.JR, type: CC.C, length: 2 };
            case 0x08: // LD [N16], SP
                return { op: this.LD_iN16_SP, length: 3 };
            case 0xC6: // ADD A, N8
                return { op: this.ADD_A_N8, length: 2 };
            case 0xD6: // SUB A, N8
                return { op: this.SUB_A_R8, length: 2 };
            case 0xB7: // OR A,A
                return { op: this.OR_A_R8, type: T.A, length: 1 };
            case 0xC2: // JP NZ, N16
                return { op: this.JP_N16, type: CC.NZ, length: 1 };
            case 0x46: // LD B, (HL)
                return { op: this.LD_R8_iHL, type: T.B, length: 1 };
            case 0x2D: // DEC L
                return { op: this.DEC_R8, type: T.L, length: 1 };
            case 0x4E: // LD C,(HL)
                return { op: this.LD_R8_iHL, type: T.C, length: 1 };
            case 0x26: // LD H, N8
                return { op: this.LD_R8_N8, type: T.H, length: 2 };
            case 0xF7: // RST 30h
                return { op: this.RST, type: 0x30, length: 1 };
            default:
                alert(`[PC ${hex(this.pc, 4)}] Unknown Opcode in Lookup Table: ` + hex(id, 2));
                clearInterval(this.khzInterval);
                break;

        }
    }

    cbOpcode(id): Op {
        let upperNybble = id >> 4;
        let lowerNybble = id & 0b1111;

        let type: OperandType;
        let op: Function;

        switch (lowerNybble & 0b111) {
            case 0x0:
                type = T.B;
                break;
            case 0x1:
                type = T.C;
                break;
            case 0x2:
                type = T.D;
                break;
            case 0x3:
                type = T.E;
                break;
            case 0x4:
                type = T.H;
                break;
            case 0x5:
                type = T.L;
                break;
            // (HL)
            case 0x6:
                type = TT.HL;
                break;
            case 0x7:
                type = T.A;
                break;
        }

        // 0x00 - 0x30
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
        }


        return { op: op, type: type, length: 1 };
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
        return mod(i, 0xF);
    }

    static o8b(i: number): number {
        return mod(i, 0xFF);
    }

    static o16b(i: number): number {
        return mod(i, 0xFFFF);
    }

    static do4b(i: number): boolean {
        return i >= 0xF;
    }

    static do8b(i: number): boolean {
        return i >= 0xFF;
    }

    static do16b(i: number): boolean {
        return i >= 0xFFFF;
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

    // Load SP into index
    LD_iN16_SP(in16: number) {
        let spUpperByte = this._r.sp >> 8;
        let spLowerByte = this._r.sp & 0b11111111;

        this.bus.writeMem(in16 + 0, spLowerByte);
        this.bus.writeMem(in16 + 1, CPU.o16b(spUpperByte));
    }


    RST(vector: number) {
        this.pc = vector - 1;

        let value = this.pc;
        let upperByte = value >> 8;
        let lowerByte = value & 0b11111111;

        this.bus.writeMem(CPU.o16b(--this._r.sp), upperByte);
        this.bus.writeMem(CPU.o16b(--this._r.sp), lowerByte);
    }

    LD_A_N16(n16: number) {
        this._r.a = this.bus.readMem8(n16);
    }

    LD_R8_iHL(r8: T) {
        this.setReg(r8, this.bus.readMem8(this._r.hl));
    }

    LD_A__HL_INC_() {
        this._r.a = this.bus.readMem8(this._r.hl);
        this._r.hl = CPU.o16b(this._r.hl + 1);
    }

    LD__HL__N8(n8: number) {
        this.bus.writeMem(this._r.hl, n8);
    }

    ADD__HL_() {
        this._r.a = CPU.o8b(this._r.a + this.bus.readMem8(this._r.hl));
    }

    CP_A__HL_() {
        let u8 = this.bus.readMem8(this.getReg(TT.HL));
        this._f.zero = this._r.a - u8 == 0;
        this._f.negative = true;
        this._f.half_carry = (this._r.a & 0xF) + (u8 & 0xF) > 0xF;
        this._f.carry = u8 > this._r.a;
    }

    LD_A__FF00_n8_(n8: number) {
        this.setReg(T.A, this.bus.readMem8(CPU.o16b(0xFF00 + n8)));
    }

    LD__R16__A(r16: TT) {
        this.bus.writeMem(this.getReg(r16), this._r.a);
    }

    // Store value in register A into address n16
    LD_N16_A(n16: number) {
        this.bus.writeMem(n16, this._r.a);
    }

    /*  PUSH r16 - 0xC5
        Push register r16 onto the stack. */
    PUSH_R16(r16: TT) {
        let value = this.getReg(r16);
        let upperByte = value >> 8;
        let lowerByte = value & 0b11111111;

        this.bus.writeMem(CPU.o16b(--this._r.sp), upperByte);
        this.bus.writeMem(CPU.o16b(--this._r.sp), lowerByte);
    }

    // Push HL onto the stack
    PUSH_HL() {
        this.bus.writeMem(CPU.o16b(--this._r.sp), this._r.h);
        this.bus.writeMem(CPU.o16b(--this._r.sp), this._r.l);
    }


    /*  PUSH r16 - 0xC1
        Pop off the stack into r16. */
    POP_R16(r16: TT) {
        let lowerByte = this.bus.readMem8(CPU.o16b(this._r.sp++));
        let upperByte = this.bus.readMem8(CPU.o16b(this._r.sp++));

        this.setReg(r16, (upperByte << 8) | lowerByte);
    }

    // Pop off the stack into HL
    POP_HL() {
        this._r.l = this.bus.readMem8(CPU.o16b(this._r.sp++));
        this._r.h = this.bus.readMem8(CPU.o16b(this._r.sp++));
    }

    // CALL n16 - 0xCD
    CALL_N16(cc: CC, u16: number) {
        if (cc == CC.Z && !this._f.zero) return;
        if (cc == CC.NZ && this._f.zero) return;
        if (cc == CC.C && !this._f.zero) return;
        if (cc == CC.NC && this._f.zero) return;

        let pcUpperByte = this.pc >> 8;
        let pcLowerByte = this.pc & 0b11111111;

        // console.info(`Calling 0x${u16.toString(16)} from 0x${this.pc.toString(16)}`);

        this.bus.writeMem(CPU.o16b(--this._r.sp), pcUpperByte);
        this.bus.writeMem(CPU.o16b(--this._r.sp), pcLowerByte);

        this.pc = u16 - 3;
    }

    JP_N16(n16: number, cc: CC) {
        if (cc == CC.Z && !this._f.zero) return;
        if (cc == CC.NZ && this._f.zero) return;
        if (cc == CC.C && !this._f.zero) return;
        if (cc == CC.NC && this._f.zero) return;

        this.pc = n16 - 3;
    }

    JP_iR16(r16: TT) {
        this.pc = this.getReg(r16) - 1;
    }


    RET() {
        let stackLowerByte = this.bus.readMem8(CPU.o16b(this._r.sp++));
        let stackUpperByte = this.bus.readMem8(CPU.o16b(this._r.sp++));

        let returnAddress = CPU.o16b(((stackUpperByte << 8) | stackLowerByte) + 2);
        // console.info(`Returning to 0x${returnAddress.toString(16)}`);

        this.pc = returnAddress;
    }

    // LD A,(R16)
    LD_A_iR16(r16: TT) {
        this.setReg(T.A, this.bus.readMem8(this.getReg(r16)));
    }

    LD_R16_A(t: T) {
        this.bus.writeMem(this.bus.readMem8(this.getReg(t)), this._r.a);
    }

    // LD [$FF00+u8],A
    LD_FF00_N8_A(u8: number) {
        let value = this._r.a;
        this.bus.writeMem(CPU.o16b(0xFF00 + u8), value);
        // console.log(0xFF00 + u8);
    }

    // LD [$FF00+C],A
    LD_FF00_C_A() {
        let value = this._r.a;
        this.bus.writeMem(CPU.o16b(0xFF00 + this._r.c), value);
    }

    LD_R8_N8(r8: T, n8: number) {
        this.setReg(r8, n8);
    }

    // Store value in register on the right into register on the left
    LD_R8_R8(r8: T, r8_2: T) {
        this.setReg(r8, this.getReg(r8_2));
    }

    // LD r16,n16 - 0x21, 
    LD_R16_N16(r16: TT, n16: number) {
        this.setReg(r16, n16);
    }

    // LD [HL+],A | Store value in register A into byte pointed by HL and post-increment HL.  
    LD_HL_INC_A() {
        this.bus.writeMem(this._r.hl, this._r.a);
        this._r.hl = CPU.o16b(this._r.hl + 1);
    }
    // LD [HL-],A | Store value in register A into byte pointed by HL and post-decrement HL. 
    LD_HL_SUB_A() {
        this.bus.writeMem(this._r.hl, this._r.a);
        this._r.hl = CPU.o16b(this._r.hl - 1);
    }


    // JR
    JR(cc: CC, n8: number) {
        if (cc == CC.Z && !this._f.zero) return;
        if (cc == CC.NZ && this._f.zero) return;
        if (cc == CC.C && !this._f.zero) return;
        if (cc == CC.NC && this._f.zero) return;

        this.pc += this.unTwo8b(n8);
    }

    JR_E8(e8: number) {
        // console.log(n8 - 256);
        // console.log(`[PC: 0x${this.pc.toString(16)}, INS: ${this.rgOpcode(this.bus.readMem8(this.pc)).op.name}] Jumping to 0x${(this.pc + this.unTwo8b(n8) + 2).toString(16)}`);
        this.pc += this.unTwo8b(e8);
    }

    // LD SP,u16 - 0x31 
    LD_SP(n16: number) {
        this._r.sp = n16;
    }

    // ADD A, r8
    ADD_A_R8(t: T) {
        let value = this.getReg(t);
        this._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;

        let newValue = CPU.o8b(value + this._r.a);
        let didOverflow = CPU.do8b(value + this._r.a);

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._f.carry = didOverflow;
        this._f.zero = newValue == 0;
        this._f.negative = false;
    }

    // ADD A, N8
    ADD_A_N8(t: T, n8: number) {
        let value = n8;
        this._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;

        let newValue = CPU.o8b(value + this._r.a);
        let didOverflow = CPU.do8b(value + this._r.a);

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._f.carry = didOverflow;
        this._f.zero = newValue == 0;
        this._f.negative = false;

    }

    // ADC A, r8
    ADC(t: T) {
        let value = this.getReg(t);
        this._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;

        // Add the carry flag as well for ADC
        let newValue = CPU.o8b(value + this._r.a + (this._f.carry ? 1 : 0));
        let didOverflow = CPU.do8b(value + this._r.a + (this._f.carry ? 1 : 0));

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._f.carry = didOverflow;
        this._f.zero = newValue == 0;
        this._f.negative = false;

    }

    ADD_HL_R8(t: T) {
        let value = this.getReg(t);

        let newValue = CPU.o16b(value + this._r.hl);
        let didOverflow = CPU.do16b(value + this._r.hl);

        // Set register values
        this._r.hl = newValue;

        // Set flags
        this._f.carry = didOverflow;
        this._f.zero = newValue == 0;
        this._f.negative = false;
        this._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;
    }

    ADD_HL_R16(r16: TT) {
        let value = this.getReg(r16);

        let newValue = CPU.o16b(value + this._r.hl);
        let didOverflow = CPU.do16b(value + this._r.hl);

        // Set register values
        this._r.hl = newValue;

        // Set flags
        this._f.carry = didOverflow;
        this._f.zero = newValue == 0;
        this._f.negative = false;
        this._f.half_carry = (this._r.a & 0xF) + (value & 0xF) > 0xF;
    }

    SUB_A_R8(t: T) {
        let value = this.getReg(t);

        let newValue = CPU.o8b(this._r.a - value);
        let didOverflow = CPU.do8b(this._r.a - value);

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._f.carry = didOverflow;
        this._f.zero = newValue == 0;
        this._f.negative = true;
    }

    SUB_A_N8(n8: number) {
        let value = n8;

        let newValue = CPU.o8b(this._r.a - value);
        let didOverflow = CPU.do8b(this._r.a - value);

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._f.carry = didOverflow;
        this._f.zero = newValue == 0;
        this._f.negative = true;
    }

    SBC_A_R8(t: T) {
        let value = this.getReg(t);

        // Also subtract the carry flag for SBC
        let newValue = CPU.o8b(this._r.a - value - (this._f.carry ? 1 : 0));
        let didOverflow = CPU.do8b(this._r.a - value - (this._f.carry ? 1 : 0));

        // Set register values
        this._r.a = newValue;

        // Set flags
        this._f.carry = didOverflow;
        this._f.zero = newValue == 0;
        this._f.negative = true;
    }

    AND_R8(t: T) {
        let value = this.getReg(t);

        let final = value & this._r.a;
        this._r.a = final;
    }

    AND_N8(n8: number) {
        let value = this.bus.readMem8(n8);

        let final = value & this._r.a;
        this._r.a = final;
    }

    OR_A_R8(t: T) {
        let value = this.getReg(t);

        let final = value | this._r.a;
        this._r.a = final;

        this._f.zero = final == 0;
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = false;
    }

    XOR_A(t: T) {
        let value = this.getReg(t);

        let final = value ^ this._r.a;
        this._r.a = final;
        this._f.zero = final == 0;
    }

    XOR_A_iHL() {
        let value = this.bus.readMem8(this._r.hl);

        let final = value ^ this._r.a;
        this._r.a = final;

        this._f.zero = final == 0;
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = false;
    }

    // CP A,r8
    CP_A(t: T) {
        let r8 = this.getReg(t);

        let newValue = CPU.o8b(this._r.a - r8);
        let didOverflow = CPU.do8b(this._r.a - r8);

        // DO not set register values for CP

        // Set flags
        this._f.carry = r8 > this._r.a;
        this._f.zero = newValue == 0;
        this._f.negative = true;
        this._f.half_carry = (this._r.a & 0xF) + (r8 & 0xF) > 0xF;
    }

    CP_A_N8(n8: number) {

        let newValue = CPU.o8b(this._r.a - n8);
        let didOverflow = CPU.do8b(this._r.a - n8);

        // DO not set register values for CP

        // Set flags
        this._f.carry = n8 > this._r.a;
        this._f.zero = newValue == 0;
        this._f.negative = true;
        this._f.half_carry = (this._r.a & 0xF) + (n8 & 0xF) > 0xF;
    }

    INC_R8(t: T) {
        let target = this.getReg(t);

        let newValue = CPU.o8b(target + 1);
        let didOverflow = CPU.do8b(target + 1);

        this.setReg(t, newValue);

        // UNMODIFIED this._f.carry = didOverflow;
        this._f.zero = newValue == 0;
        this._f.negative = false;
        this._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
    }


    // Increment in register r16
    INC_R16(r16: TT) {
        this.setReg(r16, CPU.o16b(this.getReg(r16) + 1));
    }


    INC_HL() {
        this._r.hl = CPU.o16b(this._r.hl + 1);
    }


    DEC_R8(t: T) {
        let target = this.getReg(t);

        let newValue = CPU.o8b(target - 1);
        let didOverflow = CPU.do8b(target - 1);

        this.setReg(t, newValue);

        // UNMODIFIED this._f.carry = didOverflow;
        this._f.zero = newValue == 0;
        this._f.negative = true;
        this._f.half_carry = (target & 0xF) - (1 & 0xF) < 0;
    }

    DEC_R16(tt: TT) {
        this.setReg(tt, CPU.o16b(this.getReg(tt)));
    }

    CCF() {
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = !this._f.carry;
    }

    SCF() {
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = true;
    }

    // Rotate A right through carry
    RRA() {
        let carryMask = (this._f.numerical & 0b00010000) << 3;

        let newValue = CPU.o8b((this._r.a >> 1) | carryMask);
        let didOverflow = CPU.do8b((this._r.a >> 1) | carryMask);

        this._f.carry = (this._r.a & 0b00000001) == 0b1;

        this._r.a = newValue;

        this._f.zero = false;
        this._f.negative = false;
        this._f.half_carry = false;

    }

    // Rotate A left through carry
    RLA() {
        let carryMask = (this._f.numerical & 0b00010000) >> 4;

        let newValue = CPU.o8b((this._r.a << 1) | carryMask);
        let didOverflow = CPU.do8b((this._r.a << 1) | carryMask);

        this._f.carry = (this._r.a & 0b10000000) >> 7 == 0b1;

        this._r.a = newValue;

        this._f.zero = false;
        this._f.negative = false;
        this._f.half_carry = false;
    }

    // Rotate register A right
    RRCA() {
        let rightmostBit = (this._r.a & 0b00000001) << 7;

        let newValue = CPU.o8b((this._r.a >> 1) | rightmostBit);
        let didOverflow = CPU.do8b((this._r.a >> 1) | rightmostBit);

        this._r.a = newValue;

        this._f.zero = false;
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = didOverflow;
    }

    // Rotate register A left
    RRLA() {
        let leftmostBit = (this._r.a & 0b10000000) >> 7;

        let newValue = CPU.o8b((this._r.a << 1) | leftmostBit);
        let didOverflow = CPU.do8b((this._r.a << 1) | leftmostBit);

        this._r.a = newValue;

        this._f.zero = false;
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = didOverflow;
    }

    CPL() {
        this._r.a = this._r.a ^ 0b11111111;
    }

    BIT(t: T, selectedBit) {
        let value = this.getReg(t);
        let mask = 0b1 << selectedBit;

        this._f.zero = (value & mask) == 0;
        this._f.negative = false;
        this._f.half_carry = true;
    }

    BIT_HL(t: T, selectedBit) {
        let value = this.bus.readMem8(this._r.hl);

        let mask = 0b1 << selectedBit;

        this._f.zero = (value & mask) == 0;
        this._f.negative = false;
        this._f.half_carry = true;
    }

    RES(t: T, selectedBit) {
        let value = this.getReg(t);
        let mask = 0b1 << selectedBit;

        let final = value & ~(mask);

        this.setReg(t, final);
    }

    SET(t: T, selectedBit) {
        let value = this.getReg(t);
        let mask = 0b1 << selectedBit;

        let final = value | ~(mask);

        this.setReg(t, final);
    }

    SRL_R8(t: T) {
        let value = this.getReg(t);
        this.setReg(t, value >> 1);
    }

    // Rotate TARGET right through carry
    RR(t: T) {
        let carryMask = (this._f.numerical & 0b00010000) << 3;

        let newValue = CPU.o8b((this.getReg(t) >> 1) | carryMask);
        let didOverflow = CPU.do8b((this.getReg(t) >> 1) | carryMask);

        this.setReg(t, newValue);

        this._f.zero = newValue == 0;
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = didOverflow;
    }

    // Rotate TARGET left through carry
    RL(t: T) {
        let carryMask = (this._f.numerical & 0b00010000) >> 4;

        let newValue = CPU.o8b((this.getReg(t) << 1) | carryMask);
        let didOverflow = CPU.do8b((this.getReg(t) << 1) | carryMask);

        this.setReg(t, newValue);

        this._f.zero = newValue == 0;
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = didOverflow;
    }

    // Rotate TARGET right
    RRC(t: T) {
        let rightmostBit = (this._r.a & 0b00000001) << 7;

        let newValue = CPU.o8b((this._r.a >> 1) | rightmostBit);
        let didOverflow = CPU.do8b((this._r.a >> 1) | rightmostBit);

        this.setReg(t, newValue);

        this._f.zero = newValue == 0;
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = didOverflow;
    }

    // Rotate TARGET left
    RLC(t: T) {
        let leftmostBit = (this._r.a & 0b10000000) >> 7;

        let newValue = CPU.o8b((this._r.a << 1) | leftmostBit);
        let didOverflow = CPU.do8b((this._r.a << 1) | leftmostBit);

        this.setReg(t, newValue);

        this._f.zero = newValue == 0;
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = didOverflow;
    }

    // Shift TARGET right
    SRA(t: T) {
        let newValue = CPU.o8b(this.getReg(t) >> 1);
        let didOverflow = CPU.do8b(this.getReg(t) >> 1);

        this.setReg(t, newValue);

        this._f.zero = newValue == 0;
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = didOverflow;
    }

    // Shift TARGET left 
    SLA(t: T) {
        let newValue = CPU.o8b(this.getReg(t) << 1);
        let didOverflow = CPU.do8b(this.getReg(t) << 1);

        this.setReg(t, newValue);

        this._f.zero = newValue == 0;
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = didOverflow;
    }

    // Shift right logic register
    SRL(t: T) {
        let newValue = CPU.o8b(this.getReg(t) >> 1);
        let didOverflow = CPU.do8b(this.getReg(t) >> 1);

        this.setReg(t, newValue);

        this._f.zero = newValue == 0;
        this._f.negative = false;
        this._f.half_carry = false;
        this._f.carry = didOverflow;
    }

    // SWAP 
    SWAP(r8: T) {
        let original = this.getReg(r8);
        let lowerNybble = original & 0b00001111;
        let upperNybble = (original >> 4) & 0b00001111;

        this.setReg(r8, (lowerNybble << 4) | upperNybble);

        this._f.zero = this.getReg(r8) == 0;
    }

}

let cpu = new CPU();

function test() {
    cpu._f.zero = true;
    console.log(cpu._f.numerical);
    cpu._f.numerical = cpu._f.numerical;
    console.log(cpu._f.numerical);
    console.log("Expect both answers 128.");

    cpu._r.a = 100;
    cpu._r.b = 100;
    cpu.ADD_A_R8(T.B);
    console.log(cpu._r.a);
    console.log("Expect 200.");

    cpu = new CPU();

    cpu._r.a = 200;
    cpu._r.b = 200;
    cpu.ADD_A_R8(T.B);
    console.log(cpu._r.a);
    console.log(cpu._f.carry);
    console.log("Expect 144 and carry bit.");

    cpu = new CPU();

    cpu._r.c = 200;
    cpu._r.hl = 256;
    cpu.ADD_HL_R8(T.C);
    console.log(cpu._r.hl);
    console.log(cpu._f.carry);
    console.log("ADDHL: Expect 456 and no carry bit.");

    cpu = new CPU();

    cpu._r.hl = 42069;
    console.log(cpu._r.hl);
    console.log("setting HL: Expect 42069.");

    cpu._r.a = 20;
    cpu._r.b = 16;
    cpu.SUB_A_R8(T.B);
    console.log(cpu._r.a);
    console.log("SUB 20 - 16: Expect 4.");

    cpu._r.a = 20;
    cpu._r.b = 160;
    cpu.SUB_A_R8(T.B);
    console.log(cpu._r.a);
    console.log("SUB 20 - 160: Expect 116.");

    cpu._r.a = 12;
    cpu._r.b = 25;
    cpu.AND_R8(T.B);
    console.log(cpu._r.a);
    console.log("(DEC) 12 & 25: Expect (DEC) 8.");

    cpu._r.a = 12;
    cpu._r.b = 25;
    cpu.OR_A_R8(T.B);
    console.log(cpu._r.a);
    console.log("(DEC) 12 | 25: Expect (DEC) 29.");

    cpu._r.a = 12;
    cpu._r.b = 25;
    cpu.XOR_A(T.B);
    console.log(cpu._r.a);
    console.log("(DEC) 12 ^ 25: Expect (DEC) 21.");

    cpu._r.a = 12;
    cpu.INC_R8(T.A);
    console.log(cpu._r.a);
    console.log("INC A: Expect 13.");

    cpu._r.a = 12;
    cpu.DEC_R8(T.A);
    console.log(cpu._r.a);
    console.log("DEC A: Expect 11.");

    cpu._r.a = 0b00001111;
    cpu._r.b = 0b00000001;
    cpu.ADD_A_R8(T.B);
    console.log(cpu._r.a);
    console.log("Expect half carry.");

    cpu._r.h = 0b00010000;
    cpu.BIT(T.H, 7);
    console.log("Expect zero.");

    cpu = new CPU();
}

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

if (!isNode()) {
    setInterval(() => {
        try {
            (window as any).cpu = cpu;
            let debugP = document.getElementById('debug');
            debugP.innerText = `
    Last Instruction: ${cpu.currentIns}

    Total Instructions Executed: ${cpu.totalI}
    
    PC: ${hex(cpu.pc, 4)}

    CARRY: ${cpu._f.carry}
    HALF_CARRY: ${cpu._f.half_carry}
    SUBTRACT: ${cpu._f.negative}
    ZERO: ${cpu._f.zero}

    SP: ${hex(cpu._r.sp, 4)} ${cpu._r.sp} ${cpu._r.sp.toString(2)}

    A: ${hex(cpu._r.a, 2)} ${cpu._r.a} ${cpu._r.a.toString(2)}
    B: ${hex(cpu._r.b, 2)} ${cpu._r.b} ${cpu._r.b.toString(2)}
    C: ${hex(cpu._r.c, 2)} ${cpu._r.c} ${cpu._r.c.toString(2)}
    D: ${hex(cpu._r.d, 2)} ${cpu._r.d} ${cpu._r.d.toString(2)}
    E: ${hex(cpu._r.e, 2)} ${cpu._r.e} ${cpu._r.e.toString(2)}
    H: ${hex(cpu._r.h, 2)} ${cpu._r.h} ${cpu._r.h.toString(2)}
    L: ${hex(cpu._r.l, 2)} ${cpu._r.l} ${cpu._r.l.toString(2)}

    BC: ${hex(cpu._r.bc, 4)} ${cpu._r.bc} ${cpu._r.bc.toString(2)}
    DE: ${hex(cpu._r.de, 4)} ${cpu._r.de} ${cpu._r.de.toString(2)}
    HL: ${hex(cpu._r.hl, 4)} ${cpu._r.hl} ${cpu._r.hl.toString(2)}
    `;
        } catch (e) {
            alert(`
        Error occurred in display, probably caused by error in CPU.
        
        PC: 0x${cpu.pc.toString(16)}
        Opcode: 0x${cpu.bus.readMem8(cpu.pc).toString(16)}
        Op: ${cpu.rgOpcode(cpu.bus.readMem8(cpu.pc)).op.name}

        `);

            console.error(e);
            cpu.khzStop();
        }
    }, 10);

} else {
    console.log("Running in node, not updating DEBUG");
    // @ts-ignore
    module.exports = { CPU, MemoryBus, GPU };
}

