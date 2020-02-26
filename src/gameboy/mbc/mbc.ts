interface MBC {

    ext: ExternalBus;
    romBank: number;

    read(addr: number): number;
    write(addr: number, value: number): void;

    reset(): void;
}

class MBC {
    static bankSize = 16384;
}