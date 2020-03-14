import CPU, { R8, R16, CC } from './cpu';
import { unTwo8b } from '../tools/util';

class Ops {
    static UNKNOWN_OPCODE(cpu: CPU) {
        cpu.pc--;
    }


    static INVALID_OPCODE(cpu: CPU) {
        cpu.pc--;
    }

    // #region INSTRUCTIONS

    // NOP - 0x00
    static NOP(cpu: CPU) {

    }

    // DI - 0xF3
    static DI(cpu: CPU) {
        cpu.gb.bus.interrupts.masterEnabled = false;

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
                cpu.gb.bus.interrupts.enabledInterrupts.numerical &
                cpu.gb.bus.interrupts.requestedInterrupts.numerical &
                0x1F
            ) !== 0
        ) {
            // HALT bug
            cpu.haltBug = true;
            cpu.pc++; cpu.pc &= 0xFFFF;
        } else (
            cpu.gb.bus.interrupts.enabledInterrupts.numerical &
            cpu.gb.bus.interrupts.requestedInterrupts.numerical &
            0x1F) === 0;
        {
            cpu.halted = true;
        }
    }

    static STOP(cpu: CPU) {
        // alert(`[PC: ${hex(cpu.pc, 4)}] CPU has been stopped`);
    }

    // wtf is a DAA?
    // Decimal adjust A
    static DA_A(cpu: CPU) {
        if (!cpu._r._f.negative) {
            if (cpu._r._f.carry || cpu._r.gen[R8.A] > 0x99) {
                cpu._r.gen[R8.A] = (cpu._r.gen[R8.A] + 0x60) & 0xFF;
                cpu._r._f.carry = true;
            }
            if (cpu._r._f.half_carry || (cpu._r.gen[R8.A] & 0x0f) > 0x09) {
                cpu._r.gen[R8.A] = (cpu._r.gen[R8.A] + 0x6) & 0xFF;
            }
        }
        else {
            if (cpu._r._f.carry) {
                cpu._r.gen[R8.A] = (cpu._r.gen[R8.A] - 0x60) & 0xFF;
                cpu._r._f.carry = true;
            }
            if (cpu._r._f.half_carry) {
                cpu._r.gen[R8.A] = (cpu._r.gen[R8.A] - 0x6) & 0xFF;
            }
        }

        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
        cpu._r._f.half_carry = false;
    }

    // Load SP into index
    static LD_iN16_SP(cpu: CPU, in16: number) {
        let spUpperByte = cpu._r.sp >> 8;
        let spLowerByte = cpu._r.sp & 0b11111111;

        cpu.writeMem8(in16 + 0, spLowerByte);
        cpu.writeMem8(in16 + 1, (spUpperByte) & 0xFFFF);
    }


    static RST(cpu: CPU, vector: number) {
        let pcUpperByte = ((cpu.pc + 1) & 0xFFFF) >> 8;
        let pcLowerByte = ((cpu.pc + 1) & 0xFFFF) & 0xFF;

        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu._r.sp, pcUpperByte);
        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu._r.sp, pcLowerByte);

        cpu.pc = vector - 1;

        cpu.cycles += 4;
    }

    static LD_A_iN16(cpu: CPU, n16: number) {
        cpu._r.gen[R8.A] = cpu.fetchMem8(n16);
    }

    static LD_iHL_N8(cpu: CPU, n8: number) {
        cpu.writeMem8(cpu._r.hl, n8);
    }

    static LD_iHL_R8(cpu: CPU, r8: R8) {
        cpu.writeMem8(cpu._r.hl, cpu._r.gen[r8]);
    }

    static ADD_iHL(cpu: CPU) {
        cpu._r.gen[R8.A] = (cpu._r.gen[R8.A] + cpu.fetchMem8(cpu._r.hl)) & 0xFF;
    }

    static CP_A_iHL(cpu: CPU) {
        let u8 = cpu.fetchMem8(cpu.getReg16(R16.HL));
        cpu._r._f.zero = cpu._r.gen[R8.A] - u8 === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) + (u8 & 0xF) > 0xF;
        cpu._r._f.carry = u8 > cpu._r.gen[R8.A];
    }

    static LD_A_iFF00plusN8(cpu: CPU, n8: number) {
        cpu._r.gen[R8.A] = cpu.fetchMem8((0xFF00 + n8) & 0xFFFF);
    }

    static LD_A_iFF00plusC(cpu: CPU) {
        cpu._r.gen[R8.A] = cpu.fetchMem8((0xFF00 + cpu._r.gen[R8.A]) & 0xFFFF);
    }

    static LD_iR16_A(cpu: CPU, r16: R16) {
        cpu.writeMem8(cpu.getReg16(r16), cpu._r.gen[R8.A]);
    }

    // Store value in register A into address n16
    static LD_iN16_A(cpu: CPU, n16: number) {
        cpu.writeMem8(n16, cpu._r.gen[R8.A]);
    }

    /*  PUSH r16 - 0xC5
        Push register r16 onto the stack. */
    static PUSH_R16(cpu: CPU, r16: R16) {
        let value = cpu.getReg16(r16);
        let upperByte = value >> 8;
        let lowerByte = value & 0b11111111;

        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu._r.sp, upperByte);
        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu._r.sp, lowerByte);
    }

    /*  PUSH r16 - 0xC1
        Pop off the stack into r16. */
    static POP_R16(cpu: CPU, r16: R16) {
        let lowerByte = cpu.fetchMem8(cpu._r.sp);
        cpu._r.sp = (cpu._r.sp + 1) & 0xFFFF;
        let upperByte = cpu.fetchMem8(cpu._r.sp);
        cpu._r.sp = (cpu._r.sp + 1) & 0xFFFF;

        cpu.setReg16(r16, (upperByte << 8) | lowerByte);
    }

    // CALL n16 - 0xCD
    static CALL_N16(cpu: CPU, cc: CC, u16: number) {
        if (cc === CC.Z && !cpu._r._f.zero) return;
        if (cc === CC.NZ && cpu._r._f.zero) return;
        if (cc === CC.C && !cpu._r._f.carry) return;
        if (cc === CC.NC && cpu._r._f.carry) return;

        let pcUpperByte = ((cpu.pc + 3) & 0xFFFF) >> 8;
        let pcLowerByte = ((cpu.pc + 3) & 0xFFFF) & 0xFF;

        // console.info(`Calling 0x${u16.toString(16)} from 0x${cpu.pc.toString(16)}`);

        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu._r.sp, pcUpperByte);
        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu._r.sp, pcLowerByte);

        cpu.pc = u16 - 3;

        cpu.cycles += 4; // Branching takes 4 cycles
    }

    static JP_N16(cpu: CPU, cc: CC, n16: number) {
        if (cc === CC.Z && !cpu._r._f.zero) return;
        if (cc === CC.NZ && cpu._r._f.zero) return;
        if (cc === CC.C && !cpu._r._f.carry) return;
        if (cc === CC.NC && cpu._r._f.carry) return;

        cpu.pc = n16 - 3;

        cpu.cycles += 4; // Branching takes 4 cycles
    }

    static JP_HL(cpu: CPU) {
        cpu.pc = cpu._r.hl - 1;
    }


    static RET(cpu: CPU, cc: CC) {
        cpu.cycles += 4; // Branch decision?

        if (cc === CC.Z && !cpu._r._f.zero) return;
        if (cc === CC.NZ && cpu._r._f.zero) return;
        if (cc === CC.C && !cpu._r._f.carry) return;
        if (cc === CC.NC && cpu._r._f.carry) return;

        let stackLowerByte = cpu.fetchMem8((cpu._r.sp++) & 0xFFFF);
        let stackUpperByte = cpu.fetchMem8((cpu._r.sp++) & 0xFFFF);

        let returnAddress = (((stackUpperByte << 8) | stackLowerByte) - 1) & 0xFFFF;
        // console.info(`Returning to 0x${returnAddress.toString(16)}`);

        cpu.pc = returnAddress;

        cpu.cycles += 4; // Branching takes 4 cycles
    }

    static RETI(cpu: CPU) {
        Ops.RET(cpu, CC.UNCONDITIONAL);
        Ops.EI(cpu);
    }

    // LD A,(R16)
    static LD_A_iR16(cpu: CPU, r16: R16) {
        cpu._r.gen[R8.A] = cpu.fetchMem8(cpu.getReg16(r16));
    }

    static LD_R16_A(cpu: CPU, t: R8) {
        cpu.writeMem8(cpu.fetchMem8(cpu._r.gen[t]), cpu._r.gen[R8.A]);
    }

    static LD_HL_SPaddE8(cpu: CPU, e8: number) {
        let signedVal = unTwo8b(e8);

        cpu._r._f.zero = false;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = (signedVal & 0xF) + (cpu._r.sp & 0xF) > 0xF;
        cpu._r._f.carry = (signedVal & 0xFF) + (cpu._r.sp & 0xFF) > 0xFF;

        cpu._r.hl = (unTwo8b(e8) + cpu._r.sp) & 0xFFFF;
    }

    // LD [$FF00+u8],A
    static LD_iFF00plusN8_A(cpu: CPU, u8: number) {
        let value = cpu._r.gen[R8.A];
        cpu.writeMem8((0xFF00 + u8) & 0xFFFF, value);
        // writeDebug(0xFF00 + u8);
    }

    // LD [$FF00+C],A
    static LD_iFF00plusC_A(cpu: CPU) {
        let value = cpu._r.gen[R8.A];
        cpu.writeMem8((0xFF00 + cpu._r.gen[R8.C]) & 0xFFFF, value);
    }

    static LD_R8_N8(cpu: CPU, r8: R8, n8: number) {
        cpu._r.gen[r8] = n8;
    }

    // Store value in register on the right into register on the left
    static LD_R8_R8(cpu: CPU, r8: R8, r8_2: R8) {
        cpu._r.gen[r8] = cpu._r.gen[r8_2];
    }

    // LD r16,n16 - 0x21, 
    static LD_R16_N16(cpu: CPU, r16: R16, n16: number) {
        cpu.setReg16(r16, n16);
    }


    // LD [HL+],A | Store value in register A into byte pointed by HL and post-increment HL.  
    static LD_iHLinc_A(cpu: CPU) {
        cpu.writeMem8(cpu._r.hl, cpu._r.gen[R8.A]);
        cpu._r.hl = (cpu._r.hl + 1) & 0xFFFF;
    }
    // LD [HL-],A | Store value in register A into byte pointed by HL and post-decrement HL. 
    static LD_iHLdec_A(cpu: CPU) {
        cpu.writeMem8(cpu._r.hl, cpu._r.gen[R8.A]);
        cpu._r.hl = (cpu._r.hl - 1) & 0xFFFF;
    }

    // LD A,[HL+] | Store value in byte pointed by HL into A, then post-increment HL.
    static LD_A_iHLinc(cpu: CPU) {
        cpu._r.gen[R8.A] = cpu.fetchMem8(cpu._r.hl);
        cpu._r.hl = (cpu._r.hl + 1) & 0xFFFF;
    }
    // LD A,[HL-] | Store value in byte pointed by HL into A, then post-decrement HL.
    static LD_A_iHLdec(cpu: CPU) {
        cpu._r.gen[R8.A] = cpu.fetchMem8(cpu._r.hl);
        cpu._r.hl = (cpu._r.hl - 1) & 0xFFFF;
    }

    // ADD SP, e8
    static ADD_SP_E8(cpu: CPU, e8: number) {
        let value = unTwo8b(e8);

        cpu._r._f.zero = false;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = ((value & 0xF) + (cpu._r.sp & 0xF)) > 0xF;
        cpu._r._f.carry = ((value & 0xFF) + (cpu._r.sp & 0xFF)) > 0xFF;

        cpu._r.sp = (cpu._r.sp + value) & 0xFFFF;
    }

    // JR
    static JR_E8(cpu: CPU, cc: CC, n8: number) {
        if (cc === CC.Z && !cpu._r._f.zero) return;
        if (cc === CC.NZ && cpu._r._f.zero) return;
        if (cc === CC.C && !cpu._r._f.carry) return;
        if (cc === CC.NC && cpu._r._f.carry) return;

        cpu.pc += unTwo8b(n8);

        cpu.cycles += 4; // Branching takes 4 cycles
    }

    static LD_SP_HL(cpu: CPU) {
        cpu._r.sp = cpu._r.hl;
    }

    // ADD A, r8
    static ADD_A_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) + (value & 0xF) > 0xF;

        let newValue = (value + cpu._r.gen[R8.A]) & 0xFF;
        let didOverflow = ((value + cpu._r.gen[R8.A]) >> 8) !== 0;

        // Set register values
        cpu._r.gen[R8.A] = newValue;

        // Set flags
        cpu._r._f.carry = didOverflow;
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
    }

    // ADD A, N8
    static ADD_A_N8(cpu: CPU, n8: number) {
        let value = n8;

        let newValue = (value + cpu._r.gen[R8.A]) & 0xFF;
        let didOverflow = ((value + cpu._r.gen[R8.A]) >> 8) !== 0;

        // Set flags
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) + (value & 0xF) > 0xF;
        cpu._r._f.carry = didOverflow;

        // Set register values
        cpu._r.gen[R8.A] = newValue;
    }

    // ADC A, r8
    static ADC_A_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let newValue = (value + cpu._r.gen[R8.A] + (cpu._r._f.carry ? 1 : 0)) & 0xFF;
        let didOverflow = ((value + cpu._r.gen[R8.A] + (cpu._r._f.carry ? 1 : 0)) >> 8) !== 0;

        // Set flags
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) + (value & 0xF) + (cpu._r._f.carry ? 1 : 0) > 0xF;
        cpu._r._f.carry = didOverflow;

        // Set register values
        cpu._r.gen[R8.A] = newValue;
    }

    // ADC A, n8
    static ADC_A_N8(cpu: CPU, n8: number) {
        let value = n8;

        let newValue = (value + cpu._r.gen[R8.A] + (cpu._r._f.carry ? 1 : 0)) & 0xFF;
        let didOverflow = ((value + cpu._r.gen[R8.A] + (cpu._r._f.carry ? 1 : 0)) >> 8) !== 0;

        // Set flags
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) + (value & 0xF) + (cpu._r._f.carry ? 1 : 0) > 0xF;
        cpu._r._f.carry = didOverflow;

        // Set register values
        cpu._r.gen[R8.A] = newValue;
    }

    static ADD_HL_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let newValue = (value + cpu._r.hl) & 0xFFFF;
        let didOverflow = ((value + cpu._r.hl) >> 8) !== 0;

        // Set register values
        cpu._r.hl = newValue;

        // Set flags
        cpu._r._f.carry = didOverflow;
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) + (value & 0xF) > 0xF;
    }

    static ADD_HL_R16(cpu: CPU, r16: R16) {
        let r16Value = cpu.getReg16(r16);

        let newValue = (r16Value + cpu._r.hl) & 0xFFFF;
        let didOverflow = ((r16Value + cpu._r.hl) >> 16) !== 0;

        // Set flag
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = (cpu._r.hl & 0xFFF) + (r16Value & 0xFFF) > 0xFFF;
        cpu._r._f.carry = didOverflow;

        // Set register values
        cpu._r.hl = newValue;
    }

    static SUB_A_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

        // Set flags
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
        cpu._r._f.carry = value > cpu._r.gen[R8.A];

        // Set register values
        cpu._r.gen[R8.A] = newValue;
    }


    static SUB_A_N8(cpu: CPU, n8: number) {
        let value = n8;

        let newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

        // Set flags
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
        cpu._r._f.carry = value > cpu._r.gen[R8.A];

        // Set register values
        cpu._r.gen[R8.A] = newValue;
    }

    static SBC_A_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

        // Set flags
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

        // Set register values
        cpu._r.gen[R8.A] = newValue;
    }

    static SBC_A_N8(cpu: CPU, n8: number) {
        let value = n8;

        let newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

        // Set flags
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

        // Set register values
        cpu._r.gen[R8.A] = newValue;
    }

    static AND_A_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let final = value & cpu._r.gen[R8.A];
        cpu._r.gen[R8.A] = final;

        // Set flags
        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = true;
        cpu._r._f.carry = false;
    }

    static AND_N8(cpu: CPU, n8: number) {
        let value = n8;

        let final = value & cpu._r.gen[R8.A];
        cpu._r.gen[R8.A] = final;

        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = true;
        cpu._r._f.carry = false;
    }

    static OR_A_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let final = value | cpu._r.gen[R8.A];
        cpu._r.gen[R8.A] = final;

        cpu._r._f.zero = final === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = false;
    }

    static OR_A_N8(cpu: CPU, n8: number) {
        let value = n8;

        let final = value | cpu._r.gen[R8.A];
        cpu._r.gen[R8.A] = final;

        cpu._r._f.zero = final === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = false;
    }

    static XOR_A_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let final = value ^ cpu._r.gen[R8.A];
        cpu._r.gen[R8.A] = final;

        cpu._r._f.zero = final === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = false;
    }

    static XOR_A_N8(cpu: CPU, n8: number) {
        let value = n8;

        let final = value ^ cpu._r.gen[R8.A];
        cpu._r.gen[R8.A] = final;

        cpu._r._f.zero = final === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = false;
    }

    // CP A,r8
    static CP_A_R8(cpu: CPU, t: R8) {
        let r8 = cpu._r.gen[t];

        let newValue = (cpu._r.gen[R8.A] - r8) & 0xFF;
        let didOverflow = ((cpu._r.gen[R8.A] - r8) >> 8) !== 0;

        // DO not set register values for CP

        // Set flags
        cpu._r._f.carry = r8 > cpu._r.gen[R8.A];
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (r8 & 0xF) < 0;
    }


    static CP_A_N8(cpu: CPU, n8: number) {
        let value = n8;

        let newValue = (cpu._r.gen[R8.A] - value) & 0xFF;
        let didOverflow = ((cpu._r.gen[R8.A] - value) >> 8) !== 0;


        // Set flags
        cpu._r._f.carry = value > cpu._r.gen[R8.A];
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (n8 & 0xF) < 0;
    }

    static INC_R8(cpu: CPU, t: R8) {
        let target = cpu._r.gen[t];

        let newValue = (target + 1) & 0xFF;
        let didOverflow = ((target + 1) >> 8) !== 0;

        cpu._r.gen[t] = newValue;

        // UNMODIFIED cpu._r._f.carry = didOverflow;
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
    }


    // Increment in register r16
    static INC_R16(cpu: CPU, r16: R16) {
        cpu.setReg16(r16, (cpu.getReg16(r16) + 1) & 0xFFFF);
    }

    static DEC_R8(cpu: CPU, t: R8) {
        let target = cpu._r.gen[t];

        let newValue = (target - 1) & 0xFF;

        cpu._r.gen[t] = newValue;

        // UNMODIFIED cpu._r._f.carry = didOverflow;
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (1 & 0xF) > (target & 0xF);
    }

    static DEC_R16(cpu: CPU, tt: R16) {
        cpu.setReg16(tt, (cpu.getReg16(tt) - 1) & 0xFFFF);
    }

    static CCF(cpu: CPU) {
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = !cpu._r._f.carry;
    }

    static SCF(cpu: CPU) {
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = true;
    }


    static CPL(cpu: CPU) {
        cpu._r.gen[R8.A] = cpu._r.gen[R8.A] ^ 0b11111111;

        cpu._r._f.negative = true;
        cpu._r._f.half_carry = true;
    }

    // #region 0xCB Opcodes

    static BIT_R8(cpu: CPU, t: R8, selectedBit: number) {
        let value = cpu._r.gen[t];

        cpu._r._f.zero = (value & (1 << selectedBit)) === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = true;
    }

    static RES_R8(cpu: CPU, t: R8, selectedBit: number) {
        let value = cpu._r.gen[t];
        let mask = 0b1 << selectedBit;

        let final = value & ~(mask);

        cpu._r.gen[t] = final;
    }

    static SET_R8(cpu: CPU, t: R8, selectedBit: number) {
        let value = cpu._r.gen[t];
        let mask = 0b1 << selectedBit;

        let final = value |= mask;

        cpu._r.gen[t] = final;
    }

    // Rotate A right through carry
    static RRA(cpu: CPU) {
        let value = cpu._r.gen[R8.A];

        let carryMask = (cpu._r.f & 0b00010000) << 3;

        let newValue = ((value >> 1) | carryMask) & 0xFF;

        cpu._r.gen[R8.A] = newValue;

        cpu._r._f.zero = false;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = !!(value & 1);
    }


    // Rotate TARGET right through carry
    static RR_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let carryMask = (cpu._r.f & 0b00010000) << 3;

        let newValue = ((value >> 1) | carryMask) & 0xFF;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = !!(value & 1);
    }

    // Rotate A left through carry
    static RLA(cpu: CPU) {
        let value = cpu._r.gen[R8.A];

        let carryMask = (cpu._r.f & 0b00010000) >> 4;

        let newValue = ((value << 1) | carryMask) & 0xFF;

        cpu._r.gen[R8.A] = newValue;

        cpu._r._f.zero = false;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = (value >> 7) === 1;
    }

    // Rotate TARGET left through carry
    static RL_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let carryMask = (cpu._r.f & 0b00010000) >> 4;

        let newValue = ((value << 1) | carryMask) & 0xFF;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = (value >> 7) === 1;
    }

    // Rotate A right
    static RRCA(cpu: CPU) {
        let value = cpu._r.gen[R8.A];

        let rightmostBit = (value & 1) << 7;
        let newValue = ((value >> 1) | rightmostBit) & 0xFF;

        cpu._r.gen[R8.A] = newValue;

        cpu._r._f.zero = false;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = (value & 1) === 1;
    }


    // Rotate TARGET right
    static RRC_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let rightmostBit = (value & 1) << 7;
        let newValue = ((value >> 1) | rightmostBit) & 0xFF;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = !!(value & 1);
    }

    // Rotate A left
    static RLCA(cpu: CPU) {
        let value = cpu._r.gen[R8.A];

        let leftmostBit = (value & 0b10000000) >> 7;

        let newValue = ((value << 1) | leftmostBit) & 0xFF;

        cpu._r.gen[R8.A] = newValue;

        cpu._r._f.zero = false;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = (value >> 7) === 1;
    }

    // Rotate TARGET left
    static RLC_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let leftmostBit = (value & 0b10000000) >> 7;

        let newValue = ((value << 1) | leftmostBit) & 0xFF;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = (value >> 7) === 1;
    }

    // Shift TARGET right
    static SRA_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let leftmostBit = value & 0b10000000;
        let newValue = (value >> 1) | leftmostBit;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = !!(value & 1);
    }

    // Shift TARGET left 
    static SLA_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let newValue = (value << 1) & 0xFF;
        let didOverflow = ((value << 1) >> 8) !== 0;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = didOverflow;
    }

    // Shift right logic register
    static SRL_R8(cpu: CPU, t: R8) {
        let value = cpu._r.gen[t];

        let newValue = value >> 1;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = !!(value & 1);
    }

    // SWAP 
    static SWAP_R8(cpu: CPU, r8: R8) {
        let value = cpu._r.gen[r8];

        let lowerNybble = value & 0b00001111;
        let upperNybble = (value >> 4) & 0b00001111;

        cpu._r.gen[r8] = (lowerNybble << 4) | upperNybble;

        cpu._r._f.zero = value === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = false;
    }
}

export default Ops;