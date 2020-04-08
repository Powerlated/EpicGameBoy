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
    gb: GameBoy;

    ext: ExternalBus;

    workRamBanks = new Array(8).fill(0).map(() => new Uint8Array(4096).fill(0));
    workRamBank = this.workRamBanks[1];
    workRamBankIndex = 1;

    highRam = new Uint8Array(128).fill(0);
    bootrom = new Uint8Array(256).fill(0);

    bootromEnabled = true;
    bootromLoaded = false;

    constructor(gb: GameBoy) {
        this.gb = gb;
        this.ext = new ExternalBus(this.gb);
    }

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

    cheats: Map<number, number> = new Map();

    addCheat(addr: number, value: number) {
        this.cheats.set(addr, value);
    }

    writeMem8(addr: number, value: number) {
        // ROM Write (MBC Control)
        if (addr >= 0x0000 && addr <= 0x7FFF) {
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

        // Write from External RAM through External Bus
        else if (addr >= 0xA000 && addr <= 0xBFFF) {
            this.ext.mbc.write(addr, value);
        }

        // SET Interrupt request flags
        else if (addr === INTERRUPT_REQUEST_FLAGS_ADDR) {
            this.gb.interrupts.requested.numerical = value;
        }

        // Write to High RAM
        else if (addr >= 0xFF80 && addr <= 0xFFFE) {
            this.highRam[addr - 0xFF80] = value;
        }

        // SET Interrupt enable flags
        else if (addr === INTERRUPT_ENABLE_FLAGS_ADDR) {
            this.gb.interrupts.enabled.numerical = value;
        }

        // Write to VRAM
        else if (addr >= VRAM_BEGIN && addr <= VRAM_END) {
            // writeDebug(`[PC 0x${this.cpu.pc.toString(16)}] Wrote to tileset ram 0x${value.toString(16)} @ 0x${addr.toString(16)}`);
            this.gb.gpu.write(addr, value);
        }

        // Write to OAM
        else if (addr >= 0xFE00 && addr <= 0xFE9F) {
            if (this.gb.gpu.lcdStatus.mode == 0 || this.gb.gpu.lcdStatus.mode == 1) {
                this.gb.gpu.oam[addr - 0xFE00] = value;
            }
            writeDebug(`OAM Write: ${hex(value, 2)} @ ${hex(addr, 4)}`);
        }

        // Hardware I/O registers
        else if (addr >= HWIO_BEGIN && addr <= HWIO_END) {
            this.gb.gpu.writeHwio(addr, value);
            this.gb.dma.writeHwio(addr, value);
            this.gb.soundChip.writeHwio(addr, value);
            switch (addr) {
                case 0xFF00: // Joypad write
                    this.gb.joypad.numerical = value;
                    break;
                case 0xFF01:
                    // console.info(`[PC: ${ hex(this.cpu.pc, 4) }, INS: #${ this.cpu.totalI }]SERIAL PORT WRITE: ` + hex(value, 2));
                    this.serialOut.push(value);
                    break;
                case 0xFF04: // Timer divider
                    this.gb.timer.addr_0xFF04 = value;
                    break;
                case 0xFF05: // Timer counter
                    this.gb.timer.addr_0xFF05 = value;
                    break;
                case 0xFF06: // Timer modulo
                    this.gb.timer.addr_0xFF06 = value;
                    break;
                case 0xFF07: // Timer control
                    this.gb.timer.addr_0xFF07 = value;
                    break;
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
                default:
                    return;
            }
        }
    }

    readMem8(addr: number): number {
        if (this.cheats.has(addr)) {
            return this.cheats.get(addr)!;
        }

        else if (this.bootromEnabled && addr < 0x100) {
            return this.bootrom[addr];
        }

        // Read from ROM through External Bus
        else if (addr <= 0x7FFF) {
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

        // Read from External RAM through External Bus
        else if (addr >= 0xA000 && addr <= 0xBFFF) {
            return this.ext.mbc.read(addr);
        }

        // Read from High RAM
        else if (addr >= 0xFF80 && addr <= 0xFFFE) {
            return this.highRam[addr - 0xFF80];
        }

        // Return from VRAM
        else if (addr >= VRAM_BEGIN && addr <= VRAM_END) {
            return this.gb.gpu.read(addr);
        }

        // Read from OAM
        else if (addr >= 0xFE00 && addr <= 0xFE9F) {
            if (this.gb.gpu.lcdStatus.mode == 0 || this.gb.gpu.lcdStatus.mode == 1) {
                return this.gb.gpu.oam[addr - 0xFE00];
            } else {
                return 0xFF;
            }
        }

        // GET Interrupt request flags
        else if (addr === INTERRUPT_REQUEST_FLAGS_ADDR) {
            return this.gb.interrupts.requested.numerical | 0b11100000;
        }
        // GET Interrupt enable flags
        else if (addr === INTERRUPT_ENABLE_FLAGS_ADDR) {
            return this.gb.interrupts.enabled.numerical;
        }

        // Hardware I/O registers
        else if (addr >= HWIO_BEGIN && addr <= HWIO_END) {
            let val;
            val = this.gb.gpu.readHwio(addr);
            if (val != undefined) return val;
            val = this.gb.soundChip.readHwio(addr);
            if (val != undefined) return val;
            val = this.gb.dma.readHwio(addr);
            if (val != undefined) return val;
            switch (addr) {
                case 0xFF00: // Joypad read
                    // writeDebug("Polled joypad")
                    return this.gb.joypad.numerical | 0b11000000;
                case 0xFF01:
                    // console.info(`SERIAL PORT READ`);
                    return 0xFF;
                case 0xFF02:
                    return 0x00;
                case 0xFF04: // Timer divider
                    return this.gb.timer.addr_0xFF04;
                case 0xFF05: // Timer counter
                    return this.gb.timer.addr_0xFF05;
                case 0xFF06: // Timer modulo
                    return this.gb.timer.addr_0xFF06;
                case 0xFF07: // Timer control
                    return this.gb.timer.addr_0xFF07 | 0b11111000;
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
                default:
                    return 0xFF;
            }
        }
        return 0xFF;
    }

    readMem16(addr: number) {
        return this.readMem8(addr) | this.readMem8(addr + 1) << 8;
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