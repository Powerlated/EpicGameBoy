import MemoryBus from "../../memory/memorybus";
import MBC, { MBCWithRAM } from "./mbc";
import ExternalBus from "../externalbus";
import { hex } from "../../../tools/util";

export default class MBC5 extends MBCWithRAM implements MBC {
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
        // Banks 00-1FF (Read Only)
        if (addr >= 0x4000 && addr <= 0x7FFF) {
            return this.readBank(addr, this.romBank);
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
            return;
        }
        // Change RAM bank
        if (addr >= 0x4000 && addr <= 0x5FFF) {
            this.ramBank = value & 3;
            return;
        }
        // RAM Bank 00-0F (Read/Write)
        if (addr >= 0xA000 && addr <= 0xBFFF) {
            if (this.enableExternalRam) {
                this.writeBankRam(addr, this.ramBank, value);
            }
            return;
        }
        // Low 8 bits of ROM Bank Number (Write)
        if (addr >= 0x2000 && addr <= 0x2FFF) {
            this.romBank &= 0b100000000; // Zero out low 8 bits
            this.romBank |= value;
            return;
        }
        // High bit of ROM Bank Number (Write);
        if (addr >= 0x3000 && addr <= 0x3FFF) {
            this.romBank &= 0b011111111; // Zero out high bit
            this.romBank |= (value << 8);
            this.romBank &= 0b111111111; // Make sure everything fits
            return;
        }
    }

    reset() {
        this.romBank = 1;
    }
}