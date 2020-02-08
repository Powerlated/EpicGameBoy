console.log("Hello Z80!");

class Registers {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
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

    constructor() {
        this.a = 0;
        this.b = 0;
        this.c = 0;
        this.d = 0;
        this.e = 0;
        this.f = 0;

        this.h = 0;
        this.l = 0;
        this.sp = 0;
    }
}

class FlagsRegister {
    zero: boolean;
    subtract: boolean;
    half_carry: boolean;
    carry: boolean;

    constructor() {
        this.zero = false;
        this.subtract = false;
        this.half_carry = false;
        this.carry = false;
    }

    get numerical() {
        let flagN = 0;
        if (this.zero) {
            flagN = flagN | 0b10000000;
        }
        if (this.subtract) {
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
        this.subtract = (i & (1 << 6)) != 0;
        this.half_carry = (i & (1 << 5)) != 0;
        this.carry = (i & (1 << 4)) != 0;
    }
}

enum T {
    A, B, C, D, E, H, L, AF, BC, DE, HL
}

function mod(n, m) {
    return ((n % m) + m) % m;
}

class MemoryBus {
    memory = new Array(0xFFFF).fill(0);

    constructor() {
        /* $0000 */ this.memory[0x00] = 0x31; // LD SP $fffe
        /* $0001 */ this.memory[0x01] = 0xFE;
        /* $0002 */ this.memory[0x02] = 0xFF;

        /* $0003 */ this.memory[0x03] = 0xAF; // XOR A

        /* $0004 */ this.memory[0x04] = 0x21; // LD HL,$9fff
        /* $0005 */ this.memory[0x05] = 0xFF;
        /* $0006 */ this.memory[0x06] = 0x9F;

        /* $0007 */ this.memory[0x07] = 0x32; // Addr_0007: LD (HL-),A 

        /* $0008 */ this.memory[0x08] = 0xCB;
        /* $0009 */ this.memory[0x09] = 0x7C; // BIT 7, H

        /* $000A */ this.memory[0x0A] = 0x20; // JR NZ, Addr_0007
        /* $000B */ this.memory[0x0B] = 0xFB;

        /* $000C */ this.memory[0x0C] = 0x21; // LD HL,$ff26
        /* $000D */ this.memory[0x0D] = 0x26;
        /* $000E */ this.memory[0x0E] = 0xFF;

        /* $000F */ this.memory[0x0F] = 0x0E; // LD C,$11
        /* $0010 */ this.memory[0x10] = 0x11;

        /* $0011 */ this.memory[0x11] = 0x3E; // LD A,$80
        /* $0012 */ this.memory[0x12] = 0x80;

        /* $0013 */ this.memory[0x13] = 0x32; // LD (HL-),A	

        /* $0014 */ this.memory[0x14] = 0xE2; // LD ($FF00+C),A	

        /* $0015 */ this.memory[0x15] = 0x0C; // INC C	

        /* $0016 */ this.memory[0x16] = 0x3E; // LD A,$f3		
        /* $0017 */ this.memory[0x17] = 0xF3;

        /* $0018 */ this.memory[0x18] = 0xE2; // LD ($FF00+C),A	

        /* $0019 */ this.memory[0x19] = 0x32; // LD (HL-),A	

        /* $001A */ this.memory[0x1A] = 0x3E; // LD A,$77	
        /* $001B */ this.memory[0x1B] = 0x77;

        /* $001C */ this.memory[0x1C] = 0x77; // LD (HL),A

        /* $001D */ this.memory[0x1D] = 0x3E; // LD A,$fc	
        /* $001E */ this.memory[0x1E] = 0xFC;

        /* $001F */ this.memory[0x1F] = 0xE0; // LD ($FF00+$47),A	
        /* $0020 */ this.memory[0x20] = 0x47;
    }
}

type Op = {
    op, type?, type2?, length?, timing?, operand?;
};

enum Operand {
    b16, b8
}

function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

class CPU {
    constructor() {
        console.log("CPU Bootstrap!");
    }

    totalI = 0;

