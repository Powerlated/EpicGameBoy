import GameBoy from "../../gameboy";
import GPUCanvas from "./canvas";
import { writeDebug } from "../../tools/debug";
import { unTwo8b } from "../../tools/util";
import { GPURenderer } from "./renderer";

class LCDCRegister {
    // https://gbdev.gg8.se/wiki/articles/Video_Display#LCD_Control_Register
    lcdDisplayEnable7 = false; // Bit 7 - LCD Display Enable             (0=Off, 1=On)
    windowTilemapSelect___6 = false; // Bit 6 - Window Tile Map Display Select (0=9800-9BFF, 1=9C00-9FFF)
    enableWindow____5 = false; // Bit 5 - Window Display Enable          (0=Off, 1=On)
    bgWindowTiledataSelect__4 = false; // Bit 4 - BG & Window Tile Data Select   (0=8800-97FF, 1=8000-8FFF)
    bgTilemapSelect_3 = false; // Bit 3 - BG Tile Map Display Select     (0=9800-9BFF, 1=9C00-9FFF)
    spriteSize______2 = false; // Bit 2 - OBJ (Sprite) Size              (0=8x8, 1=8x16)
    spriteDisplay___1 = false; // Bit 1 - OBJ (Sprite) Display Enable    (0=Off, 1=On)
    bgWindowEnable0 = false; // Bit 0 - BG/Window Display/Priority     (0=Off, 1=On)

    get numerical(): number {
        let flagN = 0;
        if (this.lcdDisplayEnable7) flagN = flagN | 0b10000000;
        if (this.windowTilemapSelect___6) flagN = flagN | 0b01000000;
        if (this.enableWindow____5) flagN = flagN | 0b00100000;
        if (this.bgWindowTiledataSelect__4) flagN = flagN | 0b00010000;
        if (this.bgTilemapSelect_3) flagN = flagN | 0b00001000;
        if (this.spriteSize______2) flagN = flagN | 0b00000100;
        if (this.spriteDisplay___1) flagN = flagN | 0b00000010;
        if (this.bgWindowEnable0) flagN = flagN | 0b00000001;
        return flagN;
    }

    set numerical(i: number) {
        this.lcdDisplayEnable7 = (i & (1 << 7)) !== 0;
        this.windowTilemapSelect___6 = (i & (1 << 6)) !== 0;
        this.enableWindow____5 = (i & (1 << 5)) !== 0;
        this.bgWindowTiledataSelect__4 = (i & (1 << 4)) !== 0;
        this.bgTilemapSelect_3 = (i & (1 << 3)) !== 0;
        this.spriteSize______2 = (i & (1 << 2)) !== 0;
        this.spriteDisplay___1 = (i & (1 << 1)) !== 0;
        this.bgWindowEnable0 = (i & (1 << 0)) !== 0;
    }
}

class LCDStatusRegister {
    // https://gbdev.gg.8se/wiki/articles/Video_Display#FF41_-_STAT_-_LCDC_Status_.28R.2FW.29
    lyCoincidenceInterrupt6 = false; // Bit 6 - LYC=LY Coincidence Interrupt (1=Enable) (Read/Write)
    mode2OamInterrupt_____5 = false; // Bit 5 - Mode 2 OAM Interrupt         (1=Enable) (Read/Write)
    mode1VblankInterrupt__4 = false; // Bit 4 - Mode 1 V-Blank Interrupt     (1=Enable) (Read/Write)
    mode0HblankInterrupt__3 = false; // Bit 3 - Mode 0 H-Blank Interrupt     (1=Enable) (Read/Write)
    coincidenceFlag_______2 = false; // Bit 2 - Coincidence Flag  (0:LYC<>LY, 1:LYC=LY) (Read Only)

    mode = 0;   // Bit 1-0 - Mode Flag       (Mode 0-3, see below) (Read Only)
    // 0: During H-Blank
    // 1: During V-Blank
    // 2: During Searching OAM
    // 3: During Transferring Data to LCD Driver

