import GameBoy from "../gameboy";
import GPUCanvas from "./canvas";
import { writeDebug } from "../../tools/debug";
import { unTwo8b, assert } from "../../tools/util";
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

    constructor(numerical: number) {
        this.numerical = numerical;
    }
}

export class OAMEntry {
    xPos = 0;
    yPos = 0;
    tile = 0;
    flags: OAMFlags;

    constructor(yPos: number, xPos: number, tile: number, flags: OAMFlags) {
        this.xPos = xPos;
        this.yPos = yPos;
        this.tile = tile;
        this.flags = flags;
    }
}

class CGBPaletteData {
    data = new Uint8Array(64);

    shades: Array<Array<Uint8Array>> = new Array(8).fill(0).map(() => [
        Uint8Array.of(0, 0, 0),
        Uint8Array.of(0, 0, 0),
        Uint8Array.of(0, 0, 0),
        Uint8Array.of(0, 0, 0)
    ]);

    update() {
        for (let pal = 0; pal < 8; pal++) {
            for (let col = 0; col < 4; col++) {
                let b0 = this.data[(pal * 8) + (col * 2) + 0];
                let b1 = this.data[(pal * 8) + (col * 2) + 1];

                let rgb555 = (b1 << 8) | b0;

                let r = ((rgb555 >> 0) & 31);
                let g = ((rgb555 >> 5) & 31);
                let b = ((rgb555 >> 10) & 31);

                r = (r << 3) || (r >> 2);
                g = (g << 3) || (g >> 2);
                b = (b << 3) || (b >> 2);

                this.shades[pal][col] = Uint8Array.of(r, g, b);
            }
        }
    }
}

class CGBTileFlags {
    ignoreSpritePriority = false; // Bit 7
    yFlip = false; // Bit 6
    xFlip = false; // Bit 5
    vramBank = false; // Bit 3
    bgPalette = 0; // Bit 0-2


    get numerical(): number {
        let n = 0;
        if (this.ignoreSpritePriority)
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
        this.ignoreSpritePriority = (i & (1 << 7)) !== 0;
        this.yFlip = (i & (1 << 6)) !== 0;
        this.xFlip = (i & (1 << 5)) !== 0;
        this.vramBank = (i & (1 << 3)) !== 0;

        this.bgPalette = i & 0b111;
    }
}