    debug = true;

    registers = new Registers();
    flags = new FlagsRegister();

    pc: number = 0x0000;
    bus = new MemoryBus();

    step() {
        if (this.debug)
            console.log("STEP");


        if (this.readMem8(this.pc) != 0xCB) {
            let ins = this.rgOpcode(this.readMem8(this.pc));

            // Rebind the this object
            ins.op = ins.op.bind(this);

            if (this.debug)
                console.log("Executing op: 0x" + pad(this.readMem8(this.pc).toString(16), 2, ' '));

            if (ins.type) {
                if (ins.operand == Operand.b16) {
                    ins.op(ins.type, this.readMem16(this.pc + 1));
                } else if (ins.operand == Operand.b8) {
                    ins.op(ins.type, this.readMem8(this.pc + 1));
                } else {
                    ins.op(ins.type, ins.type2);
                }
            } else {
                if (ins.operand == Operand.b16) {
                    ins.op(this.readMem16(this.pc + 1));
                } else if (ins.operand == Operand.b8) {
                    ins.op(this.readMem8(this.pc + 1));
                } else {
                    ins.op(ins.type, ins.type2);
                }
            }
            this.pc += ins.length;

            if (this.debug)
                console.log("Instruction length: " + ins.length);
        } else {
            this.pc++;
            let ins = this.cbOpcode(this.readMem8(this.pc));

            // Rebind the this object
            ins.op = ins.op.bind(this);

            if (this.debug)
                console.log("[0xCB Prefix] Executing op: 0x" + pad(this.readMem8(this.pc).toString(16), 2, ' '));

            if (ins.type) {
                if (ins.operand == Operand.b16) {
                    ins.op(ins.type, this.readMem16(this.pc + 1));
                } else if (ins.operand == Operand.b8) {
                    ins.op(ins.type, this.readMem8(this.pc + 1));
                } else {
                    ins.op(ins.type, ins.type2);
                }
            } else {
                if (ins.operand == Operand.b16) {
                    ins.op(this.readMem16(this.pc + 1));
                } else if (ins.operand == Operand.b8) {
                    ins.op(this.readMem8(this.pc + 1));
                } else {
                    ins.op(ins.type, ins.type2);
                }
            }
            this.pc += ins.length;

            if (this.debug)
                console.log("Instruction length: " + ins.length);
        }

        this.totalI++;
    }

    khzInterval = 0;

    khz() {
        this.debug = false;
        this.khzInterval = setInterval(() => {
            let i = 0;
            let max = 1000;
            while (i < max) {
                this.step();
                i++;
            }
        }, 1);

    }

    private getTarget(t: T) {
        switch (t) {
            case T.A:
                return this.registers.a;
            case T.B:
                return this.registers.b;
            case T.C:
                return this.registers.c;
            case T.D:
                return this.registers.d;
            case T.E:
                return this.registers.e;
            case T.H:
                return this.registers.h;
            case T.L:
                return this.registers.l;
            case T.AF:
                return this.registers.af;
            case T.BC:
                return this.registers.bc;
            case T.DE:
                return this.registers.de;
            case T.HL:
                return this.registers.hl;
        }
    }

    private setTarget(t: T, i: number) {
        switch (t) {
            case T.A:
                this.registers.a = i;
                break;
            case T.B:
                this.registers.b = i;
                break;
            case T.C:
                this.registers.c = i;
                break;
            case T.D:
                this.registers.d = i;
                break;
            case T.E:
                this.registers.e = i;
                break;
            case T.H:
                this.registers.h = i;
                break;
            case T.L:
                this.registers.l = i;
                break;
            case T.AF:
                this.registers.af = i;
                break;
            case T.BC:
                this.registers.bc = i;
                break;
            case T.DE:
                this.registers.de = i;
                break;
            case T.HL:
                this.registers.hl = i;
                break;
        }
    }