    get numerical(): number {
        let flagN = 0;
        if (this.lyCoincidenceInterrupt6) flagN = flagN | 0b01000000;
        if (this.mode2OamInterrupt_____5) flagN = flagN | 0b00100000;
        if (this.mode1VblankInterrupt__4) flagN = flagN | 0b00010000;
        if (this.mode0HblankInterrupt__3) flagN = flagN | 0b00001000;
        if (this.coincidenceFlag_______2) flagN = flagN | 0b00000100;

        flagN = flagN | (this.mode & 0b11);
        return flagN;
    }

    set numerical(i: number) {
        this.lyCoincidenceInterrupt6 = (i & (1 << 6)) !== 0;
        this.mode2OamInterrupt_____5 = (i & (1 << 5)) !== 0;
        this.mode1VblankInterrupt__4 = (i & (1 << 4)) !== 0;
        this.mode0HblankInterrupt__3 = (i & (1 << 3)) !== 0;
        this.coincidenceFlag_______2 = (i & (1 << 2)) !== 0;

        // this.mode = i & 0b11; // this is read only when numerically setting
    }
}

export class OAMFlags {
    behindBG = false;
    yFlip = false;
    xFlip = false;
    paletteNumberDMG = false; // DMG only (0, 1)
    vramBank = false; // CGB only (0, 1)
    paletteNumberCGB = 0;

    get numerical(): number {
        let n = 0;
        if (this.behindBG)
            n |= 0b10000000;
        if (this.yFlip)
            n |= 0b01000000;
        if (this.xFlip)
            n |= 0b00100000;
        if (this.paletteNumberDMG)
            n |= 0b00010000;
        if (this.vramBank)
            n |= 0b00001000;

        n |= this.paletteNumberCGB & 0b111;
        return n;
    }

    set numerical(i: number) {
        this.behindBG = (i & (1 << 7)) !== 0;
        this.yFlip = (i & (1 << 6)) !== 0;
        this.xFlip = (i & (1 << 5)) !== 0;
        this.paletteNumberDMG = (i & (1 << 4)) !== 0;
        this.vramBank = (i & (1 << 3)) !== 0;

        this.paletteNumberCGB = i & 0b111;
    }
}


class PaletteData {
    shades = new Uint8Array(4).fill(0);

    get numerical(): number {
        let n = 0;
        n |= n | (this.shades[3] << 6);
        n |= n | (this.shades[2] << 4);
        n |= n | (this.shades[1] << 2);
        n |= n | (this.shades[0] << 0);
        return n;
    }

    set numerical(i: number) {
        this.shades[3] = (i >> 6) & 0b11;
        this.shades[2] = (i >> 4) & 0b11;
        this.shades[1] = (i >> 2) & 0b11;
        this.shades[0] = (i >> 0) & 0b11;
    }
}

class CGBPaletteData {
    data = new Uint8Array(32);

    getShade(pal: number, col: number) {
        let b0 = this.data[(pal * 8) + (col * 2) + 0];
        let b1 = this.data[(pal * 8) + (col * 2) + 1];

        let rgb555 = (b1 << 8) | b0;

        let r = ((rgb555 >> 0) & 31);
        let g = ((rgb555 >> 5) & 31);
        let b = ((rgb555 >> 10) & 31);

        r = (r << 3) || (r >> 2);
        g = (g << 3) || (g >> 2);
        b = (b << 3) || (b >> 2);

        return Uint8Array.of(r, g, b);
    }
}

class CGBTileFlags {
    useBgPriority = false; // Bit 7
    yFlip = false; // Bit 6
    xFlip = false; // Bit 5
    vramBank = false; // Bit 3
    bgPalette = 0; // Bit 0-2


    get numerical(): number {
        let n = 0;
        if (this.useBgPriority)
            n |= 0b10000000;
        if (this.yFlip)
            n |= 0b01000000;
        if (this.xFlip)
            n |= 0b00100000;
        if (this.vramBank)
            n |= 0b00001000;

        n |= this.bgPalette & 0b111;
        return n;
    }

    set numerical(i: number) {
        this.useBgPriority = (i & (1 << 7)) !== 0;
        this.yFlip = (i & (1 << 6)) !== 0;
        this.xFlip = (i & (1 << 5)) !== 0;
        this.vramBank = (i & (1 << 3)) !== 0;

        this.bgPalette = i & 0b111;
    }
}

