import MemoryBus from "../memorybus";
import MBC, { MBCWithRAM } from "./mbc";
import { hex } from "../../../src/gameboy/tools/util";
import { Serializer } from "../../serialize";

export default class MBC5 extends MBCWithRAM implements MBC {
    ext: MemoryBus;

    constructor(ext: MemoryBus) {
        super();
        this.ext = ext;
    }


    read(addr: number): number {
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
            this.enableExternalRam = value === 0x0A;
        }
        // Low 8 bits of ROM Bank Number (Write)
        else if (addr >= 0x2000 && addr <= 0x2FFF) {
            this.romBank &= 0b100000000; // Zero out low 8 bits
            this.romBank |= value;

            this.romBank %= this.ext.romBanks;
            this.updateRomOffset();
        }
        // High bit of ROM Bank Number (Write);
        else if (addr >= 0x3000 && addr <= 0x3FFF) {
            this.romBank &= 0b011111111; // Zero out high bit
            this.romBank |= (value << 8);
            this.romBank &= 0b111111111; // Make sure everything fits

            this.romBank %= this.ext.romBanks;
            this.updateRomOffset();
        }
        // Change RAM bank
        else if (addr >= 0x4000 && addr <= 0x5FFF) {
            this.ramBank = value & 0b1111;
        }
        // RAM Bank 00-0F (Read/Write)
        else if (addr >= 0xA000 && addr <= 0xBFFF) {
            if (this.enableExternalRam) {
                this.writeBankRam(addr, this.ramBank, value);
            }
        }
    }

    serialize(state: Serializer) {
        state.PUT_BOOL(this.enableExternalRam);
        state.PUT_32LE(this.externalRamDirtyBytes);
        state.PUT_32LE(this.romBank);
        state.PUT_32LE(this.ramBank);
    }

    deserialize(state: Serializer) {
        this.enableExternalRam = state.GET_BOOL();
        this.externalRamDirtyBytes = state.GET_32LE();
        this.romBank = state.GET_32LE();
        this.ramBank = state.GET_32LE();

        this.updateRomOffset()
    }

    reset() {
        this.romBank = 1;
        this.updateRomOffset();
    }
}