    rgOpcode(id): Op {
        switch (id) {
            case 0x31:
                return { op: this.LD_SP, length: 3, operand: Operand.b16 };
            case 0x20:
                return { op: this.JR_NZ, length: 2, operand: Operand.b8 };
            case 0x28:
                return { op: this.JR_Z, length: 2, operand: Operand.b8 };
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
                return { op: this.XOR_A_HL };
            case 0x21:
                return { op: this.LD_R16, type: T.HL, length: 3, timing: 12, operand: Operand.b16 };
            case 0x32:
                return { op: this.LD_HL_SUB_A, length: 1 };
            case 0x0E:
                return { op: this.LD_R8_N8, type: T.C, length: 2 };
            case 0x3E:
                return { op: this.LD_R8_N8, type: T.A, length: 2 };
            case 0xE2:
                return { op: this.LD_FF00_C_A, length: 1 };
            case 0x0C:
                return { op: this.INC, type: T.C, length: 1 };
            case 0x77:
                return { op: this.LD_R16_A, length: 1 };
            case 0xE0:
                return { op: this.LD_FF00_N8_A, length: 2 };
            default:
                alert("Unknown Opcode in Lookup Table: 0x" + pad(this.readMem8(this.pc).toString(16), 2, '0'));
                clearInterval(this.khzInterval);
                break;

        }
    }

    cbOpcode(id): Op {
        switch (id) {
            case 0x31:
                return { op: this.LD_SP };
            case 0x47:
                return { op: this.BIT, type: T.A, length: 1 };
            case 0x40:
                return { op: this.BIT, type: T.B, length: 1 };
            case 0x41:
                return { op: this.BIT, type: T.C, length: 1 };
            case 0x42:
                return { op: this.BIT, type: T.D, length: 1 };
            case 0x43:
                return { op: this.BIT, type: T.E, length: 1 };
            case 0x7c:
                return { op: this.BIT, type: T.H, type2: 7, length: 1 };
            case 0x45:
                return { op: this.BIT, type: T.L, length: 1 };
            case 0x46:
                return { op: this.BIT_HL, type: 0 };
            default:
                alert("[0xCB Prefix] Unknown Opcode in Lookup Table: 0x" + pad(this.readMem8(this.pc).toString(16), 2, '0'));
                clearInterval(this.khzInterval);
                break;

        }
    }

    static o8b(i: number): [number, boolean] {
        return [mod(i, 256), i >= 256];
    }

    static o16b(i: number): [number, boolean] {
        return [mod(i, 65536), i >= 65536];
    }

    writeMem8(addr: number, value: number) {
        this.bus.memory[addr] = value;
    }

    readMem8(addr: number) {
        return this.bus.memory[addr];
    }

    readMem16(addr: number) {
        return this.bus.memory[addr] | this.bus.memory[addr + 1] << 8;
    }



    LD_R16_A(t: T) {
        this.writeMem8(this.readMem8(this.getTarget(t)), this.registers.a);
    }

    // LD [$FF00+u8],A
    LD_FF00_N8_A(u8: number) {
        let value = this.registers.a;
        this.writeMem8(CPU.o8b(0xFF + u8)[0], value);
    }

    // LD [$FF00+C],A
    LD_FF00_C_A() {
        let value = this.registers.a;
        this.writeMem8(CPU.o8b(0xFF + this.registers.c)[0], value);
    }

    LD_R8_N8(r8: T, n8: number) {
        this.setTarget(n8, r8);
    }

    // LD r6,n16 - 0x21, 
    LD_R16(t: T, i: number) {
        this.setTarget(t, i);
    }

    // LD [HL+],A | Store value in register A into byte pointed by HL and post-increment HL.  
    LD_HL_INC_A() {
        this.writeMem8(this.registers.a, this.readMem8(this.registers.hl));
        this.registers.hl = CPU.o16b(this.registers.hl + 1)[0];
    }
    // LD [HL-],A | Store value in register A into byte pointed by HL and post-decrement HL. 
    LD_HL_SUB_A() {
        this.writeMem8(this.registers.a, this.readMem8(this.registers.hl));
        this.registers.hl = CPU.o16b(this.registers.hl - 1)[0];
    }


