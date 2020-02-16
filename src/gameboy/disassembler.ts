
const willJump = (ins: Op, cpu: CPU) => {
    if (ins.type == CC.C) return cpu._r._f.carry;
    if (ins.type == CC.NC) return !cpu._r._f.carry;
    if (ins.type == CC.Z) return cpu._r._f.zero;
    if (ins.type == CC.NZ) return !cpu._r._f.zero;
    if (ins.type == CC.UNCONDITIONAL) return true;
};

const isControlFlow = (ins: Op, cpu: CPU) => {
    switch (ins.op) {
        case cpu.JP_N16:
        case cpu.CALL_N16:
        case cpu.JP_HL:
        case cpu.RET:
        case cpu.JR_E8:
            return true;
        default:
            return false;
    }
};

const willJumpTo = (ins: Op, cpu: CPU, pcTriplet, disasmPc): number => {
    switch (ins.op) {
        case cpu.JP_N16:
        case cpu.CALL_N16:
            return pcTriplet[0] | pcTriplet[1] << 8;
        case cpu.JP_HL:
            return cpu._r.hl;
        case cpu.RET:
            let stackLowerByte = cpu.bus.readMem8(o16b(cpu._r.sp));
            let stackUpperByte = cpu.bus.readMem8(o16b(cpu._r.sp + 1));
            return o16b(((stackUpperByte << 8) | stackLowerByte) - 1);
        case cpu.JR_E8:
            // Offset 2 for the length of JR instruction
            return disasmPc + unTwo8b(pcTriplet[1]) + 2;
        default: return null;
    }
};

