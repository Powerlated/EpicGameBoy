import GameBoy from "../gameboy";

import CPU from "../cpu/cpu";

import GPU from "../video/gpu";
import MBC3 from "./mbc/mbc3";
import MBC, { MBCWithRAM } from "./mbc/mbc";
import MBC1 from "./mbc/mbc1";
import NullMBC from "./mbc/nullmbc";
import { writeDebug } from "../../src/gameboy/tools/debug";
import { hex } from "../../src/gameboy/tools/util";
import { JoypadRegister } from "../components/joypad";
import MBC5 from "./mbc/mbc5";
import { Serializer } from "../serialize";
import { saveSram, loadSram } from "../../src/gameboy/localstorage";

const VRAM_BEGIN = 0x8000;
const VRAM_END = 0x9FFF;

const HWIO_BEGIN = 0xFF00;
const HWIO_END = 0xFF7F;

const INTERRUPT_REQUEST_FLAGS_ADDR = 0xFF0F;
const INTERRUPT_ENABLE_FLAGS_ADDR = 0xFFFF;

class MemoryBus {
    constructor(gb: GameBoy) {
        this.gb = gb;
        this.mbc = new NullMBC(this);
    }

    mbc: MBC | MBCWithRAM;
    romBanks = 0;
    romData: Uint8Array[] = [];

    gb: GameBoy;

    romTitle: string = "";

    replaceRom(rom: Uint8Array) {
        console.info("Replaced ROM");
        // Zero out existing ROM
        this.romData = [];
        // Write new ROM in
        rom.forEach((v, i) => {
            const bank = i >> 14;
            const bankAddr = i & 16383;
            if (this.romData[bank] == undefined) {
                this.romData[bank] = new Uint8Array(16384);
            }
            this.romData[bank][bankAddr] = v;
        });
        this.updateMBC();

        const title = this.romData[0].slice(0x134, 0x143);
        const titleDecoded = new TextDecoder("utf-8").decode(title);
        console.log(titleDecoded);

        this.romTitle = titleDecoded;

        this.gb.cgb = (this.romData[0][0x143] & 0x80) !== 0 || this.romData[0][0x143] == 0xC0;
        this.gb.reset();

        const m = this.mbc as MBCWithRAM;
        if (m instanceof MBCWithRAM) {
            const sram = loadSram(this.romTitle);
            if (sram) {
                m.externalRam.forEach((v, i, a) => {
                    a[i] = 0;
                });
                sram.forEach((v: number, i: number) => {
                    m.externalRam[i] = v;
                });
                console.log(`Loaded SRAM for "${this.romTitle}"`);
            } else {
                console.log("Did not find save, not loading SRAM.");
            }
        }
    }

    saveGameSram() {
        const m = this.mbc as MBCWithRAM;
        if (m instanceof MBCWithRAM && m.externalRamDirtyBytes > 0) {
            console.log(`Flushing SRAM: ${m.externalRamDirtyBytes} dirty bytes`);
            saveSram(this.romTitle, m.externalRam);
            m.externalRamDirtyBytes = 0;
        }
    }

    updateMBC() {
        switch (this.romData[0][0x147]) {
            case 0x01: case 0x02: case 0x03:
                this.mbc = new MBC1(this);
                break;
            case 0x05: case 0x06:
                // this.mbc = new MBC2(this);
                break;
            case 0x0F: case 0x10: case 0x11: case 0x12: case 0x13:
                this.mbc = new MBC3(this);
                break;
            case 0x19: case 0x1A: case 0x1B: case 0x1B:
            case 0x1C: case 0x1D: case 0x1E:
                this.mbc = new MBC5(this);
                break;
            case 0x20:
                // this.mbc = new MBC6(this);
                break;
            case 0x22:
                // this.mbc = new MBC7(this);
                break;
            case 0x00: case 0x08:
            case 0x09: case 0x0B:
            case 0x0C: case 0x0D:
            default:
                this.mbc = new NullMBC(this);
                break;
        }
        let banks = 0;
        switch (this.romData[0][0x148]) {
            case 0x00: banks = 2; break;
            case 0x01: banks = 4; break;
            case 0x02: banks = 8; break;
            case 0x03: banks = 16; break;
            case 0x04: banks = 32; break;
            case 0x05: banks = 64; break;
            case 0x06: banks = 128; break;
            case 0x07: banks = 256; break;
            case 0x08: banks = 512; break;
            case 0x52: banks = 72; break;
            case 0x53: banks = 80; break;
            case 0x54: banks = 96; break;
        }

        if (this.mbc instanceof MBC5 && banks == 2) {
            banks = 512;
        }

        this.romBanks = banks;


        console.log("Banks: " + banks);
        console.log(this.mbc);
    }

    workRamBanks = new Array(8).fill(0).map(() => new Uint8Array(4096).fill(0));
    workRamBankIndex = 1;
    highRam = new Uint8Array(128).fill(0);
    bootrom = new Uint8Array(256).fill(0);
    bootromEnabled = true;
    bootromLoaded = false;

