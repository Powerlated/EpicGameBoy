import MemoryBus from "../memorybus";
import { hex } from "../../../src/gameboy/tools/util";
import { Serializer } from "../../serialize";

export default interface MBC {
    bus: MemoryBus;

    read(addr: number): number;
    write(addr: number, value: number): void;

    serialize(state: Serializer): void;
    deserialize(state: Serializer): void;

    reset(): void;
}


export default class MBC {
    romBank = 0;
    romOffset = 0;

    static romBankSize = 16384;
    static ramBankSize = 8192;

    updateRomOffset() {
        this.romOffset = this.romBank * 0x4000;
    }
} 

export class MBCWithRAM extends MBC {
    ramBank = 0;
    enableExternalRam = false;
    externalRam: Uint8Array = new Uint8Array(131072).fill(0xFF);
    externalRamDirtyBytes = 0;

    readBankRam(addr: number, bank: number): number {
        const calculated = this.calcBankAddrRam(addr, bank);
        return this.externalRam[calculated];
    }

    writeBankRam(addr: number, bank: number, value: number) {
        const calculated = this.calcBankAddrRam(addr, bank);
        this.externalRam[calculated] = value;
        this.externalRamDirtyBytes++;
    }

    calcBankAddrRam(addr: number, bank: number): number {
        return (bank * MBC.ramBankSize) + (addr - 0xA000);
    }
}
