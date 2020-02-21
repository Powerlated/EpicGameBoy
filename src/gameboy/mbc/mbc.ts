interface MBC {

    bus: MemoryBus;
    romBank: number;

    read(addr: number): number;
    write(addr: number, value: number): void;
}

class MBC {
    static bankSize = 16384;
}