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

    calcBankAddr(addr: number, bank: number): number {
        return (bank * MBC.bankSize) + (addr - MBC.bankSize);
    }

    readBank(addr: number, bank: number): number {
        bank %= this.ext.romBanks;
        let calculated = this.calcBankAddr(addr, bank); 
        return this.ext.rom[calculated];
    }
}