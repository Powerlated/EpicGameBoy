using System.Runtime.InteropServices;
using System.Data;
using System.Collections.Generic;
using System.Text;
using System;
using static Util;

namespace DMSharp
{
    public class CPU
    {
        internal bool halted = false;
        internal bool haltBug = false;

        internal GameBoy gb;

        public bool logging = false;
        public List<string> log = new List<string>();
        public List<string> fullLog = new List<string>();

        // jumpLog: Array<string> = [];

        public Registers _r;
        public ushort pc = 0;

        internal HashSet<ushort> breakpoints = new HashSet<ushort>();

        internal bool stopNow = false;

        internal bool scheduleEnableInterruptsForNextTick = false;

        public CPU(GameBoy gb)
        {
            this._r = new Registers(this);
            this.gb = gb;
            Util.WriteDebug("CPU Bootstrap!");

            // Generate all possible opcodes including invalids
            for (int i = 0; i <= 0xFF; i++)
            {
                this.opCacheRg[i] = this.rgOpcode((byte)i);
                this.opCacheCb[i] = this.cbOpcode((byte)i);
            }
            Util.WriteDebug("Generated and cached all opcodes.");
        }

        // #region

        internal long cycles = 0;

        int lastSerialOut = 0;
        string lastInstructionDebug = "";
        string lastOperandDebug = "";
        internal long lastInstructionCycles = 0;
        string currentIns = "";

        byte lastOpcode = 0;
        byte lastOpcodeReps = 0;

        long totalI = 0;
        long time = 0;

        internal bool debugging = false;

        Instruction[] opCacheRg = new Instruction[256];
        Instruction[] opCacheCb = new Instruction[256];

        HashSet<object> opcodesRan = new HashSet<object>();


        public void Reset()
        {
            this._r.a = 0;
            this._r.b = 0;
            this._r.c = 0;
            this._r.d = 0;
            this._r.e = 0;
            this._r.f = 0;
            this._r.h = 0;
            this._r.l = 0;
            this._r.af = 0;
            this._r.bc = 0;
            this._r.de = 0;
            this._r.hl = 0;
            this._r.sp = 0;
            this.totalI = 0;
            this.time = 0;
            this.pc = 0;
            this.cycles = 0;
            this.haltBug = false;
            this.halted = false;
            this.scheduleEnableInterruptsForNextTick = false;
            this.lastInstructionCycles = 0;
        }

        // #endregion

        internal byte FetchMem8(ushort addr)
        {
            this.cycles += 4;
            return this.gb.bus.ReadMem8(addr);
        }

        // Timing already satisfied by fetchMem8
        internal ushort FetchMem16(ushort addr)
        {
            return (ushort)(this.FetchMem8(addr) | this.FetchMem8((ushort)(addr + 1)) << 8);
        }

        internal void WriteMem8(ushort addr, byte value)
        {
            this.cycles += 4;
            this.gb.bus.WriteMem8(addr, value);
        }


        internal void Step()
        {
            if (this.scheduleEnableInterruptsForNextTick)
            {
                this.scheduleEnableInterruptsForNextTick = false;
                this.gb.interrupts.masterEnabled = true;
            }

            if (this.breakpoints.Contains(this.pc))
            {
                this.gb.speedStop();
                return;
            };

            long c = this.cycles;

            this.checkBootrom();

            // Run the debug information collector
            this.stepDebug();

            if (this.halted == false)
            {
                this.executeInstruction();
                this.lastInstructionCycles = this.cycles - c;
            }


            // If the CPU is HALTed and there are requested interrupts, unHALT
            if ((this.gb.interrupts.requestedInterrupts.numerical &
                this.gb.interrupts.enabledInterrupts.numerical) > 0 && this.halted == true)
            {
                this.halted = false;
            }

            this.serviceInterrupts();
            this.haltBug = false;
        }