    JR_C(i8: number) {
        if (this.flags.carry) {
            this.pc += i8 - 256;
        }
    }

    JR_NC(i8: number) {
        if (!this.flags.carry) {
            this.pc += i8 - 256;
        }
    }


    //JR Z,i8 - 0x28 | JR cc,e8
    JR_Z(i8: number) {
        if (this.flags.zero) {
            this.pc += i8 - 256;
        }
    }

    // JR NZ,i8 - 0x20 | JR cc,e8
    JR_NZ(i8: number) {
        if (!this.flags.zero) {
            this.pc += i8 - 256;
        }
    }

    // LD SP,u16 - 0x31 
    LD_SP(n16: number) {
        this.registers.sp = n16;
    }

    // ADD A, r8
    ADD_A(t: T) {
        let value = this.getTarget(t);
        this.flags.half_carry = (this.registers.a & 0xF) + (value & 0xF) > 0xF;

        let values = CPU.o8b(value + this.registers.a);
        let newValue = values[0];
        let didOverflow = values[1];

        // Set register values
        this.registers.a = newValue;

        // Set flags
        this.flags.carry = didOverflow;
        this.flags.zero = newValue == 0;
        this.flags.subtract = false;

    }

    // ADC A, r8
    ADC(t: T) {
        let value = this.getTarget(t);
        this.flags.half_carry = (this.registers.a & 0xF) + (value & 0xF) > 0xF;

        // Add the carry flag as well for ADC
        let values = CPU.o8b(value + this.registers.a + (this.flags.carry ? 1 : 0));
        let newValue = values[0];
        let didOverflow = values[1];

        // Set register values
        this.registers.a = newValue;

        // Set flags
        this.flags.carry = didOverflow;
        this.flags.zero = newValue == 0;
        this.flags.subtract = false;

    }

    ADDHL(t: T) {
        let value = this.getTarget(t);

        let values = CPU.o16b(value + this.registers.hl);
        let newValue = values[0];
        let didOverflow = values[1];

        // Set register values
        this.registers.hl = newValue;

        // Set flags
        this.flags.carry = didOverflow;
        this.flags.zero = newValue == 0;
        this.flags.subtract = false;
        this.flags.half_carry = (this.registers.a & 0xF) + (value & 0xF) > 0xF;
    }

    SUB(t: T) {
        let value = this.getTarget(t);

        let values = CPU.o8b(this.registers.a - value);
        let newValue = values[0];
        let didOverflow = values[1];

        // Set register values
        this.registers.a = newValue;

        // Set flags
        this.flags.carry = didOverflow;
        this.flags.zero = newValue == 0;
        this.flags.subtract = true;
    }

    SBC(t: T) {
        let value = this.getTarget(t);

        // Also subtract the carry flag for SBC
        let values = CPU.o8b(this.registers.a - value - (this.flags.carry ? 1 : 0));
        let newValue = values[0];
        let didOverflow = values[1];

        // Set register values
        this.registers.a = newValue;

        // Set flags
        this.flags.carry = didOverflow;
        this.flags.zero = newValue == 0;
        this.flags.subtract = true;
    }

    AND(t: T) {
        let value = this.getTarget(t);

        let final = value & this.registers.a;
        this.registers.a = final;
    }

    OR(t: T) {
        let value = this.getTarget(t);

        let final = value | this.registers.a;
        this.registers.a = final;
    }

    XOR_A(t: T) {
        let value = this.getTarget(t);

        console.log(value)
        let final = value ^ this.registers.a;
        this.registers.a = final;
        this.flags.zero = final == 0;
    }

    XOR_A_HL() {
        let value = this.readMem8(this.registers.hl);

        let final = value ^ this.registers.a;
        this.registers.a = final;
        this.flags.zero = final == 0;
    }

    // CP A,r8
    CP(t: T) {
        let r8 = this.getTarget(t);

        let values = CPU.o8b(this.registers.a - r8);
        let newValue = values[0];
        let didOverflow = values[1];

        // DO not set register values for CP

        // Set flags
        this.flags.carry = r8 > this.registers.a;
        this.flags.zero = newValue == 0;
        this.flags.subtract = true;
        this.flags.half_carry = (this.registers.a & 0xF) + (r8 & 0xF) > 0xF;
    }