const disassembleOp = (ins: Op, pcTriplet: Array<number>, disasmPc: number, cpu: CPU) => {
    const HARDCODE_DECODE = (ins, pcTriplet) => {
        const LD = "LD";
        const RST = "RST";
        const CP = "CP";
        const ADC = "ADC";
        const doublet = pcTriplet[1] | pcTriplet[2] << 8;
        switch (ins.op) {
            case cpu.LD_iHLdec_A: return [LD, "(HL-),A"];
            case cpu.LD_iHLinc_A: return [LD, "(HL+),A"];
            case cpu.LD_SP: return [LD, "SP"];
            case cpu.LD_iFF00plusC_A: return [LD, "($FF00+C),A"];
            case cpu.LD_iFF00plusN8_A: return [LD, `($FF00+$${hexN(pcTriplet[1], 2)}),A`];
            case cpu.LD_A_iFF00plusC: return [LD, "A,($FF00+C)"];
            case cpu.LD_A_iFF00plusN8: return [LD, `A,($FF00+$${hexN(pcTriplet[1], 2)})`];
            case cpu.RST: return [RST, `${hexN(ins.type, 2)}h`];
            case cpu.LD_R8_R8: return [LD, `${ins.type},${ins.type2}`];
            case cpu.LD_A_iR16: return [LD, `A,(${ins.type})`];
            case cpu.CP_A_N8: return [CP, `$${hexN(pcTriplet[1], 2)}`];
            case cpu.ADC_N8: return [ADC, `A,$${hexN(pcTriplet[1], 2)}`];
            case cpu.LD_iN16_SP: return [LD, `($${hexN(doublet, 4)}),SP`];
            case cpu.LD_A_iHL_INC: return [LD, "A,(HL+)"];
            case cpu.LD_iN16_A: return [LD, `($${hexN(doublet, 4)}),A`]
            case cpu.JP_HL: return ["JP", "HL"]
            default: return null;
        }
    };

    let isCB = pcTriplet[0] == 0xCB;
    let hardDecoded = HARDCODE_DECODE(ins, pcTriplet);
    // Block means don't add the operand onto the end because it has already been done in the hardcode decoder
    let block = hardDecoded ? true : false;

    let operandAndType = "";

    // Detect bottom 3/4 of 0xCB table
    if (isCB && pcTriplet[1] > 0x30) {
        operandAndType = (ins.type2 ? ins.type2 : "") + (ins.type2 || ins.length > 1 ? "," : "") + (ins.type ? ins.type : "");
    } else if (!block) {
        // Regular operations, block if hardcode decoded
        operandAndType = ins.type != CC.UNCONDITIONAL ? (ins.type ? ins.type : "") + (ins.type2 || ins.length > 1 ? "," : "") : "" + (ins.type2 ? ins.type2 : "");
    }

    // Instructions with type 2
    if (isNaN(ins.type2 as any) && !block) {
        if (ins.length == 2) {
            if (ins.op != cpu.JR_E8) {
                // Regular operation
                operandAndType += "$" + hexN(cpu.bus.readMem8(disasmPc + 1), 2);
            } else {
                // For JR operation, reverse two's complement instead of hex
                operandAndType += "" + unTwo8b(cpu.bus.readMem8(disasmPc + 1));
            }
        } else if (ins.length == 3) {
            // 16 bit
            operandAndType += "$" + hexN(cpu.bus.readMem16(disasmPc + 1), 4);
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

let disassembledLines = new Array(65536);

function disassemble(cpu: CPU): string {
    let disassembly = [];
    let nextOpWillJumpTo = 0xFFFFFF;

    const buildLine = line => {
        // CPU assumes that CPU and disassemblyP are in the global context, terrible assumption but it works for now
        return `
            <span 
                onclick="cpu.toggleBreakpoint(${disasmPc}); disassemblyP.innerHTML = disassemble(cpu);"
            >${line}</span>`;
    };

    const CURRENT_LINE_COLOR = "lime";
    const JUMP_TO_COLOR = "cyan";
    const BREAKPOINT_COLOR = "indianred";

    const BREAKPOINT_CODE = `style='background-color: ${BREAKPOINT_COLOR}'`;
    const BREAKPOINT_GENERATE = () => cpu.breakpoints.has(disasmPc) ? BREAKPOINT_CODE : "";

    const LOGBACK_INSTRUCTIONS = 16;
    const READAHEAD_INSTRUCTIONS = 32;

    let disasmPc = cpu.pc;

    for (let i = 0; i < READAHEAD_INSTRUCTIONS; i++) {
        let isCB = cpu.bus.readMem8(disasmPc) == 0xCB;
        let pcTriplet = [cpu.bus.readMem8(disasmPc), cpu.bus.readMem8(disasmPc + 1), cpu.bus.readMem8(disasmPc + 2)];

        // Pre-increment PC for 0xCB prefix
        let ins = isCB ? cpu.cbOpcode(cpu.bus.readMem8(disasmPc + 1)) : cpu.rgOpcode(cpu.bus.readMem8(disasmPc));

        // Decode hexadecimal triplet 
        function decodeHex(pcTriplet: Array<number>) {
            let i0 = hexN_LC(pcTriplet[0], 2);
            let i1 = ins.length >= 2 ? hexN_LC(pcTriplet[1], 2) : "--";
            let i2 = ins.length >= 3 ? hexN_LC(pcTriplet[2], 2) : "--";

            return pad(`${i0} ${i1} ${i2}`, 8, ' ');
        }


        let hexDecoded = decodeHex(pcTriplet);

        let disasmLine = `0x${hexN_LC(disasmPc, 4)}: ${hexDecoded} ${disassembleOp(ins, pcTriplet, disasmPc, cpu)}`;





        if (i == 0) {
            if (willJump(ins, cpu))
                nextOpWillJumpTo = willJumpTo(ins, cpu, pcTriplet, disasmPc);

            if (isControlFlow(ins, cpu) && !willJump(ins, cpu)) {
                nextOpWillJumpTo = disasmPc + ins.length;
            }
        }

        disassembledLines[disasmPc] = disasmLine;
        if (ins.length >= 2) disassembledLines[disasmPc + 1] = null;
        if (ins.length >= 3) disassembledLines[disasmPc + 2] = null;

        // Build the HTML line, green and bold if PC is at it
        let disAsmLineHtml = buildLine(`
            <span
                ${BREAKPOINT_GENERATE()}
                ${i == 0 ? `style='background-color: ${CURRENT_LINE_COLOR}'` : ""}
                ${nextOpWillJumpTo == disasmPc ? `style='background-color: ${JUMP_TO_COLOR}'` : ""}
            >
                ${disasmLine}
            </span>`);

        disassembly.push(disAsmLineHtml);
        disasmPc = o16b(disasmPc + ins.length);
    }

    const BLANK_LINE = '<span style="color: gray">------- -- -- -- --------</span>';

    disasmPc = cpu.pc;
    let skippedLines = 0;
    for (let i = 0; i < LOGBACK_INSTRUCTIONS;) {
        if (disassembledLines[disasmPc] != undefined && disasmPc != cpu.pc) {
            // Color the line background cyan if the next operation will jump there
            let disAsmLineHtml = buildLine(`
                <span 
                    ${BREAKPOINT_GENERATE()}
                    ${nextOpWillJumpTo == disasmPc ? `style='background-color: ${JUMP_TO_COLOR}'` : ""}
                >
                    ${disassembledLines[disasmPc]}
                </span>`);
            disassembly.unshift(disAsmLineHtml);

            // Add to counter when adding disassembled line
            i++;
        }
        if (disassembledLines[disasmPc] === null) {
            // Data, not operation
        } else if(disassembledLines[disasmPc] === undefined) {
            // If there is no log at position, just add a blank line
            disassembly.unshift(BLANK_LINE);
            i++;
        }

        disasmPc = o16b(disasmPc - 1);
    }

    // Prepend the skipped lines to the log
    for (let i = 0; i < skippedLines; i++) {
        disassembly.unshift(BLANK_LINE);
    }

    const HOVER_BG = `onMouseOver="this.style.backgroundColor='#AAA'" onMouseOut="this.style.backgroundColor='rgba(0, 0, 0, 0)'"`;

    // Add wrapper to each one
    disassembly = disassembly.map((v, i, a) => {
        return `<span
            ${v == BLANK_LINE ? "" : HOVER_BG}
            >${v}</span><br/>`;
    });

    return disassembly.join('');
}
