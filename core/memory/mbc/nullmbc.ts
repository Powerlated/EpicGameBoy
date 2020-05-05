import MemoryBus from "../memorybus";
import MBC from "./mbc";
import ExternalBus from "../externalbus";

export default class NullMBC extends MBC implements MBC {

    ext: ExternalBus;

    constructor(ext: ExternalBus) {
        super();
        this.ext = ext;
    }

    // Keep this 1 so MemoryBus will read ROM 0x4### correctly
    romBank = 1;

    // Pass reads straight through with no MBC, however, one address line is missing
    read(addr: number): number {
        return 0;
    }
    write(addr: number, value: number) {
        return;
    }

    reset() { }
}