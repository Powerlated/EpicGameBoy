import { Executor } from "./unprefixed_executors";
import { CPU } from "../gameboy";
import { R8 } from "./cpu_types";

const CB_PREFIXED_EXECUTORS: Executor[] = new Array(256);
export default CB_PREFIXED_EXECUTORS;

export function RLC_R8(this: number, cpu: CPU): number {
    const t: R8 = this & 0b111;
    const value = cpu.reg[t];

    const leftmostBit = (value & 0b10000000) >> 7;
    const newValue = ((value << 1) | leftmostBit) & 0xFF;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = (value & 128) !== 0;

    return 2;
};

// RRC r8
export function RRC_R8(this: number, cpu: CPU): number {
    const t: R8 = this & 0b111;
    const value = cpu.reg[t];

    const rightmostBit = (value & 1) << 7;
    const newValue = ((value >> 1) | rightmostBit) & 0xFF;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = (value & 1) !== 0;

    return 2;
};

// RL r8
export function RL_R8(this: number, cpu: CPU): number {
    const t: R8 = this & 0b111;
    const value = cpu.reg[t];

    const carryMask = (cpu.reg.f & 0b00010000) >> 4;

    const newValue = ((value << 1) | carryMask) & 0xFF;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = (value & 128) !== 0;

    return 2;
};

// RR r8
export function RR_R8(this: number, cpu: CPU): number {
    const t: R8 = this & 0b111;
    const value = cpu.reg[t];

    const carryMask = (cpu.reg.f & 0b00010000) << 3;

    const newValue = ((value >> 1) | carryMask) & 0xFF;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = (value & 1) !== 0;

    return 2;
};

// SLA r8
export function SLA_R8(this: number, cpu: CPU): number {
    const t: R8 = this & 0b111;
    const value = cpu.reg[t];

    const newValue = (value << 1) & 0xFF;
    const didOverflow = (value >> 7) !== 0;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = didOverflow;

    return 2;
};

// SRA r8
export function SRA_R8(this: number, cpu: CPU): number {
    const t: R8 = this & 0b111;
    const value = cpu.reg[t];

    const leftmostBit = value & 0b10000000;
    const newValue = (value >> 1) | leftmostBit;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = (value & 1) !== 0;

    return 2;
};

// SWAP r8
export function SWAP_R8(this: number, cpu: CPU): number {
    const t: R8 = this & 0b111;
    const value = cpu.reg[t];

    const lowerNybble = value & 0b00001111;
    const upperNybble = (value >> 4) & 0b00001111;

    cpu.reg[t] = (lowerNybble << 4) | upperNybble;

    cpu.reg._f.zero = value === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = false;

    return 2;
};

// SRL r8
export function SRL_R8(this: number, cpu: CPU): number {
    const t: R8 = this & 0b111;
    const value = cpu.reg[t];

    const newValue = value >> 1;

    cpu.reg[t] = newValue;

    cpu.reg._f.zero = newValue === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = false;
    cpu.reg._f.carry = (value & 1) !== 0;

    return 2;
};

// BIT r8
export function BIT_R8(this: number, cpu: CPU): number {
    const t: R8 = this & 0b111;
    const bit = (this & 0b111000) >> 3;

    cpu.reg._f.zero = (cpu.reg[t] & (1 << bit)) === 0;
    cpu.reg._f.negative = false;
    cpu.reg._f.half_carry = true;

    return 2;
};

// RES r8
export function RES_R8(this: number, cpu: CPU): number {
    const t: R8 = this & 0b111;
    const bit = (this & 0b111000) >> 3;

    const value = cpu.reg[t];
    const mask = 0b1 << bit;

    cpu.reg[t] = value & ~(mask);

    return 2;
};

// SET r8
export function SET_R8(this: number, cpu: CPU): number {
    const t: R8 = this & 0b111;
    const bit = (this & 0b111000) >> 3;

    const value = cpu.reg[t];
    const mask = 0b1 << bit;

    cpu.reg[t] = value | mask;;

    return 2;
};

const topOpsTable = [
    RLC_R8, RRC_R8,
    RL_R8, RR_R8,
    SLA_R8, SRA_R8,
    SWAP_R8, SRL_R8
];

// Generate these with an algorithm because there's
// no way I'm copy pasting 256 times.
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

for (let i = 0; i < 256; i++) {
    CB_PREFIXED_EXECUTORS[i] = CB_PREFIXED_EXECUTORS[i].bind(i);
}

