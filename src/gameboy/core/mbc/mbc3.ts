import MemoryBus from "../memorybus";
import MBC from "./mbc";
import ExternalBus from "../externalbus";

// TODO: Implement RTC features in MBC3
export default class MBC3 extends MBC implements MBC {
    romBank = 1;
    enableRamAndTimer = false;
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
        if (addr >= 0x2000 && addr <= 0x3FFF) {
            // MBC3 - Writing 0 will select 1
            if (value == 0) {
                this.romBank = 1;
                return;
            } else {
                this.romBank = value & 0b1111111; // Whole 7 bits
            }
        }
        if (addr >= 0x0000 && addr <= 0x1FFF) {
            this.enableRamAndTimer = true;
        }
    }

    reset() {
        this.romBank = 1;
    }
}