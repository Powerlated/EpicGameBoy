using System;

namespace DMSharp
{
    class Ops
    {
        public static void UNKNOWN_OPCODE(CPU cpu, Options opts)
        {
            cpu.pc--;
        }

        public static void INVALID_OPCODE(CPU cpu, Options opts)
        {
            cpu.pc--;
        }

        // #region INSTRUCTIONS

        // NOP - 0x00
        public static void NOP(CPU cpu, Options options)
        {

        }

        // DI - 0xF3
        public static void DI(CPU cpu, Options opts)
        {
            cpu.gb.interrupts.masterEnabled = false;

            // writeDebug("Disabled interrupts");
        }


        // EI - 0xFB
        public static void EI(CPU cpu, Options opts)
        {
            cpu.scheduleEnableInterruptsForNextTick = true;
        }

        // HALT - 0x76
        public static void HALT(CPU cpu, Options opts)
        {

            if (
                (cpu.gb.interrupts.enabledInterrupts.numerical &
                    cpu.gb.interrupts.requestedInterrupts.numerical &
                    0x1F) != 0
            )
            {
                // HALT bug
                cpu.haltBug = true;
                cpu.pc++; cpu.pc &= 0xFFFF;
            }
            else if ((cpu.gb.interrupts.enabledInterrupts.numerical &
              cpu.gb.interrupts.requestedInterrupts.numerical &
              0x1F) == 0)
            {
                cpu.halted = true;
            }
        }

        public static void STOP(CPU cpu, Options opts)
        {
            // alert(`[PC: ${hex(cpu.pc, 4)}] CPU has been stopped`);
        }

        // wtf is a DAA?
        // Decimal adjust A
        public static void DA_A(CPU cpu, Options opts)
        {
            if (!cpu._r._f.negative)
            {
                if (cpu._r._f.carry || cpu._r.a > 0x99)
                {
                    cpu._r.a = (byte)(cpu._r.a + 0x60);
                    cpu._r._f.carry = true;
                }
                if (cpu._r._f.half_carry || (cpu._r.a & 0x0f) > 0x09)
                {
                    cpu._r.a = (byte)(cpu._r.a + 0x6);
                }
            }
            else
            {
                if (cpu._r._f.carry)
                {
                    cpu._r.a = (byte)(cpu._r.a - 0x60);
                    cpu._r._f.carry = true;
                }
                if (cpu._r._f.half_carry)
                {
                    cpu._r.a = (byte)(cpu._r.a - 0x6);
                }
            }

            cpu._r._f.zero = cpu._r.a == 0;
            cpu._r._f.half_carry = false;
        }

        // Load SP into index
        public static void LD_iN16_SP(CPU cpu, Options opts)
        {
            byte spUpperByte = (byte)(cpu._r.sp >> 8);
            byte spLowerByte = (byte)(cpu._r.sp & 0b11111111);

            cpu.WriteMem8((ushort)(opts.imm16 + 0), spLowerByte);
            cpu.WriteMem8((ushort)(opts.imm16 + 1), (spUpperByte));
        }


        public static void RST(CPU cpu, Options opts)
        {
            byte pcUpperByte = (byte)((cpu.pc + 1) >> 8);
            byte pcLowerByte = (byte)((cpu.pc + 1) & 0xFF);

            cpu._r.sp = (ushort)(cpu._r.sp - 1);
            cpu.WriteMem8(cpu._r.sp, pcUpperByte);
            cpu._r.sp = (ushort)(cpu._r.sp - 1);
            cpu.WriteMem8(cpu._r.sp, pcLowerByte);

            cpu.pc = (byte)(opts.numtype - 1);

            cpu.cycles += 4;
        }

        public static void LD_A_iN16(CPU cpu, Options opts)
        {
            cpu._r.a = cpu.FetchMem8(opts.imm16);
        }

        public static void LD_iHL_N8(CPU cpu, Options opts)
        {
            cpu.WriteMem8(cpu._r.hl, opts.imm8);
        }

        public static void LD_iHL_R8(CPU cpu, Options opts)
        {
            cpu.WriteMem8(cpu._r.hl, cpu.getReg8(opts.r8));
        }

        public static void ADD_iHL(CPU cpu, Options opts)
        {
            cpu._r.a = (byte)(cpu._r.a + cpu.FetchMem8(cpu._r.hl));
        }

