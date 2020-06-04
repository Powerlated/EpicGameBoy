import MemoryBus from "../memorybus";
import MBC from "./mbc";
import { Serializer } from "../../serialize";

export default class NullMBC extends MBC implements MBC {

    bus: MemoryBus;

    constructor(bus: MemoryBus) {
        super();
        this.bus = bus;
        this.romBank = 1;
        this.updateRomOffset();
    }

    // Pass reads straight through with no MBC, however, one address line is missing
    read(addr: number): number {
        return 0;
    }
    write(addr: number, value: number) {
        return;
    }

    serialize(state: Serializer) { }

    deserialize(state: Serializer) { }

    reset() { }
}