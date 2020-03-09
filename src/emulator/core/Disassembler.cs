using System.Buffers;
using System.Runtime.CompilerServices;
using System.Runtime.InteropServices;
using System.Linq;
using DMSharp;
using System;
using System.Collections.Generic;
using static Util;
class Disassembler
{
    public static bool willJump(Instruction ins, CPU cpu)
    {
        if (ins.opts.cc == CC.C) return cpu._r._f.carry;
        if (ins.opts.cc == CC.NC) return !cpu._r._f.carry;
        if (ins.opts.cc == CC.Z) return cpu._r._f.zero;
        if (ins.opts.cc == CC.NZ) return !cpu._r._f.zero;
        return true; // Jump by default
    }

    public static bool isControlFlow(Instruction ins)
    {
        Executor[] allowed = {
            Ops.JP_N16,
            Ops.CALL_N16,
            Ops.JP_HL,
            Ops.RET,
            Ops.RETI,
            Ops.RST,
            Ops.JR_E8
        };
        return allowed.Contains(ins.executor);
    }

    public static ushort willJumpTo(Instruction ins, byte[] pcTriplet, ushort disasmPc, CPU cpu)
    {
        var dict = new Dictionary<Executor, Func<ushort>>();
        var ex = ins.executor;
        if (ex == Ops.CALL_N16)
            return (ushort)(pcTriplet[1] | pcTriplet[2] << 8);
        if (ex == Ops.JP_N16) return (ushort)(pcTriplet[1] | pcTriplet[2] << 8);
        if (ex == Ops.JP_HL) return cpu._r.hl;
        if (ex == Ops.RET)
        {
            var stackLowerByte = cpu.gb.bus.ReadMem8((ushort)(cpu._r.sp));
            var stackUpperByte = cpu.gb.bus.ReadMem8((ushort)(cpu._r.sp + 1));
            return (ushort)(((stackUpperByte << 8) | stackLowerByte) - 1);
        }
        if (ex == Ops.RETI)
        {
            var stackLowerByte = cpu.gb.bus.ReadMem8((ushort)(cpu._r.sp));
            var stackUpperByte = cpu.gb.bus.ReadMem8((ushort)(cpu._r.sp + 1));
            return (ushort)(((stackUpperByte << 8) | stackLowerByte) - 1);
        }
        if (ex == Ops.JR_E8) return (ushort)(disasmPc + (pcTriplet[1]) + 2);
        if (ex == Ops.RST) return ins.opts.numtype;

        if (dict.ContainsKey(ins.executor))
        {
            return dict[ins.executor]();
        }
        return 0;
    }

