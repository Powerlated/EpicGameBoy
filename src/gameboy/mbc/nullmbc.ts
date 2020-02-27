import MemoryBus from "../core/memorybus";
import MBC from "./mbc";
import ExternalBus from "../core/externalbus";

export default class NullMBC implements MBC {

    ext: ExternalBus;

    constructor(ext: ExternalBus) {
        this.ext = ext;
    }

    romBank: number = 0;

    // Pass reads straight through with no MBC, however, one address line is missing
    read(addr: number): number {
        addr &= 32767;
        return this.ext.rom[addr];
    }
    write(addr: number, value: number): void {
        return;
    }

    reset(): void { }
}