
namespace DMSharp
{
    class MBC5 : MBCWithRAM
    {
        public MBC5(ExternalBus ext)
        {
            this.ext = ext;
        }

        public override byte Read(ushort addr)
        {
            // Bank 0 (Read Only)
            if (addr >= 0x0000 && addr <= 0x3FFF)
            {
                return this.ext.rom[addr];
            }
            // Banks 00-1FF (Read Only)
            if (addr >= 0x4000 && addr <= 0x7FFF)
            {
                return this.readBank(addr, this.romBank);
            }
            // RAM Bank 00-03
            if (addr >= 0xA000 && addr <= 0xBFFF)
            {
                if (this.enableExternalRam)
                {
                    return this.readBankRam(addr, this.ramBank);
                }
                else
                {
                    return 0xFF;
                }
            }

            return 0xFF;
        }

        public override void Write(ushort addr, byte value)
        {
            // RAM Enable
            if (addr >= 0x0000 && addr <= 0x1FFF)
            {
                if ((value & 0xF) == 0x0A)
                {
                    this.enableExternalRam = true;
                }
                else
                {
                    this.enableExternalRam = false;
                }
                return;
            }
            // Change RAM bank
            if (addr >= 0x4000 && addr <= 0x5FFF)
            {
                this.ramBank = (byte)(value & 3);
                return;
            }
            // RAM Bank 00-0F (Read/Write)
            if (addr >= 0xA000 && addr <= 0xBFFF)
            {
                if (this.enableExternalRam)
                {
                    this.writeBankRam(addr, this.ramBank, value);
                }
                return;
            }
            // Low 8 bits of ROM Bank Number (Write)
            if (addr >= 0x2000 && addr <= 0x2FFF)
            {
                this.romBank &= 0b00000000; // Zero out low 8 bits
                this.romBank |= value;
                return;
            }
            // High bit of ROM Bank Number (Write);
            if (addr >= 0x3000 && addr <= 0x3FFF)
            {
                this.romBank &= 0b011111111; // Zero out high bit
                this.romBank |= (byte)(value << 8);
                this.romBank &= 0b111111111; // Make sure everything fits
                return;
            }
        }

        public override void Reset()
        {
            this.romBank = 1;
        }
    }
}
