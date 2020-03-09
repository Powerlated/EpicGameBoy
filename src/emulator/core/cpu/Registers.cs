namespace DMSharp
{
    public class Registers
    {
        public CPU cpu;

        internal FlagsRegister _f = new FlagsRegister();

        internal byte f
        {
            get
            {
                byte flagN = 0;
                if (this._f.zero)
                {
                    flagN = (byte)(flagN | 0b10000000);
                }
                if (this._f.negative)
                {
                    flagN = (byte)(flagN | 0b01000000);
                }
                if (this._f.half_carry)
                {
                    flagN = (byte)(flagN | 0b00100000);
                }
                if (this._f.carry)
                {
                    flagN = (byte)(flagN | 0b00010000);
                }
                return flagN;
            }

            set
            {
                this._f.zero = (value & (1 << 7)) != 0;
                this._f.negative = (value & (1 << 6)) != 0;
                this._f.half_carry = (value & (1 << 5)) != 0;
                this._f.carry = (value & (1 << 4)) != 0;
            }
        }


        internal byte a;
        internal byte b;
        internal byte c;
        internal byte d;
        internal byte e;
        internal byte h;
        internal byte l;

        internal ushort sp;

        internal ushort af
        {
            get
            {
                return (ushort)((this.a << 8) | this.f);
            }
            set
            {
                this.a = (byte)(value >> 8);
                this.f = (byte)(value & 0xFF);
            }

        }

        internal ushort bc
        {
            get
            {
                return (ushort)((this.b << 8) | this.c);
            }
            set
            {
                this.b = (byte)(value >> 8);
                this.c = (byte)(value & 0xFF);
            }
        }

        internal ushort de
        {
            get
            {
                return (ushort)((this.d << 8) | this.e);
            }
            set
            {
                this.d = (byte)(value >> 8);
                this.e = (byte)(value & 0xFF);
            }

        }

        internal ushort hl
        {
            get
            {
                return (ushort)((this.h << 8) | this.l);
            }
            set
            {
                this.h = (byte)(value >> 8);
                this.l = (byte)(value & 0xFF);
            }
        }

        public Registers(CPU cpu)
        {
            this.a = 0;
            this.b = 0;
            this.c = 0;
            this.d = 0;
            this.e = 0;

            this.h = 0;
            this.l = 0;
            this.sp = 0;

            this.cpu = cpu;
        }
    }

    class FlagsRegister
    {
        internal bool zero;
        internal bool negative;
        internal bool half_carry;
        internal bool carry;

        public FlagsRegister()
        {
            this.zero = false;
            this.negative = false;
            this.half_carry = false;
            this.carry = false;
        }
    }
}