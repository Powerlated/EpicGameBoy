import MBC, { MBCWithRAM } from "./mbc";

import MemoryBus from "../../memory/memorybus";
import ExternalBus from "../externalbus";
import { writeDebug } from "../../../tools/debug";

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
        // Bank 0 (Read Only)
        if (addr >= 0x0000 && addr <= 0x3FFF) {
            return this.ext.rom[addr];
        }
        // Banks 01-7F (Read Only)
        if (addr >= 0x4000 && addr <= 0x7FFF) {
            return this.readBank(addr, this.romBank);
        }
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
            return;
        }
        // ROM Bank Number Lower 5 Bits
        if (addr >= 0x2000 && addr <= 0x3FFF) {
            this.romBank &= 0b11100000; // Erase 5 bits
            this.romBank |= (value & 0b00011111); // Whole 5 bits

            if (this.romBank === 0) {
                this.romBank = 1;
            }

            return;
        }
        // RAM Bank Number / Upper Bits of ROM Bank Number
        if (addr >= 0x4000 && addr <= 0x5FFF) {
            value &= 0b11;
            if (this.bankingMode === BankingMode.RAM) {
                console.log("Set RAM Bank to: " + value);
                this.ramBank = value;
            } else {
                this.romBank &= 0b00011111; // Erase high bits 
                this.romBank |= (value << 5);
            }

            return;
        }
        // RAM Bank 00-03
        if (addr >= 0xA000 && addr <= 0xBFFF && this.enableExternalRam) {
            this.externalRam[this.calcBankAddrRam(addr, this.ramBank)] = value;
            return;
        }

        if (addr >= 0x6000 && addr <= 0x7FFF) {
            if ((value & 1) !== 0) {
                this.bankingMode = BankingMode.RAM;
            } else {
                this.bankingMode = BankingMode.ROM;
            }
            return;
        }
    }

    reset() {
        this.romBank = 1;
        this.ramBank = 0;
        this.enableExternalRam = false;
        this.externalRam = this.externalRam.map(() => { return 0; }); // Zero out external RAM
        this.bankingMode = BankingMode.ROM;
    }
}