        void checkBootrom()
        {
            if (this.pc == 0 && this.gb.bus.bootromEnabled == true && this.gb.bus.bootromLoaded == false)
            {
                Console.WriteLine("No bootrom is loaded, starting execution at 0x100 with proper values loaded");
                this.pc = 0x100;

                this._r.af = 0x01B0;
                this._r.bc = 0x0013;
                this._r.de = 0x00D8;
                this._r.hl = 0x014D;
                this._r.sp = 0xFFFE;

                this.gb.bus.WriteMem8(0xFF05, 0x00); // TIMA
                this.gb.bus.WriteMem8(0xFF06, 0x00); // TMA
                this.gb.bus.WriteMem8(0xFF07, 0x00); // TAC

                this.gb.bus.WriteMem8(0xFF10, 0x80); // NR10 
                this.gb.bus.WriteMem8(0xFF11, 0xBF); // NR11
                this.gb.bus.WriteMem8(0xFF12, 0xF3); // NR12
                this.gb.bus.WriteMem8(0xFF14, 0xBF); // NR14

                this.gb.bus.WriteMem8(0xFF16, 0x3F); // NR21
                this.gb.bus.WriteMem8(0xFF17, 0x00); // NR22
                this.gb.bus.WriteMem8(0xFF19, 0x00); // NR24

                this.gb.bus.WriteMem8(0xFF1A, 0x7F); // NR30
                this.gb.bus.WriteMem8(0xFF1B, 0xFF); // NR31
                this.gb.bus.WriteMem8(0xFF1C, 0x9F); // NR32
                this.gb.bus.WriteMem8(0xFF1E, 0xBF); // NR33

                this.gb.bus.WriteMem8(0xFF20, 0xFF); // NR41
                this.gb.bus.WriteMem8(0xFF21, 0x00); // NR42
                this.gb.bus.WriteMem8(0xFF22, 0x00); // NR43
                this.gb.bus.WriteMem8(0xFF23, 0xBF); // NR44

                this.gb.bus.WriteMem8(0xFF24, 0x77); // NR50
                this.gb.bus.WriteMem8(0xFF25, 0xF3); // NR51


                this.gb.bus.WriteMem8(0xFF26, 0xF1); // - GB, $F0 - SGB; NR52
                this.gb.bus.WriteMem8(0xFF40, 0x91); // LCDC
                this.gb.bus.WriteMem8(0xFF42, 0x00); // SCY
                this.gb.bus.WriteMem8(0xFF43, 0x00); // SCX
                this.gb.bus.WriteMem8(0xFF45, 0x00); // LYC
                this.gb.bus.WriteMem8(0xFF47, 0xFC); // BGP
                this.gb.bus.WriteMem8(0xFF48, 0xFF); // OBP0
                this.gb.bus.WriteMem8(0xFF49, 0xFF); // OBP1
                this.gb.bus.WriteMem8(0xFF4A, 0x00); // WY
                this.gb.bus.WriteMem8(0xFF4B, 0x00); // WX
                this.gb.bus.WriteMem8(0xFFFF, 0x00); // IE;

                // Make a write to disable the bootrom
                this.gb.bus.WriteMem8(0xFF50, 1);
            }
        }

        public bool minDebug = false;

        void executeInstruction()
        {
            byte[] pcTriplet = {
                this.gb.bus.ReadMem8(this.pc),
                this.gb.bus.ReadMem8((ushort)(this.pc + 1)),
                this.gb.bus.ReadMem8((ushort)(this.pc + 2))
            };

            bool isCB = pcTriplet[0] == 0xCB;

            if (isCB) this.cycles += 4; // 0xCB prefix decoding penalty

            // Lookup decoded
            Instruction ins = isCB ? this.opCacheCb[pcTriplet[1]] : this.opCacheRg[pcTriplet[0]];
            this.cycles += 4; // Decoding time penalty
            byte opcode = isCB ? pcTriplet[1] : pcTriplet[0];

            // if (ins.op == null)
            // {
            //     alert($"Implementation error: { (isCB ? Util.Hex((0xCB << 8 | this.gb.bus.ReadMem8(this.pc + 1)), 4) : Util.Hex(this.gb.bus.ReadMem8(this.pc), 2))} is a null op");
            // }

            // this.cycles += ins.cyclesOffset;

            if (this.minDebug)
            {
                if (Disassembler.isControlFlow(ins))
                {
                    if (Disassembler.willJump(ins, this))
                    {
                        string disasm = Disassembler.disassembleOp(ins, pcTriplet, this.pc, this);
                        ushort to = Disassembler.willJumpTo(ins, pcTriplet, this.pc, this);
                        Console.WriteLine($"[PC: {Hex(this.pc, 4)}] {disasm} -> {Hex(to, 4)}");
                        // this.jumpLog.unshift(`[{Util.Hex(this.pc, 4)}] {disasm} => {Util.Hex(to, 4)}`);
                        // this.jumpLog = this.jumpLog.slice(0, 100);
                    }
                }
            }


            if (ins.length == 3)
            {
                ins.opts.imm16 = (ushort)(pcTriplet[2] << 8 | pcTriplet[1]);
                ins.Execute(this);
                this.cycles += 8;
            }
            else if (ins.length == 2)
            {
                ins.opts.imm8 = pcTriplet[1];
                ins.Execute(this);
                this.cycles += 4;
            }
            else
            {
                ins.Execute(this);
            }

            if (!this.haltBug)
            {
                this.pc = (ushort)(this.pc + ins.length);
            }

            this.totalI++;

            // this.opcodesRan.add(pcTriplet[0]);


        }

