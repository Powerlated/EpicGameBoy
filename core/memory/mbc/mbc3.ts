import MemoryBus from "../memorybus";
import MBC, { MBCWithRAM } from "./mbc";
import { Serializer } from "../../serialize";

export default class MBC3 extends MBCWithRAM implements MBC {
    selectRtc = false;
    bus: MemoryBus;

    constructor(bus: MemoryBus) {
        super();
        this.bus = bus;
    }

    read(addr: number): number {
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
            this.enableExternalRam = (value & 0xF) === 0xA;
        }
        else if (addr >= 0x2000 && addr <= 0x3FFF) {
            // MBC3 - Writing 0 will select 1
            if (value === 0) {
                this.romBank = 1;
            } else {
                this.romBank = value & 0b11111111; // Whole byte
            }
            this.romBank %= this.bus.romBanks;
            this.updateRomOffset();
            return;
        }
        else if (addr >= 0x4000 && addr <= 0x5FFF) {
            this.ramBank = value;
        }
        // RAM Bank 00-0F (Read/Write)
        else if (addr >= 0xA000 && addr <= 0xBFFF) {
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
        this.updateRomOffset();
    }

    serialize(state: Serializer) {
        state.PUT_BOOL(this.enableExternalRam);
        state.PUT_32LE(this.externalRamDirtyBytes);
        state.PUT_32LE(this.romBank);
        state.PUT_32LE(this.ramBank);

        state.PUT_BOOL(this.selectRtc);
    }

    deserialize(state: Serializer) {
        this.enableExternalRam = state.GET_BOOL();
        this.externalRamDirtyBytes = state.GET_32LE();
        this.romBank = state.GET_32LE();
        this.ramBank = state.GET_32LE();

        this.selectRtc = state.GET_BOOL();
    
        this.updateRomOffset();
    }
}