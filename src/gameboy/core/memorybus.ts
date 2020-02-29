import GameBoy from "../gameboy";

import CPU from "./cpu";

import GPU from "./gpu";
import MBC3 from "./mbc/mbc3";
import MBC from "./mbc/mbc";
import MBC1 from "./mbc/mbc1";
import NullMBC from "./mbc/nullmbc";
import ExternalBus from "./externalbus";
import { writeDebug } from "../tools/debug";
import { hex } from "../tools/util";
import InterruptController from "./components/interrupt-controller";
import { JoypadRegister } from "./components/joypad";
import MBC5 from "./mbc/mbc5";

const VRAM_BEGIN = 0x8000;
const VRAM_END = 0x9FFF;

const HWIO_BEGIN = 0xFF00;
const HWIO_END = 0xFF7F;

const INTERRUPT_REQUEST_FLAGS_ADDR = 0xFF0F;
const INTERRUPT_ENABLE_FLAGS_ADDR = 0xFFFF;

class MemoryBus {
    gb: GameBoy;
    cpu: CPU;
    gpu: GPU;

    ext = new ExternalBus();

    memory = new Uint8Array(0xFFFF + 1).fill(0);
    bootrom = new Uint8Array(0xFF + 1).fill(0);

    interrupts = new InterruptController(this);
    joypad = new JoypadRegister();

    bootromEnabled = true;
    bootromLoaded = false;

    constructor(gb: GameBoy) {
        this.gb = gb;
        this.cpu = gb.cpu;
        this.gpu = gb.gpu;
    }

