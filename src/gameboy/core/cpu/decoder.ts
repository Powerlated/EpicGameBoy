import { Op, CC, R8, R16} from './cpu';
import Ops from './cpu_ops';

export default class Decoder {
    static rgOpcode(id: number): Op {

        const upperNybble = id >> 4;
        const lowerNybble = id & 0b1111;

        switch (id) {
            /** JR */
            case 0x18: // JR E8
                return { op: Ops.JR_E8, type: CC.UNCONDITIONAL, length: 2 };
            case 0x38: // JR C, E8
                return { op: Ops.JR_E8, type: CC.C, length: 2 };
            case 0x30: // JR NC, E8
                return { op: Ops.JR_E8, type: CC.NC, length: 2 };
            case 0x28: // JR Z, E8
                return { op: Ops.JR_E8, type: CC.Z, length: 2 };
            case 0x20: // JR NZ, E8
                return { op: Ops.JR_E8, type: CC.NZ, length: 2 };

            /** LD R8, N8 */
            case 0x3E: // LD A, N8
                return { op: Ops.LD_R8_N8, type: R8.A, length: 2 };
            case 0x06: // LD B, N8
                return { op: Ops.LD_R8_N8, type: R8.B, length: 2 };
            case 0x0E: // LD C, N8
                return { op: Ops.LD_R8_N8, type: R8.C, length: 2 };
            case 0x16: // LD D, N8
                return { op: Ops.LD_R8_N8, type: R8.D, length: 2 };
            case 0x1E: // LD E, n8
                return { op: Ops.LD_R8_N8, type: R8.E, length: 2 };
            case 0x26: // LD H, N8
                return { op: Ops.LD_R8_N8, type: R8.H, length: 2 };
            case 0x2E: // LD L, N8
                return { op: Ops.LD_R8_N8, type: R8.L, length: 2 };

            /** PUSH R16 */
            case 0xF5: // PUSH AF 
                return { op: Ops.PUSH_R16, type: R16.AF, length: 1, cyclesOffset: 4 };
            case 0xC5: // PUSH BC
                return { op: Ops.PUSH_R16, type: R16.BC, length: 1, cyclesOffset: 4 };
            case 0xD5: // PUSH DE
                return { op: Ops.PUSH_R16, type: R16.DE, length: 1, cyclesOffset: 4 };
            case 0xE5: // PUSH HL
                return { op: Ops.PUSH_R16, type: R16.HL, length: 1, cyclesOffset: 4 };

            /** POP R16 */
            case 0xF1: // POP AF 
                return { op: Ops.POP_R16, type: R16.AF, length: 1 };
            case 0xC1: // POP BC
                return { op: Ops.POP_R16, type: R16.BC, length: 1 };
            case 0xD1: // POP DE
                return { op: Ops.POP_R16, type: R16.DE, length: 1 };
            case 0xE1: // POP HL
                return { op: Ops.POP_R16, type: R16.HL, length: 1 };

            /** INC R8 */
            case 0x3C: // INC A
                return { op: Ops.INC_R8, type: R8.A, length: 1 };
            case 0x04: // INC B
                return { op: Ops.INC_R8, type: R8.B, length: 1 };
            case 0x0C: // INC C
                return { op: Ops.INC_R8, type: R8.C, length: 1 };
            case 0x14: // INC D
                return { op: Ops.INC_R8, type: R8.D, length: 1 };
            case 0x1C: // INC E
                return { op: Ops.INC_R8, type: R8.E, length: 1 };
            case 0x24: // INC H
                return { op: Ops.INC_R8, type: R8.H, length: 1 };
            case 0x2C: // INC L
                return { op: Ops.INC_R8, type: R8.L, length: 1 };
            case 0x34: // INC [HL]
                return { op: Ops.INC_R8, type: R8.iHL, length: 1 };

            /** DEC R8 */
            case 0x3D: // DEC A
                return { op: Ops.DEC_R8, type: R8.A, length: 1 };
            case 0x05: // DEC B
                return { op: Ops.DEC_R8, type: R8.B, length: 1 };
            case 0x0D: // DEC C
                return { op: Ops.DEC_R8, type: R8.C, length: 1 };
            case 0x15: // DEC D
                return { op: Ops.DEC_R8, type: R8.D, length: 1 };
            case 0x1D: // DEC E
                return { op: Ops.DEC_R8, type: R8.E, length: 1 };
            case 0x25: // DEC H
                return { op: Ops.DEC_R8, type: R8.H, length: 1 };
            case 0x2D: // DEC L
                return { op: Ops.DEC_R8, type: R8.L, length: 1 };
            case 0x35: // DEC [HL]
                return { op: Ops.DEC_R8, type: R8.iHL, length: 1 };

            /** INC R16 */
            case 0x03: // INC BC
                return { op: Ops.INC_R16, type: R16.BC, length: 1, cyclesOffset: 4 };
            case 0x13: // INC DE 
                return { op: Ops.INC_R16, type: R16.DE, length: 1, cyclesOffset: 4 };
            case 0x23: // INC HL
                return { op: Ops.INC_R16, type: R16.HL, length: 1, cyclesOffset: 4 };
            case 0x33: // INC SP
                return { op: Ops.INC_R16, type: R16.SP, length: 1, cyclesOffset: 4 };

            /** DEC R16 */
            case 0x0B: // DEC BC
                return { op: Ops.DEC_R16, type: R16.BC, length: 1, cyclesOffset: 4 };
            case 0x1B: // DEC DE 
                return { op: Ops.DEC_R16, type: R16.DE, length: 1, cyclesOffset: 4 };
            case 0x2B: // DEC HL
                return { op: Ops.DEC_R16, type: R16.HL, length: 1, cyclesOffset: 4 };
            case 0x3B: // DEC SP
                return { op: Ops.DEC_R16, type: R16.SP, length: 1, cyclesOffset: 4 };

            /** LD R16, N16 */
            case 0x01: // LD BC, N16
                return { op: Ops.LD_R16_N16, type: R16.BC, length: 3 };
            case 0x11: // LD DE, N16
                return { op: Ops.LD_R16_N16, type: R16.DE, length: 3 };
            case 0x21: // LD HL, N16
                return { op: Ops.LD_R16_N16, type: R16.HL, length: 3 };
            case 0x31: // LD SP, N16
                return { op: Ops.LD_R16_N16, type: R16.SP, length: 3 };

            /** Arithmetic */
            case 0xC6: // ADD A, N8
                return { op: Ops.ADD_A_N8, length: 2 };
            case 0xCE: // ADC A, N8
                return { op: Ops.ADC_A_N8, length: 2 };
            case 0xD6: // SUB A, N8
                return { op: Ops.SUB_A_N8, length: 2 };
            case 0xDE: // SBC A, N8
                return { op: Ops.SBC_A_N8, length: 2 };

            /** RET */
            case 0xC9: // RET
                return { op: Ops.RET, type: CC.UNCONDITIONAL, length: 1 };
            case 0xD8: // RET C
                return { op: Ops.RET, type: CC.C, length: 1 };
            case 0xD0: // RET NC
                return { op: Ops.RET, type: CC.NC, length: 1 };
            case 0xC8: // RET Z
                return { op: Ops.RET, type: CC.Z, length: 1 };
            case 0xC0: // RET NZ
                return { op: Ops.RET, type: CC.NZ, length: 1 };

            /** SP ops */
            case 0xF8: // LD HL, SP+e8
                return { op: Ops.LD_HL_SPaddE8, length: 2, cyclesOffset: 4 };
            case 0xF9: // LD SP, HL
                return { op: Ops.LD_SP_HL, length: 1, cyclesOffset: 4 };
            case 0xE8: // ADD SP, E8
                return { op: Ops.ADD_SP_E8, length: 2, cyclesOffset: 8 };

            /** A rotate */
            case 0x07: // RLC A
                return { op: Ops.RLCA, length: 1 };
            case 0x0F: // RRC A
                return { op: Ops.RRCA, length: 1 };
            case 0x1F: // RR A
                return { op: Ops.RRA, length: 1 };
            case 0x17: // RL A
                return { op: Ops.RLA, length: 1 };

            /** A ops */
            case 0xE6: // AND A, N8
                return { op: Ops.AND_A_N8, length: 2 };
            case 0xF6: // OR A, N8
                return { op: Ops.OR_A_N8, length: 2 };
            case 0xEE: // XOR A, N8
                return { op: Ops.XOR_A_N8, length: 2 };
            case 0xFE: // CP A, N8
                return { op: Ops.CP_A_N8, length: 2 };

            /** Interrupts */
            case 0x10: // STOP
                return { op: Ops.STOP, length: 2 };
            case 0x76: // HALT
                return { op: Ops.HALT, length: 1 };

            /** Carry flag */
            case 0x37: // SCF
                return { op: Ops.SCF, length: 1 };
            case 0x3F: // CCF
                return { op: Ops.CCF, length: 1 };

            /** JP */
            case 0xE9: // JP HL
                return { op: Ops.JP_HL, length: 1 };
            case 0xC3: // JP N16
                return { op: Ops.JP_N16, type: CC.UNCONDITIONAL, length: 3 };
            case 0xDA: // JP C, N16
                return { op: Ops.JP_N16, type: CC.C, length: 3 };
            case 0xD2: // JP NC, N16
                return { op: Ops.JP_N16, type: CC.NC, length: 3 };
            case 0xCA: // JP Z, N16
                return { op: Ops.JP_N16, type: CC.Z, length: 3 };
            case 0xC2: // JP NZ, N16
                return { op: Ops.JP_N16, type: CC.NZ, length: 3 };

            /** CALL */
            case 0xCD: // CALL N16
                return { op: Ops.CALL_N16, type: CC.UNCONDITIONAL, length: 3 };
            case 0xDC: // CALL C, N16
                return { op: Ops.CALL_N16, type: CC.C, length: 3 };
            case 0xD4: // CALL NC, N16
                return { op: Ops.CALL_N16, type: CC.NC, length: 3 };
            case 0xCC: // CALL Z, N16
                return { op: Ops.CALL_N16, type: CC.Z, length: 3 };
            case 0xC4: // CALL NZ, N16
                return { op: Ops.CALL_N16, type: CC.NZ, length: 3 };

            /** ADD HL, R16 */
            case 0x09: // ADD HL, BC
                return { op: Ops.ADD_HL_R16, type: R16.BC, length: 1, cyclesOffset: 4 };
            case 0x19: // ADD HL, DE
                return { op: Ops.ADD_HL_R16, type: R16.DE, length: 1, cyclesOffset: 4 };
            case 0x29: // ADD HL, HL
                return { op: Ops.ADD_HL_R16, type: R16.HL, length: 1, cyclesOffset: 4 };
            case 0x39: // ADD HL, SP
                return { op: Ops.ADD_HL_R16, type: R16.SP, length: 1, cyclesOffset: 4 };

            /** Reset Vectors */
            case 0xC7: // RST 00h
                return { op: Ops.RST, type: 0x00, length: 1 };
            case 0xCF: // RST 08h
                return { op: Ops.RST, type: 0x08, length: 1 };
            case 0xD7: // RST 10h
                return { op: Ops.RST, type: 0x10, length: 1 };
            case 0xDF: // RST 18h
                return { op: Ops.RST, type: 0x18, length: 1 };
            case 0xE7: // RST 20h
                return { op: Ops.RST, type: 0x20, length: 1 };
            case 0xEF: // RST 28h
                return { op: Ops.RST, type: 0x28, length: 1 };
            case 0xF7: // RST 30h
                return { op: Ops.RST, type: 0x30, length: 1 };
            case 0xFF: // RST 38h
                return { op: Ops.RST, type: 0x38, length: 1 };

            /** LD between A and R16 */
            case 0x02: // LD [BC], A
                return { op: Ops.LD_iR16_A, type: R16.BC, length: 1 };
            case 0x12: // LD [DE], A
                return { op: Ops.LD_iR16_A, type: R16.DE, length: 1 };
            case 0x22: // LD [HL+], A
                return { op: Ops.LD_iHLinc_A, length: 1 };
            case 0x32: // LD [HL-], A
                return { op: Ops.LD_iHLdec_A, length: 1 };
            case 0x0A: // LD A, [BC]
                return { op: Ops.LD_A_iR16, type: R16.BC, length: 1 };
            case 0x1A: // LD A, [DE]
                return { op: Ops.LD_A_iR16, type: R16.DE, length: 1 };
            case 0x2A: // LD A, [HL+]
                return { op: Ops.LD_A_iHLinc, length: 1 };
            case 0x3A: // LD A, [HL-]
                return { op: Ops.LD_A_iHLdec, length: 1 };

            /** LD between A and High RAM */
            case 0xF0: // LD A, [$FF00+N8]
                return { op: Ops.LD_A_iFF00plusN8, length: 2 };
            case 0xE0: // LD [$FF00+N8], A
                return { op: Ops.LD_iFF00plusN8_A, length: 2 };
            case 0xF2: // LD A, [$FF00+C]
                return { op: Ops.LD_A_iFF00plusC, length: 1 };
            case 0xE2: // LD [$FF00+C], A
                return { op: Ops.LD_iFF00plusC_A, length: 1 };


            case 0xFA: // LD A, [N16]
                return { op: Ops.LD_A_iN16, length: 3 };
            case 0xEA: // LD [N16], A
                return { op: Ops.LD_iN16_A, length: 3 };
            case 0x08: // LD [N16], SP
                return { op: Ops.LD_iN16_SP, length: 3 };

            case 0xF3: // DI - Disable interrupts master flag
                return { op: Ops.DI, length: 1 };
            case 0xFB: // EI - Enable interrupts master flag
                return { op: Ops.EI, length: 1 };

            case 0x36: // LD [HL], N8
                return { op: Ops.LD_iHL_N8, length: 2 };
            case 0x2F: // CPL
                return { op: Ops.CPL, length: 1 };
            case 0xD9: // RETI
                return { op: Ops.RETI, length: 1 };
            case 0x27: // DAA
                return { op: Ops.DA_A, length: 1 };
            case 0x00: // NOP
                return { op: Ops.NOP, length: 1 };


            /** Invalid */
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
                return { op: Ops.INVALID_OPCODE, length: 1 };
        }

        const typeTable = [R8.B, R8.C, R8.D, R8.E, R8.H, R8.L, R8.iHL, R8.A];
        // Mask for the low or high half of the table
        const HALF_MASK = 1 << 3;

        // #region Algorithm decoding ADD, ADC, SUB, SBC, AND, XOR, OR, CP in 0x80-0xBF
        if (upperNybble >= 0x8 && upperNybble <= 0xB) {
            const lowOps = [Ops.ADD_A_R8, Ops.SUB_A_R8, Ops.AND_A_R8, Ops.OR_A_R8];
            const highOps = [Ops.ADC_A_R8, Ops.SBC_A_R8, Ops.XOR_A_R8, Ops.CP_A_R8];

            const type = typeTable[lowerNybble & 0b111];
            const OPDEC = upperNybble & 0b11;

            const op = (lowerNybble & HALF_MASK) !== 0 ?
                highOps[OPDEC] :
                lowOps[OPDEC];

            return { op: op, type: type, length: 1 };
        }
        // #endregion

        // #region Algorithm decoding LD 0x40-0x7F
        if (upperNybble >= 0x4 && upperNybble <= 0x7) {
            const highTypes = [R8.C, R8.E, R8.L, R8.A];
            const lowTypes = [R8.B, R8.D, R8.H, R8.iHL];

            const type2 = typeTable[lowerNybble & 0b111];

            const OPDEC = upperNybble & 0b11;

            const type = (lowerNybble & HALF_MASK) !== 0 ?
                highTypes[OPDEC] :
                lowTypes[OPDEC];

            return { op: Ops.LD_R8_R8, type: type, type2: type2, length: 1 };
        }
        return { op: Ops.UNKNOWN_OPCODE, length: 1 };
    }

