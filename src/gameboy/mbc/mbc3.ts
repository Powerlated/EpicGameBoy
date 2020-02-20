class MBC3 implements MBC {

    enableRamAndTimer = false;

    gb: GameBoy;

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    selectedBank = 1;

    rom = this.gb.bus.rom;
    
    read(addr: number): number {
        // Bank 0 (Read Only)
        if (addr >= 0x0000 && addr <= 0x3FFF) {
            return this.rom[addr];
        }
        // Banks 01-7F (Read Only)
        if (addr >= 0x4000 && addr <= 0x7FFF) {
            return this.rom[addr + (16834 * this.selectedBank)];
        }
        // RAM Bank 00-03
        if (addr >= 0xA000 && addr <= 0xBFFF) {

        }

        return 0xFF;
    }

    write(addr: number, value: number) {
        if (addr >= 0x2000 && addr <= 0x3FFF) {
            // MBC3 - Writing 0 will select 1
            if (value == 0) {
                this.selectedBank = 1;
                return;
            } else {
                this.selectedBank = value & 0b1111111; // Whole 7 bits
            }
        }
        if (addr >= 0x0000 && addr <= 0x1FFF) {
            this.enableRamAndTimer = true;
        }
    }
}