    loadSave(ram: Uint8Array) {
        console.info("Loaded Save");
        const mbc = this.mbc as MBCWithRAM;
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

    private readFunc = [
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

    private readRom0br(addr: number): number {
        if (this.bootromEnabled === true && addr < 0x100) {
            if (addr >= 0x0000 && addr < 0x100) {
                return this.bootrom[addr];
            } else {
                return 0xFF;
            }
        }

        return this.romData[0][addr];
    }

    private readRom0(addr: number): number {
        return this.romData[0][addr];
    }

    private readRomX(addr: number): number {
        return this.romData[this.mbc.romBank][addr & 0x3FFF];
    }

    private readVram(addr: number): number {
        return this.gb.gpu.read(addr);
    }

    private readCartRam(addr: number): number {
        return this.mbc.read(addr);
    }

    private readRam0(addr: number): number {
        return this.workRamBanks[0][addr & 0xFFF];
    }

    private readRamX(addr: number): number {
        return this.workRamBanks[this.workRamBankIndex][addr & 0xFFF];
    }

    private readHigh(addr: number): number {
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
            return this.gb.cpu.ie.getNumerical();
        }

        // Hardware I/O registers
        else if (addr >= HWIO_BEGIN && addr <= HWIO_END) {
            switch (addr) {
                case 0xFF4D: // KEY1
                    if (this.gb.cgb) {
                        const bit7 = (this.gb.doubleSpeedShift ? 1 : 0) << 7;
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
                return this.gb.cpu.if.numerical; // IF
            } else if (addr >= 0xFF10 && addr <= 0xFF3F) {
                return this.gb.soundChip.readHwio(addr); // Sound Chip
            } else if (addr >= 0xFF40 && addr <= 0xFF4F) {
                return this.gb.gpu.readHwio(addr); // DMG/CGB PPU Registers
            } else if (addr >= 0xFF51 && addr <= 0xFF55) {
                return this.gb.dma.readHwio(addr); // DMA
            } else if (addr >= 0xFF68 && addr <= 0xFF6B) {
                return this.gb.gpu.readHwio(addr); // CGB Palette Data
            } else if (addr === 0xFF6C) {
                return this.gb.gpu.readHwio(addr); // FF6C undocumented
            }
        }
        return 0xFF;
    }

    read(addr: number): number {
        addr &= 0xFFFF;

        const cheat = this.cheats[addr];
        if (cheat !== null) {
            return cheat;
        }

        return this.readFunc[addr >> 12](addr);
    }

    private writeFunc = [
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


    private writeMbc(addr: number, value: number): void {
        this.mbc.write(addr, value);
    }

    private writeVram(addr: number, value: number): void {
        this.gb.gpu.write(addr, value);
    }

    private writeCartRam(addr: number, value: number): void {
        this.mbc.write(addr, value);
    }

    private writeRam0(addr: number, value: number): void {
        this.workRamBanks[0][addr & 0xFFF] = value;
    }

    private writeRamX(addr: number, value: number): void {
        this.workRamBanks[this.workRamBankIndex][addr & 0xFFF] = value;
    }

    private writeHigh(addr: number, value: number): void {
        if (addr >= 0xF000 && addr <= 0xFDFF) {
            this.writeRamX(addr, value);
        }

        // Write to High RAM
        else if (addr >= 0xFF80 && addr <= 0xFFFE) {
            this.highRam[addr - 0xFF80] = value;
        }

        // SET Interrupt request flags
        else if (addr === INTERRUPT_REQUEST_FLAGS_ADDR) {
            this.gb.cpu.if.setNumerical(value);
        }

        // SET Interrupt enable flags
        else if (addr === INTERRUPT_ENABLE_FLAGS_ADDR) {
            this.gb.cpu.ie.setNumerical(value);
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
                this.gb.cpu.if.setNumerical(value);
            } else if (addr >= 0xFF10 && addr <= 0xFF3F) {
                this.gb.soundChip.writeHwio(addr, value);
            } else if (addr >= 0xFF40 && addr <= 0xFF4F) {
                this.gb.gpu.writeHwio(addr, value);
            } else if (addr >= 0xFF51 && addr <= 0xFF55) {
                this.gb.dma.writeHwio(addr, value);
            } else if (addr >= 0xFF68 && addr <= 0xFF6B) {
                this.gb.gpu.writeHwio(addr, value); // CGB Palette Data
            } else if (addr === 0xFF6C) {
                this.gb.gpu.writeHwio(addr, value); // FF6C undocumented
            }
        }
    }

    write(addr: number, value: number): void {
        addr &= 0xFFFF;
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

        this.mbc.reset();
        this.workRamBankIndex = 1;
    }

    serialize(state: Serializer) {
        if (this.gb.cgb) {
            for (let i = 0; i < 8; i++) {
                state.PUT_8ARRAY(this.workRamBanks[i], 4096);
            }
        } else {
            state.PUT_8ARRAY(this.workRamBanks[0], 4096);
            state.PUT_8ARRAY(this.workRamBanks[1], 4096);
        }

        state.PUT_8(this.workRamBankIndex);
        state.PUT_8ARRAY(this.highRam, 128);
        state.PUT_8ARRAY(this.bootrom, 256);
        state.PUT_BOOL(this.bootromEnabled);
        state.PUT_BOOL(this.bootromLoaded);

        this.mbc.serialize(state);
    }

    deserialize(state: Serializer) {
        if (this.gb.cgb) {
            for (let i = 0; i < 8; i++) {
                this.workRamBanks[i] = state.GET_8ARRAY(4096);
            }
        } else {
            this.workRamBanks[0] = state.GET_8ARRAY(4096);
            this.workRamBanks[1] = state.GET_8ARRAY(4096);
        }

        this.workRamBankIndex = state.GET_8();
        this.highRam = state.GET_8ARRAY(128);
        this.bootrom = state.GET_8ARRAY(256);
        this.bootromEnabled = state.GET_BOOL();
        this.bootromLoaded = state.GET_BOOL();

        this.mbc.deserialize(state);
    }
}

export default MemoryBus;