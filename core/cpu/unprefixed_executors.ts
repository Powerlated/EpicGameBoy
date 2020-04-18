import CPU, { R16, R8, CC } from "./cpu";
import { unTwo8b } from "../../src/gameboy/tools/util";

export type Executor = (cpu: CPU, b0: number) => void;

const UNPREFIXED_EXECUTORS: Executor[] = new Array(256);
export default UNPREFIXED_EXECUTORS;

/** LD R16, N16 */
export function LD_R16_N16(cpu: CPU, b0: number): void {
    const n16 = cpu.fetchMem16(cpu.pc + 1);

    const target = [R16.BC, R16.DE, R16.HL, R16.SP][(b0 & 0b110000) >> 4];
    cpu.reg[target] = n16;
    cpu.pc += 3;
};
UNPREFIXED_EXECUTORS[0x01] = LD_R16_N16; // LD BC, N16
UNPREFIXED_EXECUTORS[0x11] = LD_R16_N16; // LD DE, N16
UNPREFIXED_EXECUTORS[0x21] = LD_R16_N16; // LD HL, N16
UNPREFIXED_EXECUTORS[0x31] = LD_R16_N16; // LD SP, N16


// LD A, [N16]
export function LD_A_iN16(cpu: CPU, b0: number): void {
    const n16 = cpu.fetchMem16(cpu.pc + 1);

    cpu.reg[R8.A] = cpu.fetchMem8(n16);
    cpu.pc += 3;
};
UNPREFIXED_EXECUTORS[0xFA] = LD_A_iN16;

// LD [N16], A
export function LD_iN16_A(cpu: CPU, b0: number): void {
    const n16 = cpu.fetchMem16(cpu.pc + 1);

    cpu.writeMem8(n16, cpu.reg[R8.A]);
    cpu.pc += 3;
};
UNPREFIXED_EXECUTORS[0xEA] = LD_iN16_A;

export function LD_iN16_SP(cpu: CPU, b0: number): void {
    const n16 = cpu.fetchMem16(cpu.pc + 1);

    const spUpperByte = cpu.reg.sp >> 8;
    const spLowerByte = cpu.reg.sp & 0b11111111;

    cpu.writeMem8(n16 + 0, spLowerByte);
    cpu.writeMem8(n16 + 1, (spUpperByte) & 0xFFFF);

    cpu.pc += 3;
};
UNPREFIXED_EXECUTORS[0x08] = LD_iN16_SP;

export function JP(cpu: CPU, b0: number): void {
    // If unconditional, don't check
    if (b0 !== 0xC3) {
        const cc: CC = (b0 & 0b11000) >> 3;
        if (cc === CC.NZ && cpu.reg._f.zero) { cpu.pc += 3; cpu.tick(8); return; }
        else if (cc === CC.Z && !cpu.reg._f.zero) { cpu.pc += 3; cpu.tick(8); return; }
        else if (cc === CC.NC && cpu.reg._f.carry) { cpu.pc += 3; cpu.tick(8); return; }
        else if (cc === CC.C && !cpu.reg._f.carry) { cpu.pc += 3; cpu.tick(8); return; }
    }

    const n16 = cpu.fetchMem16(cpu.pc + 1);
    cpu.pc = n16 - 3;

    cpu.tick(4); // Branching takes 4 cycles
    cpu.pc += 3;
};
UNPREFIXED_EXECUTORS[0xC3] = JP; // JP N16
UNPREFIXED_EXECUTORS[0xC2] = JP; // JP NZ, N16
UNPREFIXED_EXECUTORS[0xCA] = JP; // JP Z, N16
UNPREFIXED_EXECUTORS[0xD2] = JP; // JP NC, N16
UNPREFIXED_EXECUTORS[0xDA] = JP; // JP C, N16

/** CALL */
export function CALL(cpu: CPU, b0: number): void {
    if (b0 !== 0xCD) {
        const cc: CC = (b0 & 0b11000) >> 3;
        if (cc === CC.NZ && cpu.reg._f.zero) { cpu.pc += 3; cpu.tick(8); return; }
        else if (cc === CC.Z && !cpu.reg._f.zero) { cpu.pc += 3; cpu.tick(8); return; }
        else if (cc === CC.NC && cpu.reg._f.carry) { cpu.pc += 3; cpu.tick(8); return; }
        else if (cc === CC.C && !cpu.reg._f.carry) { cpu.pc += 3; cpu.tick(8); return; }
    }

    const pcUpperByte = ((cpu.pc + 3) & 0xFFFF) >> 8;
    const pcLowerByte = ((cpu.pc + 3) & 0xFFFF) & 0xFF;

    // console.info(`Calling 0x${u16.toString(16)} from 0x${cpu.pc.toString(16)}`);

    cpu.reg.sp = (cpu.reg.sp - 1) & 0xFFFF;
    cpu.writeMem8(cpu.reg.sp, pcUpperByte);
    cpu.reg.sp = (cpu.reg.sp - 1) & 0xFFFF;
    cpu.writeMem8(cpu.reg.sp, pcLowerByte);

    const n16 = cpu.fetchMem16(cpu.pc + 1);
    cpu.pc = n16 - 3;

    cpu.tick(4); // Branching takes 4 cycles

    cpu.pc += 3;
};
UNPREFIXED_EXECUTORS[0xCD] = CALL; // CALL N16
UNPREFIXED_EXECUTORS[0xDC] = CALL; // CALL C, N16
UNPREFIXED_EXECUTORS[0xD4] = CALL; // CALL NC, N16
UNPREFIXED_EXECUTORS[0xCC] = CALL; // CALL Z, N16
UNPREFIXED_EXECUTORS[0xC4] = CALL; // CALL NZ, N16