    public static string disassembleOp(Instruction ins, byte[] pcTriplet, ushort disasmPc, CPU cpu)
    {


        (string[] decoded, bool success) HARDCODE_DECODE(Instruction ins, byte[] pcTriplet)
        {
            string LD = "LD";
            string RST = "RST";
            string CP = "CP";
            string ADC = "ADC";
            var ex = ins.executor;
            var doublet = pcTriplet[1] | pcTriplet[2] << 8;
            if (ex == Ops.LD_iHLdec_A)
                return (new[] { LD, $"(HL-),A" }, true);
            if (ex == Ops.LD_iHLinc_A)
                return (new[] { LD, $"(HL+),A" }, true);
            if (ex == Ops.LD_iFF00plusC_A)
                return (new[] { LD, $"($FF00+C),A" }, true);
            if (ex == Ops.LD_iFF00plusN8_A)
                return (new[] { LD, $"($FF00 +$(new[] { HexN(pcTriplet[1], 2)}, true)),A" }, true);
            if (ex == Ops.LD_A_iFF00plusC)
                return (new[] { LD, $"A,($FF00+C)" }, true);
            if (ex == Ops.LD_A_iFF00plusN8)
                return (new[] { LD, $"A, ($FF00 +$(new[] { HexN(pcTriplet[1], 2)}, true))" }, true);
            if (ex == Ops.LD_R8_R8)
                return (new[] { LD, $"(new[] {ins.opts.r8.ToString()}, true),(new[] {ins.opts.r8_2.ToString()}, true)" }, true);
            if (ex == Ops.LD_A_iR16)
                return (new[] { LD, $"A, ((new[] {ins.opts.r16}, true))" }, true);
            if (ex == Ops.LD_iR16_A)
                return (new[] { LD, $"((new[] {ins.opts.r16}, true)), A" }, true);
            if (ex == Ops.CP_A_N8)
                return (new[] { CP, $"$(new[] { HexN(pcTriplet[1], 2)}, true)" }, true);
            if (ex == Ops.ADC_A_R8)
                return (new[] { ADC, $"A,$(new[] { HexN(pcTriplet[1], 2)}, true)" }, true);
            if (ex == Ops.LD_iN16_SP)
                return (new[] { LD, $"($(new[] { HexN(doublet, 4)}, true)),SP" }, true);
            if (ex == Ops.LD_A_iHLinc)
                return (new[] { LD, $"A,(HL+)" }, true);
            if (ex == Ops.LD_iN16_A)
                return (new[] { LD, $"($(new[] { HexN(doublet, 4)}, true)),A" }, true);
            if (ex == Ops.LD_HL_SPaddE8)
                return (new[] { LD, $"HL, (SP +(new[] {(ushort)(pcTriplet[1])}, true))" }, true);
            if (ex == Ops.LD_R16_N16)
                return (new[] { LD, $"(new[] {ins.opts.r16}, true), $(new[] {HexN(doublet, 4)}, true)" }, true);
            if (ex == Ops.JP_HL)
                return (new[] { "JP", "HL" }, true);
            if (ex == Ops.ADD_HL_R16)
                return (new[] { "ADD HL,", ins.opts.r16.ToString() }, true);

            return (new[] { "???", "???" }, false);
        }
        var isCB = pcTriplet[0] == 0xCB;
        var hardDecoded = HARDCODE_DECODE(ins, pcTriplet).decoded;
        // Block means don't add the operand onto the end because it has already been done in the hardcode decoder
        var block = HARDCODE_DECODE(ins, pcTriplet).success;

        var t1 = ins.opts.r8;
        var t2 = ins.opts.r8_2;

        var t1s = ins.opts.r8.ToString();
        var t2s = ins.opts.r8_2.ToString();
        var r16 = ins.opts.r16;
        var n = ins.opts.numtype;


        var operandAndType = "";

        // Detect bottom 3/4 of 0xCB table
        if (isCB && pcTriplet[1] > 0x30)
        {
            operandAndType = n + ", " + (t1 != R8.NONE ? t1s : "");
        }
        else if (!block)
        {
            // Regular operations, block if hardcode decoded
            operandAndType = (t1 != R8.NONE ? t1s : "") + ((t1 != R8.NONE && t2 != R8.NONE) ? "," : "") + (t2 != R8.NONE ? t2s : "");
            if (r16 != R16.NONE)
            {
                operandAndType += r16.ToString();
            }

        }

        // Instructions with type 2
        if (t2 == R8.NONE && !block && !isCB)
        {
            if (ins.length == 2)
            {
                if (ins.executor != Ops.JR_E8)
                {
                    // Regular operation
                    operandAndType += " $" + HexN(cpu.gb.bus.ReadMem8((ushort)(disasmPc + 1)), 2);
                }
                else
                {
                    // For JR operation, reverse two's complement instead of hex
                    operandAndType += "" + (ushort)(cpu.gb.bus.ReadMem8((ushort)(disasmPc + 1)));
                }
            }
            else if (ins.length == 3)
            {
                // 16 bit
                operandAndType += "$" + HexN(cpu.gb.bus.ReadMem16((ushort)(disasmPc + 1)), 4);
            }
        }

        string name;
        // Check if instruction name is hardcoded
        if (block)
        {
            name = hardDecoded[0] + " ";
            name += hardDecoded[1];
        }
        else
        {
            name = ins.executor.Method.Name.Split('_')[0];
        };
        return name + " " + operandAndType;
    }
}