        public static void CP_A_iHL(CPU cpu, Options opts)
        {
            byte u8 = cpu.FetchMem8(cpu.getReg16(R16.HL));
            cpu._r._f.zero = cpu._r.a - u8 == 0;
            cpu._r._f.negative = true;
            cpu._r._f.half_carry = (cpu._r.a & 0xF) + (u8 & 0xF) > 0xF;
            cpu._r._f.carry = u8 > cpu._r.a;
        }

        public static void LD_A_iFF00plusN8(CPU cpu, Options opts)
        {
            cpu._r.a = cpu.FetchMem8((ushort)(0xFF00 + opts.imm8));
        }

        public static void LD_A_iFF00plusC(CPU cpu, Options opts)
        {
            cpu._r.a = cpu.FetchMem8((ushort)(0xFF00 + cpu._r.c));
        }

        public static void LD_iR16_A(CPU cpu, Options opts)
        {
            cpu.WriteMem8(cpu.getReg16((R16)opts.r16), cpu._r.a);
        }

        // Store value in register A into address opts.imm16
        public static void LD_iN16_A(CPU cpu, Options opts)
        {
            cpu.WriteMem8(opts.imm16, cpu._r.a);
        }

        /*  PUSH r16 - 0xC5
            Push register r16 onto the stack. */
        public static void PUSH_R16(CPU cpu, Options opts)
        {
            ushort value = cpu.getReg16(opts.r16);
            byte upperByte = (byte)(value >> 8);
            byte lowerByte = (byte)(value & 0b11111111);

            cpu._r.sp = (ushort)(cpu._r.sp - 1);
            cpu.WriteMem8(cpu._r.sp, upperByte);
            cpu._r.sp = (ushort)(cpu._r.sp - 1);
            cpu.WriteMem8(cpu._r.sp, lowerByte);
        }

        /*  PUSH r16 - 0xC1
            Pop off the stack into r16. */
        public static void POP_R16(CPU cpu, Options opts)
        {
            byte lowerByte = cpu.FetchMem8(cpu._r.sp);
            cpu._r.sp = (byte)(cpu._r.sp + 1);
            byte upperByte = cpu.FetchMem8(cpu._r.sp);
            cpu._r.sp = (byte)(cpu._r.sp + 1);

            cpu.setReg16(opts.r16, (byte)((upperByte << 8) | lowerByte));
        }

        // CALL opts.imm16 - 0xCD
        public static void CALL_N16(CPU cpu, Options opts)
        {
            if (opts.cc == CC.Z && !cpu._r._f.zero) return;
            if (opts.cc == CC.NZ && cpu._r._f.zero) return;
            if (opts.cc == CC.C && !cpu._r._f.carry) return;
            if (opts.cc == CC.NC && cpu._r._f.carry) return;

            byte pcUpperByte = (byte)((cpu.pc + 3) >> 8);
            byte pcLowerByte = (byte)((cpu.pc + 3) & 0xFF);

            // console.info(`Calling 0x${u16.toString(16)} from 0x${cpu.pc.toString(16)}`);

            cpu._r.sp = (ushort)(cpu._r.sp - 1);
            cpu.WriteMem8(cpu._r.sp, pcUpperByte);
            cpu._r.sp = (ushort)(cpu._r.sp - 1);
            cpu.WriteMem8(cpu._r.sp, pcLowerByte);

            cpu.pc = (ushort)(opts.imm16 - 3);

            cpu.cycles += 4; // Branching takes 4 cycles
        }

        public static void JP_N16(CPU cpu, Options opts)
        {
            if (opts.cc == CC.Z && !cpu._r._f.zero) return;
            if (opts.cc == CC.NZ && cpu._r._f.zero) return;
            if (opts.cc == CC.C && !cpu._r._f.carry) return;
            if (opts.cc == CC.NC && cpu._r._f.carry) return;

            cpu.pc = (ushort)(opts.imm16 - 3);

            cpu.cycles += 4; // Branching takes 4 cycles
        }

        public static void JP_HL(CPU cpu, Options opts)
        {
            cpu.pc = (ushort)(cpu._r.hl - 1);
        }


        public static void RET(CPU cpu, Options opts)
        {
            cpu.cycles += 4; // Branch decision?

            if (opts.cc == CC.Z && !cpu._r._f.zero) return;
            if (opts.cc == CC.NZ && cpu._r._f.zero) return;
            if (opts.cc == CC.C && !cpu._r._f.carry) return;
            if (opts.cc == CC.NC && cpu._r._f.carry) return;

            byte stackLowerByte = cpu.FetchMem8((cpu._r.sp++));
            byte stackUpperByte = cpu.FetchMem8((cpu._r.sp++));

            byte returnAddress = (byte)(((stackUpperByte << 8) | stackLowerByte) - 1);
            // console.info(`Returning to 0x${returnAddress.toString(16)}`);

            cpu.pc = returnAddress;

            cpu.cycles += 4; // Branching takes 4 cycles
        }

