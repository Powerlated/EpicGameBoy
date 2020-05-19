import GameBoy from "../gameboy";
import { TickSignal } from "tone";
import { hex, unTwo8b } from "../../src/gameboy/tools/util";
import { VideoPlugin } from "./videoplugin";
import { HWIO } from "../memory/hwio";
import { BIT_7, BIT_6, BIT_5, BIT_4, BIT_3, BIT_2, BIT_1, BIT_0 } from "../bit_constants";
import { Serializer } from "../serialize";

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
        if (this.lcdDisplayEnable7) flagN = flagN | BIT_7;
        if (this.windowTilemapSelect___6) flagN = flagN | BIT_6;
        if (this.enableWindow____5) flagN = flagN | BIT_5;
        if (this.bgWindowTiledataSelect__4) flagN = flagN | BIT_4;
        if (this.bgTilemapSelect_3) flagN = flagN | BIT_3;
        if (this.spriteSize______2) flagN = flagN | BIT_2;
        if (this.spriteDisplay___1) flagN = flagN | BIT_1;
        if (this.bgWindowEnable0) flagN = flagN | BIT_0;
        return flagN;
    }

    setNumerical(i: number) {
        this.lcdDisplayEnable7 = (i & BIT_7) !== 0;
        this.windowTilemapSelect___6 = (i & BIT_6) !== 0;
        this.enableWindow____5 = (i & BIT_5) !== 0;
        this.bgWindowTiledataSelect__4 = (i & BIT_4) !== 0;
        this.bgTilemapSelect_3 = (i & BIT_3) !== 0;
        this.spriteSize______2 = (i & BIT_2) !== 0;
        this.spriteDisplay___1 = (i & BIT_1) !== 0;
        this.bgWindowEnable0 = (i & BIT_0) !== 0;
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
        if (this.lyCoincidenceInterrupt6) flagN = flagN | BIT_6;
        if (this.mode2OamInterrupt_____5) flagN = flagN | BIT_5;
        if (this.mode1VblankInterrupt__4) flagN = flagN | BIT_4;
        if (this.mode0HblankInterrupt__3) flagN = flagN | BIT_3;
        if (this.coincidenceFlag_______2) flagN = flagN | BIT_2;

        flagN = flagN | (this.mode & 0b11);
        return flagN;
    }

    setNumerical(i: number) {
        this.lyCoincidenceInterrupt6 = (i & BIT_6) !== 0;
        this.mode2OamInterrupt_____5 = (i & BIT_5) !== 0;
        this.mode1VblankInterrupt__4 = (i & BIT_4) !== 0;
        this.mode0HblankInterrupt__3 = (i & BIT_3) !== 0;

        // this.mode = i & 0b11; // this is read only when numerically setting
    }
}

export class OAMFlags {
    behindBG = false;
    yFlip = false;
    xFlip = false;
    paletteNumberDMG = false; // DMG only (0, 1)
    vramBank = 0; // CGB only (0, 1)
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
        this.behindBG = (i & BIT_7) !== 0;
        this.yFlip = (i & BIT_6) !== 0;
        this.xFlip = (i & BIT_5) !== 0;
        this.paletteNumberDMG = (i & BIT_4) !== 0;
        this.vramBank = ((i & BIT_3) !== 0) ? 1 : 0;

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
    data = new Uint8Array(64).fill(0xFF);

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
        this.updateAll();
    }


    update(pal: number, col: number) {
        const b0 = this.data[(pal * 8) + (col * 2) + 0];
        const b1 = this.data[(pal * 8) + (col * 2) + 1];

        const rgb555 = (b1 << 8) | b0;

        const r = ((rgb555 >> 0) & 31);
        const g = ((rgb555 >> 5) & 31);
        const b = ((rgb555 >> 10) & 31);

        this.shades[pal][col][0] = this.rgb5to8Table[r];
        this.shades[pal][col][1] = this.rgb5to8Table[g];
        this.shades[pal][col][2] = this.rgb5to8Table[b];
    }

    updateAll() {
        for (let pal = 0; pal < 8; pal++) {
            for (let col = 0; col < 4; col++) {
                this.update(pal, col);
            }
        }
    }
}

class CGBTileFlags {
    ignoreSpritePriority = false; // Bit 7
    yFlip = false; // Bit 6
    xFlip = false; // Bit 5
    vramBank = 0; // Bit 3
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
        this.ignoreSpritePriority = (i & BIT_7) !== 0;
        this.yFlip = (i & BIT_6) !== 0;
        this.xFlip = (i & BIT_5) !== 0;
        this.vramBank = ((i & BIT_3) !== 0) ? 1 : 0;

        this.bgPalette = i & 0b111;
    }
}

export const colors555: Uint8Array[] = [
    new Uint8Array([0xFF >> 3, 0xFF >> 3, 0xFF >> 3]),
    new Uint8Array([0xC0 >> 3, 0xC0 >> 3, 0xC0 >> 3]),
    new Uint8Array([0x60 >> 3, 0x60 >> 3, 0x60 >> 3]),
    new Uint8Array([0x00 >> 3, 0x00 >> 3, 0x00 >> 3]),
];

export enum LCDMode {
    HBLANK = 0,
    VBLANK = 1,
    OAM = 2,
    VRAM = 3,
    LINE153 = 5,
    GLITCHED_OAM = 4, // Reads Hblank in STAT
}

enum PixelFetcher {
    SLEEP0,
    GET_TILE1,
    SLEEP2,
    GET_TILE_LOW3,
    SLEEP4,
    GET_TILE_HIGH5,
    PUSH6,
    PUSH7
}

class GPU implements HWIO {
    mode: LCDMode = 0;

    frameBlending = false;

    gb: GameBoy;

    vram = [
        new Uint8Array(0x2000),
        new Uint8Array(0x2000)
    ];

    oam = new Uint8Array(160);

    totalFrameCount = 0;

