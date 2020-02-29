import MemoryBus from "../memorybus";
import ExternalBus from "../externalbus";

export default interface MBC {

    ext: ExternalBus;
    romBank: number;

    read(addr: number): number;
    write(addr: number, value: number): void;

    reset(): void;
}

export default class MBC {
    static bankSize = 16384;
}