namespace DMSharp
{
    // TODO: Implement RTC features in MBC3
    class MBC3 : MBCWithRAM
    {
        bool selectRtc = false;

        public MBC3(ExternalBus ext)
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
            // Banks 01-7F (Read Only)
            if (addr >= 0x4000 && addr <= 0x7FFF)
            {
                return this.readBank(addr, this.romBank);
            }
            // RAM Bank 00-03
            if (addr >= 0xA000 && addr <= 0xBFFF)
            {
                if (this.enableExternalRam)
                {
                    if (this.ramBank < 0x8)
                    {
                        return this.readBankRam(addr, this.ramBank);
                    }
                    else
                    {
                       /*  let d = new Date();
                        switch (this.ramBank)
                        {
                            case 0x08: // Seconds 0-59
                                return d.getSeconds();
                            case 0x09: // Minutes 0-59
                                return d.getMinutes();
                            case 0x0A: // Hours 0-23
                                return d.getHours();
                            case 0x0B: // Days Lower 8 Bits
                                return 0;
                            case 0x0C: // Days High Bit, RTC Control 
                                return 1;
                        } */
                    }
                }
                return 0xFF;
            }
            return 0xFF;
        }


        public override void Write(ushort addr, byte value)
        {
            if (addr >= 0x0000 && addr <= 0x1FFF)
            {
                this.enableExternalRam = true;
            }
            if (addr >= 0x2000 && addr <= 0x3FFF)
            {
                // MBC3 - Writing 0 will select 1
                if (value == 0)
                {
                    this.romBank = 1;
                }
                else
                {
                    this.romBank = (byte)(value & 0b1111111); // Whole 7 bits
                }
                return;
            }
            if (addr >= 0x4000 && addr <= 0x5FFF)
            {
                this.ramBank = value;
            }
            // RAM Bank 00-0F (Read/Write)
            if (addr >= 0xA000 && addr <= 0xBFFF)
            {
                if (this.enableExternalRam)
                {
                    if (this.ramBank < 0x8)
                    {
                        this.writeBankRam(addr, this.ramBank, value);
                    }
                    else
                    {
                        return;
                    }
                }
                return;
            }
            // 
        }

        public override void Reset()
        {
            this.romBank = 1;
        }
    }
}