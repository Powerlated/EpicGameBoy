import MBC, { MBCWithRAM } from "./mbc";

import MemoryBus from "../memorybus";
import ExternalBus from "../externalbus";
import { writeDebug } from "../../../src/gameboy/tools/debug";

enum BankingMode {
    ROM = "ROM", RAM = "RAM"
}

export default class MBC1 extends MBCWithRAM implements MBC {
    enableExternalRam = false;

    bankingMode = BankingMode.ROM;

    ext: ExternalBus;

    constructor(ext: ExternalBus) {
        super();
        this.ext = ext;
    }

    read(addr: number): number {
        // RAM Bank 00-03
        if (addr >= 0xA000 && addr <= 0xBFFF) {
            if (this.enableExternalRam) {
                return this.externalRam[this.calcBankAddrRam(addr, this.ramBank)];
            } else {
                return 0xFF;
            }
        }

        return 0x00;
    }

    write(addr: number, value: number) {
        // RAM Enable
        if (addr >= 0x0000 && addr <= 0x1FFF) {
            if ((value & 0xF) === 0x0A) {
                this.enableExternalRam = true;
            } else {
                this.enableExternalRam = false;
            }
        }
        // ROM Bank Number Lower 5 Bits
        else if (addr >= 0x2000 && addr <= 0x3FFF) {
            this.romBank &= 0b11100000; // Erase 5 bits
            this.romBank |= (value & 0b00011111); // Whole 5 bits

            this.romBank %= this.ext.romBanks;
        }
        // RAM Bank Number / Upper Bits of ROM Bank Number
        else if (addr >= 0x4000 && addr <= 0x5FFF) {
            value &= 0b11;
            if (this.bankingMode === BankingMode.RAM) {
                console.log("Set RAM Bank to: " + value);
                this.ramBank = value;
            } else {
                this.romBank &= 0b00011111; // Erase high bits 
                this.romBank |= (value << 5);

                this.romBank %= this.ext.romBanks;
            }
        }
        // RAM Bank 00-03
        else if (addr >= 0xA000 && addr <= 0xBFFF && this.enableExternalRam) {
            this.externalRam[this.calcBankAddrRam(addr, this.ramBank)] = value;
        }

        else if (addr >= 0x6000 && addr <= 0x7FFF) {
            if ((value & 1) !== 0) {
                this.bankingMode = BankingMode.RAM;
            } else {
                this.bankingMode = BankingMode.ROM;
            }
        }
    }

    reset() {
        this.romBank = 1;
        this.ramBank = 0;
        this.enableExternalRam = false;
        this.bankingMode = BankingMode.ROM;
    }
}