        void serviceInterrupts()
        {
            // Service interrupts
            InterruptFlag happened = this.gb.interrupts.requestedInterrupts;
            InterruptFlag enabled = this.gb.interrupts.enabledInterrupts;
            if (this.gb.interrupts.masterEnabled)
            {

                // If servicing any interrupt, disable the master flag
                if ((this.gb.interrupts.requestedInterrupts.numerical & this.gb.interrupts.enabledInterrupts.numerical) > 0)
                {
                    this.gb.interrupts.masterEnabled = false;
                }

                if (happened.vblank && enabled.vblank)
                {
                    // this.jumpLog.unshift(`----- INTERRUPT VBLANK -----`);
                    if (!this.haltBug)
                        happened.vblank = false;
                    this.jumpToInterrupt(Interrupts.VBLANK_VECTOR);
                }
                else if (happened.lcdStat && enabled.lcdStat)
                {
                    // this.jumpLog.unshift(`----- INTERRUPT LCDSTAT -----`);
                    if (!this.haltBug)
                        happened.lcdStat = false;
                    this.jumpToInterrupt(Interrupts.LCD_STATUS_VECTOR);
                }
                else if (happened.timer && enabled.timer)
                {
                    // this.jumpLog.unshift(`----- INTERRUPT TIMER -----`);
                    if (!this.haltBug)
                        happened.timer = false;
                    this.jumpToInterrupt(Interrupts.TIMER_OVERFLOW_VECTOR);
                }
                else if (happened.serial && enabled.serial)
                {
                    if (!this.haltBug)
                        happened.serial = false;
                    this.jumpToInterrupt(Interrupts.SERIAL_LINK_VECTOR);
                }
                else if (happened.joypad && enabled.joypad)
                {
                    if (!this.haltBug)
                        happened.joypad = false;
                    this.jumpToInterrupt(Interrupts.JOYPAD_PRESS_VECTOR);
                }
            }
        }