/** Interrupts */
export function STOP(cpu: CPU, b0: number): void {
    if (cpu.gb.prepareSpeedSwitch) {
        cpu.gb.doubleSpeed = !cpu.gb.doubleSpeed;
    }
    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0x10] = STOP; // STOP

/** LD between A and High RAM */
export function LD_A_iFF00plusN8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    cpu.reg[R8.A] = cpu.fetchMem8((0xFF00 | b1) & 0xFFFF);

    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0xF0] = LD_A_iFF00plusN8;

export function LD_iFF00plusN8_A(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    cpu.writeMem8((0xFF00 | b1) & 0xFFFF, cpu.reg[R8.A]);

    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0xE0] = LD_iFF00plusN8_A;

export function LD_iHL_N8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    cpu.writeMem8(cpu.reg[R16.HL], b1);
    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0x36] = LD_iHL_N8;

export function LD_HL_SPplusE8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    const signedVal = unTwo8b(b1);

    cpu.reg._f.zero = false; 
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = (signedVal & 0xF) + (cpu.reg.sp & 0xF) > 0xF;
    cpu.reg._f.carry = (signedVal & 0xFF) + (cpu.reg.sp & 0xFF) > 0xFF;

    cpu.reg[R16.HL] = (unTwo8b(b1) + cpu.reg.sp) & 0xFFFF;

    // Register read timing
    cpu.tick(4);

    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0xF8] = LD_HL_SPplusE8;

export function ADD_SP_E8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    const value = unTwo8b(b1);

    cpu.reg._f.zero = false;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = ((value & 0xF) + (cpu.reg.sp & 0xF)) > 0xF;
    cpu.reg._f.carry = ((value & 0xFF) + (cpu.reg.sp & 0xFF)) > 0xFF;

    cpu.reg.sp = (cpu.reg.sp + value) & 0xFFFF;

    // Extra time
    cpu.tick(8);

    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0xE8] = ADD_SP_E8;

export function AND_A_N8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    const value = b1;

    const final = value & cpu.reg[R8.A];
    cpu.reg[R8.A] = final;

    cpu.reg._f.zero = cpu.reg[R8.A] === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = true;
    cpu.reg._f.carry = false;

    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0xE6] = AND_A_N8;

export function OR_A_N8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    const value = b1;

    const final = value | cpu.reg[R8.A];
    cpu.reg[R8.A] = final;

    cpu.reg._f.zero = final === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = false;
    cpu.pc += 2;
    return;
};

UNPREFIXED_EXECUTORS[0xF6] = OR_A_N8;  // OR A, N8

export function XOR_A_N8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    const value = b1;

    const final = value ^ cpu.reg[R8.A];
    cpu.reg[R8.A] = final;

    cpu.reg._f.zero = final === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = false;

    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0xEE] = XOR_A_N8;  // XOR A, N8

export function CP_A_N8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    const value = b1;

    const newValue = (cpu.reg[R8.A] - value) & 0xFF;

    // Set flags
    cpu.reg._f.carry = value > cpu.reg[R8.A];
    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = true;
    cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) - (b1 & 0xF) < 0;

    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0xFE] = CP_A_N8;  // CP A, N8


export function JR(cpu: CPU, b0: number): void {
    if (b0 !== 0x18) {
        const cc: CC = (b0 & 0b11000) >> 3;
        if (cc === CC.NZ && cpu.reg._f.zero) { cpu.pc += 2; cpu.tick(4); return; }
        else if (cc === CC.Z && !cpu.reg._f.zero) { cpu.pc += 2; cpu.tick(4); return; }
        else if (cc === CC.NC && cpu.reg._f.carry) { cpu.pc += 2; cpu.tick(4); return; }
        else if (cc === CC.C && !cpu.reg._f.carry) { cpu.pc += 2; cpu.tick(4); return; }
    }

    const b1 = cpu.fetchMem8(cpu.pc + 1);
    cpu.pc += unTwo8b(b1);

    cpu.tick(4); // Branching takes 4 cycles

    cpu.pc += 2;
};

/** JR */
UNPREFIXED_EXECUTORS[0x18] = JR;  // JR E8
UNPREFIXED_EXECUTORS[0x20] = JR;  // JR NZ, E8
UNPREFIXED_EXECUTORS[0x28] = JR;  // JR Z, E8
UNPREFIXED_EXECUTORS[0x30] = JR;  // JR NC, E8
UNPREFIXED_EXECUTORS[0x38] = JR;  // JR C, E8


/** Arithmetic */
export function ADD_A_N8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    const value = b1;

    const newValue = (value + cpu.reg[R8.A]) & 0xFF;
    const didOverflow = ((value + cpu.reg[R8.A]) >> 8) !== 0;

    // Set flags
    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) + (value & 0xF) > 0xF;
    cpu.reg._f.carry = didOverflow;

    // Set register values
    cpu.reg[R8.A] = newValue;

    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0xC6] = ADD_A_N8;  // ADD A, N8

export function ADC_A_N8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    const value = b1;

    const newValue = (value + cpu.reg[R8.A] + (cpu.reg._f.carry ? 1 : 0)) & 0xFF;
    const didOverflow = ((value + cpu.reg[R8.A] + (cpu.reg._f.carry ? 1 : 0)) >> 8) !== 0;

    // Set flags
    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) + (value & 0xF) + (cpu.reg._f.carry ? 1 : 0) > 0xF;
    cpu.reg._f.carry = didOverflow;

    // Set register values
    cpu.reg[R8.A] = newValue;

    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0xCE] = ADC_A_N8;  // ADC A, N8

