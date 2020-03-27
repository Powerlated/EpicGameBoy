import CPU, { R8, R16, CC } from './cpu';
import { unTwo8b, hex } from '../../src/gameboy/tools/util';

class Ops {
    static execute(cpu: CPU, pcTriplet: number[]): void {
        if (pcTriplet[0] !== 0xCB) {
            switch (pcTriplet[0]) {
                // Invalid
                case 0xD3:
                case 0xDB:
                case 0xDD:
                case 0xE3:
                case 0xE4:
                case 0xEB:
                case 0xEC:
                case 0xED:
                case 0xF4:
                case 0xFC:
                case 0xFD:
                    cpu.pc--;
                    cpu.invalidOpcodeExecuted = true;
                    return;

                /** JR */
                case 0x18: // JR E8
                    cpu.pc += unTwo8b(pcTriplet[1]);
                    cpu.cycles += 4; // Branching takes 4 cycles
                    return;
                case 0x38: // JR C, E8
                    if (!cpu._r._f.carry) return;
                    cpu.pc += unTwo8b(pcTriplet[1]);
                    cpu.cycles += 4; // Branching takes 4 cycles
                    return;
                case 0x30: // JR NC, E8
                    if (cpu._r._f.carry) return;
                    cpu.pc += unTwo8b(pcTriplet[1]);
                    cpu.cycles += 4; // Branching takes 4 cycles
                    return;
                case 0x28: // JR Z, E8
                    if (!cpu._r._f.zero) return;
                    cpu.pc += unTwo8b(pcTriplet[1]);
                    cpu.cycles += 4; // Branching takes 4 cycles
                    return;
                case 0x20: // JR NZ, E8
                    if (cpu._r._f.zero) return;
                    cpu.pc += unTwo8b(pcTriplet[1]);
                    cpu.cycles += 4; // Branching takes 4 cycles
                    return;

                /** PUSH R16 */
                case 0xF5: // PUSH AF 
                    {
                        const value = cpu._r.paired[R16.AF];
                        const upperByte = value >> 8;
                        const lowerByte = value & 0b11111111;

                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, upperByte);
                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, lowerByte);

                        // 4 cycle penalty
                        cpu.cycles += 4;
                    }
                    return;

                case 0xC5: // PUSH BC
                    {
                        const value = cpu._r.paired[R16.BC];
                        const upperByte = value >> 8;
                        const lowerByte = value & 0b11111111;

                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, upperByte);
                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, lowerByte);

