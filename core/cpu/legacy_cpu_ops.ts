import { CPU } from "../gameboy";
import { R8, R16, CC } from "./cpu";
import { unTwo8b } from "../../src/gameboy/tools/util";

/** @deprecated
 * 
 * I've moved this back into the main CPU class. Check there.
 */
export default class Ops {
    static UNKNOWN_OPCODE(cpu: CPU) {
        cpu.pc--;
    }


    static INVALID_OPCODE(cpu: CPU) {
        cpu.pc--;
        cpu.invalidOpcodeExecuted = true;
    }

    // #region INSTRUCTIONS

    // NOP - 0x00
    static NOP(cpu: CPU) {

    }

    // DI - 0xF3
    static DI(cpu: CPU) {
        cpu.gb.interrupts.masterEnabled = false;

        if (cpu.minDebug)
            cpu.addToLog(`--- INTERRUPTS DISABLED ---`);

        // writeDebug("Disabled interrupts");
    }


    // EI - 0xFB
    static EI(cpu: CPU) {
        cpu.scheduleEnableInterruptsForNextTick = true;
    }

    // HALT - 0x76
    static HALT(cpu: CPU) {

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
    }

    static STOP(cpu: CPU) {
        if (cpu.gb.prepareSpeedSwitch) {
            cpu.gb.doubleSpeed = !cpu.gb.doubleSpeed;
            console.log("Speed switch");
        }
    }

    // wtf is a DAA?
    // Decimal adjust A
    static DA_A(cpu: CPU) {
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
    }

    // Load SP into index
    static LD_iN16_SP(cpu: CPU, in16: number) {
        const spUpperByte = cpu.reg.sp >> 8;
        const spLowerByte = cpu.reg.sp & 0b11111111;

        cpu.writeMem8(in16 + 0, spLowerByte);
        cpu.writeMem8(in16 + 1, (spUpperByte) & 0xFFFF);
    }


    static RST(cpu: CPU, vector: number) {
        const pcUpperByte = ((cpu.pc + 1) & 0xFFFF) >> 8;
        const pcLowerByte = ((cpu.pc + 1) & 0xFFFF) & 0xFF;

        cpu.reg.sp = (cpu.reg.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu.reg.sp, pcUpperByte);
        cpu.reg.sp = (cpu.reg.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu.reg.sp, pcLowerByte);

        cpu.pc = vector - 1;

        cpu.cycles += 4;
    }

    static LD_A_iN16(cpu: CPU, n16: number) {
        cpu.reg[R8.A] = cpu.fetchMem8(n16);
    }

    static LD_iHL_N8(cpu: CPU, n8: number) {
        cpu.writeMem8(cpu.reg.hl, n8);
    }

    static LD_iHL_R8(cpu: CPU, r8: R8) {
        cpu.writeMem8(cpu.reg.hl, cpu.reg[r8]);
    }

    static ADD_iHL(cpu: CPU) {
        cpu.reg[R8.A] = (cpu.reg[R8.A] + cpu.fetchMem8(cpu.reg.hl)) & 0xFF;
    }