export function SUB_A_N8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    const value = b1;

    const newValue = (cpu.reg[R8.A] - value) & 0xFF;

    // Set flags
    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = true;
    cpu.reg._f.half_carry = (value & 0xF) > (cpu.reg[R8.A] & 0xF);
    cpu.reg._f.carry = value > cpu.reg[R8.A];

    // Set register values
    cpu.reg[R8.A] = newValue;

    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0xD6] = SUB_A_N8;  // SUB A, N8

export function SBC_A_N8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    const value = b1;

    const newValue = (cpu.reg[R8.A] - value - (cpu.reg._f.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = true;
    cpu.reg._f.half_carry = (value & 0xF) > (cpu.reg[R8.A] & 0xF) - (cpu.reg._f.carry ? 1 : 0);
    cpu.reg._f.carry = value > cpu.reg[R8.A] - (cpu.reg._f.carry ? 1 : 0);

    // Set register values
    cpu.reg[R8.A] = newValue;

    cpu.pc += 2;
};
UNPREFIXED_EXECUTORS[0xDE] = SBC_A_N8;  // SBC A, N8

/** LD R8, N8 */
export function LD_R8_N8(cpu: CPU, b0: number): void {
    const b1 = cpu.fetchMem8(cpu.pc + 1);

    const target: R8 = (b0 & 0b111000) >> 3;
    cpu.reg[target] = b1;

    cpu.pc += 2;

};
UNPREFIXED_EXECUTORS[0x06] = LD_R8_N8; // LD B, N8
UNPREFIXED_EXECUTORS[0x0E] = LD_R8_N8; // LD C, N8
UNPREFIXED_EXECUTORS[0x16] = LD_R8_N8; // LD D, N8
UNPREFIXED_EXECUTORS[0x1E] = LD_R8_N8; // LD E, N8
UNPREFIXED_EXECUTORS[0x26] = LD_R8_N8; // LD H, N8
UNPREFIXED_EXECUTORS[0x2E] = LD_R8_N8; // LD L, N8
UNPREFIXED_EXECUTORS[0x36] = LD_R8_N8; // LD (HL), N8
UNPREFIXED_EXECUTORS[0x3E] = LD_R8_N8; // LD A, N8

export function LD_SP_HL(cpu: CPU, b0: number): void {
    cpu.reg.sp = cpu.reg[R16.HL];
    // Register read timing
    cpu.tick(4);

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0xF9] = LD_SP_HL;  // LD SP, HL


export function LD_R8_R8(cpu: CPU, b0: number): void {
    const source: R8 = b0 & 0b111;
    const dest: R8 = (b0 & 0b111000) >> 3;
    cpu.reg[dest] = cpu.reg[source];

    cpu.pc += 1;
};
// LD R8, R8
UNPREFIXED_EXECUTORS[0x40] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x41] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x42] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x43] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x44] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x45] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x46] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x47] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x48] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x49] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x4A] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x4B] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x4C] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x4D] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x4E] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x4F] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x50] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x51] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x52] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x53] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x54] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x55] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x56] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x57] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x58] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x59] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x5A] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x5B] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x5C] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x5D] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x5E] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x5F] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x60] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x61] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x62] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x63] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x64] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x65] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x66] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x67] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x68] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x69] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x6A] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x6B] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x6C] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x6D] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x6E] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x6F] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x70] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x71] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x72] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x73] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x74] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x75] = LD_R8_R8;
/* HALT */
UNPREFIXED_EXECUTORS[0x77] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x78] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x79] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x7A] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x7B] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x7C] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x7D] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x7E] = LD_R8_R8;
UNPREFIXED_EXECUTORS[0x7F] = LD_R8_R8;

/** PUSH R16 */
export function PUSH_R16(cpu: CPU, b0: number): void {
    const target = [R16.BC, R16.DE, R16.HL, R16.AF][(b0 & 0b110000) >> 4];

    const value = cpu.reg[target];
    const upperByte = value >> 8;
    const lowerByte = value & 0b11111111;

    cpu.reg.sp = (cpu.reg.sp - 1) & 0xFFFF;
    cpu.writeMem8(cpu.reg.sp, upperByte);
    cpu.reg.sp = (cpu.reg.sp - 1) & 0xFFFF;
    cpu.writeMem8(cpu.reg.sp, lowerByte);

    // 4 cycle penalty
    cpu.tick(4);

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0xF5] = PUSH_R16;  // PUSH AF 
UNPREFIXED_EXECUTORS[0xC5] = PUSH_R16;  // PUSH BC
UNPREFIXED_EXECUTORS[0xD5] = PUSH_R16;  // PUSH DE
UNPREFIXED_EXECUTORS[0xE5] = PUSH_R16;  // PUSH HL

/** POP R16 */
export function POP_R16(cpu: CPU, b0: number): void {
    const target = [R16.BC, R16.DE, R16.HL, R16.AF][(b0 & 0b110000) >> 4];

    const lowerByte = cpu.fetchMem8(cpu.reg.sp);
    cpu.reg.sp = (cpu.reg.sp + 1) & 0xFFFF;
    const upperByte = cpu.fetchMem8(cpu.reg.sp);
    cpu.reg.sp = (cpu.reg.sp + 1) & 0xFFFF;

    cpu.reg[target] = (upperByte << 8) | lowerByte;

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0xC1] = POP_R16;  // POP BC
UNPREFIXED_EXECUTORS[0xD1] = POP_R16;  // POP DE
UNPREFIXED_EXECUTORS[0xE1] = POP_R16;  // POP HL
UNPREFIXED_EXECUTORS[0xF1] = POP_R16;  // POP AF 

