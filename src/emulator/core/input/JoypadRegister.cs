namespace DMSharp
{
    public class JoypadRegister
    {

        /* Pandocs - Joypad Input
        Bit 7 - Not used
        Bit 6 - Not used
        Bit 5 - P15 Select Button Keys      (0=Select)
        Bit 4 - P14 Select Direction Keys   (0=Select)
        Bit 3 - P13 Input Down  or Start    (0=Pressed) (Read Only)
        Bit 2 - P12 Input Up    or Select   (0=Pressed) (Read Only)
        Bit 1 - P11 Input Left  or Button B (0=Pressed) (Read Only)
        Bit 0 - P10 Input Right or Button A (0=Pressed) (Read Only)
        */

        public bool selectButtons = false;
        public bool selectDpad = false;

        public bool down = false;
        public bool up = false;
        public bool left = false;
        public bool right = false;
        public bool start = false;
        public bool select = false;
        public bool a = false;
        public bool b = false;


        public byte numerical
        {
            get
            {
                byte n = 0;

                if (!this.selectButtons) n |= (1 << 5);
                if (!this.selectDpad) n |= (1 << 4);

                if (this.selectDpad)
                {
                    if (!this.down) n |= (1 << 3);
                    if (!this.up) n |= (1 << 2);
                    if (!this.left) n |= (1 << 1);
                    if (!this.right) n |= (1 << 0);
                }
                else if (this.selectButtons)
                {
                    if (!this.start) n |= (1 << 3);
                    if (!this.select) n |= (1 << 2);
                    if (!this.b) n |= (1 << 1);
                    if (!this.a) n |= (1 << 0);
                }
                return n;
            }
            set
            {
                this.selectButtons = ((value >> 5) & 1) == 0; // Bit 5
                this.selectDpad = ((value >> 4) & 1) == 0; // Bit 4
            }
        }
    }
}