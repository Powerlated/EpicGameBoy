using System;

namespace DMSharp
{
    enum InstructionType
    {
        Immediate8, Immediate16, OneType, TwoType
    }

    public class Options
    {
        public CC cc = CC.NONE;
        public R16 r16 = R16.NONE;
        public R8 r8 = R8.NONE;
        public R8 r8_2 = R8.NONE;
        public ushort numtype = 0;
        public byte imm8 = 0;
        public ushort imm16 = 0;

        public sbyte imm8s
        {
            get
            {
                return (sbyte)imm8;
            }
        }



        public Options() { }
        public Options(CC cc)
        {
            this.cc = cc;
        }
        public Options(R8 r8)
        {
            this.r8 = r8;
        }
        public Options(R8 r8, R8 r8_2)
        {
            this.r8 = r8;
            this.r8_2 = r8_2;
        }
        public Options(R16 r16)
        {
            this.r16 = r16;
        }
        public Options(ushort numtype) {
            this.numtype = numtype;
        }
    }

    public delegate void Executor(CPU cpu, Options opts);

    public class Instruction
    {
        public Executor executor;
        public Options opts;
        public int length = 0;
        public void Execute(CPU cpu) {
            this.executor(cpu, opts);
        }

        public Instruction(Executor e, int length, Options options)
        {
            this.executor = e;
            this.opts = options;
            this.length = length;
        }

        public Instruction(Executor e, int length)
        {
            this.executor = e;
            this.opts = new Options();
            this.length = length;
        }
    }
}