    INC(t: T) {
        let value = this.getTarget(t);

        let values = CPU.o8b(value + 1);
        let newValue = values[0];
        let didOverflow = values[1];

        this.setTarget(t, newValue);

        this.flags.carry = didOverflow;
        this.flags.zero = newValue == 0;
        this.flags.subtract = false;
        this.flags.half_carry = (this.registers.a & 0xF) + (value & 0xF) > 0xF;
    }

    DEC(t: T) {
        let value = this.getTarget(t);

        let values = CPU.o8b(value - 1);
        let newValue = values[0];
        let didOverflow = values[1];

        this.setTarget(t, newValue);

        this.flags.carry = didOverflow;
        this.flags.zero = newValue == 0;
        this.flags.subtract = false;
        this.flags.half_carry = (this.registers.a & 0xF) + (value & 0xF) > 0xF;
    }

    CCF() {
        this.flags.subtract = false;
        this.flags.half_carry = false;
        this.flags.carry = !this.flags.carry;
    }

    SCF() {
        this.flags.subtract = false;
        this.flags.half_carry = false;
        this.flags.carry = true;
    }

    // Rotate A right through carry
    RRA() {
        let carryMask = (this.flags.numerical & 0b00010000) << 3;
        let values = CPU.o8b((this.registers.a >> 1) | carryMask);

        let newValue = values[0];
        let didOverflow = values[1];

        this.flags.carry = (this.registers.a & 0b00000001) == 0b1;

        this.registers.a = newValue;

        this.flags.zero = false;
        this.flags.subtract = false;
        this.flags.half_carry = false;

    }

    // Rotate A left through carry
    RLA() {
        let carryMask = (this.flags.numerical & 0b00010000) >> 4;
        let values = CPU.o8b((this.registers.a << 1) | carryMask);

        let newValue = values[0];
        let didOverflow = values[1];

        this.flags.carry = (this.registers.a & 0b10000000) >> 7 == 0b1;

        this.registers.a = newValue;

        this.flags.zero = false;
        this.flags.subtract = false;
        this.flags.half_carry = false;
    }

    // Rotate register A right
    RRCA() {
        let rightmostBit = (this.registers.a & 0b00000001) << 7;

        let values = CPU.o8b((this.registers.a >> 1) | rightmostBit);
        let newValue = values[0];
        let didOverflow = values[1];

        this.registers.a = newValue;

        this.flags.zero = false;
        this.flags.subtract = false;
        this.flags.half_carry = false;
        this.flags.carry = didOverflow;
    }

    // Rotate register A left
    RRLA() {
        let leftmostBit = (this.registers.a & 0b10000000) >> 7;

        let values = CPU.o8b((this.registers.a << 1) | leftmostBit);
        let newValue = values[0];
        let didOverflow = values[1];

        this.registers.a = newValue;

        this.flags.zero = false;
        this.flags.subtract = false;
        this.flags.half_carry = false;
        this.flags.carry = didOverflow;
    }

    CPL() {
        this.registers.a = this.registers.a ^ 0b11111111;
    }

    BIT(t: T, selectedBit) {
        let value = this.getTarget(t);
        let mask = 0b1 << selectedBit;

        this.flags.zero = (value & mask) == 0;
        this.flags.subtract = false;
        this.flags.half_carry = true;
    }

    BIT_HL(t: T, selectedBit) {
        let value = this.readMem8(this.registers.hl);

        let mask = 0b1 << selectedBit;

        this.flags.zero = (value & mask) == 0;
        this.flags.subtract = false;
        this.flags.half_carry = true;
    }

    RES(t: T, selectedBit) {
        let value = this.getTarget(t);
        let mask = 0b1 << selectedBit;

        let final = value & ~(mask);

        this.setTarget(t, final);
    }