/** INC R8 */
export function INC_R8(cpu: CPU, b0: number): void {
    const dest: R8 = (b0 & 0b111000) >> 3;

    const oldValue = cpu.reg[dest];
    const newValue = (oldValue + 1) & 0xFF;
    cpu.reg[dest] = newValue;
    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = (oldValue & 0xF) + (1 & 0xF) > 0xF;

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x04] = INC_R8;  // INC B
UNPREFIXED_EXECUTORS[0x0C] = INC_R8;  // INC C
UNPREFIXED_EXECUTORS[0x14] = INC_R8;  // INC D
UNPREFIXED_EXECUTORS[0x1C] = INC_R8;  // INC E
UNPREFIXED_EXECUTORS[0x24] = INC_R8;  // INC H
UNPREFIXED_EXECUTORS[0x2C] = INC_R8;  // INC L
UNPREFIXED_EXECUTORS[0x34] = INC_R8;  // INC [HL]
UNPREFIXED_EXECUTORS[0x3C] = INC_R8;  // INC A

/** DEC R8 */
export function DEC_R8(cpu: CPU, b0: number): void {
    const dest: R8 = (b0 & 0b111000) >> 3;

    const oldValue = cpu.reg[dest];
    const newValue = (oldValue - 1) & 0xFF;
    cpu.reg[dest] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = true;
    cpu.reg._f.half_carry = (1 & 0xF) > (oldValue & 0xF);

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x05] = DEC_R8;  // DEC B
UNPREFIXED_EXECUTORS[0x0D] = DEC_R8;  // DEC C
UNPREFIXED_EXECUTORS[0x15] = DEC_R8;  // DEC D
UNPREFIXED_EXECUTORS[0x1D] = DEC_R8;  // DEC E
UNPREFIXED_EXECUTORS[0x25] = DEC_R8;  // DEC H
UNPREFIXED_EXECUTORS[0x2D] = DEC_R8;  // DEC L
UNPREFIXED_EXECUTORS[0x35] = DEC_R8;  // DEC [HL]
UNPREFIXED_EXECUTORS[0x3D] = DEC_R8;  // DEC A

/** INC R16 */
export function INC_R16(cpu: CPU, b0: number): void {
    const target = [R16.BC, R16.DE, R16.HL, R16.SP][(b0 & 0b110000) >> 4];
    cpu.reg[target] = (cpu.reg[target] + 1) & 0xFFFF;
    cpu.tick(4);

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x03] = INC_R16; // INC BC
UNPREFIXED_EXECUTORS[0x13] = INC_R16;  // INC DE 
UNPREFIXED_EXECUTORS[0x23] = INC_R16;  // INC HL
UNPREFIXED_EXECUTORS[0x33] = INC_R16;  // INC SP


export function DEC_R16(cpu: CPU, b0: number): void {
    const target = [R16.BC, R16.DE, R16.HL, R16.SP][(b0 & 0b110000) >> 4];
    cpu.reg[target] = (cpu.reg[target] - 1) & 0xFFFF;
    cpu.tick(4);

    cpu.pc += 1;
};
/** DEC R16 */
UNPREFIXED_EXECUTORS[0x0B] = DEC_R16;  // DEC BC
UNPREFIXED_EXECUTORS[0x1B] = DEC_R16;  // DEC DE 
UNPREFIXED_EXECUTORS[0x2B] = DEC_R16;  // DEC HL
UNPREFIXED_EXECUTORS[0x3B] = DEC_R16;  // DEC SP

export function ADD_A_R8(cpu: CPU, b0: number): void {
    const source: R8 = b0 & 0b111;

    let value = cpu.reg[source];
    cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) + (value & 0xF) > 0xF;

    let newValue = (value + cpu.reg[R8.A]) & 0xFF;
    let didOverflow = ((value + cpu.reg[R8.A]) >> 8) !== 0;

    // Set register values
    cpu.reg[R8.A] = newValue;

    // Set flags
    cpu.reg._f.carry = didOverflow;
    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;

    cpu.pc += 1;
};
// #region Accumulator Arithmetic
UNPREFIXED_EXECUTORS[0x80] = ADD_A_R8; // ADD A, B
UNPREFIXED_EXECUTORS[0x81] = ADD_A_R8; // ADD A, C
UNPREFIXED_EXECUTORS[0x82] = ADD_A_R8; // ADD A, D
UNPREFIXED_EXECUTORS[0x83] = ADD_A_R8; // ADD A, E
UNPREFIXED_EXECUTORS[0x84] = ADD_A_R8; // ADD A, H
UNPREFIXED_EXECUTORS[0x85] = ADD_A_R8; // ADD A, L
UNPREFIXED_EXECUTORS[0x86] = ADD_A_R8; // ADD A, (HL)
UNPREFIXED_EXECUTORS[0x87] = ADD_A_R8;  // ADD A, A