        void stepDebug()
        {
            byte[] pcTriplet = {
                this.gb.bus.ReadMem8(this.pc),
                this.gb.bus.ReadMem8((ushort)(this.pc + 1)),
                this.gb.bus.ReadMem8((ushort)(this.pc + 2))
            };

            var isCB = this.gb.bus.ReadMem8(this.pc) == 0xCB;

            var ins = isCB ? this.cbOpcode(this.gb.bus.ReadMem8((ushort)(this.pc + 1))) : this.rgOpcode(this.gb.bus.ReadMem8(this.pc));

            var opcode = isCB ? this.gb.bus.ReadMem8((ushort)(this.pc + 1)) : this.gb.bus.ReadMem8(this.pc);

            if (opcode == this.lastOpcode)
            {
                this.lastOpcodeReps++;
            }
            else
            {
                this.lastOpcodeReps = 0;
            }
            this.lastOpcode = opcode;

            // if ((ins.op.length == 1 && (!ins.type)) || (ins.op.length == 2 && (!ins.type || !ins.type2))) {
            //     alert("[Arg length 1 || 2] Implementation error: {ins.op.name} 0x{this.fetchMem8(this.pc).toString(16)}");
            // }
            // if (ins.op.length == 3 && (ins.type === undefined || ins.type2 === undefined)) {
            //     alert("[Arg length 3] Implementation error: {ins.op.name} 0x{this.fetchMem8(this.pc).toString(16)}");
            // }

            var insDebug = "";
            var operandDebug = "";


            if (this.debugging)
            {
                Util.WriteDebug($"PC: {this.pc}");
                Util.WriteDebug($"[OPcode: {Util.Hex(this.gb.bus.ReadMem16((ushort)this.pc), 2)}, OP: {ins.executor.Method.Name}] {(isCB ? "[0xCB Prefix] " : "")} Executing op: " + Hex(this.gb.bus.ReadMem8(this.pc), 2));
                Util.WriteDebug("Instruction " + ins.length);
            }

            if (this.debugging || this.logging)
            {
                if (ins.length == 3)
                {
                    insDebug = $"{HexN_LC(this.gb.bus.ReadMem8(this.pc), 2)} {HexN_LC(this.gb.bus.ReadMem8((ushort)(this.pc + 1)), 2)} {HexN_LC(this.gb.bus.ReadMem8((ushort)(this.pc + 2)), 2)}";
                    operandDebug = $"{Util.Hex(this.gb.bus.ReadMem16((ushort)(this.pc + 1)), 4)}";
                }
                else if (ins.length == 2)
                {
                    insDebug = $"{HexN_LC(this.gb.bus.ReadMem8(this.pc), 2)} {HexN_LC(this.gb.bus.ReadMem8((ushort)(this.pc + 1)), 2)} ..";
                    operandDebug = $"{Util.Hex(this.gb.bus.ReadMem8((ushort)(this.pc + 1)), 2)}";
                }
                else
                {
                    insDebug = $"{HexN_LC(this.gb.bus.ReadMem8(this.pc), 2)} .. ..";
                }
                this.currentIns = $"{ins.executor.Method.Name} {(ins.opts.r8 == R8.NONE ? "" : ins.opts.r8.ToString())}{(ins.opts.r8_2 == R8.NONE ? "" : ins.opts.r8_2.ToString())}";
            }

            if (this.logging)
            {

                var flags = $"{(this._r._f.zero ? 'Z' : '-')}{(this._r._f.negative ? 'N' : '-')}{(this._r._f.half_carry ? 'H' : '-')}{(this._r._f.carry ? 'C' : '-')}";

                // this.log.push("A:{HexN(this._r.a, 2)} F:{flags} BC:{HexN(this._r.bc, 4)} DE:{HexN_LC(this._r.de, 4)} HL:{HexN_LC(this._r.hl, 4)
                // } SP:{HexN_LC(this._r.sp, 4)} PC:{HexN_LC(this.pc, 4)} (cy: {this.cycles})");

                var sb1 = new StringBuilder();
                sb1.Append($"A:{HexN(this._r.a, 2)} ");
                sb1.Append($"F:{flags} ");
                sb1.Append($"BC:{HexN(this._r.bc, 4)} ");
                sb1.Append($"DE:{HexN_LC(this._r.de, 4)} ");
                sb1.Append($"HL:{HexN_LC(this._r.hl, 4)} ");
                sb1.Append($"SP:{HexN_LC(this._r.sp, 4)} ");
                sb1.Append($"PC:{HexN_LC(this.pc, 4)} ");
                sb1.Append(Disassembler.disassembleOp(ins, pcTriplet, this.pc, this));
                this.log.Add(sb1.ToString());

                var sb2 = new StringBuilder();
                sb2.Append($"A:{HexN(this._r.a, 2)} ");
                sb2.Append($"F:{flags} ");
                sb2.Append($"BC:{HexN(this._r.bc, 4)} ");
                sb2.Append($"DE:{HexN_LC(this._r.de, 4)} ");
                sb2.Append($"HL:{HexN_LC(this._r.hl, 4)} ");
                sb2.Append($"SP:{HexN_LC(this._r.sp, 4)} ");
                sb2.Append($"PC:{HexN_LC(this.pc, 4)} ");
                sb2.Append($"(ins: {this.totalI}) ");
                sb2.Append($"|[00]0x{ HexN_LC(this.pc, 4)}: ");
                sb2.Append($"{RightPad(insDebug, 8, ' ')} ");
                sb2.Append($"{this.currentIns} ");
                sb2.Append($"{operandDebug}");
                this.fullLog.Add(sb2.ToString());
            }

            this.lastOperandDebug = operandDebug;
            this.lastInstructionDebug = insDebug;
        }

        void jumpToInterrupt(ushort vector)
        {
            byte pcUpperByte = (byte)((this.pc) >> 8);
            byte pcLowerByte = (byte)((this.pc) & 0xFF);

            this._r.sp = (ushort)(this._r.sp - 1);
            this.WriteMem8(this._r.sp, pcUpperByte);
            this._r.sp = (ushort)(this._r.sp - 1);
            this.WriteMem8(this._r.sp, pcLowerByte);

            this.pc = vector;
        }

        void toggleBreakpoint(ushort point)
        {
            if (!this.breakpoints.Contains(point))
            {
                this.setBreakpoint(point);
            }
            else
            {
                this.clearBreakpoint(point);
            }
        }
        void setBreakpoint(ushort point)
        {
            Util.WriteDebug("Set breakpoint at " + Util.Hex(point, 4));
            this.breakpoints.Add(point);
        }
        void clearBreakpoint(ushort point)
        {
            Util.WriteDebug("Cleared breakpoint at " + Util.Hex(point, 4));
            this.breakpoints.Remove(point);
        }

        internal byte getReg8(R8 t)
        {
            switch (t)
            {
                case R8.A: return this._r.a;
                case R8.B: return this._r.b;
                case R8.C: return this._r.c;
                case R8.D: return this._r.d;
                case R8.E: return this._r.e;
                case R8.H: return this._r.h;
                case R8.L: return this._r.l;
                case R8.iHL: return this.FetchMem8(this._r.hl);
                default: throw new ArgumentException();
            }
        }

        internal ushort getReg16(R16 t)
        {
            switch (t)
            {
                case R16.AF: return this._r.af;
                case R16.BC: return this._r.bc;
                case R16.DE: return this._r.de;
                case R16.HL: return this._r.hl;
                case R16.SP: return this._r.sp;
                default: throw new ArgumentException();
            }
        }