export const colors: Uint8Array[] = [
    new Uint8Array([0xFF, 0xFF, 0xFF]),
    new Uint8Array([0xC0, 0xC0, 0xC0]),
    new Uint8Array([0x60, 0x60, 0x60]),
    new Uint8Array([0x00, 0x00, 0x00]),
];

class GPU {
    gb: GameBoy;

    vram0 = new Uint8Array(0x2000 + 1);
    vram1 = new Uint8Array(0x2000 + 1);

    oam = new Uint8Array(256);
    vram = this.vram0;

    totalFrameCount = 0;

    renderer = new GPURenderer(this);
    canvas = new GPUCanvas(this);

    // [tile][row][pixel]
    tileset0 = new Array(0x1800).fill(0).map(() => Array(8).fill(0).map(() => new Uint8Array(8).fill(0))); // For bank 0
    tileset1 = new Array(0x1800).fill(0).map(() => Array(8).fill(0).map(() => new Uint8Array(8).fill(0))); // For bank 0
    cgbTileAttrs = new Array(2048).fill(0).map(() => new CGBTileFlags()); // For bank 1

    tileset = this.tileset0;

    tilemap = new Uint8Array(2048);

    lcdControl = new LCDCRegister(); // 0xFF40
    lcdStatus = new LCDStatusRegister(); // 0xFF41

    bgPaletteData = new PaletteData(); // 0xFF47
    objPaletteData0 = new PaletteData(); // 0xFF48
    objPaletteData1 = new PaletteData(); // 0xFF49

    scrY = 0; // 0xFF42
    scrX = 0; // 0xFF43

    lcdcY = 0; // 0xFF44 - Current scanning line

    lYCompare = 0; // 0xFF45 - Request STAT interrupt and set STAT flag in LCDStatus when lcdcY === lcdcYCompare 

    windowYpos = 0; // 0xFF4A
    windowXpos = 0; // 0xFF4B

    modeClock: number = 0;
    frameClock: number = 0;

    // Thanks for the timing logic, http://imrannazar.com/GameBoy-Emulation-in-JavaScript:-Graphics
    step() {
        // TODO: FIX: THE GPU CLOCK DOES NOT RUN WHEN THE LCD IS DISABLED
        // You don't have to be cycle-accurate for everything

        if (this.lcdControl.lcdDisplayEnable7) {
            this.modeClock += this.gb.cpu.lastInstructionCycles;
            switch (this.lcdStatus.mode) {
                // Read from OAM - Scanline active
                case 2:
                    if (this.modeClock >= 80) {
                        this.modeClock -= 80;
                        this.lcdStatus.mode = 3;
                    }
                    break;

                // Read from VRAM - Scanline active
                case 3:
                    if (this.modeClock >= 172) {
                        this.modeClock -= 172;
                        this.lcdStatus.mode = 0;

                        if ((this.totalFrameCount % this.gb.speedMul) === 0)
                            this.renderer.renderScanline();

                        if (this.lcdStatus.mode0HblankInterrupt__3) {
                            this.gb.bus.interrupts.requestLCDstatus();
                        }
                    }
                    break;

                // Hblank
                case 0:
                    if (this.modeClock >= 204) {
                        this.modeClock -= 204;
                        this.lcdcY++;
                        this.lcdStatus.coincidenceFlag_______2 = this.lYCompare === this.lcdcY;
                        if (this.lYCompare === this.lcdcY && this.lcdStatus.lyCoincidenceInterrupt6) {
                            // writeDebug("Coincidence");
                            this.gb.bus.interrupts.requestLCDstatus();
                        }

                        // THIS NEEDS TO BE 144, THAT IS PROPER TIMING!
                        if (this.lcdcY >= 144) {
                            // If we're at LCDCy = 144, enter Vblank
                            this.lcdStatus.mode = 1;
                            // Fire the Vblank interrupt
                            this.gb.bus.interrupts.requestVblank();
                            this.totalFrameCount++;

                            if (this.lcdStatus.mode1VblankInterrupt__4) {
                                this.gb.bus.interrupts.requestLCDstatus();
                            }

                            // Draw to the canvas
                            if ((this.totalFrameCount % this.gb.speedMul) === 0) {
                                this.renderer.gpu.canvas.drawGameboy();
                            }
                        }
                        else {
                            // Enter back into OAM mode if not Vblank
                            this.lcdStatus.mode = 2;
                            if (this.lcdStatus.mode2OamInterrupt_____5) {
                                this.gb.bus.interrupts.requestLCDstatus();
                            }
                        }
                    }
                    break;

                // Vblank
                case 1:
                    if (this.modeClock >= 456) {
                        this.modeClock -= 456;

                        this.lcdcY++;

                        if (this.lcdcY >= 154) {
                            this.lcdcY = 0;
                            this.lcdStatus.mode = 2;
                        }
                    }
                    break;
            }
        } else {
            this.modeClock = 0;
            this.lcdStatus.mode = 0;
            this.lcdcY = 0;
        }
    }

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    read(index: number): number {
        // During mode 3, the CPU cannot access VRAM or CGB palette data
        if (this.lcdStatus.mode === 3 && this.lcdControl.lcdDisplayEnable7) return 0xFF;

        let adjIndex = index - 0x8000;

        return this.vram[adjIndex];
    }

