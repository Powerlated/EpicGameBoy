class NullMBC implements MBC {
    gb: GameBoy;

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    selectedBank = 0;

    read(addr: number): number {
        return this.gb.bus.rom[addr];
    }
    write(addr: number, value: number) {
        return;
    }
}