import { Executor } from "./unprefixed_executors";
import { CPU } from "../gameboy";
import { R8 } from "./cpu";

const CB_PREFIXED_EXECUTORS: Executor[] = new Array(256);
export default CB_PREFIXED_EXECUTORS;

const RLC_R8 = (cpu: CPU, b1: number) => {
    const t: R8 = b1 & 0b111;
    const value = cpu.reg[t];

    const leftmostBit = (value & 0b10000000) >> 7;
    const newValue = ((value << 1) | leftmostBit) & 0xFF;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = (value >> 7) === 1;

    cpu.pc += 2;
};

// RRC r8
const RRC_R8 = (cpu: CPU, b1: number) => {
    const t: R8 = b1 & 0b111;
    const value = cpu.reg[t];

    const rightmostBit = (value & 1) << 7;
    const newValue = ((value >> 1) | rightmostBit) & 0xFF;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = !!(value & 1);

    cpu.pc += 2;
};

// RL r8
const RL_R8 = (cpu: CPU, b1: number) => {
    const t: R8 = b1 & 0b111;
    const value = cpu.reg[t];

    const carryMask = (cpu.reg.f & 0b00010000) >> 4;

    const newValue = ((value << 1) | carryMask) & 0xFF;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = (value >> 7) === 1;

    cpu.pc += 2;
};

// RR r8
const RR_R8 = (cpu: CPU, b1: number) => {
    const t: R8 = b1 & 0b111;
    const value = cpu.reg[t];

    const carryMask = (cpu.reg.f & 0b00010000) << 3;

    const newValue = ((value >> 1) | carryMask) & 0xFF;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = !!(value & 1);

    cpu.pc += 2;
};

// SLA r8
const SLA_R8 = (cpu: CPU, b1: number) => {
    const t: R8 = b1 & 0b111;
    const value = cpu.reg[t];

    const newValue = (value << 1) & 0xFF;
    const didOverflow = ((value << 1) >> 8) !== 0;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = didOverflow;

    cpu.pc += 2;
};

// SRA r8
const SRA_R8 = (cpu: CPU, b1: number) => {
    const t: R8 = b1 & 0b111;
    const value = cpu.reg[t];

    const leftmostBit = value & 0b10000000;
    const newValue = (value >> 1) | leftmostBit;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = !!(value & 1);

    cpu.pc += 2;
};

// SWAP r8
const SWAP_R8 = (cpu: CPU, b1: number) => {
    const t: R8 = b1 & 0b111;
    const value = cpu.reg[t];

    const lowerNybble = value & 0b00001111;
    const upperNybble = (value >> 4) & 0b00001111;

    cpu.reg[t] = (lowerNybble << 4) | upperNybble;

    cpu.reg._f.zero = value === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = false;

    cpu.pc += 2;
};

// SRL r8
const SRL_R8 = (cpu: CPU, b1: number) => {
    const t: R8 = b1 & 0b111;
    const value = cpu.reg[t];

    const newValue = value >> 1;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = !!(value & 1);

    cpu.pc += 2;
};

// BIT r8
const BIT_R8 = (cpu: CPU, b1: number) => {
    const t: R8 = b1 & 0b111;
    const bit = (b1 & 0b111000) >> 3;

    const value = cpu.reg[t];

    cpu.reg._f.zero = (value & (1 << bit)) === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = true;

    cpu.pc += 2;
};

// RES r8
const RES_R8 = (cpu: CPU, b1: number) => {
    const t: R8 = b1 & 0b111;
    const bit = (b1 & 0b111000) >> 3;

    const value = cpu.reg[t];
    const mask = 0b1 << bit;

    const final = value & ~(mask);

    cpu.reg[t] = final;

    cpu.pc += 2;
};

// SET r8
const SET_R8 = (cpu: CPU, b1: number) => {
    const t: R8 = b1 & 0b111;
    const bit = (b1 & 0b111000) >> 3;

    const value = cpu.reg[t];
    const mask = 0b1 << bit;

    const final = value | mask;

    cpu.reg[t] = final;

    cpu.pc += 2;
};

const topOpsTable = [
    RLC_R8, RRC_R8,
    RL_R8, RR_R8,
    SLA_R8, SRA_R8,
    SWAP_R8, SRL_R8
];

for (let i = 0; i < 256; i++) {
    if (i >= 0x00 && i <= 0x3F) {
        CB_PREFIXED_EXECUTORS[i] = topOpsTable[(i & 0b111000) >> 3];
    } else if (i >= 0x40 && i <= 0x7F) {
        CB_PREFIXED_EXECUTORS[i] = BIT_R8;
    } else if (i >= 0x80 && i <= 0xBF) {
        CB_PREFIXED_EXECUTORS[i] = RES_R8;
    } else if (i >= 0xC0 && i <= 0xFF) {
        CB_PREFIXED_EXECUTORS[i] = SET_R8;
    } 
}