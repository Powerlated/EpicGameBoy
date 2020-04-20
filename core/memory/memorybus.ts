import GameBoy from "../gameboy";

import CPU from "../cpu/cpu";

import GPU from "../video/gpu";
import MBC3 from "./mbc/mbc3";
import MBC, { MBCWithRAM } from "./mbc/mbc";
import MBC1 from "./mbc/mbc1";
import NullMBC from "./mbc/nullmbc";
import ExternalBus from "./externalbus";
import { writeDebug } from "../../src/gameboy/tools/debug";
import { hex } from "../../src/gameboy/tools/util";
import InterruptController from "../components/interrupt-controller";
import { JoypadRegister } from "../components/joypad";
import MBC5 from "./mbc/mbc5";

const VRAM_BEGIN = 0x8000;
const VRAM_END = 0x9FFF;

const HWIO_BEGIN = 0xFF00;
const HWIO_END = 0xFF7F;

const INTERRUPT_REQUEST_FLAGS_ADDR = 0xFF0F;
const INTERRUPT_ENABLE_FLAGS_ADDR = 0xFFFF;

class MemoryBus {
    constructor(gb: GameBoy) {
        this.gb = gb;
        this.ext = new ExternalBus(this.gb);
    }

    gb: GameBoy;

    ext: ExternalBus;

    workRamBanks = new Array(8).fill(0).map(() => new Uint8Array(4096).fill(0));
    workRamBank = this.workRamBanks[1];
    workRamBankIndex = 1;

    highRam = new Uint8Array(128).fill(0);
    bootrom = new Uint8Array(256).fill(0);

    bootromEnabled = true;
    bootromLoaded = false;

    loadSave(ram: Uint8Array) {
        console.info("Loaded Save");
        const mbc = this.ext.mbc as MBCWithRAM;
        if (mbc instanceof MBCWithRAM) {
            ram.forEach((v, i) => {
                mbc.externalRam[i] = v;
            });
        }
    }

    serialOut: Array<number> = [];

    private cheats: Array<number | null> = new Array(65536).fill(null);

    addCheat(addr: number, value: number) {
        this.cheats[addr] = value;
    }

    removeCheat(addr: number) {
        this.cheats[addr] = null;
    }

    clearCheats() {
        for (let i = 0; i < this.cheats.length; i++) {
            this.cheats[i] = null;
        }
    }

    read(addr: number): number {
        const cheat = this.cheats[addr];
        if (cheat !== null) {
            return cheat;
        }

        if (this.bootromEnabled === true && addr < 0x100) {
            if (addr >= 0x0000 && addr < 0x100) {
                return this.bootrom[addr];
            } else {
                return 0xFF;
            }
        }

        // Read from ROM through External Bus
        else if (addr < 0x8000) {
            return this.ext.mbc.read(addr);
        }

        // Return from VRAM
        else if (addr >= VRAM_BEGIN && addr <= VRAM_END) {
            return this.gb.gpu.read(addr);
        }

        // Read from External RAM through External Bus
        else if (addr >= 0xA000 && addr <= 0xBFFF) {
            return this.ext.mbc.read(addr);
        }

        // Echo RAM
        if (addr >= 0xE000 && addr <= 0xFDFF) {
            addr -= 8192;
        }

        // Write to Internal RAM 
        if (addr >= 0xC000 && addr <= 0xCFFF) {
            return this.workRamBanks[0][addr - 0xC000];
        } else if (addr >= 0xD000 && addr <= 0xDFFF) {
            return this.workRamBank[addr - 0xD000];
        }

        // Read from OAM
        else if (addr >= 0xFE00 && addr <= 0xFE9F) {
            return this.gb.gpu.readOam(addr);
        }

        // Read from High RAM
        else if (addr >= 0xFF80 && addr <= 0xFFFE) {
            return this.highRam[addr - 0xFF80];
        }

        // GET Interrupt enable flags
        else if (addr === INTERRUPT_ENABLE_FLAGS_ADDR) {
            return this.gb.interrupts.enabled.getNumerical();
        }

        // Hardware I/O registers
        else if (addr >= HWIO_BEGIN && addr <= HWIO_END) {
            switch (addr) {
                case 0xFF4D: // KEY1
                    if (this.gb.cgb) {
                        let bit7 = (this.gb.doubleSpeed ? 1 : 0) << 7;
                        let bit0 = (this.gb.prepareSpeedSwitch ? 1 : 0) << 7;
                        return bit7 | bit0;
                    }
                    break;
                case 0xFF50:
                    return 0xFF;
                case 0xFF70:
                    if (this.gb.cgb) {
                        return this.workRamBankIndex;
                    }
                    return 0xFF;
            }

            if (addr === 0xFF00) {
                return this.gb.joypad.readHwio(addr); // Joypad
            } else if (addr >= 0xFF01 && addr <= 0xFF02) {
                return this.gb.serial.readHwio(addr); // Serial
            } else if (addr >= 0xFF03 && addr <= 0xFF07) {
                return this.gb.timer.readHwio(addr); // Timer
            } else if (addr === INTERRUPT_REQUEST_FLAGS_ADDR) {
                return this.gb.interrupts.requested.numerical; // IF
            } else if (addr >= 0xFF10 && addr <= 0xFF3F) {
                return this.gb.soundChip.readHwio(addr); // Sound Chip
            } else if (addr >= 0xFF40 && addr <= 0xFF4F) {
                return this.gb.gpu.readHwio(addr); // DMG/CGB PPU Registers
            } else if (addr >= 0xFF51 && addr <= 0xFF55) {
                return this.gb.dma.readHwio(addr); // DMA
            } else if (addr >= 0xFF68 && addr <= 0xFF6B) {
                return this.gb.gpu.readHwio(addr); // CGB Palette Data
            }
        }
        return 0xFF;
    }


