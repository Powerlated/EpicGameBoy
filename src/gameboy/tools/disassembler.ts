

import { unTwo8b, hexN, hexN_LC, pad, hex } from "./util";
import { LD_A_iFF00plusN8, RST, ADD_A_N8, ADC_A_N8, SUB_A_N8, SBC_A_N8, AND_A_N8, XOR_A_N8, OR_A_N8, CP_A_N8, ADD_A_R8, ADC_A_R8, SUB_A_R8, SBC_A_R8, AND_A_R8, XOR_A_R8, OR_A_R8, CP_A_R8, LD_R8_R8, LD_R8_N8, LD_iHLdec_A, LD_iHLinc_A, LD_iFF00plusC_A, LD_A_iFF00plusC, LD_iFF00plusN8_A, LD_A_iN16, LD_iN16_SP, LD_A_iHLinc, LD_iN16_A, JP_HL, ADD_HL_R16, LD_HL_SPplusE8, RETI, JP, CALL_CC, RET, JR, PUSH_R16, POP_R16, LD_R16_N16, HALT, RLCA, RRCA, RRA, RLA } from "../../../core/cpu/unprefixed_executors";
import Decoder from "../../../core/cpu/legacy_decoder";
import CPU, { OperandType, Op } from "../../../core/cpu/cpu";
import { R8, R16, CC } from "../../../core/cpu/cpu_types";

function tr(type: OperandType) {
    switch (type) {
        case R8.B: return "B";
        case R8.C: return "C";
        case R8.D: return "D";
        case R8.E: return "E";
        case R8.H: return "H";
        case R8.L: return "L";
        case R8.iHL: return "(HL)";
        case R8.A: return "A";
        case R16.AF: return "AF";
        case R16.BC: return "BC";
        case R16.DE: return "DE";
        case R16.HL: return "HL";
        case R16.SP: return "SP";
        default: return type;
    }
};
export default class Disassembler {
    static willJump = (ins: Op, cpu: CPU) => {
        if (ins.type === CC.C) return cpu.reg._f.carry;
        if (ins.type === CC.NC) return !cpu.reg._f.carry;
        if (ins.type === CC.Z) return cpu.reg._f.zero;
        if (ins.type === CC.NZ) return !cpu.reg._f.zero;
        return true; // Jump by default
    };

    static isControlFlow = (ins: Op) => {
        switch (ins.op) {
            case JP:
            case CALL_CC:
            case JP_HL:
            case RET:
            case RETI:
            case RST:
            case JR:
                return true;
            default:
                return false;
        }
    };

    static willJumpTo = (ins: Op, pcTriplet: Uint8Array, cpu: CPU): number => {
        switch (ins.op) {
            case JP:
            case CALL_CC:
                return pcTriplet[1] | pcTriplet[2] << 8;
            case JP_HL:
                return cpu.reg[R16.HL];
            case RET:
            case RETI:
                const stackLowerByte = cpu.gb.bus.read((cpu.reg.sp) & 0xFFFF);
                const stackUpperByte = cpu.gb.bus.read((cpu.reg.sp + 1) & 0xFFFF);
                return (((stackUpperByte << 8) | stackLowerByte) - 1) & 0xFFFF;
            case JR:
                // Offset 2 for the length of JR instruction
                return cpu.pc + unTwo8b(pcTriplet[1]) + 2;
            case RST:
                return ins.type as number;
            default: return NaN;
        }
    };

