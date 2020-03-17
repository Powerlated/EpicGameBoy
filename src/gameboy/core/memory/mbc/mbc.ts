import MemoryBus from "../../memory/memorybus";
import ExternalBus from "../externalbus";
import { hex } from "../../../tools/util";

export default interface MBC {

    ext: ExternalBus;
    romBank: number;

    read(addr: number): number;
    write(addr: number, value: number): void;

    reset(): void;
}


export default class MBC {
    romBank = 0;
    static romBankSize = 16384;
    static ramBankSize = 8192;

    calcBankAddrRom(addr: number, bank: number): number {
        return (bank * MBC.romBankSize) + (addr - 0x4000);
    }

    readBank(addr: number, bank: number): number {
        bank %= this.ext.romBanks;
        const calculated = this.calcBankAddrRom(addr, bank);
        return this.ext.rom[calculated];
    }
}

export class MBCWithRAM extends MBC {
    ramBank = 0;
    enableExternalRam = false;
    externalRam: Uint8Array = new Uint8Array(32768).fill(0xFF);
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