    write(index: number, value: number) {
        // During mode 3, the CPU cannot access VRAM or CGB palette data
        if (this.lcdStatus.mode === 3 && this.lcdControl.lcdDisplayEnable7) return;

        let adjIndex = index - 0x8000;

        this.vram[adjIndex] = value;
        const tile = adjIndex >> 4;

        // Write to tile set
        if (index >= 0x8000 && index < 0x9800) {
            adjIndex &= 0xFFFE;

            // Work out which tile and row was updated
            const y = (index & 0xF) >> 1;

            for (var x = 0; x < 8; x++) {
                // Find bit index for this pixel
                const bytes = [this.vram[adjIndex], this.vram[adjIndex + 1]];

                const mask = 0b1 << (7 - x);
                const lsb = bytes[0] & mask;
                const msb = bytes[1] & mask;

                // Update tile set
                let tileset = this.vramBank === 1 ? this.tileset1 : this.tileset0;

                tileset[tile][y][x] =
                    (lsb !== 0 ? 1 : 0) +
                    (msb !== 0 ? 2 : 0);
            }
        }

        if (this.vramBank === 0) {
            // Write to tile map
            if (index >= 0x9800 && index < 0xA000) {
                this.tilemap[index - 0x9800] = value;
            }
        } else {
            // Write to CGB tile flags
            if (index >= 0x9800 && index < 0xA000) {
                this.cgbTileAttrs[index - 0x9800].numerical = value;
            }
        }
    }

    reset() {
        this.totalFrameCount = 0;

        // [tile][row][pixel]
        this.tileset0 = new Array(0x1800 + 1).fill(0).map(() => Array(8).fill(0).map(() => new Uint8Array(8).fill(0)));
        this.tileset1 = new Array(0x1800 + 1).fill(0).map(() => Array(8).fill(0).map(() => new Uint8Array(8).fill(0)));

        this.lcdControl = new LCDCRegister();
        this.lcdStatus = new LCDStatusRegister();

        this.bgPaletteData = new PaletteData();
        this.objPaletteData0 = new PaletteData();
        this.objPaletteData1 = new PaletteData();

        this.scrY = 0;
        this.scrX = 0;

        this.windowYpos = 0;
        this.windowXpos = 0;

        this.lcdcY = 0; // 0xFF44 - Current scanning line
        this.modeClock = 0;

        // Zero out OAM
        this.oam.forEach((v, i, a) => {
            a[i] = 0;
        });

        // Zero out VRAM
        this.vram.forEach((v, i, a) => {
            a[i] = 0;
        });
    }

    // Source must be < 0xA000
    oamDma(startAddr: number) {
        // writeDebug(`OAM DMA @ ${hex(startAddr, 4)}`);
        for (let i = 0; i < 0x100; i++) {
            // If $FE00, read from external bus 
            if (startAddr === 0xFE00) {
                this.oam[i] = this.gb.bus.ext.read(startAddr + i);
            } else { // General bus read
                this.oam[i] = this.gb.bus.readMem8(startAddr + i);
            }
        }
    }