        public static void RETI(CPU cpu, Options opts)
        {
            Ops.RET(cpu, new Options(CC.NONE));
            Ops.EI(cpu, new Options(CC.NONE));
        }

        // LD A,(R16)
        public static void LD_A_iR16(CPU cpu, Options opts)
        {
            cpu.setReg8(R8.A, cpu.FetchMem8(cpu.getReg16(opts.r16)));

        }

        public static void LD_R16_A(CPU cpu, Options opts)
        {
            cpu.WriteMem8(cpu.FetchMem8(cpu.getReg8(opts.r8)), cpu._r.a);
        }

        public static void LD_HL_SPaddE8(CPU cpu, Options opts)
        {
            sbyte signedVal = opts.imm8s;

            cpu._r._f.zero = false;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = (signedVal & 0xF) + (cpu._r.sp & 0xF) > 0xF;
            cpu._r._f.carry = (signedVal & 0xFF) + (cpu._r.sp & 0xFF) > 0xFF;

            cpu._r.hl = (ushort)(signedVal + cpu._r.sp);
        }

        // LD [$FF00+u8],A
        public static void LD_iFF00plusN8_A(CPU cpu, Options opts)
        {
            byte value = cpu._r.a;
            cpu.WriteMem8((byte)(0xFF00 + opts.imm8), value);
            // writeDebug(0xFF00 + u8);
        }

        // LD [$FF00+C],A
        public static void LD_iFF00plusC_A(CPU cpu, Options opts)
        {
            byte value = cpu._r.a;
            cpu.WriteMem8((byte)(0xFF00 + cpu._r.c), value);
        }

        public static void LD_R8_N8(CPU cpu, Options opts)
        {
            cpu.setReg8(opts.r8, opts.imm8);
        }

        // Store value in register on the right into register on the left
        public static void LD_R8_R8(CPU cpu, Options opts)
        {
            cpu.setReg8(opts.r8, cpu.getReg8(opts.r8_2));
        }

        // LD r16,opts.imm16 - 0x21, 
        public static void LD_R16_N16(CPU cpu, Options opts)
        {
            cpu.setReg16(opts.r16, opts.imm16);
        }


        // LD [HL+],A | Store value in register A into byte pointed by HL and post-increment HL.  
        public static void LD_iHLinc_A(CPU cpu, Options opts)
        {
            cpu.WriteMem8(cpu._r.hl, cpu._r.a);
            cpu._r.hl = (ushort)(cpu._r.hl + 1);
        }
        // LD [HL-],A | Store value in register A into byte pointed by HL and post-decrement HL. 
        public static void LD_iHLdec_A(CPU cpu, Options opts)
        {
            cpu.WriteMem8(cpu._r.hl, cpu._r.a);
            cpu._r.hl = (ushort)(cpu._r.hl - 1);
        }

        // LD A,[HL+] | Store value in byte pointed by HL into A, then post-increment HL.
        public static void LD_A_iHLinc(CPU cpu, Options opts)
        {
            cpu._r.a = cpu.FetchMem8(cpu._r.hl);
            cpu._r.hl = (ushort)(cpu._r.hl + 1);
        }
        // LD A,[HL-] | Store value in byte pointed by HL into A, then post-decrement HL.
        public static void LD_A_iHLdec(CPU cpu, Options opts)
        {
            cpu._r.a = cpu.FetchMem8(cpu._r.hl);
            cpu._r.hl = (ushort)(cpu._r.hl - 1);
        }

        // ADD SP, e8
        public static void ADD_SP_E8(CPU cpu, Options opts)
        {
            sbyte value = opts.imm8s;

            cpu._r._f.zero = false;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = ((value & 0xF) + (cpu._r.sp & 0xF)) > 0xF;
            cpu._r._f.carry = ((value & 0xFF) + (cpu._r.sp & 0xFF)) > 0xFF;

            cpu._r.sp = (ushort)(cpu._r.sp + value);
        }

        // JR
        public static void JR_E8(CPU cpu, Options opts)
        {
            if (opts.cc == CC.Z && !cpu._r._f.zero) return;
            if (opts.cc == CC.NZ && cpu._r._f.zero) return;
            if (opts.cc == CC.C && !cpu._r._f.carry) return;
            if (opts.cc == CC.NC && cpu._r._f.carry) return;

            cpu.pc = (ushort)(cpu.pc + opts.imm8s);

            cpu.cycles += 4; // Branching takes 4 cycles
        }