    SET(t: T, selectedBit) {
        let value = this.getTarget(t);
        let mask = 0b1 << selectedBit;

        let final = value | ~(mask);

        this.setTarget(t, final);
    }

    SRL(t: T) {
        let value = this.getTarget(t);
        this.setTarget(t, value >> 1);
    }

    // Rotate TARGET right through carry
    RR(t: T) {
        let carryMask = (this.flags.numerical & 0b00010000) << 3;
        let values = CPU.o8b((this.getTarget(t) >> 1) | carryMask);

        let newValue = values[0];
        let didOverflow = values[1];

        this.setTarget(t, newValue);

        this.flags.zero = newValue == 0;
        this.flags.subtract = false;
        this.flags.half_carry = false;
        this.flags.carry = didOverflow;
    }

    // Rotate TARGET left through carry
    RL(t: T) {
        let carryMask = (this.flags.numerical & 0b00010000) >> 4;
        let values = CPU.o8b((this.getTarget(t) << 1) | carryMask);

        let newValue = values[0];
        let didOverflow = values[1];

        this.setTarget(t, newValue);

        this.flags.zero = newValue == 0;
        this.flags.subtract = false;
        this.flags.half_carry = false;
        this.flags.carry = didOverflow;
    }

    // Rotate TARGET right
    RRC(t: T) {
        let rightmostBit = (this.registers.a & 0b00000001) << 7;

        let values = CPU.o8b((this.registers.a >> 1) | rightmostBit);

        let newValue = values[0];
        let didOverflow = values[1];

        this.setTarget(t, newValue);

        this.flags.zero = newValue == 0;
        this.flags.subtract = false;
        this.flags.half_carry = false;
        this.flags.carry = didOverflow;
    }

    // Rotate TARGET left
    RLC(t: T) {
        let leftmostBit = (this.registers.a & 0b10000000) >> 7;

        let values = CPU.o8b((this.registers.a << 1) | leftmostBit);

        let newValue = values[0];
        let didOverflow = values[1];

        this.setTarget(t, newValue);

        this.flags.zero = newValue == 0;
        this.flags.subtract = false;
        this.flags.half_carry = false;
        this.flags.carry = didOverflow;
    }

    // Shift TARGET right
    SRA(t: T) {
        let values = CPU.o8b(this.getTarget(t) >> 1);

        let newValue = values[0];
        let didOverflow = values[1];

        this.setTarget(t, newValue);

        this.flags.zero = newValue == 0;
        this.flags.subtract = false;
        this.flags.half_carry = false;
        this.flags.carry = didOverflow;
    }