    static CP_A_iHL(cpu: CPU) {
        const u8 = cpu.fetchMem8(cpu.reg[R16.HL]);
        cpu.reg._f.zero = cpu.reg[R8.A] - u8 === 0;
        cpu.reg._f.negative = true;
        cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) + (u8 & 0xF) > 0xF;
        cpu.reg._f.carry = u8 > cpu.reg[R8.A];
    }

    static LD_A_iFF00plusN8(cpu: CPU, n8: number) {
        cpu.reg[R8.A] = cpu.fetchMem8((0xFF00 + n8) & 0xFFFF);
    }

    static LD_A_iFF00plusC(cpu: CPU) {
        cpu.reg[R8.A] = cpu.fetchMem8((0xFF00 + cpu.reg[R8.C]) & 0xFFFF);
    }

    static LD_iR16_A(cpu: CPU, r16: R16) {
        cpu.writeMem8(cpu.reg[r16], cpu.reg[R8.A]);
    }

    // Store value in register A into address n16
    static LD_iN16_A(cpu: CPU, n16: number) {
        cpu.writeMem8(n16, cpu.reg[R8.A]);
    }

    /*  PUSH r16 - 0xC5
        Push register r16 onto the stack. */
    static PUSH_R16(cpu: CPU, r16: R16) {
        const value = cpu.reg[r16];
        const upperByte = value >> 8;
        const lowerByte = value & 0b11111111;

        cpu.reg.sp = (cpu.reg.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu.reg.sp, upperByte);
        cpu.reg.sp = (cpu.reg.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu.reg.sp, lowerByte);

        // 4 cycle penalty
        cpu.cycles += 4;
    }

    /*  PUSH r16 - 0xC1
        Pop off the stack into r16. */
    static POP_R16(cpu: CPU, r16: R16) {
        const lowerByte = cpu.fetchMem8(cpu.reg.sp);
        cpu.reg.sp = (cpu.reg.sp + 1) & 0xFFFF;
        const upperByte = cpu.fetchMem8(cpu.reg.sp);
        cpu.reg.sp = (cpu.reg.sp + 1) & 0xFFFF;

        cpu.reg[r16] = (upperByte << 8) | lowerByte;
    }

    // CALL n16 - 0xCD
    static CALL_N16(cpu: CPU, cc: CC, u16: number) {
        if (cc === CC.Z && !cpu.reg._f.zero) return;
        if (cc === CC.NZ && cpu.reg._f.zero) return;
        if (cc === CC.C && !cpu.reg._f.carry) return;
        if (cc === CC.NC && cpu.reg._f.carry) return;

        const pcUpperByte = ((cpu.pc + 3) & 0xFFFF) >> 8;
        const pcLowerByte = ((cpu.pc + 3) & 0xFFFF) & 0xFF;

        // console.info(`Calling 0x${u16.toString(16)} from 0x${cpu.pc.toString(16)}`);

        cpu.reg.sp = (cpu.reg.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu.reg.sp, pcUpperByte);
        cpu.reg.sp = (cpu.reg.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu.reg.sp, pcLowerByte);

        cpu.pc = u16 - 3;

        cpu.cycles += 4; // Branching takes 4 cycles
    }

    static JP_N16(cpu: CPU, cc: CC, n16: number) {

        if (cc === CC.Z && !cpu.reg._f.zero) return;
        if (cc === CC.NZ && cpu.reg._f.zero) return;
        if (cc === CC.C && !cpu.reg._f.carry) return;
        if (cc === CC.NC && cpu.reg._f.carry) return;

        cpu.pc = n16 - 3;

        cpu.cycles += 4; // Branching takes 4 cycles
    }

    static JP_HL(cpu: CPU) {
        cpu.pc = cpu.reg.hl - 1;
    }


    static RET(cpu: CPU, cc: CC) {
        cpu.cycles += 4; // Branch decision?

        if (cc === CC.Z && !cpu.reg._f.zero) return;
        if (cc === CC.NZ && cpu.reg._f.zero) return;
        if (cc === CC.C && !cpu.reg._f.carry) return;
        if (cc === CC.NC && cpu.reg._f.carry) return;

        const stackLowerByte = cpu.fetchMem8((cpu.reg.sp++) & 0xFFFF);
        const stackUpperByte = cpu.fetchMem8((cpu.reg.sp++) & 0xFFFF);

        const returnAddress = (((stackUpperByte << 8) | stackLowerByte)) & 0xFFFF;
        // console.info(`Returning to 0x${returnAddress.toString(16)}`);

        cpu.pc = returnAddress - 1;

        cpu.cycles += 4; // Branching takes 4 cycles
    }

    static RETI(cpu: CPU) {
        Ops.RET(cpu, CC.UNCONDITIONAL);
        Ops.EI(cpu);
    }

    // LD A,(R16)
    static LD_A_iR16(cpu: CPU, r16: R16) {
        cpu.reg[R8.A] = cpu.fetchMem8(cpu.reg[r16]);
    }

    static LD_R16_A(cpu: CPU, t: R8) {
        cpu.writeMem8(cpu.fetchMem8(cpu.reg[t]), cpu.reg[R8.A]);
    }

    static LD_HL_SPaddE8(cpu: CPU, e8: number) {
        const signedVal = unTwo8b(e8);

        cpu.reg._f.zero = false;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = (signedVal & 0xF) + (cpu.reg.sp & 0xF) > 0xF;
        cpu.reg._f.carry = (signedVal & 0xFF) + (cpu.reg.sp & 0xFF) > 0xFF;

        cpu.reg.hl = (unTwo8b(e8) + cpu.reg.sp) & 0xFFFF;

        // Register read timing
        cpu.cycles += 4;
    }

    // LD [$FF00+u8],A
    static LD_iFF00plusN8_A(cpu: CPU, u8: number) {
        const value = cpu.reg[R8.A];
        cpu.writeMem8((0xFF00 + u8) & 0xFFFF, value);
        // writeDebug(0xFF00 + u8);
    }

    // LD [$FF00+C],A
    static LD_iFF00plusC_A(cpu: CPU) {
        const value = cpu.reg[R8.A];
        cpu.writeMem8((0xFF00 + cpu.reg[R8.C]) & 0xFFFF, value);
    }

    static LD_R8_N8(cpu: CPU, r8: R8, n8: number) {
        cpu.reg[r8] = n8;
    }

    // Store value in register on the right into register on the left
    static LD_R8_R8(cpu: CPU, r8: R8, r8_2: R8) {
        cpu.reg[r8] = cpu.reg[r8_2];
    }

    // LD r16,n16 - 0x21, 
    static LD_R16_N16(cpu: CPU, r16: R16, n16: number) {
        cpu.reg[r16] = n16;
    }


    // LD [HL+],A | Store value in register A into byte pointed by HL and post-increment HL.  
    static LD_iHLinc_A(cpu: CPU) {
        cpu.writeMem8(cpu.reg.hl, cpu.reg[R8.A]);
        cpu.reg.hl = (cpu.reg.hl + 1) & 0xFFFF;
    }
    // LD [HL-],A | Store value in register A into byte pointed by HL and post-decrement HL. 
    static LD_iHLdec_A(cpu: CPU) {
        cpu.writeMem8(cpu.reg.hl, cpu.reg[R8.A]);
        cpu.reg.hl = (cpu.reg.hl - 1) & 0xFFFF;
    }

    // LD A,[HL+] | Store value in byte pointed by HL into A, then post-increment HL.
    static LD_A_iHLinc(cpu: CPU) {
        cpu.reg[R8.A] = cpu.fetchMem8(cpu.reg.hl);
        cpu.reg.hl = (cpu.reg.hl + 1) & 0xFFFF;
    }
    // LD A,[HL-] | Store value in byte pointed by HL into A, then post-decrement HL.
    static LD_A_iHLdec(cpu: CPU) {
        cpu.reg[R8.A] = cpu.fetchMem8(cpu.reg.hl);
        cpu.reg.hl = (cpu.reg.hl - 1) & 0xFFFF;
    }

    // ADD SP, e8
    static ADD_SP_E8(cpu: CPU, e8: number) {
        const value = unTwo8b(e8);

        cpu.reg._f.zero = false;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = ((value & 0xF) + (cpu.reg.sp & 0xF)) > 0xF;
        cpu.reg._f.carry = ((value & 0xFF) + (cpu.reg.sp & 0xFF)) > 0xFF;

        cpu.reg.sp = (cpu.reg.sp + value) & 0xFFFF;

        // Extra time
        cpu.cycles += 8;
    }

    // JR
    static JR_E8(cpu: CPU, cc: CC, n8: number) {
        if (cc === CC.Z && !cpu.reg._f.zero) return;
        if (cc === CC.NZ && cpu.reg._f.zero) return;
        if (cc === CC.C && !cpu.reg._f.carry) return;
        if (cc === CC.NC && cpu.reg._f.carry) return;

        cpu.pc += unTwo8b(n8);

        cpu.cycles += 4; // Branching takes 4 cycles
    }

    static LD_SP_HL(cpu: CPU) {
        cpu.reg.sp = cpu.reg.hl;

        // Register read timing
        cpu.cycles += 4;
    }

    // ADD A, r8
    static ADD_A_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];
        cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) + (value & 0xF) > 0xF;

        const newValue = (value + cpu.reg[R8.A]) & 0xFF;
        const didOverflow = ((value + cpu.reg[R8.A]) >> 8) !== 0;

        // Set register values
        cpu.reg[R8.A] = newValue;

        // Set flags
        cpu.reg._f.carry = didOverflow;
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
    }

    // ADD A, N8
    static ADD_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const newValue = (value + cpu.reg[R8.A]) & 0xFF;
        const didOverflow = ((value + cpu.reg[R8.A]) >> 8) !== 0;

        // Set flags
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) + (value & 0xF) > 0xF;
        cpu.reg._f.carry = didOverflow;

        // Set register values
        cpu.reg[R8.A] = newValue;
    }

    // ADC A, r8
    static ADC_A_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const newValue = (value + cpu.reg[R8.A] + (cpu.reg._f.carry ? 1 : 0)) & 0xFF;
        const didOverflow = ((value + cpu.reg[R8.A] + (cpu.reg._f.carry ? 1 : 0)) >> 8) !== 0;

        // Set flags
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) + (value & 0xF) + (cpu.reg._f.carry ? 1 : 0) > 0xF;
        cpu.reg._f.carry = didOverflow;

        // Set register values
        cpu.reg[R8.A] = newValue;
    }

    // ADC A, n8
    static ADC_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const newValue = (value + cpu.reg[R8.A] + (cpu.reg._f.carry ? 1 : 0)) & 0xFF;
        const didOverflow = ((value + cpu.reg[R8.A] + (cpu.reg._f.carry ? 1 : 0)) >> 8) !== 0;

        // Set flags
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) + (value & 0xF) + (cpu.reg._f.carry ? 1 : 0) > 0xF;
        cpu.reg._f.carry = didOverflow;

        // Set register values
        cpu.reg[R8.A] = newValue;
    }

    static ADD_HL_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const newValue = (value + cpu.reg.hl) & 0xFFFF;
        const didOverflow = ((value + cpu.reg.hl) >> 8) !== 0;

        // Set register values
        cpu.reg.hl = newValue;

        // Set flags
        cpu.reg._f.carry = didOverflow;
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) + (value & 0xF) > 0xF;
    }

    static ADD_HL_R16(cpu: CPU, r16: R16) {
        const r16Value = cpu.reg[r16];

        const newValue = (r16Value + cpu.reg.hl) & 0xFFFF;
        const didOverflow = ((r16Value + cpu.reg.hl) >> 16) !== 0;

        // Set flag
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = (cpu.reg.hl & 0xFFF) + (r16Value & 0xFFF) > 0xFFF;
        cpu.reg._f.carry = didOverflow;

        // Set register values
        cpu.reg.hl = newValue;

        // Register read takes 4 more cycles
        cpu.cycles += 4;
    }

    static SUB_A_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const newValue = (cpu.reg[R8.A] - value) & 0xFF;

        // Set flags
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = true;
        cpu.reg._f.half_carry = (value & 0xF) > (cpu.reg[R8.A] & 0xF);
        cpu.reg._f.carry = value > cpu.reg[R8.A];

        // Set register values
        cpu.reg[R8.A] = newValue;
    }


    static SUB_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const newValue = (cpu.reg[R8.A] - value) & 0xFF;

        // Set flags
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = true;
        cpu.reg._f.half_carry = (value & 0xF) > (cpu.reg[R8.A] & 0xF);
        cpu.reg._f.carry = value > cpu.reg[R8.A];

        // Set register values
        cpu.reg[R8.A] = newValue;
    }

    static SBC_A_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const newValue = (cpu.reg[R8.A] - value - (cpu.reg._f.carry ? 1 : 0)) & 0xFF;

        // Set flags
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = true;
        cpu.reg._f.half_carry = (value & 0xF) > (cpu.reg[R8.A] & 0xF) - (cpu.reg._f.carry ? 1 : 0);
        cpu.reg._f.carry = value > cpu.reg[R8.A] - (cpu.reg._f.carry ? 1 : 0);

        // Set register values
        cpu.reg[R8.A] = newValue;
    }

    static SBC_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const newValue = (cpu.reg[R8.A] - value - (cpu.reg._f.carry ? 1 : 0)) & 0xFF;

        // Set flags
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = true;
        cpu.reg._f.half_carry = (value & 0xF) > (cpu.reg[R8.A] & 0xF) - (cpu.reg._f.carry ? 1 : 0);
        cpu.reg._f.carry = value > cpu.reg[R8.A] - (cpu.reg._f.carry ? 1 : 0);

        // Set register values
        cpu.reg[R8.A] = newValue;
    }

    static AND_A_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const final = value & cpu.reg[R8.A];
        cpu.reg[R8.A] = final;

        // Set flags
        cpu.reg._f.zero = cpu.reg[R8.A] === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = true;
        cpu.reg._f.carry = false;
    }

    static AND_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const final = value & cpu.reg[R8.A];
        cpu.reg[R8.A] = final;

        cpu.reg._f.zero = cpu.reg[R8.A] === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = true;
        cpu.reg._f.carry = false;
    }

    static OR_A_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const final = value | cpu.reg[R8.A];
        cpu.reg[R8.A] = final;

        cpu.reg._f.zero = final === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = false;
    }

    static OR_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const final = value | cpu.reg[R8.A];
        cpu.reg[R8.A] = final;

        cpu.reg._f.zero = final === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = false;
    }

    static XOR_A_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const final = value ^ cpu.reg[R8.A];
        cpu.reg[R8.A] = final;

        cpu.reg._f.zero = final === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = false;
    }

    static XOR_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const final = value ^ cpu.reg[R8.A];
        cpu.reg[R8.A] = final;

        cpu.reg._f.zero = final === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = false;
    }

    // CP A,r8
    static CP_A_R8(cpu: CPU, t: R8) {
        const r8 = cpu.reg[t];

        const newValue = (cpu.reg[R8.A] - r8) & 0xFF;
        const didOverflow = ((cpu.reg[R8.A] - r8) >> 8) !== 0;

        // DO not set register values for CP

        // Set flags
        cpu.reg._f.carry = r8 > cpu.reg[R8.A];
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = true;
        cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) - (r8 & 0xF) < 0;
    }


    static CP_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const newValue = (cpu.reg[R8.A] - value) & 0xFF;
        const didOverflow = ((cpu.reg[R8.A] - value) >> 8) !== 0;


        // Set flags
        cpu.reg._f.carry = value > cpu.reg[R8.A];
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = true;
        cpu.reg._f.half_carry = (cpu.reg[R8.A] & 0xF) - (n8 & 0xF) < 0;
    }

    static INC_R8(cpu: CPU, t: R8) {
        const target = cpu.reg[t];

        const newValue = (target + 1) & 0xFF;
        const didOverflow = ((target + 1) >> 8) !== 0;

        cpu.reg[t] = newValue;

        // UNMODIFIED cpu._r._f.carry = didOverflow;
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
    }


    // Increment in register r16
    static INC_R16(cpu: CPU, r16: R16) {
        cpu.reg[r16] = (cpu.reg[r16] + 1) & 0xFFFF;

        // Extra time for register writeback
        cpu.cycles += 4;
    }

    static DEC_R8(cpu: CPU, t: R8) {
        const target = cpu.reg[t];

        const newValue = (target - 1) & 0xFF;

        cpu.reg[t] = newValue;

        // UNMODIFIED cpu._r._f.carry = didOverflow;
        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = true;
        cpu.reg._f.half_carry = (1 & 0xF) > (target & 0xF);
    }

    static DEC_R16(cpu: CPU, tt: R16) {
        cpu.reg[tt] = (cpu.reg[tt] - 1) & 0xFFFF;

        // Extra time for register writeback
        cpu.cycles += 4;
    }

    static CCF(cpu: CPU) {
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = !cpu.reg._f.carry;
    }

    static SCF(cpu: CPU) {
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = true;
    }


    static CPL(cpu: CPU) {
        cpu.reg[R8.A] = cpu.reg[R8.A] ^ 0b11111111;

        cpu.reg._f.negative = true;
        cpu.reg._f.half_carry = true;
    }

    // #region 0xCB Opcodes

    static BIT_R8(cpu: CPU, t: R8, selectedBit: number) {
        const value = cpu.reg[t];

        cpu.reg._f.zero = (value & (1 << selectedBit)) === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = true;
    }

    static RES_R8(cpu: CPU, t: R8, selectedBit: number) {
        const value = cpu.reg[t];
        const mask = 0b1 << selectedBit;

        const final = value & ~(mask);

        cpu.reg[t] = final;
    }

    static SET_R8(cpu: CPU, t: R8, selectedBit: number) {
        let value = cpu.reg[t];
        const mask = 0b1 << selectedBit;

        const final = value |= mask;

        cpu.reg[t] = final;
    }

    // Rotate A right through carry
    static RRA(cpu: CPU) {
        const value = cpu.reg[R8.A];

        const carryMask = (cpu.reg.f & 0b00010000) << 3;

        const newValue = ((value >> 1) | carryMask) & 0xFF;

        cpu.reg[R8.A] = newValue;

        cpu.reg._f.zero = false;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = !!(value & 1);
    }


    // Rotate TARGET right through carry
    static RR_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const carryMask = (cpu.reg.f & 0b00010000) << 3;

        const newValue = ((value >> 1) | carryMask) & 0xFF;

        cpu.reg[t] = newValue;

        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = !!(value & 1);
    }

    // Rotate A left through carry
    static RLA(cpu: CPU) {
        const value = cpu.reg[R8.A];

        const carryMask = (cpu.reg.f & 0b00010000) >> 4;

        const newValue = ((value << 1) | carryMask) & 0xFF;

        cpu.reg[R8.A] = newValue;

        cpu.reg._f.zero = false;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = (value >> 7) === 1;
    }

    // Rotate TARGET left through carry
    static RL_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const carryMask = (cpu.reg.f & 0b00010000) >> 4;

        const newValue = ((value << 1) | carryMask) & 0xFF;

        cpu.reg[t] = newValue;

        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = (value >> 7) === 1;
    }

    // Rotate A right
    static RRCA(cpu: CPU) {
        const value = cpu.reg[R8.A];

        const rightmostBit = (value & 1) << 7;
        const newValue = ((value >> 1) | rightmostBit) & 0xFF;

        cpu.reg[R8.A] = newValue;

        cpu.reg._f.zero = false;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = (value & 1) === 1;
    }


    // Rotate TARGET right
    static RRC_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const rightmostBit = (value & 1) << 7;
        const newValue = ((value >> 1) | rightmostBit) & 0xFF;

        cpu.reg[t] = newValue;

        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = !!(value & 1);
    }

    // Rotate A left
    static RLCA(cpu: CPU) {
        const value = cpu.reg[R8.A];

        const leftmostBit = (value & 0b10000000) >> 7;

        const newValue = ((value << 1) | leftmostBit) & 0xFF;

        cpu.reg[R8.A] = newValue;

        cpu.reg._f.zero = false;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = (value >> 7) === 1;
    }

    // Rotate TARGET left
    static RLC_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const leftmostBit = (value & 0b10000000) >> 7;

        const newValue = ((value << 1) | leftmostBit) & 0xFF;

        cpu.reg[t] = newValue;

        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = (value >> 7) === 1;
    }

    // Shift TARGET right
    static SRA_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const leftmostBit = value & 0b10000000;
        const newValue = (value >> 1) | leftmostBit;

        cpu.reg[t] = newValue;

        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = !!(value & 1);
    }

    // Shift TARGET left 
    static SLA_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const newValue = (value << 1) & 0xFF;
        const didOverflow = ((value << 1) >> 8) !== 0;

        cpu.reg[t] = newValue;

        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = didOverflow;
    }

    // Shift right logic register
    static SRL_R8(cpu: CPU, t: R8) {
        const value = cpu.reg[t];

        const newValue = value >> 1;

        cpu.reg[t] = newValue;

        cpu.reg._f.zero = newValue === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = !!(value & 1);
    }

    // SWAP 
    static SWAP_R8(cpu: CPU, r8: R8) {
        const value = cpu.reg[r8];

        const lowerNybble = value & 0b00001111;
        const upperNybble = (value >> 4) & 0b00001111;

        cpu.reg[r8] = (lowerNybble << 4) | upperNybble;

        cpu.reg._f.zero = value === 0;
        cpu.reg._f.negative = false;
        cpu.reg._f.half_carry = false;
        cpu.reg._f.carry = false;
    }
}