export const colors555: Uint8Array[] = [
    new Uint8Array([0xFF >> 3, 0xFF >> 3, 0xFF >> 3]),
    new Uint8Array([0xC0 >> 3, 0xC0 >> 3, 0xC0 >> 3]),
    new Uint8Array([0x60 >> 3, 0x60 >> 3, 0x60 >> 3]),
    new Uint8Array([0x00 >> 3, 0x00 >> 3, 0x00 >> 3]),
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

    scrY = 0; // 0xFF42
    scrX = 0; // 0xFF43

    lcdcY = 0; // 0xFF44 - Current scanning line
    lYCompare = 0; // 0xFF45 - Request STAT interrupt and set STAT flag in LCDStatus when lcdcY === lcdcYCompare 

    windowYpos = 0; // 0xFF4A
    windowXpos = 0; // 0xFF4B

    modeClock: number = 0;

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

                        if (this.hDmaRemaining > 0) {
                            this.newDma(this.hDmaSourceAt, this.hDmaDestAt + 0x8000, 16);
                            this.hDmaSourceAt += 16;
                            this.hDmaDestAt += 16;
                            this.hDmaRemaining -= 16;

                            if (this.hDmaRemaining <= 0) {
                                this.hDmaRemaining = 0;
                                this.hDmaCompleted = true;
                            }
                        }

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
                            this.scanOAM();
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

                        if (this.lcdcY === 153) {
                            this.lcdStatus.mode = 4;
                        }
                    }
                    break;

                // Between Line 153 and Line 0
                case 4:
                    if (this.modeClock >= 4) {
                        this.lcdStatus.coincidenceFlag_______2 = this.lYCompare === this.lcdcY;
                        if (this.lYCompare === this.lcdcY && this.lcdStatus.lyCoincidenceInterrupt6) {
                            this.gb.bus.interrupts.requestLCDstatus();
                        }

                        this.lcdcY = 0;
                    }
                    if (this.modeClock >= 456) {
                        this.modeClock -= 456;
                        this.lcdStatus.mode = 2;
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

    scanned: OAMEntry[] = [];

    scanOAM() {
        this.scanned = [];
        // OAM Scan, maximum of 10 sprites
        for (let sprite = 0; sprite < 40 && this.scanned.length < 40; sprite++) {
            const base = sprite * 4;

            let yPos = this.oam[base + 0];
            const xPos = this.oam[base + 1];
            const tile = this.oam[base + 2];

            // Continue to next sprite if it is offscreen
            if (xPos < 0 || xPos >= 168 || yPos < 0 || yPos >= 160) continue;

            const HEIGHT = this.lcdControl.spriteSize______2 ? 16 : 8;

            let screenYPos = yPos - 16;
            let screenXPos = xPos - 8;

            // Push sprite to scanned if it is on the current scanline
            if (this.lcdcY >= screenYPos && this.lcdcY < screenYPos + HEIGHT)
                this.scanned.push(new OAMEntry(yPos, xPos, tile, new OAMFlags(this.oam[base + 3])));
        }
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
        } else if (this.vramBank === 1) {
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
        this.vram0.forEach((v, i, a) => {
            a[i] = 0;
        });
        this.vram1.forEach((v, i, a) => {
            a[i] = 0;
        });

        this.tilemap = new Uint8Array(2048);

        this.cgbBgPaletteIndex = 0;
        this.cgbBgPaletteIndexAutoInc = false;
        this.cgbBgPalette = new CGBPaletteData();

        this.cgbObjPaletteIndex = 0;
        this.cgbObjPaletteIndexAutoInc = false;
        this.cgbObjPalette = new CGBPaletteData();

        this.vramBank = 0;

        this.dmgBgPalette = 0;
        this.dmgObj0Palette = 0;
        this.dmgObj1Palette = 0;

        this.cgbTileAttrs = new Array(2048).fill(0).map(() => new CGBTileFlags()); // For bank 1

        this.newDmaDestHigh = 0;
        this.newDmaDestLow = 0;

        this.newDmaSourceHigh = 0;
        this.newDmaSourceLow = 0;

        this.newDmaLength = 0;

        this.hDmaDestAt = 0;
        this.hDmaSourceAt = 0;
        this.hDmaRemaining = 0;
        this.hDmaCompleted = false;

        this.renderer = new GPURenderer(this);
    }

    // Source must be < 0xA000
    oamDma(startAddr: number) {
        // writeDebug(`OAM DMA @ ${hex(startAddr, 4)}`);
        for (let i = 0; i < 0xA0; i++) {
            // If $FE00, read from external bus 
            if (startAddr === 0xFE00) {
                this.oam[i] = this.gb.bus.ext.read(startAddr + i);
            } else { // General bus read
                this.oam[i] = this.gb.bus.readMem8(startAddr + i);
            }
        }
    }


    newDmaSourceLow = 0;
    newDmaSourceHigh = 0;

    get newDmaSource() {
        return (this.newDmaSourceHigh << 8) | this.newDmaSourceLow;
    }

    newDmaDestLow = 0;
    newDmaDestHigh = 0;

    get newDmaDest() {
        return (this.newDmaDestHigh << 8) | this.newDmaDestLow;
    }

    newDmaLength = 0;
    hDmaRemaining = 0;
    hDmaSourceAt = 0;
    hDmaDestAt = 0;
    hDmaCompleted = false;

    newDma(startAddr: number, destination: number, length: number) {
        for (let i = 0; i < length; i++) {
            this.write(destination, this.gb.bus.readMem8(startAddr));
            startAddr++;
            destination++;
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
                return this.dmgBgPalette;
            case 0xFF48: // Palette OBJ 0
                return this.dmgObj0Palette;
            case 0xFF49: // Palette OBJ 1
                return this.dmgObj1Palette;;
            case 0xFF4A: // Window Y Position
                return this.windowYpos;
            case 0xFF4B: // Window X Position
                return this.windowXpos;
            case 0xFF4F: // CGB - VRAM Bank
                return this.vramBank | 0b11111110;
            case 0xFF51:
                if (this.gb.cgb) return this.newDmaSourceHigh;
                break;
            case 0xFF52:
                if (this.gb.cgb) return this.newDmaSourceLow;
                break;
            case 0xFF53:
                if (this.gb.cgb) return this.newDmaDestHigh;
                break;
            case 0xFF54:
                if (this.gb.cgb) return this.newDmaDestLow;
                break;
            case 0xFF55:
                if (this.gb.cgb) {
                    if (this.hDmaCompleted) {
                        return 0xFF;
                    }
                    else {
                        return (this.hDmaRemaining >> 4) - 1;
                    }
                }
                break;
            case 0xFF68: // CGB - Background Palette Index
                if (this.gb.cgb) return this.cgbBgPaletteIndex;
                break;
            case 0xFF69: // CGB - Background Palette Data
                if (this.gb.cgb) return this.cgbBgPalette.data[this.cgbBgPaletteIndex];
                break;
            case 0xFF6A: // CGB - Sprite Palette Index
                if (this.gb.cgb) return this.cgbObjPaletteIndex;
                break;
            case 0xFF6B: // CGB - Sprite Palette Data
                if (this.gb.cgb) return this.cgbObjPalette.data[this.cgbObjPaletteIndex];
                break;
        }
    }

    cgbBgPaletteIndex = 0; // 0xFF68
    cgbBgPaletteIndexAutoInc = false;
    cgbBgPalette = new CGBPaletteData();

    cgbObjPaletteIndex = 0; // 0xFF6A
    cgbObjPaletteIndexAutoInc = false;
    cgbObjPalette = new CGBPaletteData();

    vramBank = 0;

    dmgBgPalette = 0;
    dmgObj0Palette = 0;
    dmgObj1Palette = 0;

    setDmgBgPalette(p: number, l: number) {
        let i = p * 2;
        let c = colors555[l];
        let cv = (c[0] & 31) | ((c[1] & 31) << 5) | ((c[2] & 31) << 10);

        let upper = (cv >> 8) & 0xFF;
        let lower = cv & 0xFF;

        this.cgbBgPalette.data[i + 0] = lower;
        this.cgbBgPalette.data[i + 1] = upper;

        this.cgbBgPalette.update();
    }

    setDmgObjPalette(p: number, l: number) {
        let i = p * 2;
        let c = colors555[l];
        let cv = (c[0] & 31) | ((c[1] & 31) << 5) | ((c[2] & 31) << 10);

        let upper = (cv >> 8) & 0xFF;
        let lower = cv & 0xFF;

        this.cgbObjPalette.data[i + 0] = lower;
        this.cgbObjPalette.data[i + 1] = upper;

        this.cgbObjPalette.update();
    }

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
                this.dmgBgPalette = value;
                if (!this.gb.cgb) {
                    this.setDmgBgPalette(0, (value >> 0) & 0b11);
                    this.setDmgBgPalette(1, (value >> 2) & 0b11);
                    this.setDmgBgPalette(2, (value >> 4) & 0b11);
                    this.setDmgBgPalette(3, (value >> 6) & 0b11);
                }
                break;
            case 0xFF48: // Palette OBJ 0
                this.dmgObj0Palette = value;
                if (!this.gb.cgb) {
                    this.setDmgObjPalette(0, (value >> 0) & 0b11);
                    this.setDmgObjPalette(1, (value >> 2) & 0b11);
                    this.setDmgObjPalette(2, (value >> 4) & 0b11);
                    this.setDmgObjPalette(3, (value >> 6) & 0b11);
                }
                break;
            case 0xFF49: // Palette OBJ 1
                this.dmgObj1Palette = value;
                if (!this.gb.cgb) {
                    this.setDmgObjPalette(4, (value >> 0) & 0b11);
                    this.setDmgObjPalette(5, (value >> 2) & 0b11);
                    this.setDmgObjPalette(6, (value >> 4) & 0b11);
                    this.setDmgObjPalette(7, (value >> 6) & 0b11);
                }
                break;
            case 0xFF4A: // Window Y Position
                this.windowYpos = value;
                break;
            case 0xFF4B: // Window X Position
                this.windowXpos = value;
                break;
            case 0xFF4F: // CGB - VRAM Bank
                if (this.gb.cgb) {
                    this.vramBank = (value & 1);
                    if (this.vramBank === 1) {
                        this.vram = this.vram1;
                    } else {
                        this.vram = this.vram0;
                    }
                }
                break;
            case 0xFF51:
                if (this.gb.cgb) this.newDmaSourceHigh = value;
                break;
            case 0xFF52:
                if (this.gb.cgb) this.newDmaSourceLow = value & 0xF0;
                break;
            case 0xFF53:
                if (this.gb.cgb) this.newDmaDestHigh = value;
                break;
            case 0xFF54:
                if (this.gb.cgb) this.newDmaDestLow = value & 0xF0;
                break;
            case 0xFF55:
                if (this.gb.cgb) {
                    this.newDmaLength = ((value & 127)) << 4;
                    let newDmaHblank = ((value >> 7) & 1) !== 0;
                    if (newDmaHblank) {
                        this.hDmaRemaining = ((value & 127)) << 4;
                        this.hDmaSourceAt = this.newDmaSource;
                        this.hDmaDestAt = this.newDmaDest;
                        this.hDmaCompleted = false;
                    } else {
                        this.newDma(this.newDmaSource, this.newDmaDest, this.newDmaLength);
                    }
                }
                break;
            case 0xFF68: // CGB - Background Palette Index
                if (this.gb.cgb) {
                    this.cgbBgPaletteIndex = value & 0x3F;
                    this.cgbBgPaletteIndexAutoInc = (value >> 7) !== 0;
                }
                break;
            case 0xFF69: // CGB - Background Palette Data
                if (this.gb.cgb) {
                    this.cgbBgPalette.data[this.cgbBgPaletteIndex] = value;
                    if (this.cgbBgPaletteIndexAutoInc) {
                        this.cgbBgPaletteIndex++;
                        this.cgbBgPaletteIndex &= 0x3F;
                    }
                    this.cgbBgPalette.update();
                }
                break;
            case 0xFF6A: // CGB - Sprite Palette Index
                if (this.gb.cgb) {
                    this.cgbObjPaletteIndex = value & 0x3F;
                    this.cgbObjPaletteIndexAutoInc = (value >> 7) !== 0;
                }
                break;
            case 0xFF6B: // CGB - Sprite Palette Data
                if (this.gb.cgb) {
                    this.cgbObjPalette.data[this.cgbObjPaletteIndex] = value;
                    if (this.cgbObjPaletteIndexAutoInc) {
                        this.cgbObjPaletteIndex++;
                        this.cgbObjPaletteIndex &= 0x3F;
                    }
                    this.cgbObjPalette.update();
                }
                break;
        }
    }
}

export default GPU;