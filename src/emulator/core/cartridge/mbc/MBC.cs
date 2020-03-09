
namespace DMSharp
{
    public abstract class MBC
    {
        public ExternalBus ext;
        public ushort romBank = 0;
        public static int romBankSize = 16384;
        public static int ramBankSize = 8192;

        public int calcBankAddrRom(ushort addr, ushort bank)
        {
            return (bank * MBC.romBankSize) + (addr - 0x4000);
        }

        public byte readBank(ushort addr, ushort bank)
        {
            bank = (byte)(bank % this.ext.romBanks);
            var calculated = this.calcBankAddrRom(addr, bank);
            return this.ext.rom[calculated];
        }

        public abstract void Reset();
        public abstract byte Read(ushort addr);
        public abstract void Write(ushort addr, byte value);
    }

    public abstract class MBCWithRAM : MBC
    {
        public byte ramBank = 0;
        public bool enableExternalRam = false;
        public byte[] externalRam = new byte[32768];
        public int externalRamDirtyBytes = 0;

        public byte readBankRam(ushort addr, byte bank)
        {
            var calculated = this.calcBankAddrRam(addr, bank);
            return this.externalRam[calculated];
        }

        public void writeBankRam(ushort addr, byte value, byte bank)
        {
            var calculated = this.calcBankAddrRam(addr, bank);
            this.externalRam[calculated % 32768] = value;
            this.externalRamDirtyBytes++;
        }

        public int calcBankAddrRam(ushort addr, byte bank)
        {
            return (bank * MBC.ramBankSize) + (addr - 0xA000);
        }
    }
}