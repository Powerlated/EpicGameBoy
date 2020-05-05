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

    readFunc = [
        this.readRom0br.bind(this), // ROM0 - 0###
        this.readRom0.bind(this), // ROM0 - 1###
        this.readRom0.bind(this), // ROM0 - 2###
        this.readRom0.bind(this), // ROM0 - 3###
        this.readRomX.bind(this), // ROMX - 4###
        this.readRomX.bind(this), // ROMX - 5###
        this.readRomX.bind(this), // ROMX - 6###
        this.readRomX.bind(this), // ROMX - 7###
        this.readVram.bind(this), // VRAM - 8###
        this.readVram.bind(this), // VRAM - 9###
        this.readCartRam.bind(this), // Cart RAM - A###
        this.readCartRam.bind(this), // Cart RAM - B###
        this.readRam0.bind(this), // RAM0 - C###
        this.readRamX.bind(this), // RAMX - D###
        this.readRam0.bind(this), // Echo RAM0 - E###
        this.readHigh.bind(this), // High Area - F###
    ];

    readRom0br(addr: number): number {
        if (this.bootromEnabled === true && addr < 0x100) {
            if (addr >= 0x0000 && addr < 0x100) {
                return this.bootrom[addr];
            } else {
                return 0xFF;
            }
        }

        return this.ext.romData[0][addr];
    }

    readRom0(addr: number): number {
        return this.ext.romData[0][addr];
    }

    readRomX(addr: number): number {
        return this.ext.romData[this.ext.mbc.romBank][addr & 0x3FFF];
    }

    readVram(addr: number): number {
        return this.gb.gpu.read(addr);
    }

    readCartRam(addr: number): number {
        return this.ext.mbc.read(addr);
    }

    readRam0(addr: number): number {
        return this.workRamBanks[0][addr & 0xFFF];
    }

    readRamX(addr: number): number {
        return this.workRamBank[addr & 0xFFF];
    }

    readHigh(addr: number): number {
        if (addr >= 0xF000 && addr <= 0xFDFF) {
            return this.readRamX(addr);
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
                        const bit7 = (this.gb.doubleSpeed ? 1 : 0) << 7;
                        const bit0 = (this.gb.prepareSpeedSwitch ? 1 : 0);
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

    read(addr: number): number {
        const cheat = this.cheats[addr];
        if (cheat !== null) {
            return cheat;
        }

        return this.readFunc[addr >> 12](addr);
    }



    writeFunc = [
        this.writeMbc.bind(this), // ROM0 - 0###
        this.writeMbc.bind(this), // ROM0 - 1###
        this.writeMbc.bind(this), // ROM0 - 2###
        this.writeMbc.bind(this), // ROM0 - 3###
        this.writeMbc.bind(this), // ROMX - 4###
        this.writeMbc.bind(this), // ROMX - 5###
        this.writeMbc.bind(this), // ROMX - 6###
        this.writeMbc.bind(this), // ROMX - 7###
        this.writeVram.bind(this), // VRAM - 8###
        this.writeVram.bind(this), // VRAM - 9###
        this.writeCartRam.bind(this), // Cart RAM - A###
        this.writeCartRam.bind(this), // Cart RAM - B###
        this.writeRam0.bind(this), // RAM0 - C###
        this.writeRamX.bind(this), // RAMX - D###
        this.writeRam0.bind(this), // Echo RAM0 - E###
        this.writeHigh.bind(this), // High Area - F###
    ];


    writeMbc(addr: number, value: number): void {
        this.ext.mbc.write(addr, value);
    }

    writeVram(addr: number, value: number): void {
        this.gb.gpu.write(addr, value);
    }

    writeCartRam(addr: number, value: number): void {
        this.ext.mbc.write(addr, value);
    }

    writeRam0(addr: number, value: number): void {
        this.workRamBanks[0][addr & 0xFFF] = value;
    }

    writeRamX(addr: number, value: number): void {
        this.workRamBank[addr & 0xFFF] = value;
    }

    writeHigh(addr: number, value: number): void {
        if (addr >= 0xF000 && addr <= 0xFDFF) {
            this.writeRamX(addr, value);
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

    write(addr: number, value: number): void {
        this.writeFunc[addr >> 12](addr, value);
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