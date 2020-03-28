import MemoryBus from "../memorybus";
import MBC from "./mbc";
import ExternalBus from "../externalbus";

export default class NullMBC extends MBC implements MBC {

    ext: ExternalBus;

    constructor(ext: ExternalBus) {
        super();
        this.ext = ext;
    }

    romBank = 0;

    // Pass reads straight through with no MBC, however, one address line is missing
    read(addr: number): number {
        addr &= 32767;
        return this.ext.romData[0][addr];
    }
    write(addr: number, value: number) {
        return;
    }

    reset() { }
}