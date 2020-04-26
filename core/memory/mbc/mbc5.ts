import MemoryBus from "../memorybus";
import MBC, { MBCWithRAM } from "./mbc";
import ExternalBus from "../externalbus";
import { hex } from "../../../src/gameboy/tools/util";

export default class MBC5 extends MBCWithRAM implements MBC {
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
        // Banks 00-1FF (Read Only)
        if (addr >= 0x4000 && addr <= 0x7FFF) {
            return this.ext.romData[this.romBank][addr & 16383];
        }
        // RAM Bank 00-03
        if (addr >= 0xA000 && addr <= 0xBFFF) {
            if (this.enableExternalRam) {
                return this.readBankRam(addr, this.ramBank);
            } else {
                return 0xFF;
            }
        }

        return 0xFF;
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
        // Change RAM bank
        else if (addr >= 0x4000 && addr <= 0x5FFF) {
            this.ramBank = value & 3;
        }
        // RAM Bank 00-0F (Read/Write)
        else if (addr >= 0xA000 && addr <= 0xBFFF) {
            if (this.enableExternalRam) {
                this.writeBankRam(addr, this.ramBank, value);
            }
        }
        // Low 8 bits of ROM Bank Number (Write)
        else if (addr >= 0x2000 && addr <= 0x2FFF) {
            this.romBank &= 0b100000000; // Zero out low 8 bits
            this.romBank |= value;

            this.romBank %= this.ext.romBanks;
        }
        // High bit of ROM Bank Number (Write);
        else if (addr >= 0x3000 && addr <= 0x3FFF) {
            this.romBank &= 0b011111111; // Zero out high bit
            this.romBank |= (value << 8);
            this.romBank &= 0b111111111; // Make sure everything fits

            this.romBank %= this.ext.romBanks;
        }
    }

    reset() {
        this.romBank = 1;
    }
}