    // Shift TARGET left 
    SLA(t: T) {
        let values = CPU.o8b(this.getTarget(t) << 1);

        let newValue = values[0];
        let didOverflow = values[1];

        this.setTarget(t, newValue);

        this.flags.zero = newValue == 0;
        this.flags.subtract = false;
        this.flags.half_carry = false;
        this.flags.carry = didOverflow;
    }

}

let cpu = new CPU();

function test() {
    cpu.flags.zero = true;
    console.log(cpu.flags.numerical);
    cpu.flags.numerical = cpu.flags.numerical;
    console.log(cpu.flags.numerical);
    console.log("Expect both answers 128.");

    cpu.registers.a = 100;
    cpu.registers.b = 100;
    cpu.ADD_A(T.B);
    console.log(cpu.registers.a);
    console.log("Expect 200.");

    cpu = new CPU();

    cpu.registers.a = 200;
    cpu.registers.b = 200;
    cpu.ADD_A(T.B);
    console.log(cpu.registers.a);
    console.log(cpu.flags.carry);
    console.log("Expect 144 and carry bit.");

    cpu = new CPU();

    cpu.registers.c = 200;
    cpu.registers.hl = 256;
    cpu.ADDHL(T.C);
    console.log(cpu.registers.hl);
    console.log(cpu.flags.carry);
    console.log("ADDHL: Expect 456 and no carry bit.");

    cpu = new CPU();

    cpu.registers.hl = 42069;
    console.log(cpu.registers.hl);
    console.log("setting HL: Expect 42069.");

    cpu.registers.a = 20;
    cpu.registers.b = 16;
    cpu.SUB(T.B);
    console.log(cpu.registers.a);
    console.log("SUB 20 - 16: Expect 4.");

    cpu.registers.a = 20;
    cpu.registers.b = 160;
    cpu.SUB(T.B);
    console.log(cpu.registers.a);
    console.log("SUB 20 - 160: Expect 116.");

    cpu.registers.a = 12;
    cpu.registers.b = 25;
    cpu.AND(T.B);
    console.log(cpu.registers.a);
    console.log("(DEC) 12 & 25: Expect (DEC) 8.");

    cpu.registers.a = 12;
    cpu.registers.b = 25;
    cpu.OR(T.B);
    console.log(cpu.registers.a);
    console.log("(DEC) 12 | 25: Expect (DEC) 29.");

    cpu.registers.a = 12;
    cpu.registers.b = 25;
    cpu.XOR_A(T.B);
    console.log(cpu.registers.a);
    console.log("(DEC) 12 ^ 25: Expect (DEC) 21.");

    cpu.registers.a = 12;
    cpu.INC(T.A);
    console.log(cpu.registers.a);
    console.log("INC A: Expect 13.");

    cpu.registers.a = 12;
    cpu.DEC(T.A);
    console.log(cpu.registers.a);
    console.log("DEC A: Expect 11.");

    cpu.registers.a = 0b00001111;
    cpu.registers.b = 0b00000001;
    cpu.ADD_A(T.B);
    console.log(cpu.registers.a);
    console.log("Expect half carry.");

    cpu.registers.h = 0b00010000;
    cpu.BIT(5, T.H);
    console.log("Expect zero.");

    cpu = new CPU();
}

test();

interface Window {
    cpu: CPU;
}

setInterval(() => {
    window.cpu = cpu;
    let debugP = document.getElementById('debug');
    debugP.innerText = `
    Total Instructions Executed: ${cpu.totalI}
    
    PC: 0x${cpu.pc.toString(16)}

    CARRY: ${cpu.flags.carry}
    HALF_CARRY: ${cpu.flags.half_carry}
    SUBTRACT: ${cpu.flags.subtract}
    ZERO: ${cpu.flags.zero}

    SP: 0x${cpu.registers.sp.toString(16)} ${cpu.registers.sp} ${cpu.registers.sp.toString(2)}

    A: 0x${cpu.registers.a.toString(16)} ${cpu.registers.a} ${cpu.registers.a.toString(2)}
    B: 0x${cpu.registers.b.toString(16)} ${cpu.registers.b} ${cpu.registers.b.toString(2)}
    C: 0x${cpu.registers.c.toString(16)} ${cpu.registers.c} ${cpu.registers.c.toString(2)}
    D: 0x${cpu.registers.d.toString(16)} ${cpu.registers.d} ${cpu.registers.d.toString(2)}
    E: 0x${cpu.registers.e.toString(16)} ${cpu.registers.e} ${cpu.registers.e.toString(2)}
    F: 0x${cpu.registers.f.toString(16)} ${cpu.registers.f} ${cpu.registers.f.toString(2)}
    H: 0x${cpu.registers.h.toString(16)} ${cpu.registers.h} ${cpu.registers.h.toString(2)}
    L: 0x${cpu.registers.l.toString(16)} ${cpu.registers.l} ${cpu.registers.l.toString(2)}

    AF: 0x${cpu.registers.af.toString(16)} ${cpu.registers.af} ${cpu.registers.af.toString(2)}
    BC: 0x${cpu.registers.bc.toString(16)} ${cpu.registers.bc} ${cpu.registers.bc.toString(2)}
    DE: 0x${cpu.registers.de.toString(16)} ${cpu.registers.de} ${cpu.registers.de.toString(2)}
    HL: 0x${cpu.registers.hl.toString(16)} ${cpu.registers.hl} ${cpu.registers.hl.toString(2)}
    `;
}, 10);