    static disassembleOp = (ins: Op, pcTriplet: Uint8Array, cpu: CPU, disasmPc: number) => {
        const HARDCODE_DECODE = (ins: Op, pcTriplet: Uint8Array) => {
            const doublet = pcTriplet[1] | pcTriplet[2] << 8;
            switch (ins.op) {
                case LD_iHLdec_A: return ["LD", "(HL-),A"];
                case LD_iHLinc_A: return ["LD", "(HL+),A"];
                case LD_iFF00plusC_A: return ["LD", "($FF00+C),A"];
                case LD_iFF00plusN8_A: return ["LD", `($FF${hexN(pcTriplet[1], 2)}),A`];
                case LD_A_iFF00plusC: return ["LD", "A,($FF00+C)"];
                case LD_A_iFF00plusN8: return ["LD", `A,($FF${hexN(pcTriplet[1], 2)})`];
                case RST: return ["RST", `${hexN(ins.type, 2)}h`];

                case LD_A_iN16: return ["LD", `A,($${hexN(doublet, 4)})`];
                case LD_iN16_A: return ["LD", `($${hexN(doublet, 4)}),A`];

                case ADD_A_N8: return ["ADD", `A,$${hexN(pcTriplet[1], 2)}`];
                case ADC_A_N8: return ["ADC", `A,$${hexN(pcTriplet[1], 2)}`];
                case SUB_A_N8: return ["SUB", `A,$${hexN(pcTriplet[1], 2)}`];
                case SBC_A_N8: return ["SBC", `A,$${hexN(pcTriplet[1], 2)}`];
                case AND_A_N8: return ["AND", `A,$${hexN(pcTriplet[1], 2)}`];
                case XOR_A_N8: return ["XOR", `A,$${hexN(pcTriplet[1], 2)}`];
                case OR_A_N8: return ["OR", `A,$${hexN(pcTriplet[1], 2)}`];
                case CP_A_N8: return ["CP", `A,$${hexN(pcTriplet[1], 2)}`];

                case ADD_A_R8: return ["ADD", `A,${tr(ins.type!)}`];
                case ADC_A_R8: return ["ADC", `A,${tr(ins.type!)}`];
                case SUB_A_R8: return ["SUB", `A,${tr(ins.type!)}`];
                case SBC_A_R8: return ["SBC", `A,${tr(ins.type!)}`];
                case AND_A_R8: return ["AND", `A,${tr(ins.type!)}`];
                case XOR_A_R8: return ["XOR", `A,${tr(ins.type!)}`];
                case OR_A_R8: return ["OR", `A,${tr(ins.type!)}`];
                case CP_A_R8: return ["CP", `A,${tr(ins.type!)}`];

                case PUSH_R16: return ["PUSH", `${tr(ins.type!)}`];
                case POP_R16: return ["POP", `${tr(ins.type!)}`];

                case LD_R16_N16: return ["LD", `${tr(ins.type!)},$${hexN(doublet, 4)}`];

                case LD_R8_R8: return ["LD", `${tr(ins.type!)},${tr(ins.type2!)}`];
                case LD_R8_N8: return ["LD", `${tr(ins.type!)},$${hexN(pcTriplet[1], 2)}`];

                case ADD_HL_R16: return ["ADD", `HL,${tr(ins.type!)}`];

                case LD_iN16_SP: return ["LD", `($${hexN(doublet, 4)}),SP`];

                case LD_A_iHLinc: return ["LD", "A,(HL+)"];
                case LD_iN16_A: return ["LD", `($${hexN(doublet, 4)}),A`];
                case LD_A_iN16: return ["LD", `A,($${hexN(doublet, 4)})`];
                case LD_HL_SPplusE8: return ["LD", `HL,(SP+${unTwo8b(pcTriplet[1])})`];
                case JP_HL: return ["JP", "HL"];
                case ADD_HL_R16: return ["ADD HL,", ins.type];



                default: return null;
            }
        };

        const isCB = pcTriplet[0] === 0xCB;
        const hardDecoded = HARDCODE_DECODE(ins, pcTriplet);
        // Block means don't add the operand onto the end because it has already been done in the hardcode decoder
        const block = hardDecoded ? true : false;

        let operandAndType = "";

        // Detect bottom 3/4 of 0xCB table
        if (isCB && pcTriplet[1] > 0x30) {
            operandAndType = `${ins.type2},${tr(ins.type!)}`;
        } else if (!block) {
            // Regular operations, block if hardcode decoded
            operandAndType =
                (ins.type != CC.UNCONDITIONAL ? (
                    ((ins.type ? tr(ins.type) : "") + (ins.type2 || (ins.length > 1 && ins.type) ? "," : ""))
                ) : "") +
                (ins.type2 ? tr(ins.type2) : "");
        }

        // Instructions with type 2
        if (isNaN(ins.type2 as any) && !block) {
            if (ins.length === 2) {
                if (ins.op !== JR) {
                    // Regular operation
                    operandAndType += "$" + hexN(cpu.gb.bus.read(disasmPc + 1), 2);
                } else {
                    // For JR operation, calculate jump destination
                    operandAndType += "$" + hexN(2 + disasmPc + unTwo8b(cpu.gb.bus.read(disasmPc + 1)), 4);
                }
            } else if (ins.length === 3) {
                // 16 bit
                operandAndType += "$" + hexN(cpu.gb.bus.readMem16(disasmPc + 1), 4);
            }
        }

        let name;
        // Check if instruction name is hardcoded
        if (hardDecoded != null) {
            name = hardDecoded[0] + " ";
            name += hardDecoded[1];
        } else {
            name = ins.op.name.split('_')[0];
        };
        return name + " " + operandAndType;
    };


    // Null indicates the disassembled address was an operand or data
    static disassembledLines: Array<string | null> = new Array(65536);
    // static controlFlowDisassembly: Array<string> = [];

