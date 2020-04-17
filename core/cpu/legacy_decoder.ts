import { Op, CC, R8, R16 } from "./cpu";
import { LD_R8_N8, PUSH_R16, POP_R16, INC_R8, DEC_R8, INC_R16, DEC_R16, LD_R16_N16, ADD_A_N8, ADC_A_N8, SUB_A_N8, SBC_A_N8, RET, LD_SP_HL, ADD_SP_E8, RLCA, RRCA, RRA, RLA, AND_A_N8, OR_A_N8, XOR_A_N8, CP_A_N8, STOP, HALT, SCF, CCF, JP_HL, ADD_HL_R16, RST, LD_iHLinc_A, LD_iHLdec_A, LD_A_iHLinc, LD_A_iHLdec, LD_A_iFF00plusN8, LD_iFF00plusN8_A, LD_A_iFF00plusC, LD_iFF00plusC_A, LD_A_iN16, LD_iN16_A, LD_iN16_SP, DI, EI, LD_iHL_N8, CPL, RETI, NOP, LD_R8_R8, JR, JP, CALL, LD_iBC_A, LD_iDE_A, LD_A_iBC, LD_A_iDE, DAA, OR_A_R8, ADD_A_R8, SUB_A_R8, AND_A_R8, ADC_A_R8, SBC_A_R8, XOR_A_R8, CP_A_R8, INVALID, LD_HL_SPplusE8 } from "./unprefixed_executors";
import { RLC_R8, RL_R8, SLA_R8, SWAP_R8, RRC_R8, RR_R8, SRA_R8, SRL_R8, BIT_R8, RES_R8, SET_R8 } from "./cb_prefixed_executors";

/** @deprecated
 * 
 * I've moved this back into the main CPU class. Check there.
 */
