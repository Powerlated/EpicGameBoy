import GameBoy from "../gameboy";

import CPU from "./cpu";

import GPU from "./gpu";
import MBC3 from "./mbc/mbc3";
import MBC, { MBCWithRAM } from "./mbc/mbc";
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

    ext: ExternalBus;

    memory = new Uint8Array(65536).fill(0);
    bootrom = new Uint8Array(256).fill(0);

    interrupts = new InterruptController(this);
    joypad = new JoypadRegister();

    bootromEnabled = true;
    bootromLoaded = false;

    constructor(gb: GameBoy) {
        this.gb = gb;
        this.cpu = gb.cpu;
        this.gpu = gb.gpu;
        this.ext = new ExternalBus(this.gb);
    }

    loadSave(ram: Uint8Array) {
        console.info("Loaded Save");
        let mbc = this.ext.mbc as MBCWithRAM;
        if (mbc instanceof MBCWithRAM) {
            ram.forEach((v, i) => {
                mbc.externalRam[i] = v;
            });
        }
    }

    serialOut: Array<number> = [];

    writeMem8(addr: number, value: number) {
        if (value > 255) {
            alert(`
        WriteMem8(0x${value.toString(16)})
        
        PC: 0x${this.gb.cpu.pc.toString(16)}
        Opcode: 0x${this.readMem8(this.gb.cpu.pc).toString(16)}
        Op: ${this.gb.cpu.rgOpcode(this.readMem8(this.gb.cpu.pc)).op.name}

        `);
        }

        // ROM Write (MBC Control)
        if (addr >= 0x0000 && addr <= 0x7FFF) {
            this.ext.write(addr, value);
        }

        // Write to Internal RAM 
        if (addr >= 0xC000 && addr <= 0xDFFF) {
            this.memory[addr] = value;
        }

        // Write to Echo RAM
        if (addr >= 0xE000 && addr <= 0xFDFF) {
            this.memory[addr - 8192] = value;
        }

        // Write from External RAM through External Bus
        if (addr >= 0xA000 && addr <= 0xBFFF) {
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


        // Write to High RAM
        if (addr >= 0xFF80 && addr <= 0xFFFE) {
            this.memory[addr] = value;
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
                    writeDebug(`LCD CONTROL CHANGE`);
                    this.gpu.lcdControl.numerical = value;
                    break;
                case 0xFF41: // LCDC Status
                    writeDebug(`LCDC STATUS CHANGE`);
                    this.gpu.lcdStatus.numerical = value;
                    break;
                case 0xFF42:
                    this.gpu.scrY = value;
                    break;
                case 0xFF43:
                    this.gpu.scrX = value;
                    break;
                case 0xFF44: break;
                case 0xFF45:
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
                case 0xFF4A: // Window Y Position
                    this.gpu.windowYpos = value;
                    break;
                case 0xFF4B: // Window X Position
                    this.gpu.windowXpos = value;
                    break;
                case 0xFF50:
                    writeDebug("Disabled bootrom by write to 0xFF50");
                    this.bootromEnabled = false;
                    break;
                default:
                    return;
            }
        }
    }

    cheats: Map<number, number> = new Map();

    addCheat(addr: number, value: number) {
        this.cheats.set(addr, value);
    }

    readMem8(addr: number): number {
        if (this.cheats.has(addr)) {
            return this.cheats.get(addr)!;
        }

        if (addr < 0x100 && this.bootromEnabled) {
            return this.bootrom[addr];
        }

        // Read from ROM through External Bus
        if (addr >= 0x0000 && addr <= 0x7FFF) {
            return this.ext.read(addr);
        }

        // Read from Internal RAM 
        if (addr >= 0xC000 && addr <= 0xDFFF) {
            return this.memory[addr];
        }

        // Read from Echo RAM
        if (addr >= 0xE000 && addr <= 0xFDFF) {
            return this.memory[addr - 8192];
        }

        // Read from External RAM through External Bus
        if (addr >= 0xA000 && addr <= 0xBFFF) {
            return this.ext.read(addr);
        }

        // Read from High RAM
        if (addr >= 0xFF80 && addr <= 0xFFFE) {
            return this.memory[addr];
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
                case 0xFF4A: // Window Y Position
                    return this.gpu.windowYpos;
                case 0xFF4B: // Window X Position
                    return this.gpu.windowXpos;
                case 0xFF50:
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
        this.memory.forEach((v, i, a) => {
            a[i] = 0;
        });

        this.ext.mbc.reset();
    }
}

export default MemoryBus;