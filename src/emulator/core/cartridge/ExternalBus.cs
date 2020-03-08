using System;

namespace DMSharp
{
    public class ExternalBus
    {
        public MBC mbc;
        public int romBanks = 0;
        public byte[] rom = new byte[4194304];
        public GameBoy gb;
        public string romTitle = "";

        public ExternalBus(GameBoy gb)
        {
            this.gb = gb;
            this.mbc = new NullMBC(this);
        }

        public byte Read(ushort addr)
        {
            return this.mbc.Read(addr);
        }

        public void Write(ushort addr, byte value)
        {
            this.mbc.Write(addr, value);
        }

        public void ReplaceRom(byte[] rom)
        {
            Console.WriteLine("Replaced ROM");
            Array.Clear(this.rom, 0, this.rom.Length);
            Array.Copy(rom, this.rom, rom.Length);

            this.updateMBC();
            this.gb.Reset();
            var title = new ArraySegment<byte>(rom, 0x134, 0xF);
            var titleDecoded = System.Text.Encoding.UTF8.GetString(title);
            Console.WriteLine("Title: " + titleDecoded);

            this.romTitle = new string(titleDecoded);
        }

        public void saveGameSram()
        {
            var m = this.mbc;
            if (m is MBCWithRAM mram)
            {
                if (mram.externalRamDirtyBytes > 0)
                {
                    Console.WriteLine($"Flushing SRAM: {mram.externalRamDirtyBytes} dirty bytes");
                    // saveSram(this.romTitle, m.externalRam);
                    mram.externalRamDirtyBytes = 0;
                }
            }
        }

        public void updateMBC()
        {
            switch (this.rom[0x147])
            {
                case 0x01:
                case 0x02:
                case 0x03:
                    this.mbc = new MBC1(this);
                    break;
                case 0x05:
                case 0x06:
                    // this.mbc = new MBC2(this);
                    break;
                case 0x0F:
                case 0x10:
                case 0x11:
                case 0x12:
                case 0x13:
                    this.mbc = new MBC3(this);
                    break;
                case 0x19:
                case 0x1A:
                case 0x1B:
                case 0x1C:
                case 0x1D:
                case 0x1E:
                    this.mbc = new MBC5(this);
                    break;
                case 0x20:
                    // this.mbc = new MBC6(this);
                    break;
                case 0x22:
                    // this.mbc = new MBC7(this);
                    break;
                case 0x00:
                case 0x08:
                case 0x09:
                case 0x0B:
                case 0x0C:
                case 0x0D:
                default:
                    this.mbc = new NullMBC(this);
                    break;
            }
            var banks = 0;
            switch (this.rom[0x148])
            {
                case 0x00: banks = 2; break;
                case 0x01: banks = 4; break;
                case 0x02: banks = 8; break;
                case 0x03: banks = 16; break;
                case 0x04: banks = 32; break;
                case 0x05: banks = 64; break;
                case 0x06: banks = 128; break;
                case 0x07: banks = 256; break;
                case 0x08: banks = 512; break;
                case 0x52: banks = 72; break;
                case 0x53: banks = 80; break;
                case 0x54: banks = 96; break;
            }
            this.romBanks = banks;
            Console.WriteLine("Banks: " + banks);
        }
    }
}