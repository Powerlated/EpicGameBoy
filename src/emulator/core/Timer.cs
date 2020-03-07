namespace DMSharp
{
    public class Timer
    {
        static int[] TimerSpeeds = new int[] { 1024, 16, 64, 256 }; // In terms of 262144hz division 

        GameBoy gb;

        byte divider = 0;
        int counter = 0; // TIMA
        int modulo = 0;
        int speed = 0;
        bool running = false;

        int counterOverflowTtime = 4;

        int internalClock = 0;
        int mainClock = 0;

        public Timer(GameBoy gb)
        {
            this.gb = gb;
        }

        /**
         * DIV has a lower byte that increments every T-cycle.
         * 
         * When counter (TIMA) overflows, it stays 0x00 for a full M-cycle before
         * firing the interrupt and reloading with modulo. 
         */
        public void Step()
        {
            // byte get_the mtime
            const int BASE = 16;

            for (var i = 0; i < this.gb.cpu.lastInstructionCycles; i++)
            {
                this.internalClock++;
                if (this.internalClock >= 256)
                {
                    this.divider++;
                    this.divider &= 0xFF;
                    this.internalClock = 0;
                }

                this.mainClock++; this.mainClock &= 0xFFFF;
                if (this.mainClock % Timer.TimerSpeeds[this.speed] == 0)
                {
                    if (this.running && this.counterOverflowTtime == 0)
                    {
                        this.counter++;
                    }
                }

                if (this.counter >= 256)
                {
                    this.counterOverflowTtime = 4;
                    this.counter = 0;
                }

                if (this.counterOverflowTtime > 0)
                {
                    if (this.counterOverflowTtime == 1)
                    {
                        this.counter = this.modulo;
                        this.gb.interrupts.requestTimer();
                    }
                    this.counterOverflowTtime--;
                }
            }
        }

        public void Reset()
        {
            this.divider = 0;
            this.counter = 0;
            this.modulo = 0;

            this.speed = 0;
            this.running = false;

            this.mainClock = 0;
            this.internalClock = 0;
            this.counterOverflowTtime = 0;
        }

        // Divider
        public byte addr_0xFF04
        {
            get
            {
                return this.divider;
            }
            set
            {
                // Resets to 0 when written to
                this.mainClock = 0;
                this.internalClock = 0;
                this.divider = 0;
                this.counterOverflowTtime = 0;
            }
        }

        // Counter / TIMA
        public byte addr_0xFF05
        {
            get
            {
                return (byte)this.counter;
            }
            set
            {
                if (this.counterOverflowTtime == 0)
                    this.counter = value;
            }
        }

        // Modulo
        public byte addr_0xFF06
        {
            get
            {
                return (byte)this.modulo;
            }
            set
            {
                this.modulo = value;
            }
        }

        // Control
        public byte addr_0xFF07
        {
            get
            {
                byte n = 0;

                n |= (byte)(this.speed & 0b11); // Bits 0-1
                if (this.running) n |= 0b00000100; // Bit 2
                return n;
            }
            set
            {
                this.speed = value & 0b11; // Bits 0-1
                this.running = (value >> 2) != 0; // Bit 2
            }
        }
    }
}