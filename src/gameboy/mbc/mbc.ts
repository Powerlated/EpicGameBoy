interface MBC {

    bus: MemoryBus;
    selectedBank: number;

    read(addr: number): number;
    write(addr: number, value: number): void;
}

class MBC {
    static bankSize = (2^14);
}