export default class Decoder {
    static rgOpcode(id: number): Op {

        const upperNybble = id >> 4;
        const lowerNybble = id & 0b1111;

        switch (id) {
            /** JR */
            case 0x18: // JR E8
                return { op: JR, type: CC.UNCONDITIONAL, length: 2 };
            case 0x38: // JR C, E8
                return { op: JR, type: CC.C, length: 2 };
            case 0x30: // JR NC, E8
                return { op: JR, type: CC.NC, length: 2 };
            case 0x28: // JR Z, E8
                return { op: JR, type: CC.Z, length: 2 };
            case 0x20: // JR NZ, E8
                return { op: JR, type: CC.NZ, length: 2 };

            /** LD R8, N8 */
            case 0x3E: // LD A, N8
                return { op: LD_R8_N8, type: R8.A, length: 2 };
            case 0x06: // LD B, N8
                return { op: LD_R8_N8, type: R8.B, length: 2 };
            case 0x0E: // LD C, N8
                return { op: LD_R8_N8, type: R8.C, length: 2 };
            case 0x16: // LD D, N8
                return { op: LD_R8_N8, type: R8.D, length: 2 };
            case 0x1E: // LD E, n8
                return { op: LD_R8_N8, type: R8.E, length: 2 };
            case 0x26: // LD H, N8
                return { op: LD_R8_N8, type: R8.H, length: 2 };
            case 0x2E: // LD L, N8
                return { op: LD_R8_N8, type: R8.L, length: 2 };

            /** PUSH R16 */
            case 0xF5: // PUSH AF 
                return { op: PUSH_R16, type: R16.AF, length: 1 };
            case 0xC5: // PUSH BC
                return { op: PUSH_R16, type: R16.BC, length: 1 };
            case 0xD5: // PUSH DE
                return { op: PUSH_R16, type: R16.DE, length: 1 };
            case 0xE5: // PUSH HL
                return { op: PUSH_R16, type: R16.HL, length: 1 };

            /** POP R16 */
            case 0xF1: // POP AF 
                return { op: POP_R16, type: R16.AF, length: 1 };
            case 0xC1: // POP BC
                return { op: POP_R16, type: R16.BC, length: 1 };
            case 0xD1: // POP DE
                return { op: POP_R16, type: R16.DE, length: 1 };
            case 0xE1: // POP HL
                return { op: POP_R16, type: R16.HL, length: 1 };

            /** INC R8 */
            case 0x3C: // INC A
                return { op: INC_R8, type: R8.A, length: 1 };
            case 0x04: // INC B
                return { op: INC_R8, type: R8.B, length: 1 };
            case 0x0C: // INC C
                return { op: INC_R8, type: R8.C, length: 1 };
            case 0x14: // INC D
                return { op: INC_R8, type: R8.D, length: 1 };
            case 0x1C: // INC E
                return { op: INC_R8, type: R8.E, length: 1 };
            case 0x24: // INC H
                return { op: INC_R8, type: R8.H, length: 1 };
            case 0x2C: // INC L
                return { op: INC_R8, type: R8.L, length: 1 };
            case 0x34: // INC [HL]
                return { op: INC_R8, type: R8.iHL, length: 1 };

            /** DEC R8 */
            case 0x3D: // DEC A
                return { op: DEC_R8, type: R8.A, length: 1 };
            case 0x05: // DEC B
                return { op: DEC_R8, type: R8.B, length: 1 };
            case 0x0D: // DEC C
                return { op: DEC_R8, type: R8.C, length: 1 };
            case 0x15: // DEC D
                return { op: DEC_R8, type: R8.D, length: 1 };
            case 0x1D: // DEC E
                return { op: DEC_R8, type: R8.E, length: 1 };
            case 0x25: // DEC H
                return { op: DEC_R8, type: R8.H, length: 1 };
            case 0x2D: // DEC L
                return { op: DEC_R8, type: R8.L, length: 1 };
            case 0x35: // DEC [HL]
                return { op: DEC_R8, type: R8.iHL, length: 1 };

            /** INC R16 */
            case 0x03: // INC BC
                return { op: INC_R16, type: R16.BC, length: 1 };
            case 0x13: // INC DE 
                return { op: INC_R16, type: R16.DE, length: 1 };
            case 0x23: // INC HL
                return { op: INC_R16, type: R16.HL, length: 1 };
            case 0x33: // INC SP
                return { op: INC_R16, type: R16.SP, length: 1 };

            /** DEC R16 */
            case 0x0B: // DEC BC
                return { op: DEC_R16, type: R16.BC, length: 1 };
            case 0x1B: // DEC DE 
                return { op: DEC_R16, type: R16.DE, length: 1 };
            case 0x2B: // DEC HL
                return { op: DEC_R16, type: R16.HL, length: 1 };
            case 0x3B: // DEC SP
                return { op: DEC_R16, type: R16.SP, length: 1 };

            /** LD R16, N16 */
            case 0x01: // LD BC, N16
                return { op: LD_R16_N16, type: R16.BC, length: 3 };
            case 0x11: // LD DE, N16
                return { op: LD_R16_N16, type: R16.DE, length: 3 };
            case 0x21: // LD HL, N16
                return { op: LD_R16_N16, type: R16.HL, length: 3 };
            case 0x31: // LD SP, N16
                return { op: LD_R16_N16, type: R16.SP, length: 3 };

            /** Arithmetic */
            case 0xC6: // ADD A, N8
                return { op: ADD_A_N8, length: 2 };
            case 0xCE: // ADC A, N8
                return { op: ADC_A_N8, length: 2 };
            case 0xD6: // SUB A, N8
                return { op: SUB_A_N8, length: 2 };
            case 0xDE: // SBC A, N8
                return { op: SBC_A_N8, length: 2 };

            /** RET */
            case 0xC9: // RET
                return { op: RET, type: CC.UNCONDITIONAL, length: 1 };
            case 0xD8: // RET C
                return { op: RET, type: CC.C, length: 1 };
            case 0xD0: // RET NC
                return { op: RET, type: CC.NC, length: 1 };
            case 0xC8: // RET Z
                return { op: RET, type: CC.Z, length: 1 };
            case 0xC0: // RET NZ
                return { op: RET, type: CC.NZ, length: 1 };

            /** SP ops */
            case 0xF8: // LD HL, SP+e8
                return { op: LD_HL_SPplusE8, length: 2 };
            case 0xF9: // LD SP, HL
                return { op: LD_SP_HL, length: 1 };
            case 0xE8: // ADD SP, E8
                return { op: ADD_SP_E8, length: 2 };

            /** A rotate */
            case 0x07: // RLC A
                return { op: RLCA, length: 1 };
            case 0x0F: // RRC A
                return { op: RRCA, length: 1 };
            case 0x1F: // RR A
                return { op: RRA, length: 1 };
            case 0x17: // RL A
                return { op: RLA, length: 1 };

            /** A ops */
            case 0xE6: // AND A, N8
                return { op: AND_A_N8, length: 2 };
            case 0xF6: // OR A, N8
                return { op: OR_A_N8, length: 2 };
            case 0xEE: // XOR A, N8
                return { op: XOR_A_N8, length: 2 };
            case 0xFE: // CP A, N8
                return { op: CP_A_N8, length: 2 };

            /** Interrupts */
            case 0x10: // STOP
                return { op: STOP, length: 2 };
            case 0x76: // HALT
                return { op: HALT, length: 1 };

            /** Carry flag */
            case 0x37: // SCF
                return { op: SCF, length: 1 };
            case 0x3F: // CCF
                return { op: CCF, length: 1 };

            /** JP */
            case 0xE9: // JP HL
                return { op: JP_HL, length: 1 };
            case 0xC3: // JP N16
                return { op: JP, type: CC.UNCONDITIONAL, length: 3 };
            case 0xDA: // JP C, N16
                return { op: JP, type: CC.C, length: 3 };
            case 0xD2: // JP NC, N16
                return { op: JP, type: CC.NC, length: 3 };
            case 0xCA: // JP Z, N16
                return { op: JP, type: CC.Z, length: 3 };
            case 0xC2: // JP NZ, N16
                return { op: JP, type: CC.NZ, length: 3 };

            /** CALL */
            case 0xCD: // CALL N16
                return { op: CALL, type: CC.UNCONDITIONAL, length: 3 };
            case 0xDC: // CALL C, N16
                return { op: CALL, type: CC.C, length: 3 };
            case 0xD4: // CALL NC, N16
                return { op: CALL, type: CC.NC, length: 3 };
            case 0xCC: // CALL Z, N16
                return { op: CALL, type: CC.Z, length: 3 };
            case 0xC4: // CALL NZ, N16
                return { op: CALL, type: CC.NZ, length: 3 };

            /** ADD HL, R16 */
            case 0x09: // ADD HL, BC
                return { op: ADD_HL_R16, type: R16.BC, length: 1 };
            case 0x19: // ADD HL, DE
                return { op: ADD_HL_R16, type: R16.DE, length: 1 };
            case 0x29: // ADD HL, HL
                return { op: ADD_HL_R16, type: R16.HL, length: 1 };
            case 0x39: // ADD HL, SP
                return { op: ADD_HL_R16, type: R16.SP, length: 1 };

            /** Reset Vectors */
            case 0xC7: // RST 00h
                return { op: RST, type: 0x00, length: 1 };
            case 0xCF: // RST 08h
                return { op: RST, type: 0x08, length: 1 };
            case 0xD7: // RST 10h
                return { op: RST, type: 0x10, length: 1 };
            case 0xDF: // RST 18h
                return { op: RST, type: 0x18, length: 1 };
            case 0xE7: // RST 20h
                return { op: RST, type: 0x20, length: 1 };
            case 0xEF: // RST 28h
                return { op: RST, type: 0x28, length: 1 };
            case 0xF7: // RST 30h
                return { op: RST, type: 0x30, length: 1 };
            case 0xFF: // RST 38h
                return { op: RST, type: 0x38, length: 1 };

            /** LD between A and R16 */
            case 0x02: // LD [BC], A
                return { op: LD_iBC_A, type: R16.BC, length: 1 };
            case 0x12: // LD [DE], A
                return { op: LD_iDE_A, type: R16.DE, length: 1 };
            case 0x22: // LD [HL+], A
                return { op: LD_iHLinc_A, length: 1 };
            case 0x32: // LD [HL-], A
                return { op: LD_iHLdec_A, length: 1 };
            case 0x0A: // LD A, [BC]
                return { op: LD_A_iBC, type: R16.BC, length: 1 };
            case 0x1A: // LD A, [DE]
                return { op: LD_A_iDE, type: R16.DE, length: 1 };
            case 0x2A: // LD A, [HL+]
                return { op: LD_A_iHLinc, length: 1 };
            case 0x3A: // LD A, [HL-]
                return { op: LD_A_iHLdec, length: 1 };

            /** LD between A and High RAM */
            case 0xF0: // LD A, [$FF00+N8]
                return { op: LD_A_iFF00plusN8, length: 2 };
            case 0xE0: // LD [$FF00+N8], A
                return { op: LD_iFF00plusN8_A, length: 2 };
            case 0xF2: // LD A, [$FF00+C]
                return { op: LD_A_iFF00plusC, length: 1 };
            case 0xE2: // LD [$FF00+C], A
                return { op: LD_iFF00plusC_A, length: 1 };


            case 0xFA: // LD A, [N16]
                return { op: LD_A_iN16, length: 3 };
            case 0xEA: // LD [N16], A
                return { op: LD_iN16_A, length: 3 };
            case 0x08: // LD [N16], SP
                return { op: LD_iN16_SP, length: 3 };

            case 0xF3: // DI - Disable interrupts master flag
                return { op: DI, length: 1 };
            case 0xFB: // EI - Enable interrupts master flag
                return { op: EI, length: 1 };

            case 0x36: // LD [HL], N8
                return { op: LD_iHL_N8, length: 2 };
            case 0x2F: // CPL
                return { op: CPL, length: 1 };
            case 0xD9: // RETI
                return { op: RETI, length: 1 };
            case 0x27: // DAA
                return { op: DAA, length: 1 };
            case 0x00: // NOP
                return { op: NOP, length: 1 };


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
                return { op: INVALID, length: 1 };
        }

        const typeTable = [R8.B, R8.C, R8.D, R8.E, R8.H, R8.L, R8.iHL, R8.A];
        // Mask for the low or high half of the table
        const HALF_MASK = 1 << 3;

        // #region Algorithm decoding ADD, ADC, SUB, SBC, AND, XOR, OR, CP in 0x80-0xBF
        if (upperNybble >= 0x8 && upperNybble <= 0xB) {
            const lowOps = [ADD_A_R8, SUB_A_R8, AND_A_R8, OR_A_R8];
            const highOps = [ADC_A_R8, SBC_A_R8, XOR_A_R8, CP_A_R8];

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

            return { op: LD_R8_R8, type: type, type2: type2, length: 1 };
        }
        return { op: INVALID, length: 1 };
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

        const typeTable = [R8.B, R8.C, R8.D, R8.E, R8.H, R8.L, R8.iHL, R8.A];
        const type = typeTable[lowerNybble & 0b111];

        if (upperNybble < 0x4) {
            const lowOps = [RLC_R8, RL_R8, SLA_R8, SWAP_R8];
            const highOps = [RRC_R8, RR_R8, SRA_R8, SRL_R8];

            if (lowerNybble < 0x8) {
                op = lowOps[upperNybble];
            } else {
                op = highOps[upperNybble];
            }

            bit = null!;
            // 0x40 - 0xF0
        } else {
            op = [op, BIT_R8, RES_R8, SET_R8][upperNybble >> 2];
        }


        return { op: op, type: type, type2: bit, length: 2 };
    }
}