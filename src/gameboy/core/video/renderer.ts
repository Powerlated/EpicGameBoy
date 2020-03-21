import GPU, { colors555, OAMFlags } from "./gpu";
import GPUCanvas from "./canvas";

export class GPURenderer {
    gpu: GPU;

    imageGameboyArr = new Uint8ClampedArray(160 * 144 * 4);
    imageGameboyPre = new Uint8Array(160 * 144);
    imageGameboy = new ImageData(this.imageGameboyArr, 160, 144);
    imageTilesetArr = new Uint8ClampedArray(256 * 96 * 4);


    showBorders = false;

    constructor(gpu: GPU) {
        this.gpu = gpu;
    }

    // TODO: Implement background transparency
    renderScanline() {
        // writeDebug("Rendering a scanline @ SCROLL Y:" + this.gpu.scrY);
        if (this.gpu.lcdControl.bgWindowEnable0) {
            this.renderBg();
            if (this.gpu.lcdControl.enableWindow____5) {
                this.renderWindow();
            }
        }

        if (this.gpu.lcdControl.spriteDisplay___1) {
            this.renderSprites();
        }
    }

    renderBg() {
        const y = (this.gpu.lcdcY + this.gpu.scrY) & 0b111; // CORRECT
        let x = (this.gpu.scrX) & 0b111;                // CORRECT

        const mapBaseBg = this.gpu.lcdControl.bgTilemapSelect_3 ? 1024 : 0;

        const mapIndex = (((this.gpu.lcdcY + this.gpu.scrY) >> 3) * 32) & 1023;
        const mapOffset = mapBaseBg + mapIndex; // 1023   // CORRECT 0x1800

        let lineOffset = this.gpu.scrX >> 3;

        let attr = this.gpu.cgbTileAttrs[mapOffset + lineOffset];
        let tile = this.gpu.tilemap[mapOffset + lineOffset]; // Add line offset to get correct starting tile

        let canvasIndex = 160 * 4 * (this.gpu.lcdcY);

        const xPos = this.gpu.windowXpos - 7;
        // Loop through every single horizontal pixel for this line 
        for (let i = 0; i < 160; i++) {
            // Don't bother drawing if WINDOW is overlayingf
            if (this.gpu.lcdControl.enableWindow____5 && this.gpu.lcdcY >= this.gpu.windowYpos && i >= xPos) break;

            // Two's Complement on high tileset
            let tileOffset = 0;
            if (!this.gpu.lcdControl.bgWindowTiledataSelect__4) {
                tileOffset = 256;
                if (tile > 127) {
                    tile = tile - 256;
                }
            }

            let tileset = attr.vramBank ? this.gpu.tileset1 : this.gpu.tileset0;
            const prePalette = tileset[tile + tileOffset][y][x];
            const pixel = this.gpu.cgbBgPalette.shades[attr.bgPalette][prePalette];
            // Re-map the tile pixel through the palette

            // Plot the pixel to canvas
            this.imageGameboy.data[canvasIndex + 0] = pixel[0];
            this.imageGameboy.data[canvasIndex + 1] = pixel[1];
            this.imageGameboy.data[canvasIndex + 2] = pixel[2];
            this.imageGameboy.data[canvasIndex + 3] = 255;

            this.imageGameboyPre[canvasIndex >> 2] = prePalette;

            // Scroll X/Y debug
            if (this.showBorders && (((mapOffset + lineOffset) % 32 === 0 && x === 0) || (mapIndex < 16 && y === 0))) {
                this.imageGameboy.data[canvasIndex + 0] = 0xFF;
                this.imageGameboy.data[canvasIndex + 1] = 0;
                this.imageGameboy.data[canvasIndex + 2] = 0;
                this.imageGameboy.data[canvasIndex + 3] = 255;
            }

            canvasIndex += 4;

            // When this tile ends, read another
            x++;
            if (x === 8) {
                x = 0;
                lineOffset++;
                lineOffset &= 31; // Wrap around after 32 tiles (width of tilemap) 
                tile = this.gpu.tilemap[mapOffset + lineOffset];
            }
        }
    }

    renderWindow() {
        const xPos = this.gpu.windowXpos - 7;
        const y = (this.gpu.lcdcY - this.gpu.windowYpos) & 0b111; // CORRECT

        // Make sure window is onscreen Y
        if (this.gpu.lcdcY >= this.gpu.windowYpos) {
            let x = 0;                // CORRECT

            const mapBase = this.gpu.lcdControl.windowTilemapSelect___6 ? 1024 : 0;

            const mapIndex = (((this.gpu.lcdcY - this.gpu.windowYpos) >> 3) * 32) & 1023;
            let mapOffset = mapBase + mapIndex; // 1023   // CORRECT 0x1800

            let attr = this.gpu.cgbTileAttrs[mapOffset];
            let tile = this.gpu.tilemap[mapOffset]; // Add line offset to get correct starting tile

            let canvasIndex = 160 * 4 * (this.gpu.lcdcY) + (xPos * 4);

            // Loop through every single horizontal pixel for this line 
            for (let i = 0; i < 160; i++) {
                if (i >= xPos) {
                    // Two's Complement on high tileset
                    let tileOffset = 0;
                    if (!this.gpu.lcdControl.bgWindowTiledataSelect__4) {
                        tileOffset = 256;
                        if (tile > 127) {
                            tile = tile - 256;
                        }
                    }

                    let tileset = attr.vramBank ? this.gpu.tileset1 : this.gpu.tileset0;
                    const prePalette = tileset[tile + tileOffset][y][x];
                    let pixel = this.gpu.cgbBgPalette.shades[attr.bgPalette][prePalette];
                    // Re-map the tile pixel through the palette

                    if (!this.gpu.lcdControl.bgWindowEnable0) pixel = new Uint8Array([0xFF, 0xFF, 0xFF]);

                    // Plot the pixel to canvas
                    this.imageGameboy.data[canvasIndex + 0] = pixel[0];
                    this.imageGameboy.data[canvasIndex + 1] = pixel[1];
                    this.imageGameboy.data[canvasIndex + 2] = pixel[2];
                    this.imageGameboy.data[canvasIndex + 3] = 255;

                    this.imageGameboyPre[canvasIndex >> 2] = prePalette;

                    // Window X debug
                    if (this.showBorders && (((mapOffset) % 32 === 0 && x === 0) || (mapIndex < 16 && y === 0))) {
                        this.imageGameboy.data[canvasIndex + 0] = 0;
                        this.imageGameboy.data[canvasIndex + 1] = 0;
                        this.imageGameboy.data[canvasIndex + 2] = 0xFF;
                        this.imageGameboy.data[canvasIndex + 3] = 255;
                    }
                    canvasIndex += 4;

                    // When this tile ends, read another
                    x++;
                    if (x === 8) {
                        x = 0;
                        mapOffset++;
                        tile = this.gpu.tilemap[mapOffset];
                        // if (GPU._bgtile === 1 && tile < 128) tile += 256;
                    }
                }
            }
        }
    }

