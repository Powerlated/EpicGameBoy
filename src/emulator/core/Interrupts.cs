namespace DMSharp
{
    public class InterruptFlag
    {
        internal bool vblank = false;
        internal bool lcdStat = false;
        internal bool timer = false;
        internal bool serial = false;
        internal bool joypad = false;

        public byte numerical
        {


            set
            {
                this.vblank = (value & (1 << 0)) != 0;
                this.lcdStat = (value & (1 << 1)) != 0;
                this.timer = (value & (1 << 2)) != 0;
                this.serial = (value & (1 << 3)) != 0;
                this.joypad = (value & (1 << 4)) != 0;
            }

            get
            {
                byte flagN = 0;
                if (this.vblank)
                {
                    flagN = (byte)(flagN | 0b00000001);
                }
                if (this.lcdStat)
                {
                    flagN = (byte)(flagN | 0b00000010);
                }
                if (this.timer)
                {
                    flagN = (byte)(flagN | 0b00000100);
                }
                if (this.serial)
                {
                    flagN = (byte)(flagN | 0b00001000);
                }
                if (this.joypad)
                {
                    flagN = (byte)(flagN | 0b00010000);
                }
                return flagN;
            }
        }
    }

    class Interrupts
    {
        public const ushort VBLANK_VECTOR = 0x40;
        public const ushort LCD_STATUS_VECTOR = 0x48;
        public const ushort TIMER_OVERFLOW_VECTOR = 0x50;
        public const ushort SERIAL_LINK_VECTOR = 0x58;
        public const ushort JOYPAD_PRESS_VECTOR = 0x60;
    }

    public class InterruptController
    {
        MemoryBus bus;

        public InterruptController(MemoryBus bus)
        {
            this.bus = bus;
        }

        public bool masterEnabled = true; // IME

        public InterruptFlag enabledInterrupts = new InterruptFlag(); // 0xFFFF
        public InterruptFlag requestedInterrupts = new InterruptFlag(); // 0xFF0F

        // Note: When an interrupt is *handled*, the master interrupt flag is disabled

        public void Reset()
        {
            this.masterEnabled = true;

            this.enabledInterrupts.numerical = 0;
            this.requestedInterrupts.numerical = 0;
        }

        public void requestVblank()
        {
            this.requestedInterrupts.vblank = true;
        }

        public void requestLCDstatus()
        {
            this.requestedInterrupts.lcdStat = true;
        }

        public void requestTimer()
        {
            this.requestedInterrupts.timer = true;
        }

        public void requestSerial()
        {
            this.requestedInterrupts.serial = true;
        }

        public void requestJoypad()
        {
            this.requestedInterrupts.joypad = true;
        }
    }
}