    readHwio(addr: number) {
        switch (addr) {
            case 0xFF40:
                // console.info(`LCD CONTROL READ`);
                return this.lcdControl.numerical;
            case 0xFF41:
                // console.info(`LCDC STATUS READ`);
                return this.lcdStatus.numerical | 0b10000000;
            case 0xFF42:
                return this.scrY;
            case 0xFF43:
                return this.scrX;
            case 0xFF44:
                return this.lcdcY;
            case 0xFF45:
                return this.lYCompare;
            case 0xFF47: // Palette
                return this.bgPaletteData.numerical;
            case 0xFF48: // Palette OBJ 0
                return this.objPaletteData0.numerical;
            case 0xFF49: // Palette OBJ 1
                return this.objPaletteData1.numerical;
            case 0xFF4A: // Window Y Position
                return this.windowYpos;
            case 0xFF4B: // Window X Position
                return this.windowXpos;
            case 0xFF4F: // CGB - VRAM Bank
                return this.vramBank | 0b11111110;
            case 0xFF68: // CGB - Background Palette Index
                return this.cgbBgPaletteIndex;
            case 0xFF69: // CGB - Background Palette Data
                return this.cgbBgPalette.data[this.cgbBgPaletteIndex];
            case 0xFF6A: // CGB - Sprite Palette Index
                return this.cgbObjPaletteIndex;
            case 0xFF6B: // CGB - Sprite Palette Data
                return this.cgbObjPalette.data[this.cgbObjPaletteIndex];
        }
    }

    cgbBgPaletteIndex = 0; // 0xFF68
    cgbBgPaletteIndexAutoInc = false;
    cgbBgPalette = new CGBPaletteData();

    cgbObjPaletteIndex = 0; // 0xFF6A
    cgbObjPaletteIndexAutoInc = false;
    cgbObjPalette = new CGBPaletteData();

    vramBank = 0;

    writeHwio(addr: number, value: number) {
        switch (addr) {
            case 0xFF40: // LCD Control
                writeDebug(`LCD CONTROL CHANGE`);
                this.lcdControl.numerical = value;
                break;
            case 0xFF41: // LCDC Status
                writeDebug(`LCDC STATUS CHANGE`);
                this.lcdStatus.numerical = value;
                break;
            case 0xFF42:
                this.scrY = value;
                break;
            case 0xFF43:
                this.scrX = value;
                break;
            case 0xFF44: break;
            case 0xFF45:
                this.lYCompare = value;
                break;
            case 0xFF46:
                this.oamDma(value << 8);
                break;
            case 0xFF47: // Palette
                this.bgPaletteData.numerical = value;
                break;
            case 0xFF48: // Palette OBJ 0
                this.objPaletteData0.numerical = value;
                break;
            case 0xFF49: // Palette OBJ 1
                this.objPaletteData1.numerical = value;
                break;
            case 0xFF4A: // Window Y Position
                this.windowYpos = value;
                break;
            case 0xFF4B: // Window X Position
                this.windowXpos = value;
                break;
            case 0xFF4F: // CGB - VRAM Bank
                this.vramBank = (value & 1);
                if (this.vramBank === 1) {
                    this.vram = this.vram1;
                } else {
                    this.vram = this.vram0;
                }
                break;
            case 0xFF68: // CGB - Background Palette Index
                this.cgbBgPaletteIndex = value & 0x3F;
                this.cgbBgPaletteIndexAutoInc = (value >> 7) !== 0;
                break;
            case 0xFF69: // CGB - Background Palette Data
                this.cgbBgPalette.data[this.cgbBgPaletteIndex] = value;
                if (this.cgbBgPaletteIndexAutoInc) {
                    this.cgbBgPaletteIndex++;
                    this.cgbBgPaletteIndex &= 0x3F;
                }
                break;
            case 0xFF6A: // CGB - Sprite Palette Index
                this.cgbObjPaletteIndex = value & 0x3F;
                this.cgbObjPaletteIndexAutoInc = (value >> 7) !== 0;
                break;
            case 0xFF6B: // CGB - Sprite Palette Data
                this.cgbObjPalette.data[this.cgbObjPaletteIndex] = value;
                if (this.cgbObjPaletteIndexAutoInc) {
                    this.cgbObjPaletteIndex++;
                    this.cgbObjPaletteIndex &= 0x3F;
                }
                break;
        }
    }
}

export default GPU;