export function ADC_A_R8(cpu: CPU, b0: number): void {
    const source: R8 = b0 & 0b111;

    let value = cpu.reg[source];

    let newValue = (value + cpu.reg[R8.A] + (cpu.reg._f.carry ? 1 : 0)) & 0xFF;
    let didOverflow = ((value + cpu.reg[R8.A] + (cpu.reg._f.carry ? 1 : 0)) >> 8) !== 0;

    // Set flags
    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) + (value & 0xF) + (cpu.reg._f.carry ? 1 : 0) > 0xF;
    cpu.reg._f.carry = didOverflow;

    // Set register values
    cpu.reg[R8.A] = newValue;

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x88] = ADC_A_R8;  // ADC A, B
UNPREFIXED_EXECUTORS[0x89] = ADC_A_R8;  // ADC A, C
UNPREFIXED_EXECUTORS[0x8A] = ADC_A_R8;  // ADC A, D
UNPREFIXED_EXECUTORS[0x8B] = ADC_A_R8;  // ADC A, E
UNPREFIXED_EXECUTORS[0x8C] = ADC_A_R8;  // ADC A, H
UNPREFIXED_EXECUTORS[0x8D] = ADC_A_R8;  // ADC A, L
UNPREFIXED_EXECUTORS[0x8E] = ADC_A_R8;  // ADC A, (HL)
UNPREFIXED_EXECUTORS[0x8F] = ADC_A_R8;  // ADC A, A

export function SUB_A_R8(cpu: CPU, b0: number): void {
    const source: R8 = b0 & 0b111;

    const value = cpu.reg[source];

    const newValue = (cpu.reg[R8.A] - value) & 0xFF;

    // Set flags
    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = true;
    cpu.reg._f.half_carry = (value & 0xF) > (cpu.reg[R8.A] & 0xF);
    cpu.reg._f.carry = value > cpu.reg[R8.A];

    // Set register values
    cpu.reg[R8.A] = newValue;

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x90] = SUB_A_R8; // SUB A, B
UNPREFIXED_EXECUTORS[0x91] = SUB_A_R8;  // SUB A, C
UNPREFIXED_EXECUTORS[0x92] = SUB_A_R8;  // SUB A, D
UNPREFIXED_EXECUTORS[0x93] = SUB_A_R8;  // SUB A, E
UNPREFIXED_EXECUTORS[0x94] = SUB_A_R8;  // SUB A, H
UNPREFIXED_EXECUTORS[0x95] = SUB_A_R8;  // SUB A, L
UNPREFIXED_EXECUTORS[0x96] = SUB_A_R8;  // SUB A, (HL)
UNPREFIXED_EXECUTORS[0x97] = SUB_A_R8;  // SUB A, A