        public static void LD_SP_HL(CPU cpu, Options opts)
        {
            cpu._r.sp = cpu._r.hl;
        }

        // ADD A, r8
        public static void ADD_A_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);
            cpu._r._f.half_carry = (cpu._r.a & 0xF) + (value & 0xF) > 0xF;

            byte newValue = (byte)(value + cpu._r.a);
            bool didOverflow = (value + cpu._r.a) > 0xFF;

            // Set register values
            cpu._r.a = newValue;

            // Set flags
            cpu._r._f.carry = didOverflow;
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
        }

        // ADD A, N8
        public static void ADD_A_N8(CPU cpu, Options opts)
        {
            byte value = opts.imm8;

            byte newValue = (byte)(value + cpu._r.a);
            bool didOverflow = (value + cpu._r.a) > 0xFF;

            // Set flags
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = (cpu._r.a & 0xF) + (value & 0xF) > 0xF;
            cpu._r._f.carry = didOverflow;

            // Set register values
            cpu._r.a = newValue;
        }

        // ADC A, r8
        public static void ADC_A_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte newValue = (byte)(value + cpu._r.a + (cpu._r._f.carry ? 1 : 0));
            bool didOverflow = (value + cpu._r.a + (cpu._r._f.carry ? 1 : 0)) > 0xFF;

            // Set flags
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = (cpu._r.a & 0xF) + (value & 0xF) + (cpu._r._f.carry ? 1 : 0) > 0xF;
            cpu._r._f.carry = didOverflow;

            // Set register values
            cpu._r.a = newValue;
        }

        // ADC A, n8
        public static void ADC_A_N8(CPU cpu, Options opts)
        {
            byte value = opts.imm8;

            byte newValue = (byte)(value + cpu._r.a + (cpu._r._f.carry ? 1 : 0));
            bool didOverflow = (value + cpu._r.a + (cpu._r._f.carry ? 1 : 0)) > 0xFF;

            // Set flags
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = (cpu._r.a & 0xF) + (value & 0xF) + (cpu._r._f.carry ? 1 : 0) > 0xF;
            cpu._r._f.carry = didOverflow;

            // Set register values
            cpu._r.a = newValue;
        }

        public static void ADD_HL_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte newValue = (byte)(value + cpu._r.hl);
            bool didOverflow = (value + cpu._r.hl) > 0xFF;

            // Set register values
            cpu._r.hl = newValue;

            // Set flags
            cpu._r._f.carry = didOverflow;
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = (cpu._r.a & 0xF) + (value & 0xF) > 0xF;
        }

        public static void ADD_HL_R16(CPU cpu, Options opts)
        {
            ushort r16Value = cpu.getReg16(opts.r16);

            ushort newValue = (ushort)(r16Value + cpu._r.hl);
            bool didOverflow = (r16Value + cpu._r.hl) > 0xFF;

            // Set flag
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = (cpu._r.hl & 0xFFF) + (r16Value & 0xFFF) > 0xFFF;
            cpu._r._f.carry = didOverflow;

            // Set register values
            cpu._r.hl = newValue;
        }

        public static void SUB_A_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte newValue = (byte)(cpu._r.a - value);

            // Set flags
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = true;
            cpu._r._f.half_carry = (value & 0xF) > (cpu._r.a & 0xF);
            cpu._r._f.carry = value > cpu._r.a;

            // Set register values
            cpu._r.a = newValue;
        }


        public static void SUB_A_N8(CPU cpu, Options opts)
        {
            byte value = opts.imm8;

            byte newValue = (byte)(int)(cpu._r.a - value);

            // Set flags
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = true;
            cpu._r._f.half_carry = (value & 0xF) > (cpu._r.a & 0xF);
            cpu._r._f.carry = value > cpu._r.a;

            // Set register values
            cpu._r.a = newValue;
        }

        public static void SBC_A_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte newValue = (byte)(cpu._r.a - value - (cpu._r._f.carry ? 1 : 0));

            // Set flags
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = true;
            cpu._r._f.half_carry = (value & 0xF) > (cpu._r.a & 0xF) - (cpu._r._f.carry ? 1 : 0);
            cpu._r._f.carry = value > cpu._r.a - (cpu._r._f.carry ? 1 : 0);

            // Set register values
            cpu._r.a = newValue;
        }

        public static void SBC_A_N8(CPU cpu, Options opts)
        {
            byte value = opts.imm8;

            byte newValue = (byte)(cpu._r.a - value - (cpu._r._f.carry ? 1 : 0));

            // Set flags
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = true;
            cpu._r._f.half_carry = (value & 0xF) > (cpu._r.a & 0xF) - (cpu._r._f.carry ? 1 : 0);
            cpu._r._f.carry = value > cpu._r.a - (cpu._r._f.carry ? 1 : 0);

            // Set register values
            cpu._r.a = newValue;
        }

        public static void AND_A_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte final = (byte)(value & cpu._r.a);
            cpu._r.a = final;

            // Set flags
            cpu._r._f.zero = cpu._r.a == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = true;
            cpu._r._f.carry = false;
        }

        public static void AND_N8(CPU cpu, Options opts)
        {
            byte value = opts.imm8;

            byte final = (byte)(value & cpu._r.a);
            cpu._r.a = final;

            cpu._r._f.zero = cpu._r.a == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = true;
            cpu._r._f.carry = false;
        }

        public static void OR_A_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte final = (byte)(value | cpu._r.a);
            cpu._r.a = final;

            cpu._r._f.zero = final == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = false;
        }

        public static void OR_A_N8(CPU cpu, Options opts)
        {
            byte value = opts.imm8;

            byte final = (byte)(value | cpu._r.a);
            cpu._r.a = final;

            cpu._r._f.zero = final == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = false;
        }

        public static void XOR_A_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte final = (byte)(value ^ cpu._r.a);
            cpu._r.a = final;

            cpu._r._f.zero = final == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = false;
        }

        public static void XOR_A_N8(CPU cpu, Options opts)
        {
            byte value = opts.imm8;

            byte final = (byte)(value ^ cpu._r.a);
            cpu._r.a = final;

            cpu._r._f.zero = final == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = false;
        }

        // CP A,r8
        public static void CP_A_R8(CPU cpu, Options opts)
        {
            byte r8 = cpu.getReg8(opts.r8);

            byte newValue = (byte)(cpu._r.a - r8);
            bool didOverflow = (cpu._r.a - r8) > 0xFF;

            // DO not set register values for CP

            // Set flags
            cpu._r._f.carry = r8 > cpu._r.a;
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = true;
            cpu._r._f.half_carry = (cpu._r.a & 0xF) - (r8 & 0xF) < 0;
        }


        public static void CP_A_N8(CPU cpu, Options opts)
        {
            byte value = opts.imm8;

            byte newValue = (byte)(cpu._r.a - value);
            bool didOverflow = (cpu._r.a - value) > 0xFF;


            // Set flags
            cpu._r._f.carry = value > cpu._r.a;
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = true;
            cpu._r._f.half_carry = (cpu._r.a & 0xF) - (opts.imm8 & 0xF) < 0;
        }

        public static void INC_R8(CPU cpu, Options opts)
        {
            byte target = cpu.getReg8(opts.r8);

            byte newValue = (byte)(target + 1);
            bool didOverflow = (target + 1) > 0xFF;

            cpu.setReg8(opts.r8, newValue);

            // UNMODIFIED cpu._r._f.carry = didOverflow;
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
        }


        // Increment in register r16
        public static void INC_R16(CPU cpu, Options opts)
        {
            cpu.setReg16(opts.r16, (ushort)(cpu.getReg16(opts.r16) + 1));
        }

        public static void DEC_R8(CPU cpu, Options opts)
        {
            byte target = cpu.getReg8(opts.r8);

            byte newValue = (byte)(target - 1);

            cpu.setReg8(opts.r8, newValue);

            // UNMODIFIED cpu._r._f.carry = didOverflow;
            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = true;
            cpu._r._f.half_carry = (1 & 0xF) > (target & 0xF);
        }

        public static void DEC_R16(CPU cpu, Options opts)
        {
            cpu.setReg16(opts.r16, (ushort)(cpu.getReg16(opts.r16) - 1));
        }

        public static void CCF(CPU cpu, Options opts)
        {
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = !cpu._r._f.carry;
        }

        public static void SCF(CPU cpu, Options opts)
        {
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = true;
        }


        public static void CPL(CPU cpu, Options opts)
        {
            cpu._r.a = (byte)(cpu._r.a ^ 0b11111111);

            cpu._r._f.negative = true;
            cpu._r._f.half_carry = true;
        }

        // #region 0xCB Opcodes

        public static void BIT_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            cpu._r._f.zero = (value & (1 << opts.numtype)) == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = true;
        }

        public static void RES_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);
            byte mask = (byte)(0b1 << opts.numtype);

            byte final = (byte)(value & ~(mask));

            cpu.setReg8(opts.r8, final);
        }

        public static void SET_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);
            byte mask = (byte)(0b1 << opts.numtype);

            byte final = value |= mask;

            cpu.setReg8(opts.r8, final);
        }

        // Rotate A right through carry
        public static void RRA(CPU cpu, Options opts)
        {
            byte value = cpu._r.a;

            byte carryMask = (byte)((cpu._r.f & 0b00010000) << 3);

            byte newValue = (byte)((value >> 1) | carryMask);

            cpu._r.a = newValue;

            cpu._r._f.zero = false;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = Convert.ToBoolean(value & 1);
        }


        // Rotate TARGET right through carry
        public static void RR_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte carryMask = (byte)((cpu._r.f & 0b00010000) << 3);

            byte newValue = (byte)((value >> 1) | carryMask);

            cpu.setReg8(opts.r8, newValue);

            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = Convert.ToBoolean(value & 1);
        }

        // Rotate A left through carry
        public static void RLA(CPU cpu, Options opts)
        {
            byte value = cpu._r.a;

            byte carryMask = (byte)((cpu._r.f & 0b00010000) >> 4);

            byte newValue = (byte)((value << 1) | carryMask);

            cpu._r.a = newValue;

            cpu._r._f.zero = false;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = (value >> 7) == 1;
        }

        // Rotate TARGET left through carry
        public static void RL_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte carryMask = (byte)((cpu._r.f & 0b00010000) >> 4);

            byte newValue = (byte)((value << 1) | carryMask);

            cpu.setReg8(opts.r8, newValue);

            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = (value >> 7) == 1;
        }

        // Rotate A right
        public static void RRCA(CPU cpu, Options opts)
        {
            byte value = cpu._r.a;

            byte rightmostBit = (byte)((value & 1) << 7);
            byte newValue = (byte)((value >> 1) | rightmostBit);

            cpu._r.a = newValue;

            cpu._r._f.zero = false;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = (value & 1) == 1;
        }


        // Rotate TARGET right
        public static void RRC_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte rightmostBit = (byte)((value & 1) << 7);
            byte newValue = (byte)((value >> 1) | rightmostBit);

            cpu.setReg8(opts.r8, newValue);

            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = Convert.ToBoolean(value & 1);
        }

        // Rotate A left
        public static void RLCA(CPU cpu, Options opts)
        {
            byte value = cpu._r.a;

            byte leftmostBit = (byte)((value & 0b10000000) >> 7);

            byte newValue = (byte)((value << 1) | leftmostBit);

            cpu._r.a = newValue;

            cpu._r._f.zero = false;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = (value >> 7) == 1;
        }

        // Rotate TARGET left
        public static void RLC_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte leftmostBit = (byte)((value & 0b10000000) >> 7);

            byte newValue = (byte)((value << 1) | leftmostBit);

            cpu.setReg8(opts.r8, newValue);

            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = (value >> 7) == 1;
        }

        // Shift TARGET right
        public static void SRA_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte leftmostBit = (byte)(value & 0b10000000);
            byte newValue = (byte)((value >> 1) | leftmostBit);

            cpu.setReg8(opts.r8, newValue);

            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = Convert.ToBoolean(value & 1);
        }

        // Shift TARGET left 
        public static void SLA_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte newValue = (byte)(value << 1);
            bool didOverflow = (value << 1) > 0xFF;

            cpu.setReg8(opts.r8, newValue);

            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = didOverflow;
        }

        // Shift right logic register
        public static void SRL_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte newValue = (byte)(value >> 1);

            cpu.setReg8(opts.r8, newValue);

            cpu._r._f.zero = newValue == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = Convert.ToBoolean(value & 1);
        }

        // SWAP 
        public static void SWAP_R8(CPU cpu, Options opts)
        {
            byte value = cpu.getReg8(opts.r8);

            byte lowerNybble = (byte)(value & 0b00001111);
            byte upperNybble = (byte)((value >> 4) & 0b00001111);

            cpu.setReg8(opts.r8, (byte)((lowerNybble << 4) | upperNybble));

            cpu._r._f.zero = value == 0;
            cpu._r._f.negative = false;
            cpu._r._f.half_carry = false;
            cpu._r._f.carry = false;
        }
    }
}