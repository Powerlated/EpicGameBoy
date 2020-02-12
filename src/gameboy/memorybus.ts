const VRAM_BEGIN = 0x8000;
const VRAM_END = 0x9FFF;

const HWIO_BEGIN = 0xFF00;
const HWIO_END = 0xFF7F;

class MemoryBus {
    cpu: CPU;
    gpu: GPU;

    memory = new Uint8Array(0xFFFF + 1).fill(0);
    bootrom = new Uint8Array(0xFF + 1).fill(0);

    constructor() {
    }

    writeMem(addr: number, value: number) {
        if (value > 255) {
            alert(`
        WriteMem8(0x${value.toString(16)})
        
        PC: 0x${this.cpu.pc.toString(16)}
        Opcode: 0x${this.readMem8(this.cpu.pc).toString(16)}
        Op: ${this.cpu.rgOpcode(this.readMem8(this.cpu.pc)).op.name}

        `);
        }

        // Write to VRAM
        if (addr >= VRAM_BEGIN && addr <= VRAM_END) {
            // console.log(`[PC 0x${this.cpu.pc.toString(16)}] Wrote to tileset ram 0x${value.toString(16)} @ 0x${addr.toString(16)}`);

            this.gpu.write(addr - VRAM_BEGIN, value);
            return;
        }

        // Hardware I/O registers
        if (addr >= HWIO_BEGIN && addr <= HWIO_END) {
            switch (addr) {
                case 0xFF01:
                    console.info(`SERIAL PORT WRITE: ` + value);
                case 0xFF40:
                    console.info(`LCD CONTROL CHANGE`);
                case 0xFF41:
                    console.info(`LCDC STATUS CHANGE`);
                case 0xFF42:
                    this.gpu.scrollY = value;
                case 0xFF43:
                    this.gpu.scrollX = value;
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
        // Return from VRAM
        if (addr >= VRAM_BEGIN && addr <= VRAM_END) {
            return this.gpu.read(addr - VRAM_BEGIN);
        }

        // Hardware I/O registers
        if (addr >= HWIO_BEGIN && addr <= HWIO_END) {
            switch (addr) {
                case 0xFF01:
                    console.info(`SERIAL PORT READ`);
                    return 0x69;
                case 0xFF40:
                    console.info(`LCD CONTROL READ`);
                    return 0x00;
                case 0xFF41:
                    console.info(`LCDC STATUS READ`);
                    return 0x00;
                case 0xFF42:
                    return this.gpu.scrollY;
                case 0xFF43:
                    return this.gpu.scrollX;
                case 0xFF44:
                    return this.gpu.lcdcY;
            }
        }

        // Check if bootrom is disabled (0xFF50)
        if (addr > 0xFF || this.readMem8(0xFF50) == 1) {
            return this.memory[addr];
        } else {
            return this.bootrom[addr];
        }
    }

    readMem16(addr: number) {
        return this.readMem8(addr) | this.readMem8(addr + 1) << 8;
    }
}