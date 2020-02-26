import MemoryBus from "../core/memorybus";

export default interface MBC {

    bus: MemoryBus;
    romBank: number;

    read(addr: number): number;
    write(addr: number, value: number): void;

    reset(): void;
}

export default class MBC {
    static bankSize = 16384;
}