    updateMBC() {
        switch (this.ext.rom[0x147]) {
            case 0x01: case 0x02: case 0x03:
                this.ext.mbc = new MBC1(this.ext);
                break;
            case 0x05: case 0x06:
                // this.mbc = new MBC2(this);
                break;
            case 0x0F: case 0x10: case 0x11: case 0x12: case 0x13:
                this.ext.mbc = new MBC3(this.ext);
                break;
            case 0x19: case 0x1A: case 0x1B: case 0x1B:
            case 0x1C: case 0x1D: case 0x1E:
                this.ext.mbc = new MBC5(this.ext);
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
                this.ext.mbc = new NullMBC(this.ext);
                break;
        }
        let banks = 0;
        switch (this.ext.rom[0x148]) {
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
        this.ext.romBanks = banks;
        console.log("Banks: " + banks);
        console.log(this.ext.mbc);
    }

    replaceRom(rom: Uint8Array) {
        console.info("Replaced ROM");
        this.ext.rom.forEach((v, i, a) => {
            a[i] = 0;
        })
        rom.forEach((v, i) => {
            this.ext.rom[i] = v;
        });
        this.updateMBC();
        this.gb.reset();
    }

    serialOut: Array<number> = [];

    writeMem(addr: number, value: number) {
        if (value > 255) {
            alert(`
        WriteMem8(0x${value.toString(16)})
        
        PC: 0x${this.gb.cpu.pc.toString(16)}
        Opcode: 0x${this.readMem8(this.gb.cpu.pc).toString(16)}
        Op: ${this.gb.cpu.rgOpcode(this.readMem8(this.gb.cpu.pc)).op.name}

        `);
        }

        // Write to High RAM
        if (addr >= 0xFF80 && addr <= 0xFFFE) {
            this.memory[addr] = value;
        }

        // Write to Echo RAM
        if (addr >= 0xE000 && addr <= 0xFDFF) {
            this.memory[addr - 8192] = value;
        }

        // ROM Write (MBC Control)
        if (addr >= 0x0000 && addr <= 0x7FFF) {
            this.ext.write(addr, value);
        }

        // Sound registers
        if (addr >= 0xFF10 && addr <= 0xFF3F) {
            this.gb.soundChip.write(addr, value);
        }

        // SET Interrupt request flags
        if (addr == INTERRUPT_REQUEST_FLAGS_ADDR) {
            this.interrupts.requestedInterrupts.numerical = value;
        }
        // SET Interrupt enable flags
        if (addr == INTERRUPT_ENABLE_FLAGS_ADDR) {
            this.interrupts.enabledInterrupts.numerical = value;
        }


        // Write to VRAM
        if (addr >= VRAM_BEGIN && addr <= VRAM_END) {
            // writeDebug(`[PC 0x${this.cpu.pc.toString(16)}] Wrote to tileset ram 0x${value.toString(16)} @ 0x${addr.toString(16)}`);

            this.gpu.write(addr - VRAM_BEGIN, value);
            return;
        }

        // Write to OAM
        if (addr >= 0xFE00 && addr <= 0xFE9F) {
            this.gpu.oam[addr - 0xFE00] = value;
            writeDebug(`OAM Write: ${hex(value, 2)} @ ${hex(addr, 4)}`);
        }

        // Hardware I/O registers
        if (addr >= HWIO_BEGIN && addr <= HWIO_END) {
            switch (addr) {
                case 0xFF00: // Joypad write
                    this.joypad.numerical = value;
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
                case 0xFF40: // LCD Control
                    console.info(`LCD CONTROL CHANGE`);
                    this.gpu.lcdControl.numerical = value;
                    break;
                case 0xFF41: // LCDC Status
                    console.info(`LCDC STATUS CHANGE`);
                    this.gpu.lcdStatus.numerical = value;
                    break;
                case 0xFF42:
                    writeDebug("SCROLL Y WRITE: " + value);
                    this.gpu.scrY = value;
                    break;
                case 0xFF43:
                    // writeDebug("SCROLL X WRITE: " + value);
                    this.gpu.scrX = value;
                    break;
                case 0xFF44: break;
                case 0xFF45:
                    writeDebug(`Set Y Compare to: ${value}`);
                    this.gpu.lYCompare = value;
                    break;
                case 0xFF46:
                    this.gpu.oamDma(value << 8);
                    break;
                case 0xFF47: // Palette
                    this.gpu.bgPaletteData.numerical = value;
                    break;
                case 0xFF48: // Palette OBJ 0
                    this.gpu.objPaletteData0.numerical = value;
                    break;
                case 0xFF49: // Palette OBJ 1
                    this.gpu.objPaletteData1.numerical = value;
                    break;
                case 0xFF50:
                    writeDebug("Disabled bootrom by write to 0xFF50");
                    this.bootromEnabled = false;
                    break;
                default:
                    return;
            }
        }

        // Write if outside the boot ROM and ROM area
        if (addr > 0x3FFF) {
            this.memory[addr] = value;
            return;
        }
    }

    readMem8(addr: number): number {
        if (addr < 0x100 && this.bootromEnabled) {
            return this.bootrom[addr];
        }

        // Read from High RAM
        if (addr >= 0xFF80 && addr <= 0xFFFE) {
            return this.memory[addr];
        }

        // Read from Echo RAM
        if (addr >= 0xE000 && addr <= 0xFDFF) {
            return this.memory[addr - 8192];
        }

        // Read from ROM through External Bus
        if (addr >= 0x0000 && addr <= 0x7FFF) {
            return this.ext.read(addr);
        }

        // Return from VRAM
        if (addr >= VRAM_BEGIN && addr <= VRAM_END) {
            return this.gpu.read(addr - VRAM_BEGIN);
        }

        // TODO: Turning this on causes click noises in Pokemon Gold and other games
        // Sound registers
        if (addr >= 0xFF10 && addr <= 0xFF3F) {
            return this.gb.soundChip.read(addr);
        }

        // Read from OAM
        if (addr >= 0xFE00 && addr <= 0xFE9F) {
            return this.gpu.oam[addr - 0xFE00];
        }

        // GET Interrupt request flags
        if (addr == INTERRUPT_REQUEST_FLAGS_ADDR) {
            return this.interrupts.requestedInterrupts.numerical | 0b11100000;
        }
        // GET Interrupt enable flags
        if (addr == INTERRUPT_ENABLE_FLAGS_ADDR) {
            return this.interrupts.enabledInterrupts.numerical | 0b11100000;
        }

        // Hardware I/O registers
        if (addr >= HWIO_BEGIN && addr <= HWIO_END) {
            switch (addr) {
                case 0xFF00: // Joypad read
                    // writeDebug("Polled joypad")
                    return this.joypad.numerical | 0b11000000;
                case 0xFF01:
                    // console.info(`SERIAL PORT READ`);
                    return 0xFF;
                case 0xFF04: // Timer divider
                    return this.gb.timer.addr_0xFF04;
                case 0xFF05: // Timer counter
                    return this.gb.timer.addr_0xFF05;
                case 0xFF06: // Timer modulo
                    return this.gb.timer.addr_0xFF06;
                case 0xFF07: // Timer control
                    return this.gb.timer.addr_0xFF07 | 0b11111000;
                case 0xFF40:
                    // console.info(`LCD CONTROL READ`);
                    return this.gpu.lcdControl.numerical;
                case 0xFF41:
                    // console.info(`LCDC STATUS READ`);
                    return this.gpu.lcdStatus.numerical | 0b10000000;
                case 0xFF42:
                    return this.gpu.scrY;
                case 0xFF43:
                    return this.gpu.scrX;
                case 0xFF44:
                    return this.gpu.lcdcY;
                case 0xFF45:
                    return this.gpu.lYCompare;
                case 0xFF47: // Palette
                    return this.gpu.bgPaletteData.numerical;
                case 0xFF48: // Palette OBJ 0
                    return this.gpu.objPaletteData0.numerical;
                case 0xFF49: // Palette OBJ 1
                    return this.gpu.objPaletteData1.numerical;
                case 0xFF50:
                    return 0xFF;
                default:
                    return 0xFF;
            }
        }
        return this.memory[addr];
    }

    readMem16(addr: number) {
        return this.readMem8(addr) | this.readMem8(addr + 1) << 8;
    }

    reset() {
        // Re-enable the bootrom
        this.bootromEnabled = true;

        // Zero out memory
        this.memory.forEach((v, i, a) => {
            a[i] = 0;
        });

        this.ext.mbc.reset();
    }
}

export default MemoryBus;