namespace DMSharp
{

    class NullMBC : MBC
    {

        public NullMBC(ExternalBus ext)
        {
            this.ext = ext;
        }

        // Pass reads straight through with no MBC, however, one address line is missing
        public override byte Read(ushort addr)
        {
            addr &= 32767;
            return this.ext.rom[addr];
        }
        public override void Write(ushort addr, byte value)
        {
            return;
        }

        public override void Reset() { }
    }
}