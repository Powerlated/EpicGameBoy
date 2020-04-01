import MemoryBus from "../memorybus";
import MBC, { MBCWithRAM } from "./mbc";
import ExternalBus from "../externalbus";

// TODO: Implement RTC features in MBC3
export default class MBC3 extends MBCWithRAM implements MBC {
    selectRtc = false;
    ext: ExternalBus;

    constructor(ext: ExternalBus) {
        super();
        this.ext = ext;
    }

    read(addr: number): number {
        // Bank 0 (Read Only)
        if (addr >= 0x0000 && addr <= 0x3FFF) {
            return this.ext.romData[0][addr];
        }
        // Banks 01-7F (Read Only)
        if (addr >= 0x4000 && addr <= 0x7FFF) {
            return this.ext.romData[this.romBank % this.ext.romBanks][addr & 16383];
        }
        // RAM Bank 00-03
        if (addr >= 0xA000 && addr <= 0xBFFF) {
            if (this.enableExternalRam) {
                if (this.ramBank < 0x8) {
                    return this.readBankRam(addr, this.ramBank);
                } else {
                    const d = new Date();
                    switch (this.ramBank) {
                        case 0x08: // Seconds 0-59
                            return d.getSeconds();
                        case 0x09: // Minutes 0-59
                            return d.getMinutes();
                        case 0x0A: // Hours 0-23
                            return d.getHours();
                        case 0x0B: // Days Lower 8 Bits
                            return 0;
                        case 0x0C: // Days High Bit, RTC Control 
                            return 1;
                    }
                }
            }
            return 0xFF;
        }
        return 0xFF;
    }

    write(addr: number, value: number) {
        if (addr >= 0x0000 && addr <= 0x1FFF) {
            this.enableExternalRam = true;
        }
        if (addr >= 0x2000 && addr <= 0x3FFF) {
            // MBC3 - Writing 0 will select 1
            if (value === 0) {
                this.romBank = 1;
            } else {
                this.romBank = value & 0b1111111; // Whole 7 bits
            }
            return;
        }
        if (addr >= 0x4000 && addr <= 0x5FFF) {
            this.ramBank = value;
        }
        // RAM Bank 00-0F (Read/Write)
        if (addr >= 0xA000 && addr <= 0xBFFF) {
            if (this.enableExternalRam) {
                if (this.ramBank < 0x8) {
                    this.writeBankRam(addr, this.ramBank, value);
                } else {
                    return;
                }
            }
            return;
        }
        // 
    }

    reset() {
        this.romBank = 1;
    }
}