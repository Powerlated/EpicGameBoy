class NullMBC implements MBC {

    bus: MemoryBus;

    constructor(bus: MemoryBus) {
        this.bus = bus;
    }

    romBank = 0;

    read(addr: number): number {
        return this.bus.gb.bus.rom[addr];
    }
    write(addr: number, value: number) {
        return;
    }
}