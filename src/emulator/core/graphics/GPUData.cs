namespace DMSharp
{
    public class LCDCRegister
    {
        // https://gbdev.gg8.se/wiki/articles/Video_Display#LCD_Control_Register
        public bool lcdDisplayEnable7 = false; // Bit 7 - LCD Display Enable             (0=Off, 1=On)
        public bool windowTilemapSelect___6 = false; // Bit 6 - Window Tile Map Display Select (0=9800-9BFF, 1=9C00-9FFF)
        public bool enableWindow____5 = false; // Bit 5 - Window Display Enable          (0=Off, 1=On)
        public bool bgWindowTiledataSelect__4 = false; // Bit 4 - BG & Window Tile Data Select   (0=8800-97FF, 1=8000-8FFF)
        public bool bgTilemapSelect_3 = false; // Bit 3 - BG Tile Map Display Select     (0=9800-9BFF, 1=9C00-9FFF)
        public bool spriteSize______2 = false; // Bit 2 - OBJ (Sprite) Size              (0=8x8, 1=8x16)
        public bool spriteDisplay___1 = false; // Bit 1 - OBJ (Sprite) Display Enable    (0=Off, 1=On)
        public bool bgWindowEnable0 = false; // Bit 0 - BG/Window Display/Priority     (0=Off, 1=On)

        public byte numerical
        {
            get
            {
                int flagN = 0;
                if (this.lcdDisplayEnable7) flagN = flagN | 0b10000000;
                if (this.windowTilemapSelect___6) flagN = flagN | 0b01000000;
                if (this.enableWindow____5) flagN = flagN | 0b00100000;
                if (this.bgWindowTiledataSelect__4) flagN = flagN | 0b00010000;
                if (this.bgTilemapSelect_3) flagN = flagN | 0b00001000;
                if (this.spriteSize______2) flagN = flagN | 0b00000100;
                if (this.spriteDisplay___1) flagN = flagN | 0b00000010;
                if (this.bgWindowEnable0) flagN = flagN | 0b00000001;
                return (byte)flagN;
            }
            set
            {
                var i = value;
                this.lcdDisplayEnable7 = (i & (1 << 7)) != 0;
                this.windowTilemapSelect___6 = (i & (1 << 6)) != 0;
                this.enableWindow____5 = (i & (1 << 5)) != 0;
                this.bgWindowTiledataSelect__4 = (i & (1 << 4)) != 0;
                this.bgTilemapSelect_3 = (i & (1 << 3)) != 0;
                this.spriteSize______2 = (i & (1 << 2)) != 0;
                this.spriteDisplay___1 = (i & (1 << 1)) != 0;
                this.bgWindowEnable0 = (i & (1 << 0)) != 0;
            }
        }
    }
    public class LCDStatusRegister
    {
        // https://gbdev.gg.8se/wiki/articles/Video_Display#FF41_-_STAT_-_LCDC_Status_.28R.2FW.29
        public bool lyCoincidenceInterrupt6 = false; // Bit 6 - LYC=LY Coincidence Interrupt (1=Enable) (Read/Write)
        public bool mode2OamInterrupt_____5 = false; // Bit 5 - Mode 2 OAM Interrupt         (1=Enable) (Read/Write)
        public bool mode1VblankInterrupt__4 = false; // Bit 4 - Mode 1 V-Blank Interrupt     (1=Enable) (Read/Write)
        public bool mode0HblankInterrupt__3 = false; // Bit 3 - Mode 0 H-Blank Interrupt     (1=Enable) (Read/Write)
        public bool coincidenceFlag_______2 = false; // Bit 2 - Coincidence Flag  (0:LYC<>LY, 1:LYC=LY) (Read Only)

        public int mode = 0;   // Bit 1-0 - Mode Flag       (Mode 0-3, see below) (Read Only)
                               // 0: During H-Blank
                               // 1: During V-Blank
                               // 2: During Searching OAM
                               // 3: During Transferring Data to LCD Driver

        public byte numerical
        {
            get
            {
                var flagN = 0;
                if (this.lyCoincidenceInterrupt6) flagN = flagN | 0b01000000;
                if (this.mode2OamInterrupt_____5) flagN = flagN | 0b00100000;
                if (this.mode1VblankInterrupt__4) flagN = flagN | 0b00010000;
                if (this.mode0HblankInterrupt__3) flagN = flagN | 0b00001000;
                if (this.coincidenceFlag_______2) flagN = flagN | 0b00000100;

                flagN = flagN | (this.mode & 0b11);
                return (byte)flagN;
            }
            set
            {
                this.lyCoincidenceInterrupt6 = (value & (1 << 6)) != 0;
                this.mode2OamInterrupt_____5 = (value & (1 << 5)) != 0;
                this.mode1VblankInterrupt__4 = (value & (1 << 4)) != 0;
                this.mode0HblankInterrupt__3 = (value & (1 << 3)) != 0;
                this.coincidenceFlag_______2 = (value & (1 << 2)) != 0;
            }
        }
    }

    public class OAMFlags
    {
        public bool behindBG = false;
        public bool yFlip = false;
        public bool xFlip = false;
        public bool paletteNumberDMG = false; // DMG only (0, 1)
        public bool tileVramBank = false; // CGB only (0, 1)
        public byte paletteNumberCGB = 0;

        public byte numerical
        {
            get
            {
                var n = 0;
                if (this.behindBG)
                    n |= 0b10000000;
                if (this.yFlip)
                    n |= 0b01000000;
                if (this.xFlip)
                    n |= 0b00100000;
                if (this.paletteNumberDMG)
                    n |= 0b00010000;
                if (this.tileVramBank)
                    n |= 0b00001000;

                n |= this.paletteNumberCGB & 0b111;
                return (byte)n;
            }
            set
            {
                var i = value;
                this.behindBG = (i & (1 << 7)) != 0;
                this.yFlip = (i & (1 << 6)) != 0;
                this.xFlip = (i & (1 << 5)) != 0;
                this.paletteNumberDMG = (i & (1 << 4)) != 0;
                this.tileVramBank = (i & (1 << 3)) != 0;

                this.paletteNumberCGB = (byte)(i & 0b111);
            }

        }
    }

    public class PaletteData
    {
        public byte[] shades = new byte[4];

        public byte numerical
        {
            get
            {
                var n = 0;
                n |= n | (this.shades[3] << 6);
                n |= n | (this.shades[2] << 4);
                n |= n | (this.shades[1] << 2);
                n |= n | (this.shades[0] << 0);
                return (byte)n;
            }
            set
            {
                this.shades[3] = (byte)((value >> 6) & 0b11);
                this.shades[2] = (byte)((value >> 4) & 0b11);
                this.shades[1] = (byte)((value >> 2) & 0b11);
                this.shades[0] = (byte)((value >> 0) & 0b11);
            }

        }
    }
}