    write(addr: number, value: number): void {
        // ROM Write (MBC Control)
        if (addr < 0x8000) {
            this.ext.mbc.write(addr, value);
            return;
        }

        // Write to VRAM
        else if (addr >= VRAM_BEGIN && addr <= VRAM_END) {
            // writeDebug(`[PC 0x${this.cpu.pc.toString(16)}] Wrote to tileset ram 0x${value.toString(16)} @ 0x${addr.toString(16)}`);
            this.gb.gpu.write(addr, value);
        }

        // Write from External RAM through External Bus
        else if (addr >= 0xA000 && addr <= 0xBFFF) {
            this.ext.mbc.write(addr, value);
        }

        // Echo RAM
        if (addr >= 0xE000 && addr <= 0xFDFF) {
            addr -= 8192;
        }

        // Write to Internal RAM 
        if (addr >= 0xC000 && addr <= 0xCFFF) {
            this.workRamBanks[0][addr - 0xC000] = value;
        } else if (addr >= 0xD000 && addr <= 0xDFFF) {
            this.workRamBank[addr - 0xD000] = value;
        }

        // Write to High RAM
        else if (addr >= 0xFF80 && addr <= 0xFFFE) {
            this.highRam[addr - 0xFF80] = value;
        }

        // SET Interrupt request flags
        else if (addr === INTERRUPT_REQUEST_FLAGS_ADDR) {
            this.gb.interrupts.requested.setNumerical(value);
        }

        // SET Interrupt enable flags
        else if (addr === INTERRUPT_ENABLE_FLAGS_ADDR) {
            this.gb.interrupts.enabled.setNumerical(value);
        }

        // Write to OAM
        else if (addr >= 0xFE00 && addr <= 0xFE9F) {
            this.gb.gpu.writeOam(addr, value);
            // writeDebug(`OAM Write: ${hex(value, 2)} @ ${hex(addr, 4)}`);
        }

        // Hardware I/O registers
        else if (addr >= HWIO_BEGIN && addr <= HWIO_END) {
            switch (addr) {
                case 0xFF4D: // KEY1
                    if (this.gb.cgb) {
                        this.gb.prepareSpeedSwitch = (value & 1) === 1;
                    }
                    break;
                case 0xFF50:
                    if ((value & 1) === 1) {
                        writeDebug("Disabled bootrom by write to 0xFF50");
                        this.bootromEnabled = false;
                    }
                    break;
                case 0xFF70:
                    if (this.gb.cgb) {
                        if (value === 0) value = 1;
                        this.workRamBank = this.workRamBanks[value & 0b111];
                        this.workRamBankIndex = value & 0b111;
                    }
                    break;
            }

            if (addr === 0xFF00) {
                this.gb.joypad.writeHwio(addr, value);
            } else if (addr >= 0xFF01 && addr <= 0xFF02) {
                this.gb.serial.writeHwio(addr, value);
            } else if (addr >= 0xFF03 && addr <= 0xFF07) {
                this.gb.timer.writeHwio(addr, value);
            } else if (addr === INTERRUPT_REQUEST_FLAGS_ADDR) {
                this.gb.interrupts.requested.setNumerical(value);
            } else if (addr >= 0xFF10 && addr <= 0xFF3F) {
                this.gb.soundChip.writeHwio(addr, value);
            } else if (addr >= 0xFF40 && addr <= 0xFF4F) {
                this.gb.gpu.writeHwio(addr, value);
            } else if (addr >= 0xFF51 && addr <= 0xFF55) {
                this.gb.dma.writeHwio(addr, value);
            } else if (addr >= 0xFF68 && addr <= 0xFF6B) {
                this.gb.gpu.writeHwio(addr, value); // CGB Palette Data
            }
        }
    }

    readMem16(addr: number) {
        return this.read(addr) | this.read(addr + 1) << 8;
    }

    reset() {
        // Re-enable the bootrom
        this.bootromEnabled = true;

        // Zero out memory
        this.workRamBanks.forEach((v, i, a) => {
            v.forEach((v2, i2, a2) => {
                a2[i2] = 0;
            });
        });

        this.highRam.forEach((v, i, a) => {
            a[i] = 0;
        });

        this.ext.mbc.reset();
        this.workRamBank = this.workRamBanks[1];
    }
}

export default MemoryBus;