    static disassemble(cpu: CPU): string {
        let disassembly = [];
        let nextOpWillJumpTo = 0xFFFFFF;

        const buildLine = (line: string) => {
            // CPU assumes that CPU and disassemblyP are in the global context, terrible assumption but it works for now
            return `
                <span 
                    onclick="
                        gb.cpu.toggleBreakpoint(${disasmPc});
                        const disassemblyP = document.getElementById('disassembly-output'); 
                        disassemblyP.innerHTML = Disassembler.disassemble(gb.cpu);
                    "
                >${line}</span>`;
        };

        const CURRENT_LINE_COLOR = "lime";
        const JUMP_TO_COLOR = "cyan";
        const BREAKPOINT_COLOR = "indianred";

        const BREAKPOINT_CODE = `style='background-color: ${BREAKPOINT_COLOR}'`;
        const BREAKPOINT_GENERATE = () => cpu.breakpoints[disasmPc] ? BREAKPOINT_CODE : "";

        const LOGBACK_INSTRUCTIONS = 16;
        const READAHEAD_INSTRUCTIONS = 32;

        let disasmPc = cpu.pc;

        for (let i = 0; i < READAHEAD_INSTRUCTIONS; i++) {
            const isCB = cpu.gb.bus.read(disasmPc) === 0xCB;
            const pcTriplet = new Uint8Array([cpu.gb.bus.read(disasmPc), cpu.gb.bus.read(disasmPc + 1), cpu.gb.bus.read(disasmPc + 2)]);


            // Pre-increment PC for 0xCB prefix
            const ins = isCB ? Decoder.cbOpcode(cpu.gb.bus.read(disasmPc + 1)) : Decoder.rgOpcode(cpu.gb.bus.read(disasmPc));
            const controlFlow = Disassembler.isControlFlow(ins);

            // Decode hexadecimal tripconst 
            function decodeHex(pcTriplet: Uint8Array) {
                const i0 = hexN_LC(pcTriplet[0], 2);
                const i1 = ins.length >= 2 ? hexN_LC(pcTriplet[1], 2) : "--";
                const i2 = ins.length >= 3 ? hexN_LC(pcTriplet[2], 2) : "--";

                return pad(`${i0} ${i1} ${i2}`, 8, ' ');
            }

            const hexDecoded = decodeHex(pcTriplet);

            const disasmLine = `0x${hexN_LC(disasmPc, 4)}: ${hexDecoded} ${Disassembler.disassembleOp(ins, pcTriplet, cpu, disasmPc)}`;

            if (i === 0) {
                if (Disassembler.willJump(ins, cpu))
                    nextOpWillJumpTo = Disassembler.willJumpTo(ins, pcTriplet, cpu);

                if (controlFlow && !Disassembler.willJump(ins, cpu)) {
                    nextOpWillJumpTo = disasmPc + ins.length;
                }
            }

            Disassembler.disassembledLines[disasmPc] = disasmLine;
            if (ins.length >= 2) Disassembler.disassembledLines[disasmPc + 1] = null;
            if (ins.length >= 3) Disassembler.disassembledLines[disasmPc + 2] = null;

            // Build the HTML line, green and bold if PC is at it
            const disAsmLineHtml = buildLine(`
                <span
                    ${BREAKPOINT_GENERATE()}
                    ${i === 0 ? `style='background-color: ${CURRENT_LINE_COLOR}'` : ""}
                    ${nextOpWillJumpTo === disasmPc ? `style='background-color: ${JUMP_TO_COLOR}'` : ""}
                >
                    ${disasmLine}
                </span>`);

            disassembly.push(disAsmLineHtml);
            disasmPc = (disasmPc + ins.length) & 0xFFFF;
        }

        const BLANK_LINE = '<span style="color: gray">------- -- -- -- --------</span>';

        disasmPc = cpu.pc;
        const skippedLines = 0;
        for (let i = 0; i < LOGBACK_INSTRUCTIONS;) {
            if (Disassembler.disassembledLines[disasmPc] != undefined && disasmPc !== cpu.pc) {
                // Color the line background cyan if the next operation will jump there
                const disAsmLineHtml = buildLine(`
                    <span 
                        ${BREAKPOINT_GENERATE()}
                        ${nextOpWillJumpTo === disasmPc ? `style='background-color: ${JUMP_TO_COLOR}'` : ""}
                    >
                        ${Disassembler.disassembledLines[disasmPc]}
                    </span>`);
                disassembly.unshift(disAsmLineHtml);

                // Add to counter when adding disassembled line
                i++;
            }
            if (Disassembler.disassembledLines[disasmPc] === null) {
                // Data, not operation
            } else if (Disassembler.disassembledLines[disasmPc] === undefined) {
                // If there is no log at position, just add a blank line
                disassembly.unshift(BLANK_LINE);
                i++;
            }

            disasmPc = (disasmPc - 1) & 0xFFFF;
        }

        // Prepend the skipped lines to the log
        for (let i = 0; i < skippedLines; i++) {
            disassembly.unshift(BLANK_LINE);
        }

        const HOVER_BG = `onMouseOver="this.style.backgroundColor='#AAA'" onMouseOut="this.style.backgroundColor='rgba(0, 0, 0, 0)'"`;

        // Add wrapper to each one
        disassembly = disassembly.map((v, i, a) => {
            return `<span
                ${v === BLANK_LINE ? "" : HOVER_BG}
                >${v}</span><br/>`;
        });

        return disassembly.join('');
    }



}
