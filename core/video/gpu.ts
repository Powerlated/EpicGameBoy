import GameBoy from "../gameboy";
import { TickSignal } from "tone";
import { hex, unTwo8b } from "../../src/gameboy/tools/util";
import { VideoPlugin } from "./videoplugin";
import { HWIO } from "../memory/hwio";

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

    getNumerical(): number {
        let flagN = 0;
        if (this.lcdDisplayEnable7) flagN = flagN | (1 << 7);
        if (this.windowTilemapSelect___6) flagN = flagN | (1 << 6);
        if (this.enableWindow____5) flagN = flagN | (1 << 5);
        if (this.bgWindowTiledataSelect__4) flagN = flagN | (1 << 4);
        if (this.bgTilemapSelect_3) flagN = flagN | (1 << 3);
        if (this.spriteSize______2) flagN = flagN | (1 << 2);
        if (this.spriteDisplay___1) flagN = flagN | (1 << 1);
        if (this.bgWindowEnable0) flagN = flagN | (1 << 0);
        return flagN;
    }

    setNumerical(i: number) {
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

    getNumerical(): number {
        let flagN = 0;
        if (this.lyCoincidenceInterrupt6) flagN = flagN | (1 << 6);
        if (this.mode2OamInterrupt_____5) flagN = flagN | (1 << 5);
        if (this.mode1VblankInterrupt__4) flagN = flagN | (1 << 4);
        if (this.mode0HblankInterrupt__3) flagN = flagN | (1 << 3);
        if (this.coincidenceFlag_______2) flagN = flagN | (1 << 2);

        flagN = flagN | (this.mode & 0b11);
        return flagN;
    }

    setNumerical(i: number) {
        this.lyCoincidenceInterrupt6 = (i & (1 << 6)) !== 0;
        this.mode2OamInterrupt_____5 = (i & (1 << 5)) !== 0;
        this.mode1VblankInterrupt__4 = (i & (1 << 4)) !== 0;
        this.mode0HblankInterrupt__3 = (i & (1 << 3)) !== 0;

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

    getNumerical(): number {
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

    setNumerical(i: number) {
        this.behindBG = (i & (1 << 7)) !== 0;
        this.yFlip = (i & (1 << 6)) !== 0;
        this.xFlip = (i & (1 << 5)) !== 0;
        this.paletteNumberDMG = (i & (1 << 4)) !== 0;
        this.vramBank = (i & (1 << 3)) !== 0;

        this.paletteNumberCGB = i & 0b111;
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

    shades: Uint8Array[][] = new Array(8).fill(0).map(() => [
        new Uint8Array(3),
        new Uint8Array(3),
        new Uint8Array(3),
        new Uint8Array(3),
    ]);

    rgb5to8Table = new Uint8Array(32);

    constructor() {
        for (let i = 0; i < 32; i++) {
            this.rgb5to8Table[i] = i * (255 / 31);
        }
    }

    update(pal: number) {
        for (let col = 0; col < 4; col++) {
            let b0 = this.data[(pal * 8) + (col * 2) + 0];
            let b1 = this.data[(pal * 8) + (col * 2) + 1];

            let rgb555 = (b1 << 8) | b0;

            let r = ((rgb555 >> 0) & 31);
            let g = ((rgb555 >> 5) & 31);
            let b = ((rgb555 >> 10) & 31);

            this.shades[pal][col][0] = this.rgb5to8Table[r];
            this.shades[pal][col][1] = this.rgb5to8Table[g];
            this.shades[pal][col][2] = this.rgb5to8Table[b];
        }
    }
}

class CGBTileFlags {
    ignoreSpritePriority = false; // Bit 7
    yFlip = false; // Bit 6
    xFlip = false; // Bit 5
    vramBank = false; // Bit 3
    bgPalette = 0; // Bit 0-2


    getNumerical(): number {
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

    setNumerical(i: number) {
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

class GPU implements HWIO {
    gb: GameBoy;

    vram0 = new Uint8Array(0x2000);
    vram1 = new Uint8Array(0x2000);

    private oam = new Uint8Array(160);
    vram = this.vram0;

    totalFrameCount = 0;

    // [tile][pixel]
    tileset0 = new Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Uint8Array(8))); // For bank 0
    tileset1 = new Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Uint8Array(8))); // For bank 1

    tilesetUpdated0: boolean[] = new Array(384).fill(false);
    tilesetUpdated1: boolean[] = new Array(384).fill(false);

    tileset = this.tileset0; // Assign active tileset reference to tileset 0

    tilemap = new Uint8Array(2048); // For bank 0
    cgbTileAttrs = new Array(2048).fill(0).map(() => new CGBTileFlags()); // For bank 1

    lcdControl = new LCDCRegister(); // 0xFF40
    lcdStatus = new LCDStatusRegister(); // 0xFF41

    scrY = 0; // 0xFF42 - Scroll Y
    scrX = 0; // 0xFF43 - Scroll X

    lY = 0; // 0xFF44 - Current scanning line
    lYCompare = 0; // 0xFF45 - Request STAT interrupt and set STAT flag in LCDStatus when lcdcY === lcdcYCompare 

    windowYpos = 0; // 0xFF4A - Window Y Position
    windowXpos = 0; // 0xFF4B - Window X Position

    // OAM Entries
    scannedEntries: OAMEntry[] = new Array(40).fill(0).map(() => new OAMEntry(0, 0, 0, new OAMFlags()));
    scannedEntriesCount = 0;

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

    imageGameboyPre = new Uint8Array(160 * 144);
    imageGameboyNoSprites = new Uint8Array(160 * 144);
    imageGameboy = new ImageData(new Uint8ClampedArray(160 * 144 * 4).fill(0xFF), 160, 144);
    imageTileset = new ImageData(new Uint8ClampedArray(256 * 192 * 4).fill(0xFF), 256, 192);

    showBorders = false;

    currentWindowLine = 0; // Which line of the window is currently rendering
    windowOnscreenYetThisFrame = false; // Has the window been triggered this frame yet?

    lineClock: number = 0;

    // Have events happened this scanline yet? - for internal tracking
    bgDrawn = false;
    windowDrawn = false;
    oamScanned = false;
    mode5lYReset = false;

    // Interrupt levels for STAT interrupt, these are all OR'd and trigger STAT on rising edge
    lcdStatusMode0 = false;
    lcdStatusMode1 = false;
    lcdStatusMode2 = false;
    lcdStatusCoincidence = false;

    lcdStatusConditionMet = false;
    lcdStatusFired = false;

    vp: VideoPlugin | null = null;

    // Skip frames when turboing
    renderingThisFrame = false;

    dirtyScanlines = new Uint8Array(144).fill(0);
    dirtySprites: boolean[] = new Array(40).fill(false);
    screenDirty = false;
    screenDirtyUntil = 0;
    currentScanlineDirty = false;

    // Thanks for the timing logic, http://imrannazar.com/GameBoy-Emulation-in-JavaScript:-Graphics
    step(cycles: number) {
        // THE GPU CLOCK DOES NOT RUN WHEN THE LCD IS DISABLED
        // You don't have to be cycle-accurate for everything


        if (this.lcdControl.lcdDisplayEnable7) {
            this.lineClock += cycles;
            switch (this.lcdStatus.mode) {
                // Read from OAM
                case 2:
                    if (this.oamScanned === false) {
                        if (this.renderingThisFrame === true) {
                            this.scanOAM();
                        }
                        this.oamScanned = true;

                        this.updateSTAT();
                        // this.mode3CyclesOffset += 6 * this.scannedEntriesCount;
                    }
                    if (this.lineClock >= 80) {
                        this.lineClock -= 80;

                        if (
                            this.dirtyScanlines[this.lY] > 0 ||
                            this.screenDirty === true
                        ) {
                            this.currentScanlineDirty = true;
                        }

                        this.lcdStatus.mode = 3;
                        this.updateSTAT();
                    }
                    break;

                // Read from VRAM - Pixel Transfer
                case 3:
                    if (this.renderingThisFrame === true) {
                        /* 
                        * Holy moly, this is needed becuase the window "remembers" where it was drawing when it is 
                        * 
                        *     A. Moved offscreen (i.e. X >= 160 || Y >= 144)
                        *     B. Disabled entirely through bit 5 of LCD Control
                        * 
                        * only AFTER the window has already been enabled.
                        */
                        if (
                            this.lcdControl.enableWindow____5 &&
                            this.windowOnscreenYetThisFrame === false &&
                            this.windowXpos < 160 && this.windowYpos < 144 &&
                            this.lY == this.windowYpos
                        ) {
                            this.currentWindowLine = this.windowYpos - this.lY;
                            this.windowOnscreenYetThisFrame = true;
                        }
                        const bgWindowEnable = (!this.gb.cgb && this.lcdControl.bgWindowEnable0) || this.gb.cgb;
                        if (bgWindowEnable === true) {
                            // Delay window rendering based on its X position, and don't be too picky, it's only X position
                            if (this.windowDrawn === false && this.lineClock >= this.windowXpos + 12) {
                                // Only IF the window is onscreen
                                if (this.lcdControl.enableWindow____5 && this.windowXpos < 160) {
                                    if (this.vp !== null) {
                                        this.renderWindow();
                                    }
                                    // this.mode3CyclesOffset += 8;
                                    this.currentWindowLine++;
                                }
                                this.windowDrawn = true;
                            }

                            if (this.bgDrawn === false) {
                                if (this.vp !== null) {
                                    this.renderBg();
                                }
                                this.bgDrawn = true;

                                // this.mode3CyclesOffset += this.scrX & 7;
                            }
                        }
                    }
                    if (this.lineClock >= 172) {
                        this.lineClock -= 172;

                        // VRAM -> HBLANK
                        this.lcdStatus.mode = 0;
                        this.updateSTAT();


                        // Render sprites at end of scanline
                        if (this.lcdControl.spriteDisplay___1) {
                            if (this.renderingThisFrame === true) {
                                if (this.currentScanlineDirty === true && this.vp !== null) {
                                    this.renderSprites();
                                }
                            }
                        }

                        if (this.renderingThisFrame === true) {
                            /*
                            let index = 160 * 4 * (this.lY);
                            const img = this.imageGameboy.data;

                            if (this.currentScanlineDirty === true) {
                                img[index + 0] = 0xFF; img[index + 1] = 0; img[index + 2] = 0; index += 4;
                                img[index + 0] = 0xFF; img[index + 1] = 0; img[index + 2] = 0; index += 4;
                                img[index + 0] = 0xFF; img[index + 1] = 0; img[index + 2] = 0; index += 4;
                                img[index + 0] = 0xFF; img[index + 1] = 0; img[index + 2] = 0; index += 4;
                            } else {
                                img[index + 0] = 0xFF; img[index + 1] = 0xFF; img[index + 2] = 0xFF; index += 4;
                                img[index + 0] = 0xFF; img[index + 1] = 0xFF; img[index + 2] = 0xFF; index += 4;
                                img[index + 0] = 0xFF; img[index + 1] = 0xFF; img[index + 2] = 0xFF; index += 4;
                                img[index + 0] = 0xFF; img[index + 1] = 0xFF; img[index + 2] = 0xFF; index += 4;
                            }
                            */

                            if (this.dirtyScanlines[this.lY] > 0) this.dirtyScanlines[this.lY]--;
                            this.currentScanlineDirty = false;

                            if (this.lY === this.screenDirtyUntil) {
                                if (this.lY >= 143) {
                                    this.screenDirty = false;
                                } else {
                                    this.screenDirtyUntil = 143;
                                }
                            }
                        }

                        this.gb.dma.continueHdma();
                    }
                    break;

                // Hblank
                case 0:
                    if (this.lineClock >= 204) {
                        this.lineClock -= 204;

                        // Reset scanline specific flags
                        this.bgDrawn = false;
                        this.windowDrawn = false;
                        this.oamScanned = false;
                        // this.mode3CyclesOffset = 0;
                        this.setDirty = false;

                        this.lY++;
                        this.updateSTAT();

                        // If we're at LCDCy = 144, enter Vblank
                        // THIS NEEDS TO BE 144, THAT IS PROPER TIMING!
                        if (this.lY >= 144) {
                            // Fire the Vblank interrupt
                            this.gb.interrupts.requested.vblank = true;
                            // Draw to the canvas
                            if (this.renderingThisFrame === true) {
                                if (this.vp !== null) {
                                    this.vp.drawGameboy(this.imageGameboy);
                                }

                                for (let i = 0; i < 384; i++) {
                                    this.tilesetUpdated0[i] = false;
                                    this.tilesetUpdated1[i] = false;
                                }
                            }

                            this.lcdStatus.mode = 1;
                            this.updateSTAT();

                            this.totalFrameCount++;
                        }
                        else {
                            // Enter back into OAM mode if not Vblank
                            this.lcdStatus.mode = 2;
                            this.updateSTAT();
                        }
                    }
                    break;

                // Vblank
                case 1:
                    if (this.lineClock >= 456) {
                        this.lineClock -= 456;

                        this.lY++;
                        this.updateSTAT();

                        this.currentWindowLine = 0;
                        this.windowOnscreenYetThisFrame = false;

                        if (this.lY === 153) {
                            this.lcdStatus.mode = 5;
                            this.updateSTAT();
                        }
                    }
                    break;

                // Between Line 153 and Line 0, reads as mode 1 (Vblank) in LCDstatus because 5 & 3 = 1
                case 5:
                    if (this.mode5lYReset === false && this.lineClock >= 4) {
                        this.lY = 0;
                        this.updateSTAT();

                        this.mode5lYReset = true;
                    }
                    if (this.lineClock >= 456) {
                        this.lineClock -= 456;

                        this.lcdStatus.mode = 2;
                        this.updateSTAT();

                        this.renderingThisFrame = (this.totalFrameCount % this.gb.speedMul) === 0;

                        this.mode5lYReset = false;
                    }
                    break;
            }
        } else {
            this.lineClock = 0;
            this.lcdStatus.mode = 0;
            this.lY = 0;
        }
    }

    updateSTAT() {
        this.lcdStatus.coincidenceFlag_______2 = this.lY == this.lYCompare;

        // Determine LCD status interrupt conditions
        this.lcdStatusCoincidence = this.lcdStatus.lyCoincidenceInterrupt6 === true && this.lcdStatus.coincidenceFlag_______2 === true;
        this.lcdStatusMode0 = this.lcdStatus.mode0HblankInterrupt__3 === true && (this.lcdStatus.mode & 3) === 0;
        this.lcdStatusMode1 = this.lcdStatus.mode1VblankInterrupt__4 === true && (this.lcdStatus.mode & 3) === 1;
        this.lcdStatusMode2 = this.lcdStatus.mode2OamInterrupt_____5 === true && (this.lcdStatus.mode & 3) === 2;

        // If any of the conditions are met, set the condition met flag
        if (
            this.lcdStatusMode0 === true ||
            this.lcdStatusMode1 === true ||
            this.lcdStatusMode2 === true ||
            this.lcdStatusCoincidence === true
        ) {
            this.lcdStatusConditionMet = true;
        } else {
            this.lcdStatusConditionMet = false;
            this.lcdStatusFired = false;
        }

        // If the condition is met and the interrupt has not been fired yet, request the interrupt
        if (this.lcdStatusFired === false && this.lcdStatusConditionMet === true) {
            this.gb.interrupts.requested.lcdStat = true;
            this.lcdStatusFired = true;

            // console.log(`${this.lYCompare} == ${this.lY} STAT IRQ LINECLOCK: ${this.lineClock}`);
        }
    }

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    setDirty = false;

    /*
    * Queues the entire screen for re-rendering
    * becuase something big has changed.
    * 
    * Limited but not including to:
    * - LCD Control
    * - Palettes
    * - Scroll X/Y
    * - WIndow X/Y
    */
    setScreenDirty() {
        this.screenDirtyUntil = this.lY - 1;
        this.screenDirty = true;
    }

    reset() {
        this.totalFrameCount = 0;
        this.vram0 = new Uint8Array(0x2000);
        this.vram1 = new Uint8Array(0x2000);

        this.oam = new Uint8Array(160);
        this.vram = this.vram0;

        this.totalFrameCount = 0;

        // [tile][pixel]
        this.tileset0 = new Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Uint8Array(8)));
        this.tileset1 = new Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Uint8Array(8)));

        this.tileset = this.tileset0;

        this.tilemap = new Uint8Array(2048);
        this.cgbTileAttrs = new Array(2048).fill(0).map(() => new CGBTileFlags());

        this.lcdControl = new LCDCRegister();
        this.lcdStatus = new LCDStatusRegister();

        this.scrY = 0;
        this.scrX = 0;

        this.lineClock = 0;
        this.lcdStatus.mode = 0;
        this.lY = 0;

        this.windowYpos = 0;
        this.windowXpos = 0;

        this.scannedEntries = new Array(40).fill(0).map(() => new OAMEntry(0, 0, 0, new OAMFlags()));
        this.scannedEntriesCount = 0;

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

        this.imageGameboyPre = new Uint8Array(160 * 144);
        this.imageGameboyNoSprites = new Uint8Array(160 * 144);
        this.imageGameboy = new ImageData(new Uint8ClampedArray(160 * 144 * 4).fill(0xFF), 160, 144);
        this.imageTileset = new ImageData(new Uint8ClampedArray(256 * 192 * 4).fill(0xFF), 256, 192);

        this.currentWindowLine = 0;
        this.windowOnscreenYetThisFrame = false;

        this.lineClock = 0;

        this.bgDrawn = false;
        this.windowDrawn = false;
        this.oamScanned = false;
        // this.mode3CyclesOffset = 0;

        this.lcdStatusMode0 = false;
        this.lcdStatusMode1 = false;
        this.lcdStatusMode2 = false;
        this.lcdStatusCoincidence = false;

        this.lcdStatusConditionMet = false;
        this.lcdStatusFired = false;
    }

    writeOam(index: number, value: number) {
        index -= 0xFE00;

        if (this.gb.gpu.lcdStatus.mode == 0 || this.gb.gpu.lcdStatus.mode == 1) {    
            if (this.oam[index] !== value) {
                this.oam[index] = value;

                this.dirtySprites[index >> 2] = true;
            }
        }
    }

    readOam(index: number): number {
        index -= 0xFE00;

        if (this.gb.gpu.lcdStatus.mode == 0 || this.gb.gpu.lcdStatus.mode == 1) {
            return this.oam[index];
        } else {
            return 0xFF;
        }
    }

    read(index: number): number {
        // During mode 3, the CPU cannot access VRAM or CGB palette data
        if (this.lcdStatus.mode === 3) return 0xFF;

        let adjIndex = index - 0x8000;

        return this.vram[adjIndex];
    }

    write(index: number, value: number) {
        // During mode 3, the CPU cannot access VRAM or CGB palette data
        if (this.lcdStatus.mode === 3) return;
        let adjIndex = index - 0x8000;

        if (this.vram[adjIndex] !== value) {
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
                    let tilesetUpdated = this.vramBank === 1 ? this.tilesetUpdated1 : this.tilesetUpdated0;

                    tileset[tile][y][x] =
                        (lsb !== 0 ? 1 : 0) +
                        (msb !== 0 ? 2 : 0);

                    tilesetUpdated[tile] = true;
                }
            }

            if (this.vramBank === 0) {
                // Write to tile map
                if (index >= 0x9800 && index < 0xA000) {
                    if (this.tilemap[index - 0x9800] !== value) {
                        this.tilemap[index - 0x9800] = value;
                        this.setScreenDirty();
                    }
                }
            } else if (this.vramBank === 1) {
                // Write to CGB tile flags
                if (index >= 0x9800 && index < 0xA000) {
                    this.cgbTileAttrs[index - 0x9800].setNumerical(value);
                }
            }
        }
    }

    readHwio(addr: number) {
        switch (addr) {
            case 0xFF40:
                // console.info(`LCD CONTROL READ`);
                return this.lcdControl.getNumerical();
            case 0xFF41:
                // console.info(`LCDC STATUS READ`);
                return this.lcdStatus.getNumerical() | 0b10000000;
            case 0xFF42:
                return this.scrY;
            case 0xFF43:
                return this.scrX;
            case 0xFF44:
                return this.lY;
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

        return 0xFF;
    }

    writeHwio(addr: number, value: number) {
        switch (addr) {
            case 0xFF40: // LCD Control
                this.lcdControl.setNumerical(value);
                this.setScreenDirty();
                break;
            case 0xFF41: // LCDC Status
                this.lcdStatus.setNumerical(value);
                break;
            case 0xFF42:
                if (this.scrY !== value) this.setScreenDirty();
                this.scrY = value;
                break;
            case 0xFF43:
                if (this.scrX !== value) this.setScreenDirty();
                this.scrX = value;
                break;
            case 0xFF44: break;
            case 0xFF45:
                this.lYCompare = value;
                break;
            case 0xFF46:
                this.gb.dma.oamDma(value << 8);
                break;
            case 0xFF47: // Palette
                if (
                    this.gb.cgb === false &&
                    this.dmgBgPalette !== value
                ) {
                    this.setScreenDirty();
                }
                this.dmgBgPalette = value;
                if (this.gb.cgb === false) {
                    this.setDmgBgPalette(0, (value >> 0) & 0b11);
                    this.setDmgBgPalette(1, (value >> 2) & 0b11);
                    this.setDmgBgPalette(2, (value >> 4) & 0b11);
                    this.setDmgBgPalette(3, (value >> 6) & 0b11);
                }
                break;
            case 0xFF48: // Palette OBJ 0
                if (
                    this.gb.cgb === false &&
                    this.dmgObj0Palette !== value
                ) {
                    this.setScreenDirty();
                }
                this.dmgObj0Palette = value;
                if (this.gb.cgb === false) {
                    this.setDmgObjPalette(0, (value >> 0) & 0b11);
                    this.setDmgObjPalette(1, (value >> 2) & 0b11);
                    this.setDmgObjPalette(2, (value >> 4) & 0b11);
                    this.setDmgObjPalette(3, (value >> 6) & 0b11);
                }
                break;
            case 0xFF49: // Palette OBJ 1
                if (
                    this.gb.cgb === false &&
                    this.dmgObj1Palette !== value
                ) {
                    this.setScreenDirty();
                }
                this.dmgObj1Palette = value;
                if (this.gb.cgb === false) {
                    this.setScreenDirty();
                    this.setDmgObjPalette(4, (value >> 0) & 0b11);
                    this.setDmgObjPalette(5, (value >> 2) & 0b11);
                    this.setDmgObjPalette(6, (value >> 4) & 0b11);
                    this.setDmgObjPalette(7, (value >> 6) & 0b11);
                }
                break;
            case 0xFF4A: // Window Y Position
                if (this.windowYpos !== value) this.setScreenDirty();
                this.windowYpos = value;
                break;
            case 0xFF4B: // Window X Position
                if (this.windowXpos !== value) this.setScreenDirty();
                this.windowXpos = value;
                break;
            case 0xFF4F: // CGB - VRAM Bank
                if (this.gb.cgb === true) {
                    this.vramBank = (value & 1);
                    if (this.vramBank === 1) {
                        // console.log("VRAM BANK -> 1");
                        this.vram = this.vram1;
                    } else {
                        // console.log("VRAM BANK -> 0");
                        this.vram = this.vram0;
                    }
                }
                break;
            case 0xFF68: // CGB - Background Palette Index
                if (this.gb.cgb === true) {
                    this.cgbBgPaletteIndex = value & 0x3F;
                    this.cgbBgPaletteIndexAutoInc = (value >> 7) !== 0;
                }
                break;
            case 0xFF69: // CGB - Background Palette Data
                if (this.gb.cgb === true) {
                    if (this.cgbBgPalette.data[this.cgbBgPaletteIndex] !== value) {
                        this.setScreenDirty();
                    }
                    this.cgbBgPalette.data[this.cgbBgPaletteIndex] = value;
                    this.cgbBgPalette.update(this.cgbBgPaletteIndex >> 3);

                    if (this.cgbBgPaletteIndexAutoInc) {
                        this.cgbBgPaletteIndex++;
                        this.cgbBgPaletteIndex &= 0x3F;
                    }
                }
                break;
            case 0xFF6A: // CGB - Sprite Palette Index
                if (this.gb.cgb === true) {
                    this.cgbObjPaletteIndex = value & 0x3F;
                    this.cgbObjPaletteIndexAutoInc = (value >> 7) !== 0;
                }
                break;
            case 0xFF6B: // CGB - Sprite Palette Data
                if (this.gb.cgb === true) {
                    if (this.cgbObjPalette.data[this.cgbObjPaletteIndex] !== value) {
                        this.setScreenDirty();
                    }
                    this.cgbObjPalette.data[this.cgbObjPaletteIndex] = value;
                    this.cgbObjPalette.update(this.cgbObjPaletteIndex >> 3);

                    if (this.cgbObjPaletteIndexAutoInc) {
                        this.cgbObjPaletteIndex++;
                        this.cgbObjPaletteIndex &= 0x3F;
                    }
                }
                break;
        }
    }

    setDmgBgPalette(p: number, l: number) {
        let i = p * 2;
        let c = colors555[l];
        let cv = (c[0] & 31) | ((c[1] & 31) << 5) | ((c[2] & 31) << 10);

        let upper = (cv >> 8) & 0xFF;
        let lower = cv & 0xFF;

        this.cgbBgPalette.data[i + 1] = upper;
        this.cgbBgPalette.data[i + 0] = lower;

        this.cgbBgPalette.update(p >> 2);
    }

    setDmgObjPalette(p: number, l: number) {
        let i = p * 2;
        let c = colors555[l];
        let cv = (c[0] & 31) | ((c[1] & 31) << 5) | ((c[2] & 31) << 10);

        let upper = (cv >> 8) & 0xFF;
        let lower = cv & 0xFF;

        this.cgbObjPalette.data[i + 0] = lower;
        this.cgbObjPalette.data[i + 1] = upper;

        this.cgbObjPalette.update(p >> 2);
    }

    renderBg() {
        // This is the Y value within a tile
        const y = (this.lY + this.scrY) & 0b111;

        const mapBaseBg = this.lcdControl.bgTilemapSelect_3 ? 1024 : 0;

        const mapIndex = (((this.lY + this.scrY) >> 3) << 5) & 1023;

        const mapOffset = mapBaseBg + mapIndex; // 1023   // CORRECT 0x1800

        // Divide by 8 to get which column drawing should start at
        let lineOffset = this.scrX >> 3;

        // How many pixels in we should start drawing at in the first tile
        let x = this.scrX & 0b111;                // CORRECT

        let imgIndex = 160 * 4 * (this.lY);

        const xPos = this.windowXpos - 7; // Get the real X position of the window
        const endAt = this.lcdControl.enableWindow____5 && this.lY >= this.windowYpos ? xPos : 160;

        let adjY: number;
        let tileRow: Uint8Array;
        let color: Uint8Array;
        let pixel = -x;
        let prePalette = 0;
        let palette: Uint8Array[];
        let attr: CGBTileFlags;
        let tile: number;
        let tileset: Uint8Array[][];
        let tileUpdated: boolean;

        const img = this.imageGameboy.data;
        const imageGameboyPre = this.imageGameboyPre;
        const imageGameboyNoSprites = this.imageGameboyNoSprites;


        while (true) {
            tile = this.tilemap[mapOffset + lineOffset];
            attr = this.cgbTileAttrs[mapOffset + lineOffset]; // Update attributes too
            tileset = attr.vramBank ? this.tileset1 : this.tileset0;

            palette = this.cgbBgPalette.shades[attr.bgPalette];

            if (this.lcdControl.bgWindowTiledataSelect__4 === false) {
                // Two's Complement on high tileset
                tile = unTwo8b(tile) + 256;
            }

            adjY = attr.yFlip ? 7 - y : y;

            tileRow = tileset[tile][adjY];
            tileUpdated = attr.vramBank ? this.tilesetUpdated1[tile] : this.tilesetUpdated0[tile];

            if (tileUpdated === true || this.currentScanlineDirty === true) {
                for (let i = 0; i < 8; i++) {
                    if (pixel >= endAt) return;
                    if (pixel >= 0) {
                        prePalette = tileRow[attr.xFlip ? 7 - i : i];
                        color = palette[prePalette];
                        img[imgIndex + 0] = color[0];
                        img[imgIndex + 1] = color[1];
                        img[imgIndex + 2] = color[2];
                        imageGameboyPre[imgIndex >> 2] = prePalette;
                        imageGameboyNoSprites[imgIndex >> 2] = attr.ignoreSpritePriority === true && prePalette !== 0 ? 1 : 0;

                        imgIndex += 4;
                    }
                    pixel++;
                }
            } else {
                imgIndex += 32;
                pixel += 8;
                if (pixel >= endAt) return;
            }

            // When this tile ends, read another
            lineOffset++;
            lineOffset &= 31; // Wrap around after 32 tiles (width of tilemap) 
        }
    }

    renderWindow() {
        // Make sure window is onscreen Y
        if (this.lY >= this.windowYpos) {
            const mapBase = this.lcdControl.windowTilemapSelect___6 ? 1024 : 0;
            const mapIndex = ((this.currentWindowLine >> 3) << 5) & 1023;
            let mapOffset = mapBase + mapIndex; // 1023   // CORRECT 0x1800

            const y = this.currentWindowLine & 0b111; // CORRECT
            const img = this.imageGameboy.data;
            const imageGameboyPre = this.imageGameboyPre;
            const imageGameboyNoSprites = this.imageGameboyNoSprites;


            let adjY: number;
            let tileRow: Uint8Array;
            let color: Uint8Array;
            let pixel = this.windowXpos - 7;;
            let prePalette = 0;
            let palette: Uint8Array[];
            let attr: CGBTileFlags;
            let tile: number;
            let tileset: Uint8Array[][];
            let tileUpdated: boolean;

            let imgIndex = 160 * 4 * (this.lY) + (pixel * 4);

            while (true) {
                tile = this.tilemap[mapOffset];
                attr = this.cgbTileAttrs[mapOffset]; // Update attributes too
                tileset = attr.vramBank ? this.tileset1 : this.tileset0;
                palette = this.cgbBgPalette.shades[attr.bgPalette];

                if (this.lcdControl.bgWindowTiledataSelect__4 === false) {
                    // Two's Complement on high tileset
                    tile = unTwo8b(tile) + 256;
                }

                adjY = attr.yFlip ? 7 - y : y;

                tileRow = tileset[tile][adjY];
                tileUpdated = attr.vramBank ? this.tilesetUpdated1[tile] : this.tilesetUpdated0[tile];

                if (tileUpdated === true || this.currentScanlineDirty === true) {
                    for (let i = 0; i < 8; i++) {
                        if (pixel >= 160) return;
                        prePalette = tileRow[attr.xFlip ? 7 - i : i];
                        color = palette[prePalette];
                        img[imgIndex + 0] = color[0];
                        img[imgIndex + 1] = color[1];
                        img[imgIndex + 2] = color[2];
                        imageGameboyPre[imgIndex >> 2] = prePalette;
                        imageGameboyNoSprites[imgIndex >> 2] = attr.ignoreSpritePriority === true && prePalette !== 0 ? 1 : 0;

                        imgIndex += 4;
                        pixel++;
                    }
                }
                else {
                    imgIndex += 32;
                    pixel += 8;
                    if (pixel >= 160) return;
                }

                mapOffset++;
            }
        }
    }

    scanOAM() {
        this.scannedEntriesCount = 0;

        const HEIGHT = this.lcdControl.spriteSize______2 ? 16 : 8;

        // OAM Scan, maximum of 10 sprites
        for (let sprite = 0; sprite < 40 && this.scannedEntriesCount < 10; sprite++) {
            const base = sprite * 4;

            let yPos = this.oam[base + 0];
            const xPos = this.oam[base + 1];
            const tile = this.oam[base + 2];

            // Continue to next sprite if it is offscreen
            if (xPos < 0 || xPos >= 168 || yPos < 0 || yPos >= 160) continue;
            let screenYPos = yPos - 16;

            // Push sprite to scanned if it is on the current scanline
            if (this.lY >= screenYPos && this.lY < screenYPos + HEIGHT) {
                let entry = this.scannedEntries[this.scannedEntriesCount];
                entry.xPos = xPos;
                entry.yPos = yPos;
                entry.tile = tile;
                entry.flags.setNumerical(this.oam[base + 3]);
                this.scannedEntriesCount++;


                // They see me unrollin', they hatin...
                this.dirtyScanlines[screenYPos + 0] = 2;
                this.dirtyScanlines[screenYPos + 1] = 2;
                this.dirtyScanlines[screenYPos + 2] = 2;
                this.dirtyScanlines[screenYPos + 3] = 2;
                this.dirtyScanlines[screenYPos + 4] = 2;
                this.dirtyScanlines[screenYPos + 5] = 2;
                this.dirtyScanlines[screenYPos + 6] = 2;
                this.dirtyScanlines[screenYPos + 7] = 2;

                if (this.lcdControl.spriteSize______2 === true) {
                    this.dirtyScanlines[screenYPos + 8] = 2;
                    this.dirtyScanlines[screenYPos + 9] = 2;
                    this.dirtyScanlines[screenYPos + 10] = 2;
                    this.dirtyScanlines[screenYPos + 11] = 2;
                    this.dirtyScanlines[screenYPos + 12] = 2;
                    this.dirtyScanlines[screenYPos + 13] = 2;
                    this.dirtyScanlines[screenYPos + 14] = 2;
                    this.dirtyScanlines[screenYPos + 15] = 2;
                }
            }
        }

    }

    renderSprites() {
        for (let sprite = 0; sprite < this.scannedEntriesCount; sprite++) {
            // Render sprites in OAM order (reverse of scan order)
            let scannedSprite = this.scannedEntries[this.scannedEntriesCount - sprite - 1];

            const yPos = scannedSprite.yPos;
            const xPos = scannedSprite.xPos;
            let tile = scannedSprite.tile;
            const flags = scannedSprite.flags;

            if (this.lcdControl.spriteSize______2) {
                tile &= 0b11111110;
            }

            const screenYPos = yPos - 16;
            let screenXPos = xPos - 8;

            const y = (this.lY - yPos) & 7;
            const pal = this.gb.cgb ? flags.paletteNumberCGB : + flags.paletteNumberDMG;
            const tileset = flags.vramBank ? this.tileset1 : this.tileset0;

            let h = this.lY > screenYPos + 7 ? 1 : 0;

            // Offset tile by +1 if rendering the top half of an 8x16 sprite
            if (flags.yFlip && this.lcdControl.spriteSize______2) {
                if (h == 0) {
                    tile += 1;
                }
            } else {
                tile += h;
            }

            const pixelY = flags.yFlip ? 7 - y : y;
            const tileRow = tileset[tile][pixelY];

            let imgIndex = ((this.lY * 160) + screenXPos) * 4;

            // Draws the 8 pixels.
            for (let x = 0; x < 8; x++) {
                screenXPos = x + xPos - 8;

                // If it's off the edges, skip this pixel
                if (screenXPos < 0 || screenXPos >= 160) { imgIndex += 4; continue; }

                // Border debug
                if (this.showBorders && (x === 0 || x === 7 || pixelY === 0 || pixelY === 7)) {
                    if (this.lcdControl.spriteSize______2) {
                        this.imageGameboy.data[imgIndex + 0] = 0xFF;
                        this.imageGameboy.data[imgIndex + 1] = 0;
                        this.imageGameboy.data[imgIndex + 2] = 0xFF;
                    } else {
                        this.imageGameboy.data[imgIndex + 0] = 0;
                        this.imageGameboy.data[imgIndex + 1] = 0xFF;
                        this.imageGameboy.data[imgIndex + 2] = 0;
                    }

                    imgIndex += 4;
                    continue;
                }

                const tileX = flags.xFlip ? 7 - x : x;

                // Simulate transparency 
                const prePalette = tileRow[tileX];
                if (prePalette === 0) { imgIndex += 4; continue; }

                const pixel = this.cgbObjPalette.shades[pal][prePalette];

                let noTransparency = this.gb.cgb && !this.lcdControl.bgWindowEnable0;
                if (noTransparency === false) {
                    if (flags.behindBG && this.imageGameboyPre[imgIndex >> 2] !== 0) { imgIndex += 4; continue; }
                    if (this.imageGameboyNoSprites[imgIndex >> 2] === 1) { imgIndex += 4; continue; }
                }

                this.imageGameboy.data[imgIndex + 0] = pixel[0];
                this.imageGameboy.data[imgIndex + 1] = pixel[1];
                this.imageGameboy.data[imgIndex + 2] = pixel[2];

                imgIndex += 4;
            }
        }
    }
    // 160 x 144

    renderTiles() {
        const WIDTH = 256;


        this.tileset0.forEach((tile, tileIndex) => {
            for (let tileX = 0; tileX < 8; tileX++) {
                for (let tileY = 0; tileY < 8; tileY++) {
                    const x = ((tileIndex << 3) + (tileX & 7)) % WIDTH;
                    let y = tileY + (8 * (tileIndex >> 5));

                    const c = this.cgbBgPalette.shades[0][tile[tileY][tileX]];

                    let index = 4 * ((y * WIDTH) + x);
                    this.imageTileset.data[index + 0] = c[0];
                    this.imageTileset.data[index + 1] = c[1];
                    this.imageTileset.data[index + 2] = c[2];
                }
            }
        });
        this.tileset1.forEach((tile, tileIndex) => {
            for (let tileX = 0; tileX < 8; tileX++) {
                for (let tileY = 0; tileY < 8; tileY++) {
                    const x = ((tileIndex << 3) + (tileX & 7)) % WIDTH;
                    let y = tileY + (8 * (tileIndex >> 5));

                    const c = this.cgbBgPalette.shades[0][tile[tileY][tileX]];

                    let offset = (256 * 96);
                    let index = 4 * (((y * WIDTH) + x) + offset);
                    this.imageTileset.data[index + 0] = c[0];
                    this.imageTileset.data[index + 1] = c[1];
                    this.imageTileset.data[index + 2] = c[2];
                }
            }
        });
    }
}

export default GPU;