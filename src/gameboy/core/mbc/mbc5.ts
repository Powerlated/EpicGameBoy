import MemoryBus from "../memorybus";
import MBC from "./mbc";
import ExternalBus from "../externalbus";
import { hex } from "../../tools/util";

export default class MBC5 extends MBC implements MBC {
    romBank = 1;
    enableRam = false;
    externalRam: Array<number> = new Array(32768).fill(0);
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
            return this.externalRam[addr & 0x1FFF];
        }

        return 0xFF;
    }

    write(addr: number, value: number) {
        // RAM Bank 00-0F (Read/Write)
        if (addr >= 0xA000 && addr <= 0xBFFF) {
            return;
        }
        // Low 8 bits of ROM Bank Number (Write)
        if (addr >= 0x2000 && addr <= 0x2FFF) {
            this.romBank &= 0b100000000; // Zero out low 8 bits
            this.romBank |= value;
        }
        // High bit of ROM Bank Number (Write);
        if (addr >= 0x3000 && addr <= 0x3FFF) {
            this.romBank &= 0b011111111; // Zero out high bit
            this.romBank |= (value << 8);
            this.romBank &= 0b111111111; // Make sure everything fits
        }
    }

    reset() {
        this.romBank = 1;
    }
}