export function SBC_A_R8(cpu: CPU, b0: number): void {
    const source: R8 = b0 & 0b111;

    const value = cpu.reg[source];

    const newValue = (cpu.reg[R8.A] - value - (cpu.reg._f.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = true;
    cpu.reg._f.half_carry = (value & 0xF) > (cpu.reg[R8.A] & 0xF) - (cpu.reg._f.carry ? 1 : 0);
    cpu.reg._f.carry = value > cpu.reg[R8.A] - (cpu.reg._f.carry ? 1 : 0);

    // Set register values
    cpu.reg[R8.A] = newValue;

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x98] = SBC_A_R8;  // SBC A, B
UNPREFIXED_EXECUTORS[0x99] = SBC_A_R8;  // SBC A, C
UNPREFIXED_EXECUTORS[0x9A] = SBC_A_R8;  // SBC A, D
UNPREFIXED_EXECUTORS[0x9B] = SBC_A_R8;  // SBC A, E
UNPREFIXED_EXECUTORS[0x9C] = SBC_A_R8;  // SBC A, H
UNPREFIXED_EXECUTORS[0x9D] = SBC_A_R8;  // SBC A, L
UNPREFIXED_EXECUTORS[0x9E] = SBC_A_R8;  // SBC A, (HL)
UNPREFIXED_EXECUTORS[0x9F] = SBC_A_R8;  // SBC A, A

export function AND_A_R8(cpu: CPU, b0: number): void {
    const source: R8 = b0 & 0b111;

    const value = cpu.reg[source];

    const final = value & cpu.reg[R8.A];
    cpu.reg[R8.A] = final;

    // Set flags
    cpu.reg._f.zero = cpu.reg[R8.A] === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = true;
    cpu.reg._f.carry = false;

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0xA0] = AND_A_R8;  // AND A, B
UNPREFIXED_EXECUTORS[0xA1] = AND_A_R8;  // AND A, C
UNPREFIXED_EXECUTORS[0xA2] = AND_A_R8;  // AND A, D
UNPREFIXED_EXECUTORS[0xA3] = AND_A_R8;  // AND A, E
UNPREFIXED_EXECUTORS[0xA4] = AND_A_R8;  // AND A, H
UNPREFIXED_EXECUTORS[0xA5] = AND_A_R8;  // AND A, L
UNPREFIXED_EXECUTORS[0xA6] = AND_A_R8;  // AND A, (HL)
UNPREFIXED_EXECUTORS[0xA7] = AND_A_R8;  // AND A, A

export function XOR_A_R8(cpu: CPU, b0: number): void {
    const source: R8 = b0 & 0b111;

    const value = cpu.reg[source];

    const final = value ^ cpu.reg[R8.A];
    cpu.reg[R8.A] = final;

    cpu.reg._f.zero = final === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = false;

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0xA8] = XOR_A_R8; // XOR A, B
UNPREFIXED_EXECUTORS[0xA9] = XOR_A_R8; // XOR A, C
UNPREFIXED_EXECUTORS[0xAA] = XOR_A_R8; // XOR A, D
UNPREFIXED_EXECUTORS[0xAB] = XOR_A_R8; // XOR A, E
UNPREFIXED_EXECUTORS[0xAC] = XOR_A_R8; // XOR A, H
UNPREFIXED_EXECUTORS[0xAD] = XOR_A_R8; // XOR A, L
UNPREFIXED_EXECUTORS[0xAE] = XOR_A_R8; // XOR A, (HL)
UNPREFIXED_EXECUTORS[0xAF] = XOR_A_R8;  // XOR A, A

export function OR_A_R8(cpu: CPU, b0: number): void {
    const source: R8 = b0 & 0b111;

    const value = cpu.reg[source];

    const final = value | cpu.reg[R8.A];
    cpu.reg[R8.A] = final;

    cpu.reg._f.zero = final === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = false;

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0xB0] = OR_A_R8;  // OR A, B
UNPREFIXED_EXECUTORS[0xB1] = OR_A_R8;  // OR A, C
UNPREFIXED_EXECUTORS[0xB2] = OR_A_R8;  // OR A, D
UNPREFIXED_EXECUTORS[0xB3] = OR_A_R8;  // OR A, E
UNPREFIXED_EXECUTORS[0xB4] = OR_A_R8;  // OR A, H
UNPREFIXED_EXECUTORS[0xB5] = OR_A_R8;  // OR A, L
UNPREFIXED_EXECUTORS[0xB6] = OR_A_R8;  // OR A, (HL)
UNPREFIXED_EXECUTORS[0xB7] = OR_A_R8;  // OR A, A

export function CP_A_R8(cpu: CPU, b0: number): void {
    const source: R8 = b0 & 0b111;

    const r8 = cpu.reg[source];

    const newValue = (cpu.reg[R8.A] - r8) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.reg._f.carry = r8 > cpu.reg[R8.A];
    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = true;
    cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) - (r8 & 0xF) < 0;

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0xB8] = CP_A_R8;  // CP A, B
UNPREFIXED_EXECUTORS[0xB9] = CP_A_R8;  // CP A, C
UNPREFIXED_EXECUTORS[0xBA] = CP_A_R8;  // CP A, D
UNPREFIXED_EXECUTORS[0xBB] = CP_A_R8;  // CP A, E
UNPREFIXED_EXECUTORS[0xBC] = CP_A_R8;  // CP A, H
UNPREFIXED_EXECUTORS[0xBD] = CP_A_R8;  // CP A, L
UNPREFIXED_EXECUTORS[0xBE] = CP_A_R8;  // CP A, (HL)
UNPREFIXED_EXECUTORS[0xBF] = CP_A_R8;  // CP A, A

export function CPL(cpu: CPU, b0: number): void {
    cpu.reg[R8.A] = cpu.reg[R8.A] ^ 0b11111111;

    cpu.reg._f.negative = true;
    cpu.reg._f.half_carry = true;
    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x2F] = CPL;  // CPL


export function RETI(cpu: CPU, b0: number): void {
    const stackLowerByte = cpu.fetchMem8((cpu.reg.sp++) & 0xFFFF);
    const stackUpperByte = cpu.fetchMem8((cpu.reg.sp++) & 0xFFFF);

    const returnAddress = ((stackUpperByte << 8) | stackLowerByte) & 0xFFFF;
    // console.info(`Returning to 0x${returnAddress.toString(16)}`);

    cpu.pc = returnAddress - 1;

    cpu.tick(4); // Branching takes 4 cycles
    cpu.scheduleEnableInterruptsForNextTick = true;
    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0xD9] = RETI;  // RETI

export function DAA(cpu: CPU, b0: number): void {
    if (!cpu.reg._f.negative) {
        if (cpu.reg._f.carry || cpu.reg[R8.A] > 0x99) {
            cpu.reg[R8.A] = (cpu.reg[R8.A] + 0x60) & 0xFF;
            cpu.reg._f.carry = true;
        }
        if (cpu.reg._f.half_carry || (cpu.reg[R8.A] & 0x0f) > 0x09) {
            cpu.reg[R8.A] = (cpu.reg[R8.A] + 0x6) & 0xFF;
        }
    }
    else {
        if (cpu.reg._f.carry) {
            cpu.reg[R8.A] = (cpu.reg[R8.A] - 0x60) & 0xFF;
            cpu.reg._f.carry = true;
        }
        if (cpu.reg._f.half_carry) {
            cpu.reg[R8.A] = (cpu.reg[R8.A] - 0x6) & 0xFF;
        }
    }

    cpu.reg._f.zero = cpu.reg[R8.A] === 0;
    cpu.reg._f.half_carry = false;
    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x27] = DAA;  // DAA

export function NOP(cpu: CPU, b0: number): void {
    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x00] = NOP;  // NOP

/** LD between A and R16 */
UNPREFIXED_EXECUTORS[0x02] = LD_iBC_A;
export function LD_iBC_A(cpu: CPU, b0: number): void { // LD [BC], A
    cpu.writeMem8(cpu.reg[R16.BC], cpu.reg[R8.A]);
    cpu.pc += 1;
};

UNPREFIXED_EXECUTORS[0x12] = LD_iDE_A;
export function LD_iDE_A(cpu: CPU, b0: number): void {// LD [DE], A
    cpu.writeMem8(cpu.reg[R16.DE], cpu.reg[R8.A]);
    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x22] = LD_iHLinc_A;
export function LD_iHLinc_A(cpu: CPU, b0: number): void {// LD [HL+], A
    cpu.writeMem8(cpu.reg[R16.HL], cpu.reg[R8.A]);
    cpu.reg[R16.HL] = (cpu.reg[R16.HL] + 1) & 0xFFFF;
    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x32] = LD_iHLdec_A;
export function LD_iHLdec_A(cpu: CPU, b0: number): void {  // LD [HL-], A
    cpu.writeMem8(cpu.reg[R16.HL], cpu.reg[R8.A]);
    cpu.reg[R16.HL] = (cpu.reg[R16.HL] - 1) & 0xFFFF;
    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x0A] = LD_A_iBC;
export function LD_A_iBC(cpu: CPU, b0: number): void { // LD A, [BC]
    cpu.reg[R8.A] = cpu.fetchMem8(cpu.reg[R16.BC]);
    cpu.pc += 1;
    return;
};
UNPREFIXED_EXECUTORS[0x1A] = LD_A_iDE;
export function LD_A_iDE(cpu: CPU, b0: number): void { // LD A, [DE]
    cpu.reg[R8.A] = cpu.fetchMem8(cpu.reg[R16.DE]);
    cpu.pc += 1;
    return;
};
UNPREFIXED_EXECUTORS[0x2A] = LD_A_iHLinc;
export function LD_A_iHLinc(cpu: CPU, b0: number): void { // LD A, [HL+]
    cpu.reg[R8.A] = cpu.fetchMem8(cpu.reg[R16.HL]);
    cpu.reg[R16.HL] = (cpu.reg[R16.HL] + 1) & 0xFFFF;
    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x3A] = LD_A_iHLdec;
export function LD_A_iHLdec(cpu: CPU, b0: number): void { // LD A, [HL-]
    cpu.reg[R8.A] = cpu.fetchMem8(cpu.reg[R16.HL]);
    cpu.reg[R16.HL] = (cpu.reg[R16.HL] - 1) & 0xFFFF;
    cpu.pc += 1;
};

UNPREFIXED_EXECUTORS[0xF2] = LD_A_iFF00plusC;
export function LD_A_iFF00plusC(cpu: CPU, b0: number): void { // LD A, [$FF00+C]
    cpu.reg[R8.A] = cpu.fetchMem8((0xFF00 | cpu.reg[R8.C]) & 0xFFFF);
    cpu.pc += 1;
    return;
};
UNPREFIXED_EXECUTORS[0xE2] = LD_iFF00plusC_A;
export function LD_iFF00plusC_A(cpu: CPU, b0: number): void {  // LD [$FF00+C], A
    cpu.writeMem8((0xFF00 | cpu.reg[R8.C]) & 0xFFFF, cpu.reg[R8.A]);
    cpu.pc += 1;
    return;
};

UNPREFIXED_EXECUTORS[0xF3] = DI;
export function DI(cpu: CPU, b0: number): void {  // DI - Disable interrupts master flag
    cpu.gb.interrupts.masterEnabled = false;
    cpu.pc += 1;
    return;
};
UNPREFIXED_EXECUTORS[0xFB] = EI;
export function EI(cpu: CPU, b0: number): void {  // EI - Enable interrupts master flag
    cpu.scheduleEnableInterruptsForNextTick = true;
    cpu.pc += 1;
    return;
};

/** JP */
UNPREFIXED_EXECUTORS[0xE9] = JP_HL;
export function JP_HL(cpu: CPU, b0: number): void {  // JP HL
    cpu.pc = cpu.reg[R16.HL] - 1;
    cpu.pc += 1;
    return;
};


/** A rotate */
UNPREFIXED_EXECUTORS[0x07] = RLCA;
export function RLCA(cpu: CPU, b0: number): void {    // RLC A
    const value = cpu.reg[R8.A];

    const leftmostBit = (value & 0b10000000) >> 7;

    const newValue = ((value << 1) | leftmostBit) & 0xFF;

    cpu.reg[R8.A] = newValue;

    cpu.reg._f.zero = false;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = (value >> 7) === 1;

    cpu.pc += 1;
};

UNPREFIXED_EXECUTORS[0x0F] = RRCA;
export function RRCA(cpu: CPU, b0: number): void {  // RRC A

    const value = cpu.reg[R8.A];

    const rightmostBit = (value & 1) << 7;
    const newValue = ((value >> 1) | rightmostBit) & 0xFF;

    cpu.reg[R8.A] = newValue;

    cpu.reg._f.zero = false;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = (value & 1) === 1;

    cpu.pc += 1;
};

UNPREFIXED_EXECUTORS[0x1F] = RRA;
export function RRA(cpu: CPU, b0: number): void {  // RR A

    const value = cpu.reg[R8.A];

    const carryMask = (cpu.reg.f & 0b00010000) << 3;

    const newValue = ((value >> 1) | carryMask) & 0xFF;

    cpu.reg[R8.A] = newValue;

    cpu.reg._f.zero = false;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = !!(value & 1);

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x17] = RLA;
export function RLA(cpu: CPU, b0: number): void {  // RL A

    const value = cpu.reg[R8.A];

    const carryMask = (cpu.reg.f & 0b00010000) >> 4;

    const newValue = ((value << 1) | carryMask) & 0xFF;

    cpu.reg[R8.A] = newValue;

    cpu.reg._f.zero = false;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = (value >> 7) === 1;

    cpu.pc += 1;
};

UNPREFIXED_EXECUTORS[0x76] = HALT;
export function HALT(cpu: CPU, b0: number): void {
    // HALT
    if (
        (
            cpu.gb.interrupts.enabled.numerical &
            cpu.gb.interrupts.requested.numerical &
            0x1F
        ) !== 0
    ) {
        // HALT bug
        cpu.haltBug = true;
        cpu.pc++; cpu.pc &= 0xFFFF;
    } else (
        cpu.gb.interrupts.enabled.numerical &
        cpu.gb.interrupts.requested.numerical &
        0x1F) === 0;
    {
        cpu.halted = true;
    }
    cpu.pc += 1;
};

/** Carry flag */
UNPREFIXED_EXECUTORS[0x37] = SCF;
export function SCF(cpu: CPU, b0: number): void { // SCF
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = true;
    cpu.pc += 1;
};

UNPREFIXED_EXECUTORS[0x3F] = CCF;
export function CCF(cpu: CPU, b0: number): void {  // CCF
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = !cpu.reg._f.carry;
    cpu.pc += 1;
};



/** RET */
export function RET(cpu: CPU, b0: number): void {
    if (b0 !== 0xC9) {
        cpu.tick(4); // Branch decision?

        const cc: CC = (b0 & 0b11000) >> 3;
        if (cc === CC.NZ && cpu.reg._f.zero) { cpu.pc += 1; return; }
        if (cc === CC.Z && !cpu.reg._f.zero) { cpu.pc += 1; return; }
        if (cc === CC.NC && cpu.reg._f.carry) { cpu.pc += 1; return; }
        if (cc === CC.C && !cpu.reg._f.carry) { cpu.pc += 1; return; }
    }


    const stackLowerByte = cpu.fetchMem8((cpu.reg.sp++) & 0xFFFF);
    const stackUpperByte = cpu.fetchMem8((cpu.reg.sp++) & 0xFFFF);

    const returnAddress = (((stackUpperByte << 8) | stackLowerByte)) & 0xFFFF;
    // console.info(`Returning to 0x${returnAddress.toString(16)}`);

    cpu.pc = returnAddress - 1;

    cpu.tick(4); // Branching takes 4 cycles

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0xC9] = RET;  // RET
UNPREFIXED_EXECUTORS[0xD8] = RET;  // RET C
UNPREFIXED_EXECUTORS[0xD0] = RET;  // RET NC
UNPREFIXED_EXECUTORS[0xC8] = RET;  // RET Z
UNPREFIXED_EXECUTORS[0xC0] = RET;  // RET NZ




/** ADD HL, R16 */
export function ADD_HL_R16(cpu: CPU, b0: number): void {
    const target = [R16.BC, R16.DE, R16.HL, R16.SP][(b0 & 0b110000) >> 4];
    const r16Value = cpu.reg[target];

    const hl = cpu.reg[R16.HL];

    const newValue = (r16Value + hl) & 0xFFFF;
    const didOverflow = (r16Value + hl) > 0xFFFF;

    // Set flag
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = (hl & 0xFFF) + (r16Value & 0xFFF) > 0xFFF;
    cpu.reg._f.carry = didOverflow;

    // Set register values
    cpu.reg[R16.HL] = newValue;

    // Register read takes 4 more cycles
    cpu.tick(4);

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0x09] = ADD_HL_R16;  // ADD HL, BC
UNPREFIXED_EXECUTORS[0x19] = ADD_HL_R16;  // ADD HL, DE
UNPREFIXED_EXECUTORS[0x29] = ADD_HL_R16;  // ADD HL, HL
UNPREFIXED_EXECUTORS[0x39] = ADD_HL_R16; // ADD HL, SP

/** Reset Vectors */
export function RST(cpu: CPU, b0: number): void {
    const target = b0 & 0b111000;
    const pcUpperByte = ((cpu.pc + 1) & 0xFFFF) >> 8;
    const pcLowerByte = ((cpu.pc + 1) & 0xFFFF) & 0xFF;

    cpu.reg.sp = (cpu.reg.sp - 1) & 0xFFFF;
    cpu.writeMem8(cpu.reg.sp, pcUpperByte);
    cpu.reg.sp = (cpu.reg.sp - 1) & 0xFFFF;
    cpu.writeMem8(cpu.reg.sp, pcLowerByte);

    cpu.pc = target - 1;

    cpu.tick(4);

    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0xC7] = RST;  // RST 00h 
UNPREFIXED_EXECUTORS[0xCF] = RST;  // RST 08h
UNPREFIXED_EXECUTORS[0xD7] = RST;  // RST 10h
UNPREFIXED_EXECUTORS[0xDF] = RST;  // RST 18h
UNPREFIXED_EXECUTORS[0xE7] = RST;  // RST 20h
UNPREFIXED_EXECUTORS[0xEF] = RST;  // RST 28h
UNPREFIXED_EXECUTORS[0xF7] = RST;  // RST 30h
UNPREFIXED_EXECUTORS[0xFF] = RST;  // RST 38h

// Invalid

export function INVALID(cpu: CPU, b0: number): void {
    cpu.pc--;
    cpu.invalidOpcodeExecuted = true;
    cpu.pc += 1;
};
UNPREFIXED_EXECUTORS[0xD3] = INVALID;
UNPREFIXED_EXECUTORS[0xDB] = INVALID;
UNPREFIXED_EXECUTORS[0xDD] = INVALID;
UNPREFIXED_EXECUTORS[0xE3] = INVALID;
UNPREFIXED_EXECUTORS[0xE4] = INVALID;
UNPREFIXED_EXECUTORS[0xEB] = INVALID;
UNPREFIXED_EXECUTORS[0xEC] = INVALID;
UNPREFIXED_EXECUTORS[0xED] = INVALID;
UNPREFIXED_EXECUTORS[0xF4] = INVALID;
UNPREFIXED_EXECUTORS[0xFC] = INVALID;
UNPREFIXED_EXECUTORS[0xFD] = INVALID;
