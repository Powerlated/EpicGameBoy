const VRAM_BEGIN = 0x8000;
const VRAM_END = 0x9FFF;

const HWIO_BEGIN = 0xFF00;
const HWIO_END = 0xFF7F;

class InterruptFlag {
    vBlank = false;
    lcdStat = false;
    timer = false;
    serial = false;
    joypad = false;


    setNumerical(i: number) {
        this.vBlank = (i & (1 << 0)) != 0;
        this.lcdStat = (i & (1 << 1)) != 0;
        this.timer = (i & (1 << 2)) != 0;
        this.serial = (i & (1 << 3)) != 0;
        this.joypad = (i & (1 << 4)) != 0;
        return;
    }

    getNumerical(): number {
        let flagN = 0;
        if (this.vBlank) {
            flagN = flagN | 0b00000001;
        }
        if (this.lcdStat) {
            flagN = flagN | 0b00000010;
        }
        if (this.timer) {
            flagN = flagN | 0b00000100;
        }
        if (this.serial) {
            flagN = flagN | 0b00001000;
        }
        if (this.joypad) {
            flagN = flagN | 0b00010000;
        }
        return flagN;
    }
}

class MemoryBus {
    cpu: CPU;
    gpu: GPU;

    memory = new Uint8Array(0xFFFF + 1).fill(0);
    bootrom = new Uint8Array(0xFF + 1).fill(0);
    rom = new Uint8Array(0xFFFFFF + 1).fill(0xFF);

    interrupts = new InterruptController();

    bootromEnabled = true;



    constructor() {
    }

    serialOut = [];

    writeMem(addr: number, value: number) {
        if (value > 255) {
            alert(`
        WriteMem8(0x${value.toString(16)})
        
        PC: 0x${this.cpu.pc.toString(16)}
        Opcode: 0x${this.readMem8(this.cpu.pc).toString(16)}
        Op: ${this.cpu.rgOpcode(this.readMem8(this.cpu.pc)).op.name}

        `);
        }

        // SET Interrupt enable flags
        if (addr == 0xFFFF) {

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
                    console.info(`[PC: ${hex(this.cpu.pc, 4)}, INS: #${this.cpu.totalI}] SERIAL PORT WRITE: ` + hex(value, 2));
                    this.serialOut.push(value);
                    break;
                case 0xFF40:
                    console.info(`LCD CONTROL CHANGE`);
                    break;
                case 0xFF41:
                    console.info(`LCDC STATUS CHANGE`);
                    break;
                case 0xFF42:
                    this.gpu.scrollY = value;
                    break;
                case 0xFF43:
                    this.gpu.scrollX = value;
                    break;
                case 0xFF50:
                    console.log("Disabled bootrom by write to 0xFF50")
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
        // Return from VRAM
        if (addr >= VRAM_BEGIN && addr <= VRAM_END) {
            return this.gpu.read(addr - VRAM_BEGIN);
        }

        // GET Interrupt enable flags
        if (addr == 0xFFFF) {
            return this.interrupts.interruptEnableFlag.getNumerical();
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
                case 0xFF50:
                    return 0xFF;
                default:
                    return 0x69;
            }
        }

        // Read from ROM area
        if (addr < 0x8000) {
            if (addr < 0x100 && this.bootromEnabled) {
                return this.bootrom[addr];
            }
            return this.rom[addr];
        }

        return this.memory[addr];
    }

    readMem16(addr: number) {
        return this.readMem8(addr) | this.readMem8(addr + 1) << 8;
    }
}