    // [tile][column][row] - quite friendly for CPU cache
    tileset = [
        new Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Uint8Array(8))), // For bank 0
        new Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Uint8Array(8))), // For bank 1
    ];

    tilemap = new Uint8Array(2048); // For bank 0
    cgbTileAttrs = new Array(2048).fill(0).map(() => new CGBTileFlags()); // For bank 1

    lcdControl = new LCDCRegister(); // 0xFF40
    lcdStatus = new LCDStatusRegister(); // 0xFF41

    scrY = 0; // 0xFF42 - Scroll Y
    scrX = 0; // 0xFF43 - Scroll X

    lY = 0; // 0xFF44 - Current scanning line
    lYCompare = 0; // 0xFF45 - Request STAT interrupt and set STAT flag in LCDStatus when lY === lYCompare 

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

    cgbObjPriority = false;

    vramBank = 0;

    dmgBgPalette = 0;
    dmgObj0Palette = 0;
    dmgObj1Palette = 0;

    // Interrupt levels for STAT interrupt, these are all OR'd and trigger STAT on rising edge
    lcdStatusMode0 = false;
    lcdStatusMode1 = false;
    lcdStatusMode2 = false;
    lcdStatusCoincidence = false;

    lcdStatusConditionMet = false;
    lcdStatusFired = false;

    pre = new Uint8Array(160);
    noSprites = new Uint8Array(160);

    imageGameboy0 = new ImageData(new Uint8ClampedArray(160 * 144 * 4).fill(0xFF), 160, 144);
    imageGameboy1 = new ImageData(new Uint8ClampedArray(160 * 144 * 4).fill(0xFF), 160, 144);

    imageGameboy = this.imageGameboy1;

    imagePrepared = new ImageData(new Uint8ClampedArray(160 * 144 * 4).fill(0xFF), 160, 144);
    imageTileset = new ImageData(new Uint8ClampedArray(256 * 192 * 4).fill(0xFF), 256, 192);

    showBorders = false;

    windowCurrentLine = 0; // Which line of the window is currently rendering
    windowOnscreenYetThisFrame = false; // Has the window been triggered this frame yet?

    // Has HWIO been modified in mode 3 this scanline?
    mode3HwioWritten = false;

    lineClock: number = 0;

    // Have events happened this scanline yet? - for internal tracking
    bgDrawn = false;
    windowDrawn = false;

    vp: VideoPlugin | null = null;

    // Use the scanline renderer only
    disableFetcher = false;
    // Use exclusively the fetcher
    exclusiveFetcher = false;

    // Skip frames when turboing
    renderingThisFrame = false;

    swapBuffers() {
        switch (this.imageGameboy) {
            case this.imageGameboy0:
                this.imageGameboy = this.imageGameboy1;
                break;
            case this.imageGameboy1:
                this.imageGameboy = this.imageGameboy0;
                break;
        }
    }

    prepareImageOut() {
        for (let i = 0; i < 160 * 144 * 4; i++) {
            this.imagePrepared.data[i] = (
                this.imageGameboy0.data[i] +
                this.imageGameboy1.data[i]
            ) >> 1;
        }
    }

    setMode(mode: LCDMode) {
        this.mode = mode;
        this.lcdStatus.mode = mode;
    }


    // Thanks for the timing logic, http://imrannazar.com/GameBoy-Emulation-in-JavaScript:-Graphics
    tick(cycles: number) {
        // THE GPU CLOCK DOES NOT RUN WHEN THE LCD IS DISABLED
        // You don't have to be cycle-accurate for everything

        if (this.lcdControl.lcdDisplayEnable7 === true) {
            this.lineClock += cycles;
            switch (this.mode) {
                case LCDMode.HBLANK: // Mode 0
                    {
                        if (this.lineClock >= 456) {
                            this.lineClock -= 456;

                            // Reset scanline specific flags
                            this.bgDrawn = false;
                            this.windowDrawn = false;
                            // this.mode3CyclesOffset = 0;

                            this.lY++;

                            // If we're at LCDCy = 144, enter Vblank
                            // THIS NEEDS TO BE 144, THAT IS PROPER TIMING!
                            if (this.lY >= 144) {
                                // Fire the Vblank interrupt
                                this.gb.cpu.if.vblank = true;
                                // Draw to the canvas
                                if (this.renderingThisFrame === true) {
                                    if (this.vp !== null) {
                                        if (this.frameBlending === true) {
                                            this.swapBuffers();
                                            this.prepareImageOut();
                                            this.vp.drawGameboy(this.imagePrepared);
                                        } else {
                                            this.vp.drawGameboy(this.imageGameboy);
                                        }
                                    }
                                }

                                this.windowCurrentLine = 0;
                                this.windowOnscreenYetThisFrame = false;

                                this.setMode(LCDMode.VBLANK);
                                this.updateSTAT();

                                this.totalFrameCount++;
                            }
                            else {
                                // Enter back into OAM mode if not Vblank
                                this.setMode(LCDMode.OAM);
                                this.updateSTAT();
                            }
                        }
                    }
                    break;
                case LCDMode.VBLANK: // Mode 1
                    {
                        if (this.lineClock >= 456) {
                            this.lineClock -= 456;

                            if (this.lY >= 152) {
                                this.setMode(LCDMode.LINE153);
                            }

                            this.lY++;
                            this.updateSTAT();
                        }
                    }
                    break;
                case LCDMode.OAM: // Mode 2
                    {
                        // this.mode3CyclesOffset += 6 * this.scannedEntriesCount;

                        if (this.lineClock >= 80) {

                            if (this.renderingThisFrame === true) {
                                this.scanOAM();
                            }

                            this.setMode(LCDMode.VRAM);

                            this.mode3HwioWritten = false;
                            this.fetcherReset();
                            this.updateSTAT();
                        }
                    }
                    break;
                case LCDMode.VRAM: // Mode 3
                    {
                        this.fetcherCycles += cycles;
                        if (this.lineClock >= 252) {
                            if (this.renderingThisFrame) {
                                if (this.mode3HwioWritten && !this.disableFetcher || this.exclusiveFetcher) {
                                    this.fetcherFlush();
                                } else {
                                    // console.log(this.lY)
                                    // console.log("Scanline")

                                    if (this.lY > this.windowYpos && this.lcdControl.enableWindow____5 === true && this.windowXpos < 167) {
                                        this.windowCurrentLine++;
                                    }
                                    if (!this.windowOnscreenYetThisFrame && this.lcdControl.enableWindow____5 && this.windowXpos < 167 && this.lY >= this.windowYpos) {
                                        this.windowOnscreenYetThisFrame = true;
                                        this.windowCurrentLine = -(this.windowYpos - this.lY);
                                    }
                                    this.renderBgWindowScanline();

                                }
                            }

                            if (this.fetcherScreenX > 159 || (!this.mode3HwioWritten || !this.renderingThisFrame || this.disableFetcher)) {
                                this.fetcherCycles = 0;

                                // VRAM -> HBLANK
                                this.setMode(LCDMode.HBLANK);
                                this.updateSTAT();

                                this.gb.dma.continueHdma();

                                if (this.renderingThisFrame === true) {
                                    if (this.lcdControl.spriteDisplay___1) {
                                        this.renderSprites();
                                    }
                                }
                            }
                        }
                    }
                    break;
                case LCDMode.LINE153:
                    {
                        this.updateSTAT();

                        // LY returns to top early at line 153
                        this.lY = 0;
                        if (this.lineClock >= 456) {
                            this.lineClock -= 456;

                            this.setMode(LCDMode.OAM);
                            this.updateSTAT();

                            this.renderingThisFrame = (this.totalFrameCount % this.gb.speedMul) === 0 && this.vp !== null;
                        }
                    }
                    break;
                case LCDMode.GLITCHED_OAM:
                    {
                        if (this.lineClock >= 76) {
                            this.lineClock -= 76;

                            this.setMode(LCDMode.VRAM);
                            // console.log("Exit Glitched OAM");
                        }
                    }
                    break;
            }
        } else {
            this.lineClock = 0;
            this.setMode(LCDMode.GLITCHED_OAM);
            this.lY = 0;
            this.renderingThisFrame = false;
        }
    }

    fetcherCycles = 0;
    fetcherStall = 0;

    fetcherStep: number = PixelFetcher.SLEEP0;
    fetcherTileIndex = 0;
    fetcherTileAttrs = new CGBTileFlags();
    fetcherX = 0;
    fetcherScreenX = 0;

    fetcherTileY = 0;
    fetcherTileData = new Uint8Array(8);

    fetcherBgFifoCol = new Uint8Array(8); // BG Color
    fetcherBgFifoPal = 0;
    fetcherBgFifoObjPri = new Uint8Array(8); // BG Sprite Priority
    fetcherBgFifoBgPri = new Uint8Array(8); // BG Priotiy
    fetcherBgFifoPos = 0;

    fetcherFirstTile = false;
    fetcherPushed = false;

    fetcherWindowMode = false;
    fetcherImageIndex = 0;

    fetcherFlush() {
        if (!this.disableFetcher) {
            this.fetcherAdvance(this.fetcherCycles);
            this.fetcherCycles = 0;
        }
    }

    fetcherAdvance(cycles: number) {
        while (cycles > 0) {
            cycles--;

            if (this.fetcherStall > 0) {
                this.fetcherStall--;
            } else {
                switch (this.fetcherStep) {
                    case 0:
                        {
                            if (
                                !(this.lcdControl.enableWindow____5 &&
                                    this.lY >= this.windowYpos) &&
                                this.fetcherWindowMode)
                                this.fetcherWindowMode = false;
                        }
                        break; // Sleep
                    case 1:
                        this.fetcherPushed = false;

                        let tileBase: number;
                        let lineOffset: number;

                        if (this.fetcherWindowMode) {
                            this.fetcherTileY = this.windowCurrentLine;
                            tileBase = this.lcdControl.windowTilemapSelect___6 ? 0x1C00 : 0x1800;
                            lineOffset = ((this.fetcherX - (this.windowXpos - 7)) >> 3) & 31;
                        } else {
                            this.fetcherTileY = this.scrY + this.lY;
                            tileBase = this.lcdControl.bgTilemapSelect_3 ? 0x1C00 : 0x1800;
                            lineOffset = ((this.fetcherX + this.scrX) >> 3) & 31;
                        }

                        const tileY = ((this.fetcherTileY >> 3) << 5) & 1023;
                        const tile = tileBase + tileY + lineOffset;

                        this.fetcherTileAttrs = this.cgbTileAttrs[tile - 0x1800];
                        this.fetcherTileIndex = this.vram[0][tile];

                        if (this.lcdControl.bgWindowTiledataSelect__4 === false)
                            this.fetcherTileIndex = unTwo8b(this.fetcherTileIndex) + 256;

                        this.fetcherX += 8;
                        // this.fetcherTileAttrs = this.cgbTileAttrs[tile];
                        break;
                    case 2: break; // Sleep
                    case 3:
                        {
                            let tileY = this.fetcherTileY & 7;
                            if (this.fetcherTileAttrs.yFlip) tileY ^= 7;

                            this.fetcherTileData = this.tileset[this.fetcherTileAttrs.vramBank][this.fetcherTileIndex][tileY];
                        }
                        break;
                    case 4:
                        if (this.fetcherX == 8) {
                            if (this.fetcherWindowMode) {
                                this.fetcherScreenX = -((this.windowXpos & 7) ^ 7);
                            } else {
                                this.fetcherScreenX = -(this.scrX & 7);
                            }
                        }
                        break; // Sleep
                    case 5:
                    case 6:
                    case 7: // Attempt push
                        if (this.fetcherPushed === false && this.fetcherBgFifoPos === 0) {
                            this.fetcherPushed = true;

                            this.fetcherBgFifoPal = this.fetcherTileAttrs.bgPalette;

                            if (this.fetcherTileAttrs.xFlip) {
                                this.fetcherBgFifoCol.set(this.fetcherTileData);
                                this.fetcherBgFifoObjPri.fill(this.fetcherTileAttrs.ignoreSpritePriority ? 1 : 0);
                            } else {
                                this.fetcherBgFifoCol.set(this.fetcherTileData);
                                this.fetcherBgFifoCol.reverse();
                                this.fetcherBgFifoObjPri.fill(this.fetcherTileAttrs.ignoreSpritePriority ? 1 : 0);

                            }

                            this.fetcherBgFifoPos = 8;
                        }
                        break;
                }

                this.fetcherStep++;
                this.fetcherStep &= 7;

                if (this.fetcherScreenX < 160) {
                    if (
                        this.lcdControl.enableWindow____5 &&
                        this.lY >= this.windowYpos
                    ) {
                        if ((this.fetcherScreenX === this.windowXpos - 7 ||
                            this.windowXpos < 7) &&
                            !this.fetcherWindowMode
                        ) {
                            if (!this.windowOnscreenYetThisFrame) {
                                this.windowCurrentLine = -(this.windowYpos - this.lY);
                                this.windowOnscreenYetThisFrame = true;
                            } else {
                                this.windowCurrentLine++;
                            }

                            this.fetcherBgFifoPos = 0;
                            this.fetcherStep = 0;
                            this.fetcherWindowMode = true;
                            this.fetcherX = this.fetcherScreenX;
                        }
                    }

                    if (this.fetcherBgFifoPos > 0) {
                        this.fetcherBgFifoPos--;

                        if (this.fetcherScreenX >= 0) {
                            const prePalette = this.fetcherBgFifoCol[this.fetcherBgFifoPos];
                            const palette = this.fetcherBgFifoPal;

                            const finalColor = this.cgbBgPalette.shades[palette][prePalette];

                            this.pre[this.fetcherScreenX] = prePalette;
                            this.noSprites[this.fetcherScreenX] = this.fetcherBgFifoObjPri[this.fetcherBgFifoPos];

                            this.imageGameboy.data[this.fetcherImageIndex + 0] = finalColor[0];
                            this.imageGameboy.data[this.fetcherImageIndex + 1] = finalColor[1];
                            this.imageGameboy.data[this.fetcherImageIndex + 2] = finalColor[2];

                            this.fetcherImageIndex += 4;
                        }

                        this.fetcherScreenX++;
                    }
                }
            }
        }
    }

    fetcherReset() {
        if (!this.gb.cgb) {
            this.fetcherStall = 8;
        } else {
            this.fetcherStall = 0;
            this.fetcherScreenX = -(this.scrX & 7);
        }

        this.fetcherX = 0;
        this.fetcherBgFifoPos = 0;
        this.fetcherFirstTile = false;
        this.fetcherPushed = false;
        this.fetcherStep = 0;
        this.fetcherCycles = 0;
        this.fetcherWindowMode = false;
        this.fetcherImageIndex = (this.lY * 160) * 4;
    }

    renderBgWindowScanline() {
        if (this.gb.cgb || this.lcdControl.bgWindowEnable0) {
            {
                // This is the Y value within a tile
                const y = (this.lY + this.scrY) & 0b111;

                const mapBaseBg = this.lcdControl.bgTilemapSelect_3 ? 1024 : 0;

                const mapIndex = (((this.lY + this.scrY) >> 3) << 5) & 1023;

                const mapOffset = mapBaseBg + mapIndex; // 1023   // CORRECT 0x1800

                // Divide by 8 to get which column drawing should start at
                let lineOffset = this.scrX >> 3;

                // How many pixels in we should start drawing at in the first tile
                const x = this.scrX & 0b111;                // CORRECT

                let imgIndex = 160 * 4 * (this.lY);

                const xPos = this.windowXpos - 7; // Get the real X position of the window
                const endAt = this.lcdControl.enableWindow____5 && this.lY >= this.windowYpos && xPos <= 160 ? xPos : 160;

                let pixel = -x;

                let bgDone = false;
                while (!bgDone) {
                    let tile = this.tilemap[mapOffset + lineOffset];
                    let attr = this.cgbTileAttrs[mapOffset + lineOffset]; // Update attributes too

                    let palette = this.cgbBgPalette.shades[attr.bgPalette];

                    if (this.lcdControl.bgWindowTiledataSelect__4 === false) {
                        // Two's Complement on high tileset
                        tile = unTwo8b(tile) + 256;
                    }

                    let adjY = attr.yFlip ? y ^ 7 : y;
                    let tileRow = this.tileset[attr.vramBank][tile][adjY];

                    if (!attr.xFlip) {
                        for (let i = 0; i < 8; i++) {
                            if (pixel >= endAt) {
                                bgDone = true;
                                break;
                            }
                            if (pixel >= 0) {
                                let prePalette = tileRow[i];
                                let color = palette[prePalette];

                                this.pre[pixel] = prePalette;
                                this.noSprites[pixel] = attr.ignoreSpritePriority ? 1 : 0;

                                this.imageGameboy.data[imgIndex + 0] = color[0];
                                this.imageGameboy.data[imgIndex + 1] = color[1];
                                this.imageGameboy.data[imgIndex + 2] = color[2];

                                imgIndex += 4;
                            }
                            pixel++;
                        }
                    } else {
                        for (let i = 7; i >= 0; i--) {
                            if (pixel >= endAt) {
                                bgDone = true;
                                break;
                            }
                            if (pixel >= 0) {
                                let prePalette = tileRow[i];
                                let color = palette[prePalette];

                                this.pre[pixel] = prePalette;
                                this.noSprites[pixel] = attr.ignoreSpritePriority ? 1 : 0;

                                this.imageGameboy.data[imgIndex + 0] = color[0];
                                this.imageGameboy.data[imgIndex + 1] = color[1];
                                this.imageGameboy.data[imgIndex + 2] = color[2];

                                imgIndex += 4;
                            }
                            pixel++;
                        }
                    }


                    // When this tile ends, read another
                    lineOffset++;
                    lineOffset &= 31; // Wrap around after 32 tiles (width of tilemap) 
                }
            }

            if (
                this.lcdControl.enableWindow____5 &&
                this.lY >= this.windowYpos &&
                this.windowXpos < 167
            ) {
                const mapBase = this.lcdControl.windowTilemapSelect___6 ? 1024 : 0;
                const mapIndex = ((this.windowCurrentLine >> 3) << 5) & 1023;
                let mapOffset = mapBase + mapIndex; // 1023   // CORRECT 0x1800

                const y = this.windowCurrentLine & 0b111; // CORRECT

                let pixel = this.windowXpos - 7;

                let imgIndex = 160 * 4 * (this.lY) + (pixel * 4);

                while (true) {
                    let tile = this.tilemap[mapOffset];
                    let attr = this.cgbTileAttrs[mapOffset]; // Update attributes too
                    let palette = this.cgbBgPalette.shades[attr.bgPalette];

                    if (this.lcdControl.bgWindowTiledataSelect__4 === false) {
                        // Two's Complement on high tileset
                        tile = unTwo8b(tile) + 256;
                    }

                    let adjY = attr.yFlip ? y ^ 7 : y;
                    let tileRow = this.tileset[attr.vramBank][tile][adjY];

                    if (!attr.xFlip) {
                        for (let i = 0; i < 8; i++) {
                            if (pixel >= 160) return;
                            let prePalette = tileRow[i];
                            let color = palette[prePalette];

                            this.pre[pixel] = prePalette;
                            this.noSprites[pixel] = attr.ignoreSpritePriority ? 1 : 0;

                            this.imageGameboy.data[imgIndex + 0] = color[0];
                            this.imageGameboy.data[imgIndex + 1] = color[1];
                            this.imageGameboy.data[imgIndex + 2] = color[2];

                            if (this.showBorders && (this.windowCurrentLine == 0 || pixel == 0)) {
                                const blue = [0, 0, 0xFF];

                                this.imageGameboy.data[imgIndex + 0] = blue[0];
                                this.imageGameboy.data[imgIndex + 1] = blue[1];
                                this.imageGameboy.data[imgIndex + 2] = blue[2];
                            }

                            imgIndex += 4;
                            pixel++;
                        }
                    } else {
                        for (let i = 7; i >= 0; i--) {
                            if (pixel >= 160) return;
                            let prePalette = tileRow[i];
                            let color = palette[prePalette];

                            this.pre[pixel] = prePalette;
                            this.noSprites[pixel] = attr.ignoreSpritePriority ? 1 : 0;

                            this.imageGameboy.data[imgIndex + 0] = color[0];
                            this.imageGameboy.data[imgIndex + 1] = color[1];
                            this.imageGameboy.data[imgIndex + 2] = color[2];

                            if (this.showBorders && (this.windowCurrentLine == 0 || pixel == 0)) {
                                const blue = [0, 0, 0xFF];

                                this.imageGameboy.data[imgIndex + 0] = blue[0];
                                this.imageGameboy.data[imgIndex + 1] = blue[1];
                                this.imageGameboy.data[imgIndex + 2] = blue[2];
                            }

                            imgIndex += 4;
                            pixel++;
                        }
                    }
                    mapOffset++;
                }
            }
        }
    }

    updateSTAT() {
        this.lcdStatus.coincidenceFlag_______2 = this.lY === this.lYCompare;

        // Determine LCD status interrupt conditions
        this.lcdStatusCoincidence = this.lcdStatus.lyCoincidenceInterrupt6 === true && this.lcdStatus.coincidenceFlag_______2 === true;
        this.lcdStatusMode0 = this.lcdStatus.mode0HblankInterrupt__3 === true && (this.lcdStatus.mode & 3) === LCDMode.HBLANK;
        this.lcdStatusMode1 = this.lcdStatus.mode1VblankInterrupt__4 === true && (this.lcdStatus.mode & 3) === LCDMode.VBLANK;
        this.lcdStatusMode2 = this.lcdStatus.mode2OamInterrupt_____5 === true && (this.lcdStatus.mode & 3) === LCDMode.OAM;

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
            this.gb.cpu.if.lcdStat = true;
            this.lcdStatusFired = true;

            // console.log(`${this.lYCompare} === ${this.lY} STAT IRQ LINECLOCK: ${this.lineClock}`);
        }
    }

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    reset() {
        this.totalFrameCount = 0;

        this.vram = [
            new Uint8Array(0x2000),
            new Uint8Array(0x2000)
        ];

        this.oam = new Uint8Array(160);
        this.totalFrameCount = 0;

        // [tile][pixel]
        this.tileset = [
            new Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Uint8Array(8))), // For bank 0
            new Array(384).fill(0).map(() => new Array(8).fill(0).map(() => new Uint8Array(8))), // For bank 1
        ];

        this.tilemap = new Uint8Array(2048);
        this.cgbTileAttrs = new Array(2048).fill(0).map(() => new CGBTileFlags());

        this.lcdControl = new LCDCRegister();
        this.lcdStatus = new LCDStatusRegister();

        this.scrY = 0;
        this.scrX = 0;

        this.lineClock = 0;
        this.setMode(LCDMode.GLITCHED_OAM);
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

        this.pre = new Uint8Array(160);
        this.noSprites = new Uint8Array(160);
        this.imageTileset = new ImageData(new Uint8ClampedArray(256 * 192 * 4).fill(0xFF), 256, 192);

        this.windowCurrentLine = 0;
        this.windowOnscreenYetThisFrame = false;

        this.lineClock = 0;

        this.bgDrawn = false;
        this.windowDrawn = false;
        // this.mode3CyclesOffset = 0;

        this.lcdStatusMode0 = false;
        this.lcdStatusMode1 = false;
        this.lcdStatusMode2 = false;
        this.lcdStatusCoincidence = false;

        this.lcdStatusConditionMet = false;
        this.lcdStatusFired = false;

        this.fetcherCycles = 0;

        this.fetcherStall = 0;

        this.fetcherStep = PixelFetcher.SLEEP0;
        this.fetcherTileIndex = 0;
        this.fetcherTileAttrs = new CGBTileFlags();
        this.fetcherX = 0;
        this.fetcherScreenX = 0;

        this.fetcherTileY = 0;

        this.fetcherBgFifoCol = new Uint8Array(8); // BG Color
        this.fetcherBgFifoPal = 0;
        this.fetcherBgFifoObjPri = new Uint8Array(8); // BG Sprite Priority
        this.fetcherBgFifoBgPri = new Uint8Array(8); // BG Priotiy
        this.fetcherBgFifoPos = 0;

        this.fetcherFirstTile = false;
        this.fetcherPushed = false;
    }

    writeOam(index: number, value: number) {
        index -= 0xFE00;

        if (!this.gb.dma.oamDmaRunning &&
            (
                this.gb.gpu.lcdStatus.mode === LCDMode.VBLANK ||
                this.gb.gpu.lcdStatus.mode === LCDMode.HBLANK ||
                this.gb.gpu.lcdStatus.mode === LCDMode.LINE153 ||
                this.gb.gpu.lcdStatus.mode === LCDMode.GLITCHED_OAM
            )
        ) {
            if (this.oam[index] !== value) {
                this.oam[index] = value;
            }
        }
    }

    readOam(index: number): number {
        index -= 0xFE00;

        if (
            !this.gb.dma.oamDmaRunning &&
            (
                this.gb.gpu.lcdStatus.mode === LCDMode.VBLANK ||
                this.gb.gpu.lcdStatus.mode === LCDMode.HBLANK ||
                this.gb.gpu.lcdStatus.mode === LCDMode.LINE153 ||
                this.gb.gpu.lcdStatus.mode === LCDMode.GLITCHED_OAM
            )
        ) {
            return this.oam[index];
        } else {
            return 0xFF;
        }
    }

    read(index: number): number {
        // During mode 3, the CPU cannot access VRAM or CGB palette data
        if (this.lcdStatus.mode === LCDMode.VRAM) return 0xFF;
        return this.vram[this.vramBank][index & 0x7FFF];
    }

    write(index: number, value: number) {
        // During mode 3, the CPU cannot access VRAM or CGB palette data
        if (this.lcdStatus.mode === LCDMode.VRAM) return;
        index |= 0x8000;
        let adjIndex = index & 0x7FFF;

        if (this.vram[this.vramBank][adjIndex] !== value) {
            this.vram[this.vramBank][adjIndex] = value;

            const tile = adjIndex >> 4;

            // Write to tile set
            if (index >= 0x8000 && index < 0x9800) {
                adjIndex &= 0xFFFE;

                // Work out which tile and row was updated
                const y = (index & 0xF) >> 1;

                for (let x = 0; x < 8; x++) {
                    // Find bit index for this pixel
                    const byte0 = this.vram[this.vramBank][adjIndex];
                    const byte1 = this.vram[this.vramBank][adjIndex + 1];

                    const mask = 0b1 << (7 - x);
                    const lsb = byte0 & mask;
                    const msb = byte1 & mask;

                    // Update tile set
                    this.tileset[this.vramBank][tile][y][x] =
                        (lsb !== 0 ? 1 : 0) +
                        (msb !== 0 ? 2 : 0);
                }
            }

            if (this.vramBank === 0) {
                // Write to tile map
                if (index >= 0x9800 && index < 0xA000) {
                    if (this.tilemap[index - 0x9800] !== value) {
                        this.tilemap[index - 0x9800] = value;
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

    checkMode3HwioWrite() {
        if (this.mode === LCDMode.VRAM)
            this.mode3HwioWritten = true;

        this.fetcherFlush();
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
            case 0xFF6C: // Undocumented register 0xFF6C
                if (this.gb.cgb) {
                    return 0xFE | (this.cgbObjPriority ? 1 : 0);
                } else {
                    return 0xFF;
                }
                break;
        }

        return 0xFF;
    }

    writeHwio(addr: number, value: number) {
        switch (addr) {
            case 0xFF40: // LCD Control
                this.checkMode3HwioWrite();
                this.lcdControl.setNumerical(value);
                break;
            case 0xFF41: // LCDC Status
                this.lcdStatus.setNumerical(value);
                this.updateSTAT();
                break;
            case 0xFF42:
                this.checkMode3HwioWrite();
                this.scrY = value;
                break;
            case 0xFF43:
                this.checkMode3HwioWrite();
                this.scrX = value;
                break;
            case 0xFF44: break;
            case 0xFF45:
                this.lYCompare = value;
                this.updateSTAT();
                break;
            case 0xFF46:
                this.gb.dma.setupOamDma(value << 8);
                break;
            case 0xFF47: // BG Palette
                const oldValue = this.dmgBgPalette;
                this.dmgBgPalette = value;
                this.checkMode3HwioWrite();

                // PPU time travel?????
                if (this.fetcherCycles > 2) {
                    this.fetcherAdvance(this.fetcherCycles - 2);
                    this.fetcherCycles = 1;


                    if (this.gb.cgb === false) {
                        this.setDmgBgPalette(0, ((value | oldValue) >> 0) & 0b11);
                        this.setDmgBgPalette(1, ((value | oldValue) >> 2) & 0b11);
                        this.setDmgBgPalette(2, ((value | oldValue) >> 4) & 0b11);
                        this.setDmgBgPalette(3, ((value | oldValue) >> 6) & 0b11);
                    }

                    this.fetcherAdvance(1);
                }

                if (this.gb.cgb === false) {
                    this.setDmgBgPalette(0, (value >> 0) & 0b11);
                    this.setDmgBgPalette(1, (value >> 2) & 0b11);
                    this.setDmgBgPalette(2, (value >> 4) & 0b11);
                    this.setDmgBgPalette(3, (value >> 6) & 0b11);
                }
                break;
            case 0xFF48: // Palette OBJ 0
                this.checkMode3HwioWrite();
                this.dmgObj0Palette = value;
                if (this.gb.cgb === false) {
                    this.setDmgObjPalette(0, (value >> 0) & 0b11);
                    this.setDmgObjPalette(1, (value >> 2) & 0b11);
                    this.setDmgObjPalette(2, (value >> 4) & 0b11);
                    this.setDmgObjPalette(3, (value >> 6) & 0b11);
                }
                break;
            case 0xFF49: // Palette OBJ 1
                this.checkMode3HwioWrite();
                this.dmgObj1Palette = value;
                if (this.gb.cgb === false) {
                    this.setDmgObjPalette(4, (value >> 0) & 0b11);
                    this.setDmgObjPalette(5, (value >> 2) & 0b11);
                    this.setDmgObjPalette(6, (value >> 4) & 0b11);
                    this.setDmgObjPalette(7, (value >> 6) & 0b11);
                }
                break;
            case 0xFF4A: // Window Y Position
                this.checkMode3HwioWrite();
                this.windowYpos = value;
                break;
            case 0xFF4B: // Window X Position
                this.checkMode3HwioWrite();
                this.windowXpos = value;
                break;
            case 0xFF4F: // CGB - VRAM Bank
                if (this.gb.cgb === true) {
                    this.vramBank = (value & 1);
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
                    if (this.lcdStatus.mode !== LCDMode.VRAM) {
                        if (this.cgbBgPalette.data[this.cgbBgPaletteIndex] !== value) {
                            this.cgbBgPalette.data[this.cgbBgPaletteIndex] = value;
                            this.cgbBgPalette.update(this.cgbBgPaletteIndex >> 3, (this.cgbBgPaletteIndex >> 1) & 3);
                        }
                    }

                    if (this.cgbBgPaletteIndexAutoInc === true) {
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
                    if (this.lcdStatus.mode !== LCDMode.VRAM) {
                        if (this.cgbObjPalette.data[this.cgbObjPaletteIndex] !== value) {
                            this.cgbObjPalette.data[this.cgbObjPaletteIndex] = value;
                            this.cgbObjPalette.update(this.cgbObjPaletteIndex >> 3, (this.cgbObjPaletteIndex >> 1) & 3);
                        }
                    }

                    if (this.cgbObjPaletteIndexAutoInc === true) {
                        this.cgbObjPaletteIndex++;
                        this.cgbObjPaletteIndex &= 0x3F;
                    }
                }
                break;
            case 0xFF6C: // Undocumented register 0xFF6C
                if (this.gb.cgb) {
                    this.cgbObjPriority = (value & 1) !== 0;
                }
                break;
        }
    }

    setDmgBgPalette(palette: number, color: number) {
        const i = palette * 2;
        const c = colors555[color];
        const cv = (c[0] & 31) | ((c[1] & 31) << 5) | ((c[2] & 31) << 10);

        const upper = (cv >> 8) & 0xFF;
        const lower = cv & 0xFF;

        this.cgbBgPalette.data[i + 1] = upper;
        this.cgbBgPalette.data[i + 0] = lower;

        this.cgbBgPalette.update(0, palette);
    }

    setDmgObjPalette(palette: number, color: number) {
        const i = palette * 2;
        const c = colors555[color];
        const cv = (c[0] & 31) | ((c[1] & 31) << 5) | ((c[2] & 31) << 10);

        const upper = (cv >> 8) & 0xFF;
        const lower = cv & 0xFF;

        this.cgbObjPalette.data[i + 0] = lower;
        this.cgbObjPalette.data[i + 1] = upper;

        this.cgbObjPalette.update(palette >> 2, palette & 3);
    }

    renderBlankScanline() {
        let imgIndex = 160 * 4 * (this.lY);
        for (let i = 0; i < 160; i++) {
            this.imageGameboy.data[imgIndex + 0] = 0xFF;
            this.imageGameboy.data[imgIndex + 1] = 0xFF;
            this.imageGameboy.data[imgIndex + 2] = 0xFF;

            imgIndex += 4;
        }
    }

    scanOAM() {
        this.scannedEntriesCount = 0;

        const HEIGHT = this.lcdControl.spriteSize______2 ? 16 : 8;

        // OAM Scan, maximum of 10 sprites
        for (let sprite = 0; sprite < 40 && this.scannedEntriesCount < 10; sprite++) {
            const base = sprite * 4;

            const yPos = this.oam[base + 0];
            const xPos = this.oam[base + 1];
            const tile = this.oam[base + 2];

            // Continue to next sprite if it is offscreen
            if (xPos < 0 || xPos >= 168 || yPos < 0 || yPos >= 160) continue;
            const screenYPos = yPos - 16;

            // Push sprite to scanned if it is on the current scanline
            if (this.lY >= screenYPos && this.lY < screenYPos + HEIGHT) {
                const entry = this.scannedEntries[this.scannedEntriesCount];
                entry.xPos = xPos;
                entry.yPos = yPos;
                entry.tile = tile;
                entry.flags.setNumerical(this.oam[base + 3]);
                this.scannedEntriesCount++;
            }
        }
    }

    renderSprites() {
        for (let sprite = 0; sprite < this.scannedEntriesCount; sprite++) {
            // Render sprites in OAM order (reverse of scan order)
            const scannedSprite = this.scannedEntries[this.scannedEntriesCount - sprite - 1];

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

            const h = this.lY > screenYPos + 7 ? 1 : 0;

            // Offset tile by +1 if rendering the top half of an 8x16 sprite
            if (flags.yFlip && this.lcdControl.spriteSize______2) {
                if (h === 0) {
                    tile += 1;
                }
            } else {
                tile += h;
            }

            const pixelY = flags.yFlip ? y ^ 7 : y;
            const tileRow = this.tileset[flags.vramBank][tile][pixelY];

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

                const tileX = flags.xFlip ? x ^ 7 : x;

                // Simulate transparency 
                const prePalette = tileRow[tileX];
                if (prePalette === 0) { imgIndex += 4; continue; }

                const pixel = this.cgbObjPalette.shades[pal][prePalette];

                const noTransparency = this.gb.cgb && !this.lcdControl.bgWindowEnable0;
                if (noTransparency === false) {
                    if (
                        (flags.behindBG && this.pre[screenXPos] !== 0) ||
                        (this.noSprites[screenXPos] && this.pre[screenXPos] !== 0)
                    ) { imgIndex += 4; continue; }
                }

                this.imageGameboy.data[imgIndex + 0] = pixel[0];
                this.imageGameboy.data[imgIndex + 1] = pixel[1];
                this.imageGameboy.data[imgIndex + 2] = pixel[2];

                imgIndex += 4;
            }
        }
    }

    renderTiles() {
        const WIDTH = 256;

        for (let i = 0; i < 2; i++) {
            this.tileset[i].forEach((tile, tileIndex) => {
                for (let tileY = 0; tileY < 8; tileY++) {
                    const offset = (256 * 96) * i;
                    const x = (tileIndex << 3) & 255;
                    const y = tileY + (8 * (tileIndex >> 5));

                    let index = 4 * (((y * WIDTH) + x) + offset);
                    for (let tileX = 0; tileX < 8; tileX++) {
                        const c = this.cgbBgPalette.shades[0][tile[tileY][tileX]];

                        this.imageTileset.data[index + 0] = c[0];
                        this.imageTileset.data[index + 1] = c[1];
                        this.imageTileset.data[index + 2] = c[2];

                        index += 4;
                    }
                }
            });
        }
    }

    // Completely refresh the cached tileset from VRAM
    regenerateTileset() {
        for (let i = 0; i < 0x1800; i++) {
            const tile = i >> 4;

            let adjIndex = i & 0xFFFE;

            // Work out which tile and row was updated
            const y = (i & 0xF) >> 1;

            for (let bank = 0; bank < 2; bank++) {
                for (let pixelX = 0; pixelX < 8; pixelX++) {
                    // Find bit index for this pixel
                    let byte0 = this.vram[bank][adjIndex];
                    let byte1 = this.vram[bank][adjIndex + 1];

                    let mask = 0b1 << (7 - pixelX);
                    let lsb = byte0 & mask;
                    let msb = byte1 & mask;

                    this.tileset[bank][tile][y][pixelX] =
                        (lsb !== 0 ? 1 : 0) +
                        (msb !== 0 ? 2 : 0);
                }
            }
        }
    }

    serialize(state: Serializer) {
        state.PUT_8ARRAY(this.vram[0], 0x2000);

        if (this.gb.cgb)
            state.PUT_8ARRAY(this.vram[1], 0x2000);

        state.PUT_8ARRAY(this.oam, 160);
        state.PUT_8ARRAY(this.tilemap, 2048);

        if (this.gb.cgb)
            for (let i = 0; i < 2048; i++) {
                let attr = this.cgbTileAttrs[i];

                state.PUT_8(attr.bgPalette);
                state.PUT_8(attr.vramBank);
                state.PUT_BOOL(attr.ignoreSpritePriority);
                state.PUT_BOOL(attr.xFlip);
                state.PUT_BOOL(attr.yFlip);
            }

        state.PUT_BOOL(this.lcdControl.bgWindowEnable0);
        state.PUT_BOOL(this.lcdControl.spriteDisplay___1);
        state.PUT_BOOL(this.lcdControl.spriteSize______2);
        state.PUT_BOOL(this.lcdControl.bgTilemapSelect_3);
        state.PUT_BOOL(this.lcdControl.bgWindowTiledataSelect__4);
        state.PUT_BOOL(this.lcdControl.enableWindow____5);
        state.PUT_BOOL(this.lcdControl.windowTilemapSelect___6);
        state.PUT_BOOL(this.lcdControl.lcdDisplayEnable7);

        state.PUT_8(this.lcdStatus.mode);
        state.PUT_BOOL(this.lcdStatus.coincidenceFlag_______2);
        state.PUT_BOOL(this.lcdStatus.mode0HblankInterrupt__3);
        state.PUT_BOOL(this.lcdStatus.mode1VblankInterrupt__4);
        state.PUT_BOOL(this.lcdStatus.mode2OamInterrupt_____5);
        state.PUT_BOOL(this.lcdStatus.lyCoincidenceInterrupt6);

        state.PUT_8(this.scrY);
        state.PUT_8(this.scrX);

        state.PUT_8(this.lY);
        state.PUT_8(this.lYCompare);

        state.PUT_8(this.windowXpos);
        state.PUT_8(this.windowYpos);

        state.PUT_8(this.cgbBgPaletteIndex);
        state.PUT_BOOL(this.cgbBgPaletteIndexAutoInc);
        state.PUT_8ARRAY(this.cgbBgPalette.data, 64);

        state.PUT_8(this.cgbObjPaletteIndex);
        state.PUT_BOOL(this.cgbObjPaletteIndexAutoInc);
        state.PUT_8ARRAY(this.cgbObjPalette.data, 64);

        state.PUT_BOOL(this.cgbObjPriority);

        state.PUT_8(this.vramBank);

        state.PUT_8(this.dmgBgPalette);
        state.PUT_8(this.dmgObj0Palette);
        state.PUT_8(this.dmgObj1Palette);

        state.PUT_BOOL(this.lcdStatusMode0);
        state.PUT_BOOL(this.lcdStatusMode1);
        state.PUT_BOOL(this.lcdStatusMode2);
        state.PUT_BOOL(this.lcdStatusCoincidence);
        state.PUT_BOOL(this.lcdStatusConditionMet);
        state.PUT_BOOL(this.lcdStatusFired);

        state.PUT_16LE(this.lineClock);

        state.PUT_8(this.windowCurrentLine);
        state.PUT_BOOL(this.windowOnscreenYetThisFrame);

        state.PUT_8(this.fetcherCycles);
        state.PUT_8(this.fetcherStall);

        state.PUT_16LE(this.fetcherStep);
        state.PUT_16LE(this.fetcherTileIndex);
        state.PUT_16LE(this.fetcherX);
        state.PUT_16LE(this.fetcherScreenX);

        state.PUT_8(this.fetcherTileY);
        state.PUT_8ARRAY(this.fetcherTileData, 8);

        state.PUT_8ARRAY(this.fetcherBgFifoCol, 8);
        state.PUT_8(this.fetcherBgFifoPal);
        state.PUT_8ARRAY(this.fetcherBgFifoObjPri, 8);
        state.PUT_8ARRAY(this.fetcherBgFifoBgPri, 8);
        state.PUT_8(this.fetcherBgFifoPos);

        state.PUT_BOOL(this.fetcherFirstTile);
        state.PUT_BOOL(this.fetcherPushed);

        state.PUT_BOOL(this.fetcherWindowMode);
    }

    deserialize(state: Serializer) {
        this.vram[0] = state.GET_8ARRAY(0x2000);

        if (this.gb.cgb)
            this.vram[1] = state.GET_8ARRAY(0x2000);

        this.regenerateTileset();

        this.oam = state.GET_8ARRAY(160);
        this.tilemap = state.GET_8ARRAY(2048);

        if (this.gb.cgb)
            for (let i = 0; i < 2048; i++) {
                let attr = this.cgbTileAttrs[i];

                attr.bgPalette = state.GET_8();
                attr.vramBank = state.GET_8();
                attr.ignoreSpritePriority = state.GET_BOOL();
                attr.xFlip = state.GET_BOOL();
                attr.yFlip = state.GET_BOOL();
            }

        this.lcdControl.bgWindowEnable0 = state.GET_BOOL();
        this.lcdControl.spriteDisplay___1 = state.GET_BOOL();
        this.lcdControl.spriteSize______2 = state.GET_BOOL();
        this.lcdControl.bgTilemapSelect_3 = state.GET_BOOL();
        this.lcdControl.bgWindowTiledataSelect__4 = state.GET_BOOL();
        this.lcdControl.enableWindow____5 = state.GET_BOOL();
        this.lcdControl.windowTilemapSelect___6 = state.GET_BOOL();
        this.lcdControl.lcdDisplayEnable7 = state.GET_BOOL();

        this.lcdStatus.mode = state.GET_8();
        this.lcdStatus.coincidenceFlag_______2 = state.GET_BOOL();
        this.lcdStatus.mode0HblankInterrupt__3 = state.GET_BOOL();
        this.lcdStatus.mode1VblankInterrupt__4 = state.GET_BOOL();
        this.lcdStatus.mode2OamInterrupt_____5 = state.GET_BOOL();
        this.lcdStatus.lyCoincidenceInterrupt6 = state.GET_BOOL();

        this.scrY = state.GET_8();
        this.scrX = state.GET_8();

        this.lY = state.GET_8();
        this.lYCompare = state.GET_8();

        this.windowXpos = state.GET_8();
        this.windowYpos = state.GET_8();

        this.cgbBgPaletteIndex = state.GET_8();
        this.cgbBgPaletteIndexAutoInc = state.GET_BOOL();
        this.cgbBgPalette.data = state.GET_8ARRAY(64);

        this.cgbObjPaletteIndex = state.GET_8();
        this.cgbObjPaletteIndexAutoInc = state.GET_BOOL();
        this.cgbObjPalette.data = state.GET_8ARRAY(64);

        this.cgbBgPalette.updateAll();
        this.cgbObjPalette.updateAll();

        this.cgbObjPriority = state.GET_BOOL();

        this.vramBank = state.GET_8();

        this.dmgBgPalette = state.GET_8();
        this.dmgObj0Palette = state.GET_8();
        this.dmgObj1Palette = state.GET_8();

        this.lcdStatusMode0 = state.GET_BOOL();
        this.lcdStatusMode1 = state.GET_BOOL();
        this.lcdStatusMode2 = state.GET_BOOL();
        this.lcdStatusCoincidence = state.GET_BOOL();
        this.lcdStatusConditionMet = state.GET_BOOL();
        this.lcdStatusFired = state.GET_BOOL();

        this.lineClock = state.GET_16LE();

        this.windowCurrentLine = state.GET_8();
        this.windowOnscreenYetThisFrame = state.GET_BOOL();

        this.fetcherCycles = state.GET_8();
        this.fetcherStall = state.GET_8();

        this.fetcherStep = state.GET_16LE();
        this.fetcherTileIndex = state.GET_16LE();
        this.fetcherX = state.GET_16LE();
        this.fetcherScreenX = state.GET_16LE();

        this.fetcherTileY = state.GET_8();
        this.fetcherTileData = state.GET_8ARRAY(8);

        this.fetcherBgFifoCol = state.GET_8ARRAY(8);
        this.fetcherBgFifoPal = state.GET_8();
        this.fetcherBgFifoObjPri = state.GET_8ARRAY(8);
        this.fetcherBgFifoBgPri = state.GET_8ARRAY(8);
        this.fetcherBgFifoPos = state.GET_8();

        this.fetcherFirstTile = state.GET_BOOL();
        this.fetcherPushed = state.GET_BOOL();

        this.fetcherWindowMode = state.GET_BOOL();
    }
}

export default GPU;