        internal void setReg8(R8 t, byte i)
        {
            switch (t)
            {
                case R8.A: this._r.a = i; break;
                case R8.B: this._r.b = i; break;
                case R8.C: this._r.c = i; break;
                case R8.D: this._r.d = i; break;
                case R8.E: this._r.e = i; break;
                case R8.H: this._r.h = i; break;
                case R8.L: this._r.l = i; break;
                case R8.iHL: this.WriteMem8(this._r.hl, i); break;
                default: throw new ArgumentException();
            }
        }

        internal void setReg16(R16 t, ushort i)
        {
            switch (t)
            {
                case R16.AF: this._r.af = i; break;
                case R16.BC: this._r.bc = i; break;
                case R16.DE: this._r.de = i; break;
                case R16.HL: this._r.hl = i; break;
                case R16.SP: this._r.sp = i; break;
            }
        }

        Instruction rgOpcode(byte id)
        {

            Executor e = Ops.LD_HL_SPaddE8;
            int upperNybble = id >> 4;

            int lowerNybble = id & 0b1111;
            switch (id)
            {
                /** JR */
                case 0x18: // JR E8
                    return new Instruction(Ops.JR_E8, 2, new Options(CC.NONE));
                case 0x38: // JR C, E8
                    return new Instruction(Ops.JR_E8, 2, new Options(CC.C));
                case 0x30: // JR NC, E8
                    return new Instruction(Ops.JR_E8, 2, new Options(CC.NC));
                case 0x28: // JR Z, E8
                    return new Instruction(Ops.JR_E8, 2, new Options(CC.Z));
                case 0x20: // JR NZ, E8
                    return new Instruction(Ops.JR_E8, 2, new Options(CC.NZ));


                /** LD R8, N8 */
                case 0x3E: // LD A, N8
                    return new Instruction(Ops.LD_R8_N8, 2, new Options(R8.A));
                case 0x06: // LD B, N8
                    return new Instruction(Ops.LD_R8_N8, 2, new Options(R8.B));
                case 0x0E: // LD C, N8
                    return new Instruction(Ops.LD_R8_N8, 2, new Options(R8.C));
                case 0x16: // LD D, N8
                    return new Instruction(Ops.LD_R8_N8, 2, new Options(R8.D));
                case 0x1E: // LD E, n8
                    return new Instruction(Ops.LD_R8_N8, 2, new Options(R8.E));
                case 0x26: // LD H, N8
                    return new Instruction(Ops.LD_R8_N8, 2, new Options(R8.H));
                case 0x2E: // LD L, N8
                    return new Instruction(Ops.LD_R8_N8, 2, new Options(R8.L));

                /** PUSH R16 */
                case 0xF5: // PUSH AF 
                    return new Instruction(Ops.PUSH_R16, 1, new Options(R16.AF));
                case 0xC5: // PUSH BC
                    return new Instruction(Ops.PUSH_R16, 1, new Options(R16.BC));
                case 0xD5: // PUSH DE
                    return new Instruction(Ops.PUSH_R16, 1, new Options(R16.DE));
                case 0xE5: // PUSH HL
                    return new Instruction(Ops.PUSH_R16, 1, new Options(R16.HL));

                /** POP R16 */
                case 0xF1: // POP AF 
                    return new Instruction(Ops.POP_R16, 1, new Options(R16.AF));
                case 0xC1: // POP BC
                    return new Instruction(Ops.POP_R16, 1, new Options(R16.BC));
                case 0xD1: // POP DE
                    return new Instruction(Ops.POP_R16, 1, new Options(R16.DE));
                case 0xE1: // POP HL
                    return new Instruction(Ops.POP_R16, 1, new Options(R16.HL));

                /** INC R8 */
                case 0x3C: // INC A
                    return new Instruction(Ops.INC_R8, 1, new Options(R8.A));
                case 0x04: // INC B
                    return new Instruction(Ops.INC_R8, 1, new Options(R8.B));
                case 0x0C: // INC C
                    return new Instruction(Ops.INC_R8, 1, new Options(R8.C));
                case 0x14: // INC D
                    return new Instruction(Ops.INC_R8, 1, new Options(R8.D));
                case 0x1C: // INC E
                    return new Instruction(Ops.INC_R8, 1, new Options(R8.E));
                case 0x24: // INC H
                    return new Instruction(Ops.INC_R8, 1, new Options(R8.H));
                case 0x2C: // INC L
                    return new Instruction(Ops.INC_R8, 1, new Options(R8.L));
                case 0x34: // INC [HL]
                    return new Instruction(Ops.INC_R8, 1, new Options(R8.iHL));

                /** DEC R8 */
                case 0x3D: // DEC A
                    return new Instruction(Ops.DEC_R8, 1, new Options(R8.A));
                case 0x05: // DEC B
                    return new Instruction(Ops.DEC_R8, 1, new Options(R8.B));
                case 0x0D: // DEC C
                    return new Instruction(Ops.DEC_R8, 1, new Options(R8.C));
                case 0x15: // DEC D
                    return new Instruction(Ops.DEC_R8, 1, new Options(R8.D));
                case 0x1D: // DEC E
                    return new Instruction(Ops.DEC_R8, 1, new Options(R8.E));
                case 0x25: // DEC H
                    return new Instruction(Ops.DEC_R8, 1, new Options(R8.H));
                case 0x2D: // DEC L
                    return new Instruction(Ops.DEC_R8, 1, new Options(R8.L));
                case 0x35: // DEC [HL]
                    return new Instruction(Ops.DEC_R8, 1, new Options(R8.iHL));

                /** INC R16 */
                case 0x03: // INC BC
                    return new Instruction(Ops.INC_R16, 1, new Options(R16.BC));
                case 0x13: // INC DE 
                    return new Instruction(Ops.INC_R16, 1, new Options(R16.DE));
                case 0x23: // INC HL
                    return new Instruction(Ops.INC_R16, 1, new Options(R16.HL));
                case 0x33: // INC SP
                    return new Instruction(Ops.INC_R16, 1, new Options(R16.SP));

                /** DEC R16 */
                case 0x0B: // DEC BC
                    return new Instruction(Ops.DEC_R16, 1, new Options(R16.BC));
                case 0x1B: // DEC DE 
                    return new Instruction(Ops.DEC_R16, 1, new Options(R16.DE));
                case 0x2B: // DEC HL
                    return new Instruction(Ops.DEC_R16, 1, new Options(R16.HL));
                case 0x3B: // DEC SP
                    return new Instruction(Ops.DEC_R16, 1, new Options(R16.SP));

                /** LD R16, N16 */
                case 0x01: // LD BC, N16
                    return new Instruction(Ops.LD_R16_N16, 3, new Options(R16.BC));
                case 0x11: // LD DE, N16
                    return new Instruction(Ops.LD_R16_N16, 3, new Options(R16.DE));
                case 0x21: // LD HL, N16
                    return new Instruction(Ops.LD_R16_N16, 3, new Options(R16.HL));
                case 0x31: // LD SP, N16
                    return new Instruction(Ops.LD_R16_N16, 3, new Options(R16.SP));

                /** Arithmetic */
                case 0xC6: // ADD A, N8
                    return new Instruction(Ops.ADD_A_N8, 2);
                case 0xCE: // ADC A, N8
                    return new Instruction(Ops.ADC_A_N8, 2);
                case 0xD6: // SUB A, N8
                    return new Instruction(Ops.SUB_A_N8, 2);
                case 0xDE: // SBC A, N8
                    return new Instruction(Ops.SBC_A_N8, 2);

                /** RET */
                case 0xC9: // RET
                    return new Instruction(Ops.RET, 1, new Options(CC.NONE));
                case 0xD8: // RET C
                    return new Instruction(Ops.RET, 1, new Options(CC.C));
                case 0xD0: // RET NC
                    return new Instruction(Ops.RET, 1, new Options(CC.NC));
                case 0xC8: // RET Z
                    return new Instruction(Ops.RET, 1, new Options(CC.Z));
                case 0xC0: // RET NZ
                    return new Instruction(Ops.RET, 1, new Options(CC.NZ));

                /** SP ops */
                case 0xF8: // LD HL, SP+e8
                    return new Instruction(Ops.LD_HL_SPaddE8, 2);
                case 0xF9: // LD SP, HL
                    return new Instruction(Ops.LD_SP_HL, 1);
                case 0xE8: // ADD SP, E8
                    return new Instruction(Ops.ADD_SP_E8, 2);

                /** A rotate */
                case 0x07: // RLCA
                    return new Instruction(Ops.RLCA, 1);
                case 0x0F: // RRCA
                    return new Instruction(Ops.RRCA, 1);
                case 0x1F: // RRA
                    return new Instruction(Ops.RRA, 1);
                case 0x17: // RLA
                    return new Instruction(Ops.RLA, 1);

                /** A ops */
                case 0xE6: // AND A, N8
                    return new Instruction(Ops.AND_N8, 2);
                case 0xF6: // OR A, N8
                    return new Instruction(Ops.OR_A_N8, 2);
                case 0xEE: // XOR A, N8
                    return new Instruction(Ops.XOR_A_N8, 2);
                case 0xFE: // CP A, N8
                    return new Instruction(Ops.CP_A_N8, 2);

                /** Interrupts */
                case 0x10: // STOP
                    return new Instruction(Ops.STOP, 2);
                case 0x76: // HALT
                    return new Instruction(Ops.HALT, 1);

                /** Carry flag */
                case 0x37: // SCF
                    return new Instruction(Ops.SCF, 1);
                case 0x3F: // CCF
                    return new Instruction(Ops.CCF, 1);

                /** JP */
                case 0xE9: // JP HL
                    return new Instruction(Ops.JP_HL, 1);
                case 0xC3: // JP N16
                    return new Instruction(Ops.JP_N16, 3, new Options(CC.NONE));
                case 0xDA: // JP C, N16
                    return new Instruction(Ops.JP_N16, 3, new Options(CC.C));
                case 0xD2: // JP NC, N16
                    return new Instruction(Ops.JP_N16, 3, new Options(CC.NC));
                case 0xCA: // JP Z, N16
                    return new Instruction(Ops.JP_N16, 3, new Options(CC.Z));
                case 0xC2: // JP NZ, N16
                    return new Instruction(Ops.JP_N16, 3, new Options(CC.NZ));

                /** CALL */
                case 0xCD: // CALL N16
                    return new Instruction(Ops.CALL_N16, 3, new Options(CC.NONE));
                case 0xDC: // CALL C, N16
                    return new Instruction(Ops.CALL_N16, 3, new Options(CC.C));
                case 0xD4: // CALL NC, N16
                    return new Instruction(Ops.CALL_N16, 3, new Options(CC.NC));
                case 0xCC: // CALL Z, N16
                    return new Instruction(Ops.CALL_N16, 3, new Options(CC.Z));
                case 0xC4: // CALL NZ, N16
                    return new Instruction(Ops.CALL_N16, 3, new Options(CC.NZ));

                /** ADD HL, R16 */
                case 0x09: // ADD HL, BC
                    return new Instruction(Ops.ADD_HL_R16, 1, new Options(R16.BC));
                case 0x19: // ADD HL, DE
                    return new Instruction(Ops.ADD_HL_R16, 1, new Options(R16.DE));
                case 0x29: // ADD HL, HL
                    return new Instruction(Ops.ADD_HL_R16, 1, new Options(R16.HL));
                case 0x39: // ADD HL, SP
                    return new Instruction(Ops.ADD_HL_R16, 1, new Options(R16.SP));

                /** Reset Vectors */
                case 0xC7: // RST 00h
                    return new Instruction(Ops.RST, 1, new Options((ushort)0x00));
                case 0xCF: // RST 08h
                    return new Instruction(Ops.RST, 1, new Options((ushort)0x08));
                case 0xD7: // RST 10h
                    return new Instruction(Ops.RST, 1, new Options((ushort)0x10));
                case 0xDF: // RST 18h
                    return new Instruction(Ops.RST, 1, new Options((ushort)0x18));
                case 0xE7: // RST 20h
                    return new Instruction(Ops.RST, 1, new Options((ushort)0x20));
                case 0xEF: // RST 28h
                    return new Instruction(Ops.RST, 1, new Options((ushort)0x28));
                case 0xF7: // RST 30h
                    return new Instruction(Ops.RST, 1, new Options((ushort)0x30));
                case 0xFF: // RST 38h
                    return new Instruction(Ops.RST, 1, new Options((ushort)0x38));

                /** LD between A and R16 */
                case 0x02: // LD [BC], A
                    return new Instruction(Ops.LD_iR16_A, 1, new Options(R16.BC));
                case 0x12: // LD [DE], A
                    return new Instruction(Ops.LD_iR16_A, 1, new Options(R16.DE));
                case 0x22: // LD [HL+], A
                    return new Instruction(Ops.LD_iHLinc_A, 1);
                case 0x32: // LD [HL-], A
                    return new Instruction(Ops.LD_iHLdec_A, 1);
                case 0x0A: // LD A, [BC]
                    return new Instruction(Ops.LD_A_iR16, 1, new Options(R16.BC));
                case 0x1A: // LD A, [DE]
                    return new Instruction(Ops.LD_A_iR16, 1, new Options(R16.DE));
                case 0x2A: // LD A, [HL+]
                    return new Instruction(Ops.LD_A_iHLinc, 1);
                case 0x3A: // LD A, [HL-]
                    return new Instruction(Ops.LD_A_iHLdec, 1);

                /** LD between A and High RAM */
                case 0xF0: // LD A, [$FF00+N8]
                    return new Instruction(Ops.LD_A_iFF00plusN8, 2);
                case 0xE0: // LD [$FF00+N8], A
                    return new Instruction(Ops.LD_iFF00plusN8_A, 2);
                case 0xF2: // LD A, [$FF00+C]
                    return new Instruction(Ops.LD_A_iFF00plusC, 1);
                case 0xE2: // LD [$FF00+C], A
                    return new Instruction(Ops.LD_iFF00plusC_A, 1);


                case 0xFA: // LD A, [N16]
                    return new Instruction(Ops.LD_A_iN16, 3);
                case 0xEA: // LD [N16], A
                    return new Instruction(Ops.LD_iN16_A, 3);
                case 0x08: // LD [N16], SP
                    return new Instruction(Ops.LD_iN16_SP, 3);

                case 0xF3: // DI - Disable interrupts master flag
                    return new Instruction(Ops.DI, 1);
                case 0xFB: // EI - Enable interrupts master flag
                    return new Instruction(Ops.EI, 1);

                case 0x36: // LD [HL], N8
                    return new Instruction(Ops.LD_iHL_N8, 2);
                case 0x2F: // CPL
                    return new Instruction(Ops.CPL, 1);
                case 0xD9: // RETI
                    return new Instruction(Ops.RETI, 1);
                case 0x27: // DAA
                    return new Instruction(Ops.DA_A, 1);
                case 0x00: // NOP
                    return new Instruction(Ops.NOP, 1);


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
                    return new Instruction(Ops.INVALID_OPCODE, 1);
            }

            R8[] typeTable = new R8[] { R8.B, R8.C, R8.D, R8.E, R8.H, R8.L, R8.iHL, R8.A };
            // Mask for the low or high half of the table
            var HALF_MASK = 1 << 3;

            // #region Algorithm decoding ADD, ADC, SUB, SBC, AND, XOR, OR, CP in 0x80-0xBF
            if (upperNybble >= 0x8 && upperNybble <= 0xB)
            {
                var lowOps = new Executor[] { Ops.ADD_A_R8, Ops.SUB_A_R8, Ops.AND_A_R8, Ops.OR_A_R8 };
                var highOps = new Executor[] { Ops.ADC_A_R8, Ops.SBC_A_R8, Ops.XOR_A_R8, Ops.CP_A_R8 };

                var type = typeTable[lowerNybble & 0b111];
                var OPDEC = upperNybble & 0b11;

                var op = (lowerNybble & HALF_MASK) != 0 ?
                    highOps[OPDEC] :
                    lowOps[OPDEC];

                return new Instruction(op, 1, new Options(type));
            }
            // #endregion

            // #region Algorithm decoding LD 0x40-0x7F
            if (upperNybble >= 0x4 && upperNybble <= 0x7)
            {
                var highTypes = new R8[] { R8.C, R8.E, R8.L, R8.A };
                var lowTypes = new R8[] { R8.B, R8.D, R8.H, R8.iHL };

                var type2 = typeTable[lowerNybble & 0b111];

                var OPDEC = upperNybble & 0b11;

                var type = (lowerNybble & HALF_MASK) != 0 ?
                    highTypes[OPDEC] :
                    lowTypes[OPDEC];

                return new Instruction(Ops.LD_R8_R8, 1, new Options(type, type2));
            }

            if (this.debugging)
            {
                Console.WriteLine($"[PC {Util.Hex(this.pc, 4)}] Unknown Opcode in Lookup Table: " + Util.Hex(id, 2));
                this.gb.speedStop();
            }
            return new Instruction(Ops.UNKNOWN_OPCODE, 1);

        }