    renderSprites() {
        const spriteCount = 0;
        // 40 sprites in total in OAM
        for (let sprite = 0; sprite < 40; sprite++) {
            const base = sprite * 4;

            const yPos = this.gpu.oam[base + 0];
            const xPos = this.gpu.oam[base + 1];
            const tile = this.gpu.oam[base + 2];

            let screenYPos = yPos - 16;
            let screenXPos = xPos - 8;

            const HEIGHT = this.gpu.lcdControl.spriteSize______2 ? 16 : 8;

            // Render sprite only if it is visible on this scanline
            if (
                (this.gpu.lcdcY + 8 >= screenYPos && (this.gpu.lcdcY <= (screenYPos + HEIGHT + 8)))
            ) {
                // TODO: Fix sprite limiting
                // if (spriteCount > 10) return; // GPU can only draw 10 sprites per scanline
                // spriteCount++;

                const flags = new OAMFlags();
                flags.numerical = this.gpu.oam[base + 3];

                const y = this.gpu.lcdcY & 7;

                for (let h = 8; h <= HEIGHT; h += 8)
                    for (let x = 0; x < 8; x++) {
                        screenYPos = yPos - (24 - h);
                        screenXPos = xPos - 8;

                        screenYPos += y;
                        screenXPos += x;

                        if (screenXPos >= 0 && screenYPos >= 0 && screenXPos < 160) {
                            const pixelX = flags.xFlip ? 7 - x : x;
                            const pixelY = flags.yFlip ? 7 - y : y;

                            const canvasIndex = ((screenYPos * 160) + screenXPos) * 4;

                            // Offset tile by +1 if rendering the top half of an 8x16 sprite
                            let tileset = flags.vramBank ? this.gpu.tileset1 : this.gpu.tileset0;
                            const prePalette = tileset[tile + ((h / 8) - 1)][pixelY][pixelX];
                            let pal = this.gpu.gb.cgb ? flags.paletteNumberCGB : + flags.paletteNumberDMG;
                            const pixel = this.gpu.cgbObjPalette.shades[pal][prePalette];

                            if (flags.behindBG && this.imageGameboyPre[canvasIndex >> 2] != 0) continue;

                            // Simulate transparency before transforming through object palette
                            if (prePalette !== 0) {
                                this.imageGameboy.data[canvasIndex + 0] = pixel[0];
                                this.imageGameboy.data[canvasIndex + 1] = pixel[1];
                                this.imageGameboy.data[canvasIndex + 2] = pixel[2];
                                this.imageGameboy.data[canvasIndex + 3] = 255;
                            }

                            // Border debug
                            if (this.showBorders && (pixelX === 0 || pixelX === 7 || pixelY === 0 || pixelY === 7)) {
                                if (this.gpu.lcdControl.spriteSize______2) {
                                    this.imageGameboy.data[canvasIndex + 0] = 0xFF;
                                    this.imageGameboy.data[canvasIndex + 1] = 0;
                                    this.imageGameboy.data[canvasIndex + 2] = 0xFF;
                                    this.imageGameboy.data[canvasIndex + 3] = 255;
                                } else {
                                    this.imageGameboy.data[canvasIndex + 0] = 0;
                                    this.imageGameboy.data[canvasIndex + 1] = 0xFF;
                                    this.imageGameboy.data[canvasIndex + 2] = 0;
                                    this.imageGameboy.data[canvasIndex + 3] = 255;
                                }
                            }
                        }
                    }
            }
        }
    }
    // 160 x 144
    /*  renderTiles() {
         this.gpu.tileset.forEach((v1, i1) => {
             v1.forEach((v2, i2) => {
                 v2.forEach((pixel, i3) => {
                     if (pixel === undefined) return;
 
                     const WIDTH = 256;
 
                     const x = ((i1 * 8) + i3) % WIDTH;
                     const row = Math.floor(((i1 * 8) + i3) / WIDTH);
                     const y = i2 + (row * 8);
 
                     const c = colors[this.gpu.bgPaletteData.shades[pixel]];
 
                     this.imageTilesetArr[4 * ((y * WIDTH) + x) + 0] = c[0];
                     this.imageTilesetArr[4 * ((y * WIDTH) + x) + 1] = c[1];
                     this.imageTilesetArr[4 * ((y * WIDTH) + x) + 2] = c[2];
                     this.imageTilesetArr[4 * ((y * WIDTH) + x) + 3] = 0xFF; // 100% alpha
                 });
             });
         });
     } */
}