                        // 4 cycle penalty
                        cpu.cycles += 4;
                    }
                    return;
                case 0xD5: // PUSH DE
                    {
                        const value = cpu._r.paired[R16.DE];
                        const upperByte = value >> 8;
                        const lowerByte = value & 0b11111111;

                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, upperByte);
                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, lowerByte);

                        // 4 cycle penalty
                        cpu.cycles += 4;
                    }
                    return;
                case 0xE5: // PUSH HL
                    {
                        const value = cpu._r.paired[R16.HL];
                        const upperByte = value >> 8;
                        const lowerByte = value & 0b11111111;

                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, upperByte);
                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, lowerByte);

                        // 4 cycle penalty
                        cpu.cycles += 4;
                    }
                    return;
                /** POP R16 */
                case 0xF1: // POP AF 
                    {
                        const lowerByte = cpu.fetchMem8(cpu._r.sp);
                        cpu._r.sp = (cpu._r.sp + 1) & 0xFFFF;
                        const upperByte = cpu.fetchMem8(cpu._r.sp);
                        cpu._r.sp = (cpu._r.sp + 1) & 0xFFFF;

                        cpu._r.paired[R16.AF] = (upperByte << 8) | lowerByte;
                    }
                    return;
                case 0xC1: // POP BC
                    {
                        const lowerByte = cpu.fetchMem8(cpu._r.sp);
                        cpu._r.sp = (cpu._r.sp + 1) & 0xFFFF;
                        const upperByte = cpu.fetchMem8(cpu._r.sp);
                        cpu._r.sp = (cpu._r.sp + 1) & 0xFFFF;

                        cpu._r.paired[R16.BC] = (upperByte << 8) | lowerByte;
                    }
                    return;
                case 0xD1: // POP DE
                    {
                        const lowerByte = cpu.fetchMem8(cpu._r.sp);
                        cpu._r.sp = (cpu._r.sp + 1) & 0xFFFF;
                        const upperByte = cpu.fetchMem8(cpu._r.sp);
                        cpu._r.sp = (cpu._r.sp + 1) & 0xFFFF;

                        cpu._r.paired[R16.DE] = (upperByte << 8) | lowerByte;
                    }
                    return;
                case 0xE1: // POP HL
                    {
                        const lowerByte = cpu.fetchMem8(cpu._r.sp);
                        cpu._r.sp = (cpu._r.sp + 1) & 0xFFFF;
                        const upperByte = cpu.fetchMem8(cpu._r.sp);
                        cpu._r.sp = (cpu._r.sp + 1) & 0xFFFF;

                        cpu._r.paired[R16.HL] = (upperByte << 8) | lowerByte;
                    }
                    return;


                /** LD R8, N8 */
                case 0x06: // LD B, N8
                    cpu._r.gen[R8.B] = pcTriplet[1];
                    return;
                case 0x0E: // LD C, N8
                    cpu._r.gen[R8.C] = pcTriplet[1];
                    return;
                case 0x16: // LD D, N8
                    cpu._r.gen[R8.D] = pcTriplet[1];
                    return;
                case 0x1E: // LD E, n8
                    cpu._r.gen[R8.E] = pcTriplet[1];
                    return;
                case 0x26: // LD H, N8
                    cpu._r.gen[R8.H] = pcTriplet[1];
                    return;
                case 0x2E: // LD L, N8
                    cpu._r.gen[R8.L] = pcTriplet[1];
                    return;
                case 0x36: // LD (HL), N8
                    cpu._r.gen[R8.iHL] = pcTriplet[1];
                    return;
                case 0x3E: // LD A, N8
                    cpu._r.gen[R8.A] = pcTriplet[1];
                    return;

                /** INC R8 */
                case 0x04: // INC B
                    {
                        const target = cpu._r.gen[R8.B];
                        const newValue = (target + 1) & 0xFF;
                        cpu._r.gen[R8.B] = newValue;
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
                    }
                    return;
                case 0x0C: // INC C
                    {
                        const target = cpu._r.gen[R8.C];
                        const newValue = (target + 1) & 0xFF;
                        cpu._r.gen[R8.C] = newValue;
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
                    }
                    return;
                case 0x14: // INC D
                    {
                        const target = cpu._r.gen[R8.D];
                        const newValue = (target + 1) & 0xFF;
                        cpu._r.gen[R8.D] = newValue;
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
                    }
                    return;
                case 0x1C: // INC E
                    {
                        const target = cpu._r.gen[R8.E];
                        const newValue = (target + 1) & 0xFF;
                        cpu._r.gen[R8.E] = newValue;
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
                    }
                    return;
                case 0x24: // INC H
                    {
                        const target = cpu._r.gen[R8.H];
                        const newValue = (target + 1) & 0xFF;
                        cpu._r.gen[R8.H] = newValue;
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
                    }
                    return;
                case 0x2C: // INC L
                    {
                        const target = cpu._r.gen[R8.L];
                        const newValue = (target + 1) & 0xFF;
                        cpu._r.gen[R8.L] = newValue;
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
                    }
                    return;
                case 0x34: // INC [HL]
                    {
                        const target = cpu._r.gen[R8.iHL];
                        const newValue = (target + 1) & 0xFF;
                        cpu._r.gen[R8.iHL] = newValue;
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
                    }
                    return;
                case 0x3C: // INC A
                    {
                        const target = cpu._r.gen[R8.A];
                        const newValue = (target + 1) & 0xFF;
                        cpu._r.gen[R8.A] = newValue;
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
                    }
                    return;

                /** DEC R8 */
                case 0x05: // DEC B
                    {
                        const target = cpu._r.gen[R8.B];
                        const newValue = (target - 1) & 0xFF;
                        cpu._r.gen[R8.B] = newValue;

                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (1 & 0xF) > (target & 0xF);
                    }
                    return;
                case 0x0D: // DEC C
                    {
                        const target = cpu._r.gen[R8.C];
                        const newValue = (target - 1) & 0xFF;
                        cpu._r.gen[R8.C] = newValue;

                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (1 & 0xF) > (target & 0xF);
                    }
                    return;
                case 0x15: // DEC D
                    {
                        const target = cpu._r.gen[R8.D];
                        const newValue = (target - 1) & 0xFF;
                        cpu._r.gen[R8.D] = newValue;

                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (1 & 0xF) > (target & 0xF);
                    }
                    return;
                case 0x1D: // DEC E
                    {
                        const target = cpu._r.gen[R8.E];
                        const newValue = (target - 1) & 0xFF;
                        cpu._r.gen[R8.E] = newValue;

                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (1 & 0xF) > (target & 0xF);
                    }
                    return;
                case 0x25: // DEC H
                    {
                        const target = cpu._r.gen[R8.H];
                        const newValue = (target - 1) & 0xFF;
                        cpu._r.gen[R8.H] = newValue;

                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (1 & 0xF) > (target & 0xF);
                    }
                    return;
                case 0x2D: // DEC L
                    {
                        const target = cpu._r.gen[R8.L];
                        const newValue = (target - 1) & 0xFF;
                        cpu._r.gen[R8.L] = newValue;

                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (1 & 0xF) > (target & 0xF);
                    }
                    return;
                case 0x35: // DEC [HL]
                    {
                        const target = cpu._r.gen[R8.iHL];
                        const newValue = (target - 1) & 0xFF;
                        cpu._r.gen[R8.iHL] = newValue;

                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (1 & 0xF) > (target & 0xF);
                    }
                    return;
                case 0x3D: // DEC A
                    {
                        const target = cpu._r.gen[R8.A];
                        const newValue = (target - 1) & 0xFF;
                        cpu._r.gen[R8.A] = newValue;

                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (1 & 0xF) > (target & 0xF);
                    }
                    return;

                /** INC R16 */
                case 0x03: // INC BC
                    cpu._r.paired[R16.BC] = (cpu._r.paired[R16.BC] + 1) & 0xFFFF;
                    cpu.cycles += 4;
                    return;
                case 0x13: // INC DE 
                    cpu._r.paired[R16.DE] = (cpu._r.paired[R16.DE] + 1) & 0xFFFF;
                    cpu.cycles += 4;
                    return;
                case 0x23: // INC HL
                    cpu._r.paired[R16.HL] = (cpu._r.paired[R16.HL] + 1) & 0xFFFF;
                    cpu.cycles += 4;
                    return;
                case 0x33: // INC SP
                    cpu._r.paired[R16.SP] = (cpu._r.paired[R16.SP] + 1) & 0xFFFF;
                    cpu.cycles += 4;
                    return;

                /** DEC R16 */
                case 0x0B: // DEC BC
                    cpu._r.paired[R16.BC] = (cpu._r.paired[R16.BC] - 1) & 0xFFFF;
                    cpu.cycles += 4;
                    return;
                case 0x1B: // DEC DE 
                    cpu._r.paired[R16.DE] = (cpu._r.paired[R16.DE] - 1) & 0xFFFF;
                    cpu.cycles += 4;
                    return;
                case 0x2B: // DEC HL
                    cpu._r.paired[R16.HL] = (cpu._r.paired[R16.HL] - 1) & 0xFFFF;
                    cpu.cycles += 4;
                    return;
                case 0x3B: // DEC SP
                    cpu._r.paired[R16.SP] = (cpu._r.paired[R16.SP] - 1) & 0xFFFF;
                    cpu.cycles += 4;
                    return;

                /** LD R16, N16 */
                case 0x01: // LD BC, N16
                    cpu._r.paired[R16.BC] = (pcTriplet[2] << 8) | pcTriplet[1];
                    return;
                case 0x11: // LD DE, N16
                    cpu._r.paired[R16.DE] = (pcTriplet[2] << 8) | pcTriplet[1];
                    return;
                case 0x21: // LD HL, N16
                    cpu._r.paired[R16.HL] = (pcTriplet[2] << 8) | pcTriplet[1];
                    return;
                case 0x31: // LD SP, N16
                    cpu._r.paired[R16.SP] = (pcTriplet[2] << 8) | pcTriplet[1];
                    return;

                /** Arithmetic */
                case 0xC6: // ADD A, N8
                    {
                        const value = pcTriplet[1];

                        const newValue = (value + cpu._r.gen[R8.A]) & 0xFF;
                        const didOverflow = ((value + cpu._r.gen[R8.A]) >> 8) !== 0;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) + (value & 0xF) > 0xF;
                        cpu._r._f.carry = didOverflow;

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }
                    return;
                case 0xCE: // ADC A, N8
                    {
                        const value = pcTriplet[1];

                        const newValue = (value + cpu._r.gen[R8.A] + (cpu._r._f.carry ? 1 : 0)) & 0xFF;
                        const didOverflow = ((value + cpu._r.gen[R8.A] + (cpu._r._f.carry ? 1 : 0)) >> 8) !== 0;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) + (value & 0xF) + (cpu._r._f.carry ? 1 : 0) > 0xF;
                        cpu._r._f.carry = didOverflow;

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }
                    return;
                case 0xD6: // SUB A, N8
                    {
                        const value = pcTriplet[1];

                        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A];

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }
                    return;
                case 0xDE: // SBC A, N8
                    {
                        const value = pcTriplet[1];

                        const newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }
                    return;

                // #region LD R8, R8
                case 0x40: // LD B, B
                    cpu._r.gen[R8.B] = cpu._r.gen[R8.B];
                    return;
                case 0x41: // LD B, C
                    cpu._r.gen[R8.B] = cpu._r.gen[R8.C];
                    return;
                case 0x42: // LD B, D
                    cpu._r.gen[R8.B] = cpu._r.gen[R8.D];
                    return;
                case 0x43: // LD B, E
                    cpu._r.gen[R8.B] = cpu._r.gen[R8.E];
                    return;
                case 0x44: // LD B, H
                    cpu._r.gen[R8.B] = cpu._r.gen[R8.H];
                    return;
                case 0x45: // LD B, L
                    cpu._r.gen[R8.B] = cpu._r.gen[R8.L];
                    return;
                case 0x46: // LD B, (HL)
                    cpu._r.gen[R8.B] = cpu._r.gen[R8.iHL];
                    return;
                case 0x47: // LD B, A
                    cpu._r.gen[R8.B] = cpu._r.gen[R8.A];
                    return;

                case 0x48: // LD C, B
                    cpu._r.gen[R8.C] = cpu._r.gen[R8.B];
                    return;
                case 0x49: // LD C, C
                    cpu._r.gen[R8.C] = cpu._r.gen[R8.C];
                    return;
                case 0x4A: // LD C, D
                    cpu._r.gen[R8.C] = cpu._r.gen[R8.D];
                    return;
                case 0x4B: // LD C, E
                    cpu._r.gen[R8.C] = cpu._r.gen[R8.E];
                    return;
                case 0x4C: // LD C, H
                    cpu._r.gen[R8.C] = cpu._r.gen[R8.H];
                    return;
                case 0x4D: // LD C, L
                    cpu._r.gen[R8.C] = cpu._r.gen[R8.L];
                    return;
                case 0x4E: // LD C, (HL)
                    cpu._r.gen[R8.C] = cpu._r.gen[R8.iHL];
                    return;
                case 0x4F: // LD C, A
                    cpu._r.gen[R8.C] = cpu._r.gen[R8.A];
                    return;

                case 0x50: // LD D, B
                    cpu._r.gen[R8.D] = cpu._r.gen[R8.B];
                    return;
                case 0x51: // LD D, C
                    cpu._r.gen[R8.D] = cpu._r.gen[R8.C];
                    return;
                case 0x52: // LD D, D
                    cpu._r.gen[R8.D] = cpu._r.gen[R8.D];
                    return;
                case 0x53: // LD D, E
                    cpu._r.gen[R8.D] = cpu._r.gen[R8.E];
                    return;
                case 0x54: // LD D, H
                    cpu._r.gen[R8.D] = cpu._r.gen[R8.H];
                    return;
                case 0x55: // LD D, L
                    cpu._r.gen[R8.D] = cpu._r.gen[R8.L];
                    return;
                case 0x56: // LD D, (HL)
                    cpu._r.gen[R8.D] = cpu._r.gen[R8.iHL];
                    return;
                case 0x57: // LD D, A
                    cpu._r.gen[R8.D] = cpu._r.gen[R8.A];
                    return;

                case 0x58: // LD E, B
                    cpu._r.gen[R8.E] = cpu._r.gen[R8.B];
                    return;
                case 0x59: // LD E, C
                    cpu._r.gen[R8.E] = cpu._r.gen[R8.C];
                    return;
                case 0x5A: // LD E, D
                    cpu._r.gen[R8.E] = cpu._r.gen[R8.D];
                    return;
                case 0x5B: // LD E, E
                    cpu._r.gen[R8.E] = cpu._r.gen[R8.E];
                    return;
                case 0x5C: // LD E, H
                    cpu._r.gen[R8.E] = cpu._r.gen[R8.H];
                    return;
                case 0x5D: // LD E, L
                    cpu._r.gen[R8.E] = cpu._r.gen[R8.L];
                    return;
                case 0x5E: // LD E, (HL)
                    cpu._r.gen[R8.E] = cpu._r.gen[R8.iHL];
                    return;
                case 0x5F: // LD E, A
                    cpu._r.gen[R8.E] = cpu._r.gen[R8.A];
                    return;

                case 0x60: // LD H, B
                    cpu._r.gen[R8.H] = cpu._r.gen[R8.B];
                    return;
                case 0x61: // LD H, C
                    cpu._r.gen[R8.H] = cpu._r.gen[R8.C];
                    return;
                case 0x62: // LD H, D
                    cpu._r.gen[R8.H] = cpu._r.gen[R8.D];
                    return;
                case 0x63: // LD H, E
                    cpu._r.gen[R8.H] = cpu._r.gen[R8.E];
                    return;
                case 0x64: // LD H, H
                    cpu._r.gen[R8.H] = cpu._r.gen[R8.H];
                    return;
                case 0x65: // LD H, L
                    cpu._r.gen[R8.H] = cpu._r.gen[R8.L];
                    return;
                case 0x66: // LD H, (HL)
                    cpu._r.gen[R8.H] = cpu._r.gen[R8.iHL];
                    return;
                case 0x67: // LD H, A
                    cpu._r.gen[R8.H] = cpu._r.gen[R8.A];
                    return;

                case 0x68: // LD L, B
                    cpu._r.gen[R8.L] = cpu._r.gen[R8.B];
                    return;
                case 0x69: // LD L, C
                    cpu._r.gen[R8.L] = cpu._r.gen[R8.C];
                    return;
                case 0x6A: // LD L, D
                    cpu._r.gen[R8.L] = cpu._r.gen[R8.D];
                    return;
                case 0x6B: // LD L, E
                    cpu._r.gen[R8.L] = cpu._r.gen[R8.E];
                    return;
                case 0x6C: // LD L, H
                    cpu._r.gen[R8.L] = cpu._r.gen[R8.H];
                    return;
                case 0x6D: // LD L, L
                    cpu._r.gen[R8.L] = cpu._r.gen[R8.L];
                    return;
                case 0x6E: // LD L, (HL)
                    cpu._r.gen[R8.L] = cpu._r.gen[R8.iHL];
                    return;
                case 0x6F: // LD L, A
                    cpu._r.gen[R8.L] = cpu._r.gen[R8.A];
                    return;

                case 0x70: // LD (HL), B
                    cpu._r.gen[R8.iHL] = cpu._r.gen[R8.B];
                    return;
                case 0x71: // LD (HL), C
                    cpu._r.gen[R8.iHL] = cpu._r.gen[R8.C];
                    return;
                case 0x72: // LD (HL), D
                    cpu._r.gen[R8.iHL] = cpu._r.gen[R8.D];
                    return;
                case 0x73: // LD (HL), E
                    cpu._r.gen[R8.iHL] = cpu._r.gen[R8.E];
                    return;
                case 0x74: // LD (HL), H
                    cpu._r.gen[R8.iHL] = cpu._r.gen[R8.H];
                    return;
                case 0x75: // LD (HL), L
                    cpu._r.gen[R8.iHL] = cpu._r.gen[R8.L];
                    return;
                // HALT goes here
                case 0x77: // LD (HL), A
                    cpu._r.gen[R8.iHL] = cpu._r.gen[R8.A];
                    return;

                case 0x78: // LD A, B
                    cpu._r.gen[R8.A] = cpu._r.gen[R8.B];
                    return;
                case 0x79: // LD A, C
                    cpu._r.gen[R8.A] = cpu._r.gen[R8.C];
                    return;
                case 0x7A: // LD A, D
                    cpu._r.gen[R8.A] = cpu._r.gen[R8.D];
                    return;
                case 0x7B: // LD A, E
                    cpu._r.gen[R8.A] = cpu._r.gen[R8.E];
                    return;
                case 0x7C: // LD A, H
                    cpu._r.gen[R8.A] = cpu._r.gen[R8.H];
                    return;
                case 0x7D: // LD A, L
                    cpu._r.gen[R8.A] = cpu._r.gen[R8.L];
                    return;
                case 0x7E: // LD A, (HL)
                    cpu._r.gen[R8.A] = cpu._r.gen[R8.iHL];
                    return;
                case 0x7F: // LD A, A
                    cpu._r.gen[R8.A] = cpu._r.gen[R8.A];
                    return;

                //#endregion

                // #region Accumulator Arithmetic
                case 0x80: // ADD A, B
                    {
                        let value = cpu._r.gen[R8.B];
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

                    return;
                case 0x81: // ADD A, C
                    {
                        let value = cpu._r.gen[R8.C];
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

                    return;
                case 0x82: // ADD A, D
                    {
                        let value = cpu._r.gen[R8.D];
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

                    return;

                case 0x83: // ADD A, E
                    {
                        let value = cpu._r.gen[R8.E];
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

                    return;

                case 0x84: // ADD A, H
                    {
                        let value = cpu._r.gen[R8.H];
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

                    return;

                case 0x85: // ADD A, L
                    {
                        let value = cpu._r.gen[R8.L];
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

                    return;

                case 0x86: // ADD A, (HL)
                    {
                        let value = cpu._r.gen[R8.iHL];
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

                    return;

                case 0x87: // ADD A, A
                    {
                        let value = cpu._r.gen[R8.A];
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

                    return;

                case 0x88: // ADC A, B
                    {
                        let value = cpu._r.gen[R8.B];

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

                    return;
                case 0x89: // ADC A, C
                    {
                        let value = cpu._r.gen[R8.C];

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

                    return;
                case 0x8A: // ADC A, D
                    {
                        let value = cpu._r.gen[R8.D];

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

                    return;

                case 0x8B: // ADC A, E
                    {
                        let value = cpu._r.gen[R8.E];

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

                    return;

                case 0x8C: // ADC A, H
                    {
                        let value = cpu._r.gen[R8.H];

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

                    return;

                case 0x8D: // ADC A, L
                    {
                        let value = cpu._r.gen[R8.L];

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

                    return;

                case 0x8E: // ADC A, (HL)
                    {
                        let value = cpu._r.gen[R8.iHL];

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

                    return;

                case 0x8F: // ADC A, A
                    {
                        let value = cpu._r.gen[R8.A];

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

                    return;

                case 0x90: // SUB A, B
                    {
                        const value = cpu._r.gen[R8.B];

                        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A];

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;
                case 0x91: // SUB A, C
                    {
                        const value = cpu._r.gen[R8.C];

                        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A];

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;
                case 0x92: // SUB A, D
                    {
                        const value = cpu._r.gen[R8.D];

                        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A];

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;

                case 0x93: // SUB A, E
                    {
                        const value = cpu._r.gen[R8.E];

                        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A];

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;

                case 0x94: // SUB A, H
                    {
                        const value = cpu._r.gen[R8.H];

                        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A];

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;

                case 0x95: // SUB A, L
                    {
                        const value = cpu._r.gen[R8.L];

                        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A];

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;

                case 0x96: // SUB A, (HL)
                    {
                        const value = cpu._r.gen[R8.iHL];

                        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A];

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;

                case 0x97: // SUB A, A
                    {
                        const value = cpu._r.gen[R8.A];

                        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A];

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;


                case 0x98: // SBC A, B
                    {
                        const value = cpu._r.gen[R8.B];

                        const newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;
                case 0x99: // SBC A, C
                    {
                        const value = cpu._r.gen[R8.C];

                        const newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;
                case 0x9A: // SBC A, D
                    {
                        const value = cpu._r.gen[R8.D];

                        const newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;

                case 0x9B: // SBC A, E
                    {
                        const value = cpu._r.gen[R8.E];

                        const newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;

                case 0x9C: // SBC A, H
                    {
                        const value = cpu._r.gen[R8.H];

                        const newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;

                case 0x9D: // SBC A, L
                    {
                        const value = cpu._r.gen[R8.L];

                        const newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;

                case 0x9E: // SBC A, (HL)
                    {
                        const value = cpu._r.gen[R8.iHL];

                        const newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;

                case 0x9F: // SBC A, A
                    {
                        const value = cpu._r.gen[R8.A];

                        const newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

                        // Set flags
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
                        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

                        // Set register values
                        cpu._r.gen[R8.A] = newValue;
                    }

                    return;

                case 0xA0: // AND A, B
                    {
                        const value = cpu._r.gen[R8.B];

                        const final = value & cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        // Set flags
                        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = true;
                        cpu._r._f.carry = false;
                    }

                    return;
                case 0xA1: // AND A, C
                    {
                        const value = cpu._r.gen[R8.C];

                        const final = value & cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        // Set flags
                        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = true;
                        cpu._r._f.carry = false;
                    }

                    return;
                case 0xA2: // AND A, D
                    {
                        const value = cpu._r.gen[R8.D];

                        const final = value & cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        // Set flags
                        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = true;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xA3: // AND A, E
                    {
                        const value = cpu._r.gen[R8.E];

                        const final = value & cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        // Set flags
                        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = true;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xA4: // AND A, H
                    {
                        const value = cpu._r.gen[R8.H];

                        const final = value & cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        // Set flags
                        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = true;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xA5: // AND A, L
                    {
                        const value = cpu._r.gen[R8.L];

                        const final = value & cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        // Set flags
                        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = true;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xA6: // AND A, (HL)
                    {
                        const value = cpu._r.gen[R8.iHL];

                        const final = value & cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        // Set flags
                        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = true;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xA7: // AND A, A
                    {
                        const value = cpu._r.gen[R8.A];

                        const final = value & cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        // Set flags
                        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = true;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xA8: // XOR A, B
                    {
                        const value = cpu._r.gen[R8.B];

                        const final = value ^ cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;
                case 0xA9: // XOR A, C
                    {
                        const value = cpu._r.gen[R8.C];

                        const final = value ^ cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;
                case 0xAA: // XOR A, D
                    {
                        const value = cpu._r.gen[R8.D];

                        const final = value ^ cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xAB: // XOR A, E
                    {
                        const value = cpu._r.gen[R8.E];

                        const final = value ^ cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;
                case 0xAC: // XOR A, H
                    {
                        const value = cpu._r.gen[R8.H];

                        const final = value ^ cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;
                case 0xAD: // XOR A, L
                    {
                        const value = cpu._r.gen[R8.L];

                        const final = value ^ cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;
                case 0xAE: // XOR A, (HL)
                    {
                        const value = cpu._r.gen[R8.iHL];

                        const final = value ^ cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;
                case 0xAF: // XOR A, A
                    {
                        const value = cpu._r.gen[R8.A];

                        const final = value ^ cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xB0: // OR A, B
                    {
                        const value = cpu._r.gen[R8.B];

                        const final = value | cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;
                case 0xB1: // OR A, C
                    {
                        const value = cpu._r.gen[R8.C];

                        const final = value | cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;
                case 0xB2: // OR A, D
                    {
                        const value = cpu._r.gen[R8.D];

                        const final = value | cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xB3: // OR A, E
                    {
                        const value = cpu._r.gen[R8.E];

                        const final = value | cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xB4: // OR A, H
                    {
                        const value = cpu._r.gen[R8.H];

                        const final = value | cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xB5: // OR A, L
                    {
                        const value = cpu._r.gen[R8.L];

                        const final = value | cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xB6: // OR A, (HL)
                    {
                        const value = cpu._r.gen[R8.iHL];

                        const final = value | cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xB7: // OR A, A
                    {
                        const value = cpu._r.gen[R8.A];

                        const final = value | cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }

                    return;

                case 0xB8: // CP A, B
                    {
                        const r8 = cpu._r.gen[R8.B];

                        const newValue = (cpu._r.gen[R8.A] - r8) & 0xFF;
                        const didOverflow = ((cpu._r.gen[R8.A] - r8) >> 8) !== 0;

                        // DO not set register values for CP

                        // Set flags
                        cpu._r._f.carry = r8 > cpu._r.gen[R8.A];
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (r8 & 0xF) < 0;
                    }

                    return;
                case 0xB9: // CP A, C
                    {
                        const r8 = cpu._r.gen[R8.C];

                        const newValue = (cpu._r.gen[R8.A] - r8) & 0xFF;
                        const didOverflow = ((cpu._r.gen[R8.A] - r8) >> 8) !== 0;

                        // DO not set register values for CP

                        // Set flags
                        cpu._r._f.carry = r8 > cpu._r.gen[R8.A];
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (r8 & 0xF) < 0;
                    }

                    return;
                case 0xBA: // CP A, D
                    {
                        const r8 = cpu._r.gen[R8.D];

                        const newValue = (cpu._r.gen[R8.A] - r8) & 0xFF;
                        const didOverflow = ((cpu._r.gen[R8.A] - r8) >> 8) !== 0;

                        // DO not set register values for CP

                        // Set flags
                        cpu._r._f.carry = r8 > cpu._r.gen[R8.A];
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (r8 & 0xF) < 0;
                    }

                    return;

                case 0xBB: // CP A, E
                    {
                        const r8 = cpu._r.gen[R8.E];

                        const newValue = (cpu._r.gen[R8.A] - r8) & 0xFF;
                        const didOverflow = ((cpu._r.gen[R8.A] - r8) >> 8) !== 0;

                        // DO not set register values for CP

                        // Set flags
                        cpu._r._f.carry = r8 > cpu._r.gen[R8.A];
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (r8 & 0xF) < 0;
                    }

                    return;
                case 0xBC: // CP A, H
                    {
                        const r8 = cpu._r.gen[R8.H];

                        const newValue = (cpu._r.gen[R8.A] - r8) & 0xFF;
                        const didOverflow = ((cpu._r.gen[R8.A] - r8) >> 8) !== 0;

                        // DO not set register values for CP

                        // Set flags
                        cpu._r._f.carry = r8 > cpu._r.gen[R8.A];
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (r8 & 0xF) < 0;
                    }

                    return;
                case 0xBD: // CP A, L
                    {
                        const r8 = cpu._r.gen[R8.L];

                        const newValue = (cpu._r.gen[R8.A] - r8) & 0xFF;
                        const didOverflow = ((cpu._r.gen[R8.A] - r8) >> 8) !== 0;

                        // DO not set register values for CP

                        // Set flags
                        cpu._r._f.carry = r8 > cpu._r.gen[R8.A];
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (r8 & 0xF) < 0;
                    }

                    return;
                case 0xBE: // CP A, (HL)
                    {
                        const r8 = cpu._r.gen[R8.iHL];

                        const newValue = (cpu._r.gen[R8.A] - r8) & 0xFF;
                        const didOverflow = ((cpu._r.gen[R8.A] - r8) >> 8) !== 0;

                        // DO not set register values for CP

                        // Set flags
                        cpu._r._f.carry = r8 > cpu._r.gen[R8.A];
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (r8 & 0xF) < 0;
                    }

                    return;
                case 0xBF: // CP A, A
                    {
                        const r8 = cpu._r.gen[R8.A];

                        const newValue = (cpu._r.gen[R8.A] - r8) & 0xFF;
                        const didOverflow = ((cpu._r.gen[R8.A] - r8) >> 8) !== 0;

                        // DO not set register values for CP

                        // Set flags
                        cpu._r._f.carry = r8 > cpu._r.gen[R8.A];
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (r8 & 0xF) < 0;
                    }

                    return;
                //#endregion

                case 0x36: // LD [HL], N8
                    cpu.writeMem8(cpu._r.hl, pcTriplet[1]);
                    return;
                case 0x2F: // CPL
                    cpu._r.gen[R8.A] = cpu._r.gen[R8.A] ^ 0b11111111;

                    cpu._r._f.negative = true;
                    cpu._r._f.half_carry = true;
                    return;
                case 0xD9: // RETI
                    cpu.cycles += 4; // Branch decision
                    const stackLowerByte = cpu.fetchMem8((cpu._r.sp++) & 0xFFFF);
                    const stackUpperByte = cpu.fetchMem8((cpu._r.sp++) & 0xFFFF);

                    const returnAddress = (((stackUpperByte << 8) | stackLowerByte)) & 0xFFFF;
                    // console.info(`Returning to 0x${returnAddress.toString(16)}`);

                    cpu.pc = returnAddress - 1;

                    cpu.cycles += 4; // Branching takes 4 cycles
                    cpu.scheduleEnableInterruptsForNextTick = true;
                    return;
                case 0x27: // DAA
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
                    return;
                case 0x00: // NOP
                    return;

                /** LD between A and R16 */
                case 0x02: // LD [BC], A
                    cpu.writeMem8(cpu._r.paired[R16.BC], cpu._r.gen[R8.A]);
                    break;
                case 0x12: // LD [DE], A
                    cpu.writeMem8(cpu._r.paired[R16.DE], cpu._r.gen[R8.A]);
                    break;
                case 0x22: // LD [HL+], A
                    cpu.writeMem8(cpu._r.hl, cpu._r.gen[R8.A]);
                    cpu._r.hl = (cpu._r.hl + 1) & 0xFFFF;
                    break;
                case 0x32: // LD [HL-], A
                    cpu.writeMem8(cpu._r.hl, cpu._r.gen[R8.A]);
                    cpu._r.hl = (cpu._r.hl - 1) & 0xFFFF;
                    break;
                case 0x0A: // LD A, [BC]
                    cpu._r.gen[R8.A] = cpu.fetchMem8(cpu._r.paired[R16.BC]);
                    break;
                case 0x1A: // LD A, [DE]
                    cpu._r.gen[R8.A] = cpu.fetchMem8(cpu._r.paired[R16.DE]);
                    break;
                case 0x2A: // LD A, [HL+]
                    cpu._r.gen[R8.A] = cpu.fetchMem8(cpu._r.hl);
                    cpu._r.hl = (cpu._r.hl + 1) & 0xFFFF;
                    break;
                case 0x3A: // LD A, [HL-]
                    cpu._r.gen[R8.A] = cpu.fetchMem8(cpu._r.hl);
                    cpu._r.hl = (cpu._r.hl - 1) & 0xFFFF;
                    break;

                /** A ops */
                case 0xE6: // AND A, N8
                    {
                        const value = pcTriplet[1];

                        const final = value & cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = true;
                        cpu._r._f.carry = false;
                    }
                    break;
                case 0xF6: // OR A, N8
                    {
                        const value = pcTriplet[1];

                        const final = value | cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                        break;
                    }
                case 0xEE: // XOR A, N8
                    {
                        const value = pcTriplet[1];

                        const final = value ^ cpu._r.gen[R8.A];
                        cpu._r.gen[R8.A] = final;

                        cpu._r._f.zero = final === 0;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = false;
                    }
                    break;
                case 0xFE: // CP A, N8
                    {
                        const value = pcTriplet[1];

                        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;
                        const didOverflow = ((cpu._r.gen[R8.A] - value) >> 8) !== 0;


                        // Set flags
                        cpu._r._f.carry = value > cpu._r.gen[R8.A];
                        cpu._r._f.zero = newValue === 0;
                        cpu._r._f.negative = true;
                        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (pcTriplet[1] & 0xF) < 0;
                    }
                    break;

                /** LD between A and High RAM */
                case 0xF0: // LD A, [$FF00+N8]
                    cpu._r.gen[R8.A] = cpu.fetchMem8((0xFF00 + pcTriplet[1]) & 0xFFFF);
                    break;
                case 0xE0: // LD [$FF00+N8], A
                    cpu.writeMem8((0xFF00 + pcTriplet[1]) & 0xFFFF, cpu._r.gen[R8.A]);
                    break;
                case 0xF2: // LD A, [$FF00+C]
                    cpu._r.gen[R8.A] = cpu.fetchMem8((0xFF00 + cpu._r.gen[R8.C]) & 0xFFFF);
                    break;
                case 0xE2: // LD [$FF00+C], A
                    cpu.writeMem8((0xFF00 + cpu._r.gen[R8.C]) & 0xFFFF, cpu._r.gen[R8.A]);
                    break;

                case 0xF3: // DI - Disable interrupts master flag
                    cpu.gb.interrupts.masterEnabled = false;
                    break;
                case 0xFB: // EI - Enable interrupts master flag
                    cpu.scheduleEnableInterruptsForNextTick = true;
                    break;


                case 0xFA: // LD A, [N16]
                    cpu._r.gen[R8.A] = cpu.fetchMem8((pcTriplet[2] << 8) | pcTriplet[1]);
                    break;
                case 0xEA: // LD [N16], A
                    cpu.writeMem8((pcTriplet[2] << 8) | pcTriplet[1], cpu._r.gen[R8.A]);
                    break;
                case 0x08: // LD [N16], SP
                    const spUpperByte = cpu._r.sp >> 8;
                    const spLowerByte = cpu._r.sp & 0b11111111;

                    cpu.writeMem8((pcTriplet[2] << 8) | pcTriplet[1] + 0, spLowerByte);
                    cpu.writeMem8((pcTriplet[2] << 8) | pcTriplet[1] + 1, (spUpperByte) & 0xFFFF);
                    break;

                /** JP */
                case 0xE9: // JP HL
                    cpu.pc = cpu._r.hl - 1;
                    break;
                case 0xC3: // JP N16
                    cpu.pc = ((pcTriplet[2] << 8) | pcTriplet[1] + 0) - 3;
                    cpu.cycles += 4; // Branching takes 4 cycles
                    break;
                case 0xDA: // JP C, N16
                    if (!cpu._r._f.carry) return;
                    cpu.pc = ((pcTriplet[2] << 8) | pcTriplet[1] + 0) - 3;
                    cpu.cycles += 4; // Branching takes 4 cycles
                    break;
                case 0xD2: // JP NC, N16
                    if (cpu._r._f.carry) return;
                    cpu.pc = ((pcTriplet[2] << 8) | pcTriplet[1] + 0) - 3;
                    cpu.cycles += 4; // Branching takes 4 cycles
                    break;
                case 0xCA: // JP Z, N16
                    if (!cpu._r._f.zero) return;
                    cpu.pc = ((pcTriplet[2] << 8) | pcTriplet[1] + 0) - 3;
                    cpu.cycles += 4; // Branching takes 4 cycles
                    break;
                case 0xC2: // JP NZ, N16
                    if (cpu._r._f.zero) return;
                    cpu.pc = ((pcTriplet[2] << 8) | pcTriplet[1] + 0) - 3;
                    cpu.cycles += 4; // Branching takes 4 cycles
                    break;

                /** A rotate */
                case 0x07: // RLC A
                    {
                        const value = cpu._r.gen[R8.A];

                        const leftmostBit = (value & 0b10000000) >> 7;

                        const newValue = ((value << 1) | leftmostBit) & 0xFF;

                        cpu._r.gen[R8.A] = newValue;

                        cpu._r._f.zero = false;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = (value >> 7) === 1;
                    }
                    break;
                case 0x0F: // RRC A
                    {
                        const value = cpu._r.gen[R8.A];

                        const rightmostBit = (value & 1) << 7;
                        const newValue = ((value >> 1) | rightmostBit) & 0xFF;

                        cpu._r.gen[R8.A] = newValue;

                        cpu._r._f.zero = false;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = (value & 1) === 1;
                    }
                    break;
                case 0x1F: // RR A
                    {
                        const value = cpu._r.gen[R8.A];

                        const carryMask = (cpu._r.f & 0b00010000) << 3;

                        const newValue = ((value >> 1) | carryMask) & 0xFF;

                        cpu._r.gen[R8.A] = newValue;

                        cpu._r._f.zero = false;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = !!(value & 1);
                    }
                    break;
                case 0x17: // RL A
                    {
                        const value = cpu._r.gen[R8.A];

                        const carryMask = (cpu._r.f & 0b00010000) >> 4;

                        const newValue = ((value << 1) | carryMask) & 0xFF;

                        cpu._r.gen[R8.A] = newValue;

                        cpu._r._f.zero = false;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = false;
                        cpu._r._f.carry = (value >> 7) === 1;
                    }
                    break;

                /** SP ops */
                case 0xF8: // LD HL, SP+e8
                    {
                        const signedVal = unTwo8b(pcTriplet[1]);

                        cpu._r._f.zero = false;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = (signedVal & 0xF) + (cpu._r.sp & 0xF) > 0xF;
                        cpu._r._f.carry = (signedVal & 0xFF) + (cpu._r.sp & 0xFF) > 0xFF;

                        cpu._r.hl = (unTwo8b(pcTriplet[1]) + cpu._r.sp) & 0xFFFF;

                        // Register read timing
                        cpu.cycles += 4;
                    }
                    break;
                case 0xF9: // LD SP, HL
                    {
                        cpu._r.sp = cpu._r.hl;
                        // Register read timing
                        cpu.cycles += 4;
                    }
                    break;
                case 0xE8: // ADD SP, E8
                    {
                        const value = unTwo8b(pcTriplet[1]);

                        cpu._r._f.zero = false;
                        cpu._r._f.negative = false;
                        cpu._r._f.half_carry = ((value & 0xF) + (cpu._r.sp & 0xF)) > 0xF;
                        cpu._r._f.carry = ((value & 0xFF) + (cpu._r.sp & 0xFF)) > 0xFF;

                        cpu._r.sp = (cpu._r.sp + value) & 0xFFFF;

                        // Extra time
                        cpu.cycles += 8;
                    }
                    break;

                /** Interrupts */
                case 0x10: // STOP
                    if (cpu.gb.prepareSpeedSwitch) {
                        cpu.gb.doubleSpeed = !cpu.gb.doubleSpeed;
                    }
                    return;
                case 0x76: // HALT
                    if (
                        (
                            cpu.gb.interrupts.enabledInterrupts.numerical &
                            cpu.gb.interrupts.requestedInterrupts.numerical &
                            0x1F
                        ) !== 0
                    ) {
                        // HALT bug
                        cpu.haltBug = true;
                        cpu.pc++; cpu.pc &= 0xFFFF;
                    } else (
                        cpu.gb.interrupts.enabledInterrupts.numerical &
                        cpu.gb.interrupts.requestedInterrupts.numerical &
                        0x1F) === 0;
                    {
                        cpu.halted = true;
                    }
                    return;

                /** Carry flag */
                case 0x37: // SCF
                    cpu._r._f.negative = false;
                    cpu._r._f.half_carry = false;
                    cpu._r._f.carry = true;
                    return;
                case 0x3F: // CCF
                    cpu._r._f.negative = false;
                    cpu._r._f.half_carry = false;
                    cpu._r._f.carry = !cpu._r._f.carry;
                    break;

                /** CALL */
                case 0xCD: // CALL N16
                    {
                        const pcUpperByte = ((cpu.pc + 3) & 0xFFFF) >> 8;
                        const pcLowerByte = ((cpu.pc + 3) & 0xFFFF) & 0xFF;

                        // console.info(`Calling 0x${u16.toString(16)} from 0x${cpu.pc.toString(16)}`);

                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, pcUpperByte);
                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, pcLowerByte);

                        cpu.pc = ((pcTriplet[2] << 8) | pcTriplet[1]) - 3;

                        cpu.cycles += 4; // Branching takes 4 cycles
                    }
                    return;
                case 0xDC: // CALL C, N16
                    {
                        if (!cpu._r._f.carry) return;

                        const pcUpperByte = ((cpu.pc + 3) & 0xFFFF) >> 8;
                        const pcLowerByte = ((cpu.pc + 3) & 0xFFFF) & 0xFF;

                        // console.info(`Calling 0x${u16.toString(16)} from 0x${cpu.pc.toString(16)}`);

                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, pcUpperByte);
                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, pcLowerByte);

                        cpu.pc = ((pcTriplet[2] << 8) | pcTriplet[1]) - 3;

                        cpu.cycles += 4; // Branching takes 4 cycles
                    }
                    return;
                case 0xD4: // CALL NC, N16
                    {
                        if (cpu._r._f.carry) return;

                        const pcUpperByte = ((cpu.pc + 3) & 0xFFFF) >> 8;
                        const pcLowerByte = ((cpu.pc + 3) & 0xFFFF) & 0xFF;

                        // console.info(`Calling 0x${u16.toString(16)} from 0x${cpu.pc.toString(16)}`);

                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, pcUpperByte);
                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, pcLowerByte);

                        cpu.pc = ((pcTriplet[2] << 8) | pcTriplet[1]) - 3;

                        cpu.cycles += 4; // Branching takes 4 cycles
                    }
                    return;
                case 0xCC: // CALL Z, N16
                    {
                        if (!cpu._r._f.zero) return;

                        const pcUpperByte = ((cpu.pc + 3) & 0xFFFF) >> 8;
                        const pcLowerByte = ((cpu.pc + 3) & 0xFFFF) & 0xFF;

                        // console.info(`Calling 0x${u16.toString(16)} from 0x${cpu.pc.toString(16)}`);

                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, pcUpperByte);
                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, pcLowerByte);

                        cpu.pc = ((pcTriplet[2] << 8) | pcTriplet[1]) - 3;

                        cpu.cycles += 4; // Branching takes 4 cycles
                    }
                    return;
                case 0xC4: // CALL NZ, N16
                    {
                        if (cpu._r._f.zero) return;

                        const pcUpperByte = ((cpu.pc + 3) & 0xFFFF) >> 8;
                        const pcLowerByte = ((cpu.pc + 3) & 0xFFFF) & 0xFF;

                        // console.info(`Calling 0x${u16.toString(16)} from 0x${cpu.pc.toString(16)}`);

                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, pcUpperByte);
                        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
                        cpu.writeMem8(cpu._r.sp, pcLowerByte);

                        cpu.pc = ((pcTriplet[2] << 8) | pcTriplet[1]) - 3;

                        cpu.cycles += 4; // Branching takes 4 cycles
                    }
                    return;


                default:
                    alert(`Oops: ${hex(pcTriplet[0], 1)}`);
                    return;


            }
        } else {
            switch (pcTriplet[1]) {

            }
        }
    }

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
                cpu.gb.interrupts.enabledInterrupts.numerical &
                cpu.gb.interrupts.requestedInterrupts.numerical &
                0x1F
            ) !== 0
        ) {
            // HALT bug
            cpu.haltBug = true;
            cpu.pc++; cpu.pc &= 0xFFFF;
        } else (
            cpu.gb.interrupts.enabledInterrupts.numerical &
            cpu.gb.interrupts.requestedInterrupts.numerical &
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
        const spUpperByte = cpu._r.sp >> 8;
        const spLowerByte = cpu._r.sp & 0b11111111;

        cpu.writeMem8(in16 + 0, spLowerByte);
        cpu.writeMem8(in16 + 1, (spUpperByte) & 0xFFFF);
    }


    static RST(cpu: CPU, vector: number) {
        const pcUpperByte = ((cpu.pc + 1) & 0xFFFF) >> 8;
        const pcLowerByte = ((cpu.pc + 1) & 0xFFFF) & 0xFF;

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
        const u8 = cpu.fetchMem8(cpu._r.paired[R16.HL]);
        cpu._r._f.zero = cpu._r.gen[R8.A] - u8 === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) + (u8 & 0xF) > 0xF;
        cpu._r._f.carry = u8 > cpu._r.gen[R8.A];
    }

    static LD_A_iFF00plusN8(cpu: CPU, n8: number) {
        cpu._r.gen[R8.A] = cpu.fetchMem8((0xFF00 + n8) & 0xFFFF);
    }

    static LD_A_iFF00plusC(cpu: CPU) {
        cpu._r.gen[R8.A] = cpu.fetchMem8((0xFF00 + cpu._r.gen[R8.C]) & 0xFFFF);
    }

    static LD_iR16_A(cpu: CPU, r16: R16) {
        cpu.writeMem8(cpu._r.paired[r16], cpu._r.gen[R8.A]);
    }

    // Store value in register A into address n16
    static LD_iN16_A(cpu: CPU, n16: number) {
        cpu.writeMem8(n16, cpu._r.gen[R8.A]);
    }

    /*  PUSH r16 - 0xC5
        Push register r16 onto the stack. */
    static PUSH_R16(cpu: CPU, r16: R16) {
        const value = cpu._r.paired[r16];
        const upperByte = value >> 8;
        const lowerByte = value & 0b11111111;

        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu._r.sp, upperByte);
        cpu._r.sp = (cpu._r.sp - 1) & 0xFFFF;
        cpu.writeMem8(cpu._r.sp, lowerByte);

        // 4 cycle penalty
        cpu.cycles += 4;
    }

    /*  PUSH r16 - 0xC1
        Pop off the stack into r16. */
    static POP_R16(cpu: CPU, r16: R16) {
        const lowerByte = cpu.fetchMem8(cpu._r.sp);
        cpu._r.sp = (cpu._r.sp + 1) & 0xFFFF;
        const upperByte = cpu.fetchMem8(cpu._r.sp);
        cpu._r.sp = (cpu._r.sp + 1) & 0xFFFF;

        cpu._r.paired[r16] = (upperByte << 8) | lowerByte;
    }

    // CALL n16 - 0xCD
    static CALL_N16(cpu: CPU, cc: CC, u16: number) {
        if (cc === CC.Z && !cpu._r._f.zero) return;
        if (cc === CC.NZ && cpu._r._f.zero) return;
        if (cc === CC.C && !cpu._r._f.carry) return;
        if (cc === CC.NC && cpu._r._f.carry) return;

        const pcUpperByte = ((cpu.pc + 3) & 0xFFFF) >> 8;
        const pcLowerByte = ((cpu.pc + 3) & 0xFFFF) & 0xFF;

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

        const stackLowerByte = cpu.fetchMem8((cpu._r.sp++) & 0xFFFF);
        const stackUpperByte = cpu.fetchMem8((cpu._r.sp++) & 0xFFFF);

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
        cpu._r.gen[R8.A] = cpu.fetchMem8(cpu._r.paired[r16]);
    }

    static LD_R16_A(cpu: CPU, t: R8) {
        cpu.writeMem8(cpu.fetchMem8(cpu._r.gen[t]), cpu._r.gen[R8.A]);
    }

    static LD_HL_SPaddE8(cpu: CPU, e8: number) {
        const signedVal = unTwo8b(e8);

        cpu._r._f.zero = false;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = (signedVal & 0xF) + (cpu._r.sp & 0xF) > 0xF;
        cpu._r._f.carry = (signedVal & 0xFF) + (cpu._r.sp & 0xFF) > 0xFF;

        cpu._r.hl = (unTwo8b(e8) + cpu._r.sp) & 0xFFFF;

        // Register read timing
        cpu.cycles += 4;
    }

    // LD [$FF00+u8],A
    static LD_iFF00plusN8_A(cpu: CPU, u8: number) {
        const value = cpu._r.gen[R8.A];
        cpu.writeMem8((0xFF00 + u8) & 0xFFFF, value);
        // writeDebug(0xFF00 + u8);
    }

    // LD [$FF00+C],A
    static LD_iFF00plusC_A(cpu: CPU) {
        const value = cpu._r.gen[R8.A];
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
        cpu._r.paired[r16] = n16;
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
        const value = unTwo8b(e8);

        cpu._r._f.zero = false;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = ((value & 0xF) + (cpu._r.sp & 0xF)) > 0xF;
        cpu._r._f.carry = ((value & 0xFF) + (cpu._r.sp & 0xFF)) > 0xFF;

        cpu._r.sp = (cpu._r.sp + value) & 0xFFFF;

        // Extra time
        cpu.cycles += 8;
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

        // Register read timing
        cpu.cycles += 4;
    }

    // ADD A, r8
    static ADD_A_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) + (value & 0xF) > 0xF;

        const newValue = (value + cpu._r.gen[R8.A]) & 0xFF;
        const didOverflow = ((value + cpu._r.gen[R8.A]) >> 8) !== 0;

        // Set register values
        cpu._r.gen[R8.A] = newValue;

        // Set flags
        cpu._r._f.carry = didOverflow;
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
    }

    // ADD A, N8
    static ADD_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const newValue = (value + cpu._r.gen[R8.A]) & 0xFF;
        const didOverflow = ((value + cpu._r.gen[R8.A]) >> 8) !== 0;

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
        const value = cpu._r.gen[t];

        const newValue = (value + cpu._r.gen[R8.A] + (cpu._r._f.carry ? 1 : 0)) & 0xFF;
        const didOverflow = ((value + cpu._r.gen[R8.A] + (cpu._r._f.carry ? 1 : 0)) >> 8) !== 0;

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
        const value = n8;

        const newValue = (value + cpu._r.gen[R8.A] + (cpu._r._f.carry ? 1 : 0)) & 0xFF;
        const didOverflow = ((value + cpu._r.gen[R8.A] + (cpu._r._f.carry ? 1 : 0)) >> 8) !== 0;

        // Set flags
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) + (value & 0xF) + (cpu._r._f.carry ? 1 : 0) > 0xF;
        cpu._r._f.carry = didOverflow;

        // Set register values
        cpu._r.gen[R8.A] = newValue;
    }

    static ADD_HL_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const newValue = (value + cpu._r.hl) & 0xFFFF;
        const didOverflow = ((value + cpu._r.hl) >> 8) !== 0;

        // Set register values
        cpu._r.hl = newValue;

        // Set flags
        cpu._r._f.carry = didOverflow;
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) + (value & 0xF) > 0xF;
    }

    static ADD_HL_R16(cpu: CPU, r16: R16) {
        const r16Value = cpu._r.paired[r16];

        const newValue = (r16Value + cpu._r.hl) & 0xFFFF;
        const didOverflow = ((r16Value + cpu._r.hl) >> 16) !== 0;

        // Set flag
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = (cpu._r.hl & 0xFFF) + (r16Value & 0xFFF) > 0xFFF;
        cpu._r._f.carry = didOverflow;

        // Set register values
        cpu._r.hl = newValue;

        // Register read takes 4 more cycles
        cpu.cycles += 4;
    }

    static SUB_A_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

        // Set flags
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
        cpu._r._f.carry = value > cpu._r.gen[R8.A];

        // Set register values
        cpu._r.gen[R8.A] = newValue;
    }


    static SUB_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;

        // Set flags
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF);
        cpu._r._f.carry = value > cpu._r.gen[R8.A];

        // Set register values
        cpu._r.gen[R8.A] = newValue;
    }

    static SBC_A_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

        // Set flags
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

        // Set register values
        cpu._r.gen[R8.A] = newValue;
    }

    static SBC_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const newValue = (cpu._r.gen[R8.A] - value - (cpu._r._f.carry ? 1 : 0)) & 0xFF;

        // Set flags
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (value & 0xF) > (cpu._r.gen[R8.A] & 0xF) - (cpu._r._f.carry ? 1 : 0);
        cpu._r._f.carry = value > cpu._r.gen[R8.A] - (cpu._r._f.carry ? 1 : 0);

        // Set register values
        cpu._r.gen[R8.A] = newValue;
    }

    static AND_A_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const final = value & cpu._r.gen[R8.A];
        cpu._r.gen[R8.A] = final;

        // Set flags
        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = true;
        cpu._r._f.carry = false;
    }

    static AND_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const final = value & cpu._r.gen[R8.A];
        cpu._r.gen[R8.A] = final;

        cpu._r._f.zero = cpu._r.gen[R8.A] === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = true;
        cpu._r._f.carry = false;
    }

    static OR_A_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const final = value | cpu._r.gen[R8.A];
        cpu._r.gen[R8.A] = final;

        cpu._r._f.zero = final === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = false;
    }

    static OR_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const final = value | cpu._r.gen[R8.A];
        cpu._r.gen[R8.A] = final;

        cpu._r._f.zero = final === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = false;
    }

    static XOR_A_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const final = value ^ cpu._r.gen[R8.A];
        cpu._r.gen[R8.A] = final;

        cpu._r._f.zero = final === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = false;
    }

    static XOR_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const final = value ^ cpu._r.gen[R8.A];
        cpu._r.gen[R8.A] = final;

        cpu._r._f.zero = final === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = false;
    }

    // CP A,r8
    static CP_A_R8(cpu: CPU, t: R8) {
        const r8 = cpu._r.gen[t];

        const newValue = (cpu._r.gen[R8.A] - r8) & 0xFF;
        const didOverflow = ((cpu._r.gen[R8.A] - r8) >> 8) !== 0;

        // DO not set register values for CP

        // Set flags
        cpu._r._f.carry = r8 > cpu._r.gen[R8.A];
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (r8 & 0xF) < 0;
    }


    static CP_A_N8(cpu: CPU, n8: number) {
        const value = n8;

        const newValue = (cpu._r.gen[R8.A] - value) & 0xFF;
        const didOverflow = ((cpu._r.gen[R8.A] - value) >> 8) !== 0;


        // Set flags
        cpu._r._f.carry = value > cpu._r.gen[R8.A];
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (cpu._r.gen[R8.A] & 0xF) - (n8 & 0xF) < 0;
    }

    static INC_R8(cpu: CPU, t: R8) {
        const target = cpu._r.gen[t];

        const newValue = (target + 1) & 0xFF;
        const didOverflow = ((target + 1) >> 8) !== 0;

        cpu._r.gen[t] = newValue;

        // UNMODIFIED cpu._r._f.carry = didOverflow;
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = (target & 0xF) + (1 & 0xF) > 0xF;
    }


    // Increment in register r16
    static INC_R16(cpu: CPU, r16: R16) {
        cpu._r.paired[r16] = (cpu._r.paired[r16] + 1) & 0xFFFF;

        // Extra time for register writeback
        cpu.cycles += 4;
    }

    static DEC_R8(cpu: CPU, t: R8) {
        const target = cpu._r.gen[t];

        const newValue = (target - 1) & 0xFF;

        cpu._r.gen[t] = newValue;

        // UNMODIFIED cpu._r._f.carry = didOverflow;
        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = true;
        cpu._r._f.half_carry = (1 & 0xF) > (target & 0xF);
    }

    static DEC_R16(cpu: CPU, tt: R16) {
        cpu._r.paired[tt] = (cpu._r.paired[tt] - 1) & 0xFFFF;

        // Extra time for register writeback
        cpu.cycles += 4;
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
        const value = cpu._r.gen[t];

        cpu._r._f.zero = (value & (1 << selectedBit)) === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = true;
    }

    static RES_R8(cpu: CPU, t: R8, selectedBit: number) {
        const value = cpu._r.gen[t];
        const mask = 0b1 << selectedBit;

        const final = value & ~(mask);

        cpu._r.gen[t] = final;
    }

    static SET_R8(cpu: CPU, t: R8, selectedBit: number) {
        let value = cpu._r.gen[t];
        const mask = 0b1 << selectedBit;

        const final = value |= mask;

        cpu._r.gen[t] = final;
    }

    // Rotate A right through carry
    static RRA(cpu: CPU) {
        const value = cpu._r.gen[R8.A];

        const carryMask = (cpu._r.f & 0b00010000) << 3;

        const newValue = ((value >> 1) | carryMask) & 0xFF;

        cpu._r.gen[R8.A] = newValue;

        cpu._r._f.zero = false;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = !!(value & 1);
    }


    // Rotate TARGET right through carry
    static RR_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const carryMask = (cpu._r.f & 0b00010000) << 3;

        const newValue = ((value >> 1) | carryMask) & 0xFF;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = !!(value & 1);
    }

    // Rotate A left through carry
    static RLA(cpu: CPU) {
        const value = cpu._r.gen[R8.A];

        const carryMask = (cpu._r.f & 0b00010000) >> 4;

        const newValue = ((value << 1) | carryMask) & 0xFF;

        cpu._r.gen[R8.A] = newValue;

        cpu._r._f.zero = false;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = (value >> 7) === 1;
    }

    // Rotate TARGET left through carry
    static RL_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const carryMask = (cpu._r.f & 0b00010000) >> 4;

        const newValue = ((value << 1) | carryMask) & 0xFF;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = (value >> 7) === 1;
    }

    // Rotate A right
    static RRCA(cpu: CPU) {
        const value = cpu._r.gen[R8.A];

        const rightmostBit = (value & 1) << 7;
        const newValue = ((value >> 1) | rightmostBit) & 0xFF;

        cpu._r.gen[R8.A] = newValue;

        cpu._r._f.zero = false;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = (value & 1) === 1;
    }


    // Rotate TARGET right
    static RRC_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const rightmostBit = (value & 1) << 7;
        const newValue = ((value >> 1) | rightmostBit) & 0xFF;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = !!(value & 1);
    }

    // Rotate A left
    static RLCA(cpu: CPU) {
        const value = cpu._r.gen[R8.A];

        const leftmostBit = (value & 0b10000000) >> 7;

        const newValue = ((value << 1) | leftmostBit) & 0xFF;

        cpu._r.gen[R8.A] = newValue;

        cpu._r._f.zero = false;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = (value >> 7) === 1;
    }

    // Rotate TARGET left
    static RLC_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const leftmostBit = (value & 0b10000000) >> 7;

        const newValue = ((value << 1) | leftmostBit) & 0xFF;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = (value >> 7) === 1;
    }

    // Shift TARGET right
    static SRA_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const leftmostBit = value & 0b10000000;
        const newValue = (value >> 1) | leftmostBit;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = !!(value & 1);
    }

    // Shift TARGET left 
    static SLA_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const newValue = (value << 1) & 0xFF;
        const didOverflow = ((value << 1) >> 8) !== 0;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = didOverflow;
    }

    // Shift right logic register
    static SRL_R8(cpu: CPU, t: R8) {
        const value = cpu._r.gen[t];

        const newValue = value >> 1;

        cpu._r.gen[t] = newValue;

        cpu._r._f.zero = newValue === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = !!(value & 1);
    }

    // SWAP 
    static SWAP_R8(cpu: CPU, r8: R8) {
        const value = cpu._r.gen[r8];

        const lowerNybble = value & 0b00001111;
        const upperNybble = (value >> 4) & 0b00001111;

        cpu._r.gen[r8] = (lowerNybble << 4) | upperNybble;

        cpu._r._f.zero = value === 0;
        cpu._r._f.negative = false;
        cpu._r._f.half_carry = false;
        cpu._r._f.carry = false;
    }
}

export default Ops;