        Instruction cbOpcode(byte id)
        {
            byte upperNybble = (byte)(id >> 4);
            byte lowerNybble = (byte)(id & 0b1111);

            Executor op = Ops.BIT_R8;

            byte HALF_MASK = (1 << 3);

            // 0x0 - 0x7
            int bit = lowerNybble < 0x8 ?
                (upperNybble & 0b11) * 2 :
                ((upperNybble & 0b11) * 2) + 1;

            int cyclesOffset = 0;

            R8[] typeTable = new R8[] { R8.B, R8.C, R8.D, R8.E, R8.H, R8.L, R8.iHL, R8.A };
            R8 type = typeTable[lowerNybble & 0b111];

            if (upperNybble < 0x4)
            {
                var lowOps = new Executor[] { Ops.RLC_R8, Ops.RL_R8, Ops.SLA_R8, Ops.SWAP_R8 };
                var highOps = new Executor[] { Ops.RRC_R8, Ops.RR_R8, Ops.SRA_R8, Ops.SRL_R8 };
                // TODO: IDK why I need this
                cyclesOffset = -4;

                if (lowerNybble < 0x8)
                {
                    op = lowOps[upperNybble];
                }
                else
                {
                    op = highOps[upperNybble];
                }

                // 0x40 - 0xF0
            }
            else
            {
                op = new Executor[] { null, Ops.BIT_R8, Ops.RES_R8, Ops.SET_R8 }[upperNybble >> 2];
            }


            return new Instruction(op, 2, new Options(type, (ushort)bit));
        }
    }
}