import MBC from "../mbc/mbc";

import NullMBC from "../mbc/nullmbc";

export default class ExternalBus {
    mbc: MBC;
    rom: Uint8Array = new Uint8Array(4194304).fill(0xFF);

    constructor() {
        this.mbc = new NullMBC(this);
    }

    read(addr: number): number {
        return this.mbc.read(addr);
    }

    write(addr: number, value: number): void {
        this.mbc.write(addr, value);
    }
}