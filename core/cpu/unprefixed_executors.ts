import { unTwo8b } from "../../src/gameboy/tools/util";
import GameBoy, { CPU } from "../gameboy";
import CB_PREFIXED_EXECUTORS from "./cb_prefixed_executors";
import { R16, R8, CC } from "./cpu_types";

export type IncrementPCBy = number;
export type Executor = (cpu: CPU) => IncrementPCBy;

const UNPREFIXED_EXECUTORS: Executor[] = new Array(256);
export default UNPREFIXED_EXECUTORS;

/** LD R16, N16 */
UNPREFIXED_EXECUTORS[0x01] = LD_R16_N16; // LD BC, N16
UNPREFIXED_EXECUTORS[0x11] = LD_R16_N16; // LD DE, N16
UNPREFIXED_EXECUTORS[0x21] = LD_R16_N16; // LD HL, N16
UNPREFIXED_EXECUTORS[0x31] = LD_R16_N16; // LD SP, N16
export function LD_R16_N16(this: number, cpu: CPU): number {
    const n16 = cpu.read16_tick(cpu.pc + 1);

    const target = [R16.BC, R16.DE, R16.HL, R16.SP][(this & 0b110000) >> 4];
    cpu[target] = n16;
    return 3;
};

// LD A, [N16]
UNPREFIXED_EXECUTORS[0xFA] = LD_A_iN16;
export function LD_A_iN16(this: number, cpu: CPU): number {
    const n16 = cpu.read16_tick(cpu.pc + 1);

    cpu[R8.A] = cpu.read_tick(n16);
    return 3;
};

// LD [N16], A
UNPREFIXED_EXECUTORS[0xEA] = LD_iN16_A;
export function LD_iN16_A(this: number, cpu: CPU): number {
    const n16 = cpu.read16_tick(cpu.pc + 1);

    cpu.write_tick(n16, cpu[R8.A]);
    return 3;
};

UNPREFIXED_EXECUTORS[0x08] = LD_iN16_SP;
export function LD_iN16_SP(this: number, cpu: CPU): number {
    const n16 = cpu.read16_tick(cpu.pc + 1);

    const spUpperByte = cpu.sp >> 8;
    const spLowerByte = cpu.sp & 0b11111111;

    cpu.write_tick(n16 + 0, spLowerByte);
    cpu.write_tick(n16 + 1, (spUpperByte) & 0xFFFF);

    return 3;
};

UNPREFIXED_EXECUTORS[0xC3] = JP; // JP N16
export function JP(this: number, cpu: CPU): number {
    const n16 = cpu.read16_tick(cpu.pc + 1);
    cpu.pc = n16 - 3;

    cpu.tick_addPending(4); // Branching takes 4 cycles
    return 3;
};

UNPREFIXED_EXECUTORS[0xC2] = JP_CC; // JP NZ, N16
UNPREFIXED_EXECUTORS[0xCA] = JP_CC; // JP Z, N16
UNPREFIXED_EXECUTORS[0xD2] = JP_CC; // JP NC, N16
UNPREFIXED_EXECUTORS[0xDA] = JP_CC; // JP C, N16
export function JP_CC(this: number, cpu: CPU): number {
    const cc: CC = (this & 0b11000) >> 3;
    if (cc === CC.NZ && cpu.zero) { cpu.tick_addPending(8); return 3; }
    else if (cc === CC.Z && !cpu.zero) { cpu.tick_addPending(8); return 3; }
    else if (cc === CC.NC && cpu.carry) { cpu.tick_addPending(8); return 3; }
    else if (cc === CC.C && !cpu.carry) { cpu.tick_addPending(8); return 3; }

    const n16 = cpu.read16_tick(cpu.pc + 1);
    cpu.pc = n16 - 3;

    cpu.tick_addPending(4); // Branching takes 4 cycles
    return 3;
};

/** CALL */
UNPREFIXED_EXECUTORS[0xCD] = CALL; // CALL N16
export function CALL(this: number, cpu: CPU): number {
    const n16 = cpu.read16_tick(cpu.pc + 1);

    cpu.tick_addPending(4); // Branching takes 4 cycles

    const pcUpperByte = ((cpu.pc + 3) & 0xFFFF) >> 8;
    const pcLowerByte = ((cpu.pc + 3) & 0xFFFF) & 0xFF;

    // console.info(`Calling 0x${u16.toString(16)} from 0x${cpu.pc.toString(16)}`);

    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write_tick(cpu.sp, pcUpperByte);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write_tick(cpu.sp, pcLowerByte);

    cpu.pc = n16 - 3;


    return 3;
};

UNPREFIXED_EXECUTORS[0xDC] = CALL_CC; // CALL C, N16
UNPREFIXED_EXECUTORS[0xD4] = CALL_CC; // CALL NC, N16
UNPREFIXED_EXECUTORS[0xCC] = CALL_CC; // CALL Z, N16
UNPREFIXED_EXECUTORS[0xC4] = CALL_CC; // CALL NZ, N16
export function CALL_CC(this: number, cpu: CPU): number {
    const cc: CC = (this & 0b11000) >> 3;
    if (cc === CC.NZ && cpu.zero) { cpu.tick_addPending(8); return 3; }
    else if (cc === CC.Z && !cpu.zero) { cpu.tick_addPending(8); return 3; }
    else if (cc === CC.NC && cpu.carry) { cpu.tick_addPending(8); return 3; }
    else if (cc === CC.C && !cpu.carry) { cpu.tick_addPending(8); return 3; }

    const n16 = cpu.read16_tick(cpu.pc + 1);

    cpu.tick_addPending(4); // Branching takes 4 cycles

    const pcUpperByte = ((cpu.pc + 3) & 0xFFFF) >> 8;
    const pcLowerByte = ((cpu.pc + 3) & 0xFFFF) & 0xFF;

    // console.info(`Calling 0x${u16.toString(16)} from 0x${cpu.pc.toString(16)}`);

    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write_tick(cpu.sp, pcUpperByte);
    cpu.sp = (cpu.sp - 1) & 0xFFFF;
    cpu.write_tick(cpu.sp, pcLowerByte);

    cpu.pc = n16 - 3;


    return 3;
};


/** Interrupts */
UNPREFIXED_EXECUTORS[0x10] = STOP; // STOP
export function STOP(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);
    if (b1 !== 0) {
        console.log("Corrupted stop executed");
        cpu.ime = false;
        cpu.halted = true;
    } else {
        cpu.gb.attemptSpeedSwitch();
    }
    return 2;
};

/** LD between A and High RAM */
UNPREFIXED_EXECUTORS[0xF0] = LD_A_iFF00plusN8;
export function LD_A_iFF00plusN8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    cpu[R8.A] = cpu.read_tick((0xFF00 | b1) & 0xFFFF);

    return 2;
};

UNPREFIXED_EXECUTORS[0xE0] = LD_iFF00plusN8_A;
export function LD_iFF00plusN8_A(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    cpu.write_tick((0xFF00 | b1) & 0xFFFF, cpu[R8.A]);

    return 2;
};

UNPREFIXED_EXECUTORS[0x36] = LD_iHL_N8;
export function LD_iHL_N8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    cpu.write_tick(cpu[R16.HL], b1);
    return 2;
};

UNPREFIXED_EXECUTORS[0xF8] = LD_HL_SPplusE8;
export function LD_HL_SPplusE8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    const signedVal = unTwo8b(b1);

    cpu.zero = false;
    cpu.negative = false;
    cpu.half_carry = (signedVal & 0xF) + (cpu.sp & 0xF) > 0xF;
    cpu.carry = (signedVal & 0xFF) + (cpu.sp & 0xFF) > 0xFF;

    cpu[R16.HL] = (unTwo8b(b1) + cpu.sp) & 0xFFFF;

    // Register read timing
    cpu.tick_addPending(4);

    return 2;
};

UNPREFIXED_EXECUTORS[0xE8] = ADD_SP_E8;
export function ADD_SP_E8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    const value = unTwo8b(b1);

    cpu.zero = false;
    cpu.negative = false;
    cpu.half_carry = ((value & 0xF) + (cpu.sp & 0xF)) > 0xF;
    cpu.carry = ((value & 0xFF) + (cpu.sp & 0xFF)) > 0xFF;

    cpu.sp = (cpu.sp + value) & 0xFFFF;

    // Extra time
    cpu.tick_addPending(8);

    return 2;
};

UNPREFIXED_EXECUTORS[0xE6] = AND_A_N8;
export function AND_A_N8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    const final = b1 & cpu[R8.A];
    cpu[R8.A] = final;

    cpu.zero = cpu[R8.A] === 0;
    cpu.negative = false;
    cpu.half_carry = true;
    cpu.carry = false;

    return 2;
};

UNPREFIXED_EXECUTORS[0xF6] = OR_A_N8;  // OR A, N8
export function OR_A_N8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    const final = b1 | cpu[R8.A];
    cpu[R8.A] = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.half_carry = false;
    cpu.carry = false;
    return 2;
};

UNPREFIXED_EXECUTORS[0xEE] = XOR_A_N8;  // XOR A, N8
export function XOR_A_N8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    const final = b1 ^ cpu[R8.A];
    cpu[R8.A] = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.half_carry = false;
    cpu.carry = false;

    return 2;
};

UNPREFIXED_EXECUTORS[0xFE] = CP_A_N8;  // CP A, N8
export function CP_A_N8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    const newValue = (cpu[R8.A] - b1) & 0xFF;

    // Set flags
    cpu.carry = b1 > cpu[R8.A];
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.half_carry = (cpu[R8.A] & 0xF) - (b1 & 0xF) < 0;

    return 2;
};

/** JR */
UNPREFIXED_EXECUTORS[0x18] = JR;  // JR E8
export function JR(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);
    cpu.pc += unTwo8b(b1);

    cpu.tick_addPending(4); // Branching takes 4 cycles

    return 2;
};


UNPREFIXED_EXECUTORS[0x20] = JR_CC;  // JR NZ, E8
UNPREFIXED_EXECUTORS[0x28] = JR_CC;  // JR Z, E8
UNPREFIXED_EXECUTORS[0x30] = JR_CC;  // JR NC, E8
UNPREFIXED_EXECUTORS[0x38] = JR_CC;  // JR C, E8
export function JR_CC(this: number, cpu: CPU): number {
    const cc: CC = (this & 0b11000) >> 3;
    if (cc === CC.NZ && cpu.zero) { cpu.tick_addPending(4); return 2; }
    else if (cc === CC.Z && !cpu.zero) { cpu.tick_addPending(4); return 2; }
    else if (cc === CC.NC && cpu.carry) { cpu.tick_addPending(4); return 2; }
    else if (cc === CC.C && !cpu.carry) { cpu.tick_addPending(4); return 2; }

    const b1 = cpu.read_tick(cpu.pc + 1);
    cpu.pc += unTwo8b(b1);

    cpu.tick_addPending(4); // Branching takes 4 cycles

    return 2;
};

/** Arithmetic */
UNPREFIXED_EXECUTORS[0xC6] = ADD_A_N8;  // ADD A, N8
export function ADD_A_N8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    const newValue = (b1 + cpu[R8.A]) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.half_carry = (cpu[R8.A] & 0xF) + (b1 & 0xF) > 0xF;
    cpu.carry = (b1 + cpu[R8.A]) > 0xFF;

    // Set register values
    cpu[R8.A] = newValue;

    return 2;
};

UNPREFIXED_EXECUTORS[0xCE] = ADC_A_N8;  // ADC A, N8
export function ADC_A_N8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    const newValue = (b1 + cpu[R8.A] + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.half_carry = (cpu[R8.A] & 0xF) + (b1 & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (b1 + cpu[R8.A] + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu[R8.A] = newValue;

    return 2;
};

UNPREFIXED_EXECUTORS[0xD6] = SUB_A_N8;  // SUB A, N8
export function SUB_A_N8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    const newValue = (cpu[R8.A] - b1) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.half_carry = (b1 & 0xF) > (cpu[R8.A] & 0xF);
    cpu.carry = b1 > cpu[R8.A];

    // Set register values
    cpu[R8.A] = newValue;

    return 2;
};

UNPREFIXED_EXECUTORS[0xDE] = SBC_A_N8;  // SBC A, N8
export function SBC_A_N8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    const newValue = (cpu[R8.A] - b1 - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.half_carry = (b1 & 0xF) > (cpu[R8.A] & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = b1 > cpu[R8.A] - (cpu.carry ? 1 : 0);

    // Set register values
    cpu[R8.A] = newValue;

    return 2;
};

UNPREFIXED_EXECUTORS[0x06] = LD_R8_N8; // LD B, N8
UNPREFIXED_EXECUTORS[0x0E] = LD_R8_N8; // LD C, N8
UNPREFIXED_EXECUTORS[0x16] = LD_R8_N8; // LD D, N8
UNPREFIXED_EXECUTORS[0x1E] = LD_R8_N8; // LD E, N8
UNPREFIXED_EXECUTORS[0x26] = LD_R8_N8; // LD H, N8
UNPREFIXED_EXECUTORS[0x2E] = LD_R8_N8; // LD L, N8
UNPREFIXED_EXECUTORS[0x36] = LD_R8_N8; // LD (HL), N8
UNPREFIXED_EXECUTORS[0x3E] = LD_R8_N8; // LD A, N8
/** LD R8, N8 */
export function LD_R8_N8(this: number, cpu: CPU): number {
    const b1 = cpu.read_tick(cpu.pc + 1);

    const target: R8 = (this & 0b111000) >> 3;
    cpu[target] = b1;

    return 2;

};

UNPREFIXED_EXECUTORS[0xF9] = LD_SP_HL; // LD SP, HL
export function LD_SP_HL(this: number, cpu: CPU): number {
    cpu.sp = cpu[R16.HL];
    // Register read timing
    cpu.tick_addPending(4);

    return 1;
};

export function LD_R8_R8(this: number, cpu: CPU): number {
    const source: R8 = this & 0b111;
    const dest: R8 = (this & 0b111000) >> 3;
    cpu[dest] = cpu[source];

    return 1;
};

// LD R8, R8
UNPREFIXED_EXECUTORS[0x40] = function LD_B_B(cpu) { cpu[R8.B] = cpu[R8.B]; return 1; };
UNPREFIXED_EXECUTORS[0x41] = function LD_B_C(cpu) { cpu[R8.B] = cpu[R8.C]; return 1; };
UNPREFIXED_EXECUTORS[0x42] = function LD_B_D(cpu) { cpu[R8.B] = cpu[R8.D]; return 1; };
UNPREFIXED_EXECUTORS[0x43] = function LD_B_E(cpu) { cpu[R8.B] = cpu[R8.E]; return 1; };
UNPREFIXED_EXECUTORS[0x44] = function LD_B_H(cpu) { cpu[R8.B] = cpu[R8.H]; return 1; };
UNPREFIXED_EXECUTORS[0x45] = function LD_B_L(cpu) { cpu[R8.B] = cpu[R8.L]; return 1; };
UNPREFIXED_EXECUTORS[0x46] = function LD_B_iHL(cpu) { cpu[R8.B] = cpu[R8.iHL]; return 1; };
UNPREFIXED_EXECUTORS[0x47] = function LD_B_A(cpu) { cpu[R8.B] = cpu[R8.A]; return 1; };
UNPREFIXED_EXECUTORS[0x48] = function LD_C_B(cpu) { cpu[R8.C] = cpu[R8.B]; return 1; };
UNPREFIXED_EXECUTORS[0x49] = function LD_C_C(cpu) { cpu[R8.C] = cpu[R8.C]; return 1; };
UNPREFIXED_EXECUTORS[0x4A] = function LD_C_D(cpu) { cpu[R8.C] = cpu[R8.D]; return 1; };
UNPREFIXED_EXECUTORS[0x4B] = function LD_C_E(cpu) { cpu[R8.C] = cpu[R8.E]; return 1; };
UNPREFIXED_EXECUTORS[0x4C] = function LD_C_H(cpu) { cpu[R8.C] = cpu[R8.H]; return 1; };
UNPREFIXED_EXECUTORS[0x4D] = function LD_C_L(cpu) { cpu[R8.C] = cpu[R8.L]; return 1; };
UNPREFIXED_EXECUTORS[0x4E] = function LD_C_iHL(cpu) { cpu[R8.C] = cpu[R8.iHL]; return 1; };
UNPREFIXED_EXECUTORS[0x4F] = function LD_C_A(cpu) { cpu[R8.C] = cpu[R8.A]; return 1; };
UNPREFIXED_EXECUTORS[0x50] = function LD_D_B(cpu) { cpu[R8.D] = cpu[R8.B]; return 1; };
UNPREFIXED_EXECUTORS[0x51] = function LD_D_C(cpu) { cpu[R8.D] = cpu[R8.C]; return 1; };
UNPREFIXED_EXECUTORS[0x52] = function LD_D_D(cpu) { cpu[R8.D] = cpu[R8.D]; return 1; };
UNPREFIXED_EXECUTORS[0x53] = function LD_D_E(cpu) { cpu[R8.D] = cpu[R8.E]; return 1; };
UNPREFIXED_EXECUTORS[0x54] = function LD_D_H(cpu) { cpu[R8.D] = cpu[R8.H]; return 1; };
UNPREFIXED_EXECUTORS[0x55] = function LD_D_L(cpu) { cpu[R8.D] = cpu[R8.L]; return 1; };
UNPREFIXED_EXECUTORS[0x56] = function LD_D_iHL(cpu) { cpu[R8.D] = cpu[R8.iHL]; return 1; };
UNPREFIXED_EXECUTORS[0x57] = function LD_D_A(cpu) { cpu[R8.D] = cpu[R8.A]; return 1; };
UNPREFIXED_EXECUTORS[0x58] = function LD_E_B(cpu) { cpu[R8.E] = cpu[R8.B]; return 1; };
UNPREFIXED_EXECUTORS[0x59] = function LD_E_C(cpu) { cpu[R8.E] = cpu[R8.C]; return 1; };
UNPREFIXED_EXECUTORS[0x5A] = function LD_E_D(cpu) { cpu[R8.E] = cpu[R8.D]; return 1; };
UNPREFIXED_EXECUTORS[0x5B] = function LD_E_E(cpu) { cpu[R8.E] = cpu[R8.E]; return 1; };
UNPREFIXED_EXECUTORS[0x5C] = function LD_E_H(cpu) { cpu[R8.E] = cpu[R8.H]; return 1; };
UNPREFIXED_EXECUTORS[0x5D] = function LD_E_L(cpu) { cpu[R8.E] = cpu[R8.L]; return 1; };
UNPREFIXED_EXECUTORS[0x5E] = function LD_E_iHL(cpu) { cpu[R8.E] = cpu[R8.iHL]; return 1; };
UNPREFIXED_EXECUTORS[0x5F] = function LD_E_A(cpu) { cpu[R8.E] = cpu[R8.A]; return 1; };
UNPREFIXED_EXECUTORS[0x60] = function LD_H_B(cpu) { cpu[R8.H] = cpu[R8.B]; return 1; };
UNPREFIXED_EXECUTORS[0x61] = function LD_H_C(cpu) { cpu[R8.H] = cpu[R8.C]; return 1; };
UNPREFIXED_EXECUTORS[0x62] = function LD_H_D(cpu) { cpu[R8.H] = cpu[R8.D]; return 1; };
UNPREFIXED_EXECUTORS[0x63] = function LD_H_E(cpu) { cpu[R8.H] = cpu[R8.E]; return 1; };
UNPREFIXED_EXECUTORS[0x64] = function LD_H_H(cpu) { cpu[R8.H] = cpu[R8.H]; return 1; };
UNPREFIXED_EXECUTORS[0x65] = function LD_H_L(cpu) { cpu[R8.H] = cpu[R8.L]; return 1; };
UNPREFIXED_EXECUTORS[0x66] = function LD_H_iHL(cpu) { cpu[R8.H] = cpu[R8.iHL]; return 1; };
UNPREFIXED_EXECUTORS[0x67] = function LD_H_A(cpu) { cpu[R8.H] = cpu[R8.A]; return 1; };
UNPREFIXED_EXECUTORS[0x68] = function LD_L_B(cpu) { cpu[R8.L] = cpu[R8.B]; return 1; };
UNPREFIXED_EXECUTORS[0x69] = function LD_L_C(cpu) { cpu[R8.L] = cpu[R8.C]; return 1; };
UNPREFIXED_EXECUTORS[0x6A] = function LD_L_D(cpu) { cpu[R8.L] = cpu[R8.D]; return 1; };
UNPREFIXED_EXECUTORS[0x6B] = function LD_L_E(cpu) { cpu[R8.L] = cpu[R8.E]; return 1; };
UNPREFIXED_EXECUTORS[0x6C] = function LD_L_H(cpu) { cpu[R8.L] = cpu[R8.H]; return 1; };
UNPREFIXED_EXECUTORS[0x6D] = function LD_L_L(cpu) { cpu[R8.L] = cpu[R8.L]; return 1; };
UNPREFIXED_EXECUTORS[0x6E] = function LD_L_iHL(cpu) { cpu[R8.L] = cpu[R8.iHL]; return 1; };
UNPREFIXED_EXECUTORS[0x6F] = function LD_L_A(cpu) { cpu[R8.L] = cpu[R8.A]; return 1; };
UNPREFIXED_EXECUTORS[0x70] = function LD_iHL_B(cpu) { cpu[R8.iHL] = cpu[R8.B]; return 1; };
UNPREFIXED_EXECUTORS[0x71] = function LD_iHL_C(cpu) { cpu[R8.iHL] = cpu[R8.C]; return 1; };
UNPREFIXED_EXECUTORS[0x72] = function LD_iHL_D(cpu) { cpu[R8.iHL] = cpu[R8.D]; return 1; };
UNPREFIXED_EXECUTORS[0x73] = function LD_iHL_E(cpu) { cpu[R8.iHL] = cpu[R8.E]; return 1; };
UNPREFIXED_EXECUTORS[0x74] = function LD_iHL_H(cpu) { cpu[R8.iHL] = cpu[R8.H]; return 1; };
UNPREFIXED_EXECUTORS[0x75] = function LD_iHL_L(cpu) { cpu[R8.iHL] = cpu[R8.L]; return 1; };
// HALT
UNPREFIXED_EXECUTORS[0x77] = function LD_iHL_A(cpu) { cpu[R8.iHL] = cpu[R8.A]; return 1; };
UNPREFIXED_EXECUTORS[0x78] = function LD_A_B(cpu) { cpu[R8.A] = cpu[R8.B]; return 1; };
UNPREFIXED_EXECUTORS[0x79] = function LD_A_C(cpu) { cpu[R8.A] = cpu[R8.C]; return 1; };
UNPREFIXED_EXECUTORS[0x7A] = function LD_A_D(cpu) { cpu[R8.A] = cpu[R8.D]; return 1; };
UNPREFIXED_EXECUTORS[0x7B] = function LD_A_E(cpu) { cpu[R8.A] = cpu[R8.E]; return 1; };
UNPREFIXED_EXECUTORS[0x7C] = function LD_A_H(cpu) { cpu[R8.A] = cpu[R8.H]; return 1; };
UNPREFIXED_EXECUTORS[0x7D] = function LD_A_L(cpu) { cpu[R8.A] = cpu[R8.L]; return 1; };
UNPREFIXED_EXECUTORS[0x7E] = function LD_A_iHL(cpu) { cpu[R8.A] = cpu[R8.iHL]; return 1; };
UNPREFIXED_EXECUTORS[0x7F] = function LD_A_A(cpu) { cpu[R8.A] = cpu[R8.A]; return 1; };

function get_reg16(cpu: CPU, r: number): number {
    switch (r) {
        case 0: return cpu[R16.BC];
        case 1: return cpu[R16.DE];
        case 2: return cpu[R16.HL];
        case 3: return cpu[R16.AF];
    }
    return 0;
}

function set_reg16(cpu: CPU, r: number, n: number): void {
    switch (r) {
        case 0: cpu[R16.BC] = n; return;
        case 1: cpu[R16.DE] = n; return;
        case 2: cpu[R16.HL] = n; return;
        case 3: cpu[R16.AF] = n; return;
    }
}

UNPREFIXED_EXECUTORS[0xC5] = PUSH_R16;  // PUSH BC
UNPREFIXED_EXECUTORS[0xD5] = PUSH_R16;  // PUSH DE
UNPREFIXED_EXECUTORS[0xE5] = PUSH_R16;  // PUSH HL
UNPREFIXED_EXECUTORS[0xF5] = PUSH_R16;  // PUSH AF 
/** PUSH R16 */
export function PUSH_R16(this: number, cpu: CPU): number {
    cpu.push_tick(get_reg16(cpu, (this & 0b110000) >> 4));
    return 1;
};

UNPREFIXED_EXECUTORS[0xC1] = POP_R16;  // POP BC
UNPREFIXED_EXECUTORS[0xD1] = POP_R16;  // POP DE
UNPREFIXED_EXECUTORS[0xE1] = POP_R16;  // POP HL
UNPREFIXED_EXECUTORS[0xF1] = POP_R16;  // POP AF 
/** POP R16 */
export function POP_R16(this: number, cpu: CPU): number {
    set_reg16(cpu, (this & 0b110000) >> 4, cpu.pop_tick());
    return 1;
};

UNPREFIXED_EXECUTORS[0x04] = INC_R8;  // INC B
UNPREFIXED_EXECUTORS[0x0C] = INC_R8;  // INC C
UNPREFIXED_EXECUTORS[0x14] = INC_R8;  // INC D
UNPREFIXED_EXECUTORS[0x1C] = INC_R8;  // INC E
UNPREFIXED_EXECUTORS[0x24] = INC_R8;  // INC H
UNPREFIXED_EXECUTORS[0x2C] = INC_R8;  // INC L
UNPREFIXED_EXECUTORS[0x34] = INC_R8;  // INC [HL]
UNPREFIXED_EXECUTORS[0x3C] = INC_R8;  // INC A
/** INC R8 */
export function INC_R8(this: number, cpu: CPU): number {
    const dest: R8 = (this & 0b111000) >> 3;

    const oldValue = cpu[dest];
    const newValue = (oldValue + 1) & 0xFF;
    cpu[dest] = newValue;
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.half_carry = (oldValue & 0xF) + (1 & 0xF) > 0xF;

    return 1;
};

UNPREFIXED_EXECUTORS[0x05] = DEC_R8;  // DEC B
UNPREFIXED_EXECUTORS[0x0D] = DEC_R8;  // DEC C
UNPREFIXED_EXECUTORS[0x15] = DEC_R8;  // DEC D
UNPREFIXED_EXECUTORS[0x1D] = DEC_R8;  // DEC E
UNPREFIXED_EXECUTORS[0x25] = DEC_R8;  // DEC H
UNPREFIXED_EXECUTORS[0x2D] = DEC_R8;  // DEC L
UNPREFIXED_EXECUTORS[0x35] = DEC_R8;  // DEC [HL]
UNPREFIXED_EXECUTORS[0x3D] = DEC_R8;  // DEC A
/** DEC R8 */
export function DEC_R8(this: number, cpu: CPU): number {
    const dest: R8 = (this & 0b111000) >> 3;

    const oldValue = cpu[dest];
    const newValue = (oldValue - 1) & 0xFF;
    cpu[dest] = newValue;

    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.half_carry = (1 & 0xF) > (oldValue & 0xF);

    return 1;
};

UNPREFIXED_EXECUTORS[0x03] = INC_R16; // INC BC
UNPREFIXED_EXECUTORS[0x13] = INC_R16;  // INC DE 
UNPREFIXED_EXECUTORS[0x23] = INC_R16;  // INC HL
UNPREFIXED_EXECUTORS[0x33] = INC_R16;  // INC SP
/** INC R16 */
export function INC_R16(this: number, cpu: CPU): number {
    const target = [R16.BC, R16.DE, R16.HL, R16.SP][(this & 0b110000) >> 4];
    cpu[target] = (cpu[target] + 1) & 0xFFFF;
    cpu.tick_addPending(4);

    return 1;
};

/** DEC R16 */
UNPREFIXED_EXECUTORS[0x0B] = DEC_R16;  // DEC BC
UNPREFIXED_EXECUTORS[0x1B] = DEC_R16;  // DEC DE 
UNPREFIXED_EXECUTORS[0x2B] = DEC_R16;  // DEC HL
UNPREFIXED_EXECUTORS[0x3B] = DEC_R16;  // DEC SP
export function DEC_R16(this: number, cpu: CPU): number {
    const target = [R16.BC, R16.DE, R16.HL, R16.SP][(this & 0b110000) >> 4];
    cpu[target] = (cpu[target] - 1) & 0xFFFF;
    cpu.tick_addPending(4);

    return 1;
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
export function ADD_A_R8(this: number, cpu: CPU): number {
    const source: R8 = this & 0b111;

    const value = cpu[source];

    const newValue = (value + cpu[R8.A]) & 0xFF;

    // Set flags
    cpu.half_carry = (cpu[R8.A] & 0xF) + (value & 0xF) > 0xF;
    cpu.carry = (value + cpu[R8.A]) > 0xFF;
    cpu.zero = newValue === 0;
    cpu.negative = false;

    // Set register values
    cpu[R8.A] = newValue;

    return 1;
};

UNPREFIXED_EXECUTORS[0x88] = ADC_A_R8;  // ADC A, B
UNPREFIXED_EXECUTORS[0x89] = ADC_A_R8;  // ADC A, C
UNPREFIXED_EXECUTORS[0x8A] = ADC_A_R8;  // ADC A, D
UNPREFIXED_EXECUTORS[0x8B] = ADC_A_R8;  // ADC A, E
UNPREFIXED_EXECUTORS[0x8C] = ADC_A_R8;  // ADC A, H
UNPREFIXED_EXECUTORS[0x8D] = ADC_A_R8;  // ADC A, L
UNPREFIXED_EXECUTORS[0x8E] = ADC_A_R8;  // ADC A, (HL)
UNPREFIXED_EXECUTORS[0x8F] = ADC_A_R8;  // ADC A, A
export function ADC_A_R8(this: number, cpu: CPU): number {
    const source: R8 = this & 0b111;

    const value = cpu[source];

    const newValue = (value + cpu[R8.A] + (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = false;
    cpu.half_carry = (cpu[R8.A] & 0xF) + (value & 0xF) + (cpu.carry ? 1 : 0) > 0xF;
    cpu.carry = (value + cpu[R8.A] + (cpu.carry ? 1 : 0)) > 0xFF;

    // Set register values
    cpu[R8.A] = newValue;

    return 1;
};

UNPREFIXED_EXECUTORS[0x90] = SUB_A_R8; // SUB A, B
UNPREFIXED_EXECUTORS[0x91] = SUB_A_R8;  // SUB A, C
UNPREFIXED_EXECUTORS[0x92] = SUB_A_R8;  // SUB A, D
UNPREFIXED_EXECUTORS[0x93] = SUB_A_R8;  // SUB A, E
UNPREFIXED_EXECUTORS[0x94] = SUB_A_R8;  // SUB A, H
UNPREFIXED_EXECUTORS[0x95] = SUB_A_R8;  // SUB A, L
UNPREFIXED_EXECUTORS[0x96] = SUB_A_R8;  // SUB A, (HL)
UNPREFIXED_EXECUTORS[0x97] = SUB_A_R8;  // SUB A, A
export function SUB_A_R8(this: number, cpu: CPU): number {
    const source: R8 = this & 0b111;

    const value = cpu[source];

    const newValue = (cpu[R8.A] - value) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.half_carry = (value & 0xF) > (cpu[R8.A] & 0xF);
    cpu.carry = value > cpu[R8.A];

    // Set register values
    cpu[R8.A] = newValue;

    return 1;
};

UNPREFIXED_EXECUTORS[0x98] = SBC_A_R8;  // SBC A, B
UNPREFIXED_EXECUTORS[0x99] = SBC_A_R8;  // SBC A, C
UNPREFIXED_EXECUTORS[0x9A] = SBC_A_R8;  // SBC A, D
UNPREFIXED_EXECUTORS[0x9B] = SBC_A_R8;  // SBC A, E
UNPREFIXED_EXECUTORS[0x9C] = SBC_A_R8;  // SBC A, H
UNPREFIXED_EXECUTORS[0x9D] = SBC_A_R8;  // SBC A, L
UNPREFIXED_EXECUTORS[0x9E] = SBC_A_R8;  // SBC A, (HL)
UNPREFIXED_EXECUTORS[0x9F] = SBC_A_R8;  // SBC A, A
export function SBC_A_R8(this: number, cpu: CPU): number {
    const source: R8 = this & 0b111;

    const value = cpu[source];

    const newValue = (cpu[R8.A] - value - (cpu.carry ? 1 : 0)) & 0xFF;

    // Set flags
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.half_carry = (value & 0xF) > (cpu[R8.A] & 0xF) - (cpu.carry ? 1 : 0);
    cpu.carry = value > cpu[R8.A] - (cpu.carry ? 1 : 0);

    // Set register values
    cpu[R8.A] = newValue;

    return 1;
};

UNPREFIXED_EXECUTORS[0xA0] = AND_A_R8;  // AND A, B
UNPREFIXED_EXECUTORS[0xA1] = AND_A_R8;  // AND A, C
UNPREFIXED_EXECUTORS[0xA2] = AND_A_R8;  // AND A, D
UNPREFIXED_EXECUTORS[0xA3] = AND_A_R8;  // AND A, E
UNPREFIXED_EXECUTORS[0xA4] = AND_A_R8;  // AND A, H
UNPREFIXED_EXECUTORS[0xA5] = AND_A_R8;  // AND A, L
UNPREFIXED_EXECUTORS[0xA6] = AND_A_R8;  // AND A, (HL)
UNPREFIXED_EXECUTORS[0xA7] = AND_A_R8;  // AND A, A
export function AND_A_R8(this: number, cpu: CPU): number {
    const source: R8 = this & 0b111;

    const value = cpu[source];

    const final = value & cpu[R8.A];
    cpu[R8.A] = final;

    // Set flags
    cpu.zero = cpu[R8.A] === 0;
    cpu.negative = false;
    cpu.half_carry = true;
    cpu.carry = false;

    return 1;
};

UNPREFIXED_EXECUTORS[0xA8] = XOR_A_R8; // XOR A, B
UNPREFIXED_EXECUTORS[0xA9] = XOR_A_R8; // XOR A, C
UNPREFIXED_EXECUTORS[0xAA] = XOR_A_R8; // XOR A, D
UNPREFIXED_EXECUTORS[0xAB] = XOR_A_R8; // XOR A, E
UNPREFIXED_EXECUTORS[0xAC] = XOR_A_R8; // XOR A, H
UNPREFIXED_EXECUTORS[0xAD] = XOR_A_R8; // XOR A, L
UNPREFIXED_EXECUTORS[0xAE] = XOR_A_R8; // XOR A, (HL)
UNPREFIXED_EXECUTORS[0xAF] = XOR_A_R8;  // XOR A, A
export function XOR_A_R8(this: number, cpu: CPU): number {
    const source: R8 = this & 0b111;

    const value = cpu[source];

    const final = value ^ cpu[R8.A];
    cpu[R8.A] = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.half_carry = false;
    cpu.carry = false;

    return 1;
};

UNPREFIXED_EXECUTORS[0xB0] = OR_A_R8;  // OR A, B
UNPREFIXED_EXECUTORS[0xB1] = OR_A_R8;  // OR A, C
UNPREFIXED_EXECUTORS[0xB2] = OR_A_R8;  // OR A, D
UNPREFIXED_EXECUTORS[0xB3] = OR_A_R8;  // OR A, E
UNPREFIXED_EXECUTORS[0xB4] = OR_A_R8;  // OR A, H
UNPREFIXED_EXECUTORS[0xB5] = OR_A_R8;  // OR A, L
UNPREFIXED_EXECUTORS[0xB6] = OR_A_R8;  // OR A, (HL)
UNPREFIXED_EXECUTORS[0xB7] = OR_A_R8;  // OR A, A
export function OR_A_R8(this: number, cpu: CPU): number {
    const source: R8 = this & 0b111;

    const value = cpu[source];

    const final = value | cpu[R8.A];
    cpu[R8.A] = final;

    cpu.zero = final === 0;
    cpu.negative = false;
    cpu.half_carry = false;
    cpu.carry = false;

    return 1;
};

UNPREFIXED_EXECUTORS[0xB8] = CP_A_R8;  // CP A, B
UNPREFIXED_EXECUTORS[0xB9] = CP_A_R8;  // CP A, C
UNPREFIXED_EXECUTORS[0xBA] = CP_A_R8;  // CP A, D
UNPREFIXED_EXECUTORS[0xBB] = CP_A_R8;  // CP A, E
UNPREFIXED_EXECUTORS[0xBC] = CP_A_R8;  // CP A, H
UNPREFIXED_EXECUTORS[0xBD] = CP_A_R8;  // CP A, L
UNPREFIXED_EXECUTORS[0xBE] = CP_A_R8;  // CP A, (HL)
UNPREFIXED_EXECUTORS[0xBF] = CP_A_R8;  // CP A, A
export function CP_A_R8(this: number, cpu: CPU): number {
    const source: R8 = this & 0b111;

    const r8 = cpu[source];

    const newValue = (cpu[R8.A] - r8) & 0xFF;

    // DO not set register values for CP

    // Set flags
    cpu.carry = r8 > cpu[R8.A];
    cpu.zero = newValue === 0;
    cpu.negative = true;
    cpu.half_carry = (cpu[R8.A] & 0xF) - (r8 & 0xF) < 0;

    return 1;
};

UNPREFIXED_EXECUTORS[0x2F] = CPL;  // CPL
export function CPL(this: number, cpu: CPU): number {
    cpu[R8.A] = cpu[R8.A] ^ 0b11111111;

    cpu.negative = true;
    cpu.half_carry = true;
    return 1;
};

UNPREFIXED_EXECUTORS[0xD9] = RETI;  // RETI
export function RETI(this: number, cpu: CPU): number {
    cpu.pc = cpu.pop_tick() - 1;
    cpu.tick_addPending(4); // Branching takes 4 cycles
    cpu.ime = true;
    return 1;
};

UNPREFIXED_EXECUTORS[0x27] = DAA;  // DAA
export function DAA(this: number, cpu: CPU): number {
    if (!cpu.negative) {
        if (cpu.carry || cpu[R8.A] > 0x99) {
            cpu[R8.A] = (cpu[R8.A] + 0x60) & 0xFF;
            cpu.carry = true;
        }
        if (cpu.half_carry || (cpu[R8.A] & 0x0f) > 0x09) {
            cpu[R8.A] = (cpu[R8.A] + 0x6) & 0xFF;
        }
    }
    else {
        if (cpu.carry) {
            cpu[R8.A] = (cpu[R8.A] - 0x60) & 0xFF;
            cpu.carry = true;
        }
        if (cpu.half_carry) {
            cpu[R8.A] = (cpu[R8.A] - 0x6) & 0xFF;
        }
    }

    cpu.zero = cpu[R8.A] === 0;
    cpu.half_carry = false;
    return 1;
};

UNPREFIXED_EXECUTORS[0x00] = NOP;  // NOP
export function NOP(): number {
    return 1;
};

/** LD between A and R16 */
UNPREFIXED_EXECUTORS[0x02] = LD_iBC_A;
export function LD_iBC_A(this: number, cpu: CPU): number { // LD [BC], A
    cpu.write_tick(cpu[R16.BC], cpu[R8.A]);
    return 1;
};

UNPREFIXED_EXECUTORS[0x12] = LD_iDE_A;
export function LD_iDE_A(this: number, cpu: CPU): number {// LD [DE], A
    cpu.write_tick(cpu[R16.DE], cpu[R8.A]);
    return 1;
};
UNPREFIXED_EXECUTORS[0x22] = LD_iHLinc_A;
export function LD_iHLinc_A(this: number, cpu: CPU): number {// LD [HL+], A
    cpu.write_tick(cpu[R16.HL], cpu[R8.A]);
    cpu[R16.HL] = (cpu[R16.HL] + 1) & 0xFFFF;
    return 1;
};
UNPREFIXED_EXECUTORS[0x32] = LD_iHLdec_A;
export function LD_iHLdec_A(this: number, cpu: CPU): number {  // LD [HL-], A
    cpu.write_tick(cpu[R16.HL], cpu[R8.A]);
    cpu[R16.HL] = (cpu[R16.HL] - 1) & 0xFFFF;
    return 1;
};
UNPREFIXED_EXECUTORS[0x0A] = LD_A_iBC;
export function LD_A_iBC(this: number, cpu: CPU): number { // LD A, [BC]
    cpu[R8.A] = cpu.read_tick(cpu[R16.BC]);
    return 1;
};
UNPREFIXED_EXECUTORS[0x1A] = LD_A_iDE;
export function LD_A_iDE(this: number, cpu: CPU): number { // LD A, [DE]
    cpu[R8.A] = cpu.read_tick(cpu[R16.DE]);
    return 1;
};
UNPREFIXED_EXECUTORS[0x2A] = LD_A_iHLinc;
export function LD_A_iHLinc(this: number, cpu: CPU): number { // LD A, [HL+]
    cpu[R8.A] = cpu.read_tick(cpu[R16.HL]);
    cpu[R16.HL] = (cpu[R16.HL] + 1) & 0xFFFF;
    return 1;
};
UNPREFIXED_EXECUTORS[0x3A] = LD_A_iHLdec;
export function LD_A_iHLdec(this: number, cpu: CPU): number { // LD A, [HL-]
    cpu[R8.A] = cpu.read_tick(cpu[R16.HL]);
    cpu[R16.HL] = (cpu[R16.HL] - 1) & 0xFFFF;
    return 1;
};

UNPREFIXED_EXECUTORS[0xF2] = LD_A_iFF00plusC;
export function LD_A_iFF00plusC(this: number, cpu: CPU): number { // LD A, [$FF00+C]
    cpu[R8.A] = cpu.read_tick((0xFF00 | cpu[R8.C]) & 0xFFFF);
    return 1;
};
UNPREFIXED_EXECUTORS[0xE2] = LD_iFF00plusC_A;
export function LD_iFF00plusC_A(this: number, cpu: CPU): number {  // LD [$FF00+C], A
    cpu.write_tick((0xFF00 | cpu[R8.C]) & 0xFFFF, cpu[R8.A]);
    return 1;
};

UNPREFIXED_EXECUTORS[0xF3] = DI;
export function DI(this: number, cpu: CPU): number {  // DI - Disable interrupts master flag
    cpu.ime = false;
    return 1;
};
UNPREFIXED_EXECUTORS[0xFB] = EI;
export function EI(this: number, cpu: CPU): number {  // EI - Enable interrupts master flag
    cpu.scheduleEnableInterruptsForNextTick = true;
    return 1;
};

/** JP */
UNPREFIXED_EXECUTORS[0xE9] = JP_HL;
export function JP_HL(this: number, cpu: CPU): number {  // JP HL
    cpu.pc = cpu[R16.HL] - 1;
    return 1;
};


/** A rotate */
UNPREFIXED_EXECUTORS[0x07] = RLCA;
export function RLCA(this: number, cpu: CPU): number {    // RLC A
    const value = cpu[R8.A];

    const leftmostBit = (value & 0b10000000) >> 7;

    const newValue = ((value << 1) | leftmostBit) & 0xFF;

    cpu[R8.A] = newValue;

    cpu.zero = false;
    cpu.negative = false;
    cpu.half_carry = false;
    cpu.carry = (value >> 7) === 1;

    return 1;
};

UNPREFIXED_EXECUTORS[0x0F] = RRCA;
export function RRCA(this: number, cpu: CPU): number {  // RRC A

    const value = cpu[R8.A];

    const rightmostBit = (value & 1) << 7;
    const newValue = ((value >> 1) | rightmostBit) & 0xFF;

    cpu[R8.A] = newValue;

    cpu.zero = false;
    cpu.negative = false;
    cpu.half_carry = false;
    cpu.carry = (value & 1) === 1;

    return 1;
};

UNPREFIXED_EXECUTORS[0x1F] = RRA;
export function RRA(this: number, cpu: CPU): number {  // RR A
    const value = cpu[R8.A];

    const newValue = ((value >> 1) | (cpu.carry ? 128 : 0)) & 0xFF;

    cpu[R8.A] = newValue;

    cpu.zero = false;
    cpu.negative = false;
    cpu.half_carry = false;
    cpu.carry = !!(value & 1);

    return 1;
};
UNPREFIXED_EXECUTORS[0x17] = RLA;
export function RLA(this: number, cpu: CPU): number {  // RL A
    const value = cpu[R8.A];

    const newValue = ((value << 1) | (cpu.carry ? 1 : 0)) & 0xFF;

    cpu[R8.A] = newValue;

    cpu.zero = false;
    cpu.negative = false;
    cpu.half_carry = false;
    cpu.carry = (value >> 7) === 1;

    return 1;
};

UNPREFIXED_EXECUTORS[0x76] = HALT;
export function HALT(this: number, cpu: CPU): number {
    // HALT
    if (cpu.ime === true) {
        cpu.halted = true;
    } else {
        if (
            (
                cpu.ie.numerical &
                cpu.if.numerical &
                0x1F
            ) !== 0
        ) {
            // HALT bug
            cpu.haltBug = true;
        } else (
            cpu.ie.numerical &
            cpu.if.numerical &
            0x1F) === 0;
        {
            cpu.halted = true;
        }
    }
    return 1;
};

/** Carry flag */
UNPREFIXED_EXECUTORS[0x37] = SCF;
export function SCF(this: number, cpu: CPU): number { // SCF
    cpu.negative = false;
    cpu.half_carry = false;
    cpu.carry = true;
    return 1;
};

UNPREFIXED_EXECUTORS[0x3F] = CCF;
export function CCF(this: number, cpu: CPU): number {  // CCF
    cpu.negative = false;
    cpu.half_carry = false;
    cpu.carry = !cpu.carry;
    return 1;
};

UNPREFIXED_EXECUTORS[0xC9] = RET;  // RET
/** RET */
export function RET(this: number, cpu: CPU): number {
    cpu.pc = cpu.pop_tick() - 1;

    cpu.tick_addPending(4); // Branching takes 4 cycles

    return 1;
};

UNPREFIXED_EXECUTORS[0xD8] = RET_CC;  // RET C
UNPREFIXED_EXECUTORS[0xD0] = RET_CC;  // RET NC
UNPREFIXED_EXECUTORS[0xC8] = RET_CC;  // RET Z
UNPREFIXED_EXECUTORS[0xC0] = RET_CC;  // RET NZ
/** RET */
export function RET_CC(this: number, cpu: CPU): number {
    cpu.tick_addPending(4); // Branch decision?

    const cc: CC = (this & 0b11000) >> 3;
    if (cc === CC.NZ && cpu.zero) { return 1; }
    if (cc === CC.Z && !cpu.zero) { return 1; }
    if (cc === CC.NC && cpu.carry) { return 1; }
    if (cc === CC.C && !cpu.carry) { return 1; }

    cpu.pc = cpu.pop_tick() - 1;

    cpu.tick_addPending(4); // Branching takes 4 cycles

    return 1;
};


UNPREFIXED_EXECUTORS[0xC7] = RST;  // RST 00h 
UNPREFIXED_EXECUTORS[0xCF] = RST;  // RST 08h
UNPREFIXED_EXECUTORS[0xD7] = RST;  // RST 10h
UNPREFIXED_EXECUTORS[0xDF] = RST;  // RST 18h
UNPREFIXED_EXECUTORS[0xE7] = RST;  // RST 20h
UNPREFIXED_EXECUTORS[0xEF] = RST;  // RST 28h
UNPREFIXED_EXECUTORS[0xF7] = RST;  // RST 30h
UNPREFIXED_EXECUTORS[0xFF] = RST;  // RST 38h
/** Reset Vectors */
export function RST(this: number, cpu: CPU): number {
    const target = this & 0b111000;

    cpu.push_tick(cpu.pc + 1);

    cpu.pc = target - 1;

    return 1;
};

// Invalid
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
export function INVALID(this: number, cpu: CPU): number {
    cpu.pc--;
    cpu.ime = false;
    cpu.halted = true;
    return 1;
};

UNPREFIXED_EXECUTORS[0x09] = ADD_HL_R16; // ADD HL, BC
UNPREFIXED_EXECUTORS[0x19] = ADD_HL_R16; // ADD HL, DE
UNPREFIXED_EXECUTORS[0x29] = ADD_HL_R16; // ADD HL, HL
UNPREFIXED_EXECUTORS[0x39] = ADD_HL_R16; // ADD HL, SP
/** ADD HL, R16 */
export function ADD_HL_R16(this: number, cpu: CPU): number {
    const r16Value = cpu[[R16.BC, R16.DE, R16.HL, R16.SP][this >> 4]];

    const hl = cpu[R16.HL];
    const newValue = r16Value + hl;

    // Set flag
    cpu.negative = false;
    cpu.half_carry = (hl & 0xFFF) + (r16Value & 0xFFF) > 0xFFF;
    cpu.carry = newValue > 0xFFFF;

    // Set register values
    cpu[R16.HL] = newValue & 0xFFFF;

    // Register read takes 4 more cycles
    cpu.tick_addPending(4);

    return 1;
};

// Fetch a byte and forward it to 0xCB executors
UNPREFIXED_EXECUTORS[0xCB] = function (this: number, cpu: CPU): number {
    return CB_PREFIXED_EXECUTORS[cpu.read_tick(cpu.pc + 1)](cpu);
};

for (let i = 0; i < 256; i++) {
    const func = UNPREFIXED_EXECUTORS[i];
    if (func != undefined)
        UNPREFIXED_EXECUTORS[i] = func.bind(i);
}