    static cbOpcode(id: number): Op {
        const upperNybble = id >> 4;
        const lowerNybble = id & 0b1111;

        let op: any;

        const HALF_MASK = (1 << 3);

        // 0x0 - 0x7
        let bit = lowerNybble < 0x8 ?
            (upperNybble & 0b11) * 2 :
            ((upperNybble & 0b11) * 2) + 1;

        let cyclesOffset = 0;

        const typeTable = [R8.B, R8.C, R8.D, R8.E, R8.H, R8.L, R8.iHL, R8.A];
        const type = typeTable[lowerNybble & 0b111];

        if (upperNybble < 0x4) {
            const lowOps = [Ops.RLC_R8, Ops.RL_R8, Ops.SLA_R8, Ops.SWAP_R8];
            const highOps = [Ops.RRC_R8, Ops.RR_R8, Ops.SRA_R8, Ops.SRL_R8];
            // TODO: IDK why I need this
            cyclesOffset = -4;

            if (lowerNybble < 0x8) {
                op = lowOps[upperNybble];
            } else {
                op = highOps[upperNybble];
            }

            bit = null!;
            // 0x40 - 0xF0
        } else {
            op = [op, Ops.BIT_R8, Ops.RES_R8, Ops.SET_R8][upperNybble >> 2];
        }


        return { op: op, type: type, type2: bit, length: 2, cyclesOffset: cyclesOffset };
    }
}