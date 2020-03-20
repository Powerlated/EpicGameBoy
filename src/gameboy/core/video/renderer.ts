import GPU, { colors, OAMFlags } from "./gpu";
import GPUCanvas from "./canvas";

export class GPURenderer {
    gpu: GPU;

    imageGameboyArr = new Uint8ClampedArray(160 * 144 * 4);
    imageGameboy = new ImageData(this.imageGameboyArr, 160, 144);
    imageTilesetArr = new Uint8ClampedArray(256 * 96 * 4);

    showBorders = false;

    constructor(gpu: GPU) {
        this.gpu = gpu;

        const cTileset = document.getElementById("tileset") as HTMLCanvasElement;
        this.gpu.canvas.ctxTileset = cTileset.getContext("2d")!;
    }

    // TODO: Implement background transparency
    renderScanline() {
        if (this.gpu.lcdControl.bgWindowEnable0) {
            this.renderVram();
        }

        if (this.gpu.lcdControl.spriteDisplay___1)
            this.renderSprites();
    }

    renderVram() {
        // writeDebug("Rendering a scanline @ SCROLL Y:" + this.gpu.scrY);
        this.renderBg();
        if (this.gpu.lcdControl.enableWindow____5) {
            this.renderWindow();
        }
    }

    renderBg() {
        const y = (this.gpu.lcdcY + this.gpu.scrY) & 0b111; // CORRECT
        let x = (this.gpu.scrX) & 0b111;                // CORRECT

        const mapBaseBg = this.gpu.lcdControl.bgTilemapSelect_3 ? 0x1C00 : 0x1800;

        const mapIndex = (((this.gpu.lcdcY + this.gpu.scrY) >> 3) * 32) & 1023;
        const mapOffset = mapBaseBg + mapIndex; // 1023   // CORRECT 0x1800

        let lineOffset = this.gpu.scrX >> 3;

        let tile = this.gpu.vram[mapOffset + lineOffset]; // Add line offset to get correct starting tile

        let canvasIndex = 160 * 4 * (this.gpu.lcdcY);

        const xPos = this.gpu.windowXpos - 7;
        // Loop through every single horizontal pixel for this line 
        for (let i = 0; i < 160; i++) {
            // Don't bother drawing if WINDOW is overlaying
            if (this.gpu.lcdControl.enableWindow____5 && this.gpu.lcdcY >= this.gpu.windowYpos && i >= xPos) break;

            // Two's Complement on high tileset
            let tileOffset = 0;
            if (!this.gpu.lcdControl.bgWindowTiledataSelect__4) {
                tileOffset = 256;
                if (tile > 127) {
                    tile = tile - 256;
                }
            }

            const pixel = this.gpu.bgPaletteData.shades[this.gpu.tileset[tile + tileOffset][y][x]];
            // Re-map the tile pixel through the palette
            const c = colors[pixel];

            // Plot the pixel to canvas
            this.gpu.renderer.imageGameboy.data[canvasIndex + 0] = c[0];
            this.gpu.renderer.imageGameboy.data[canvasIndex + 1] = c[1];
            this.gpu.renderer.imageGameboy.data[canvasIndex + 2] = c[2];
            this.gpu.renderer.imageGameboy.data[canvasIndex + 3] = 255;


            // Scroll X/Y debug
            if (this.gpu.renderer.showBorders && (((mapOffset + lineOffset) % 32 === 0 && x === 0) || (mapIndex < 16 && y === 0))) {
                this.gpu.renderer.imageGameboy.data[canvasIndex + 0] = 0xFF;
                this.gpu.renderer.imageGameboy.data[canvasIndex + 1] = 0;
                this.gpu.renderer.imageGameboy.data[canvasIndex + 2] = 0;
                this.gpu.renderer.imageGameboy.data[canvasIndex + 3] = 255;
            }

            canvasIndex += 4;

            // When this tile ends, read another
            x++;
            if (x === 8) {
                x = 0;
                lineOffset++;
                lineOffset &= 31; // Wrap around after 32 tiles (width of tilemap) 
                tile = this.gpu.vram[mapOffset + lineOffset];
            }
        }
    }

    renderWindow() {
        const xPos = this.gpu.windowXpos - 14;
        let lineOffset = this.gpu.windowXpos >> 3;
        const y = (this.gpu.lcdcY - this.gpu.windowYpos) & 0b111; // CORRECT

        // Make sure window is onscreen Y
        if (this.gpu.lcdcY >= this.gpu.windowYpos) {
            const adjXpos = xPos + this.gpu.windowXpos;
            let x = adjXpos & 0b111;                // CORRECT

            const mapBase = this.gpu.lcdControl.windowTilemapSelect___6 ? 0x1C00 : 0x1800;

            const mapIndex = (((this.gpu.lcdcY - this.gpu.windowYpos) >> 3) * 32) & 1023;
            const mapOffset = mapBase + mapIndex; // 1023   // CORRECT 0x1800

            let tile = this.gpu.vram[mapOffset]; // Add line offset to get correct starting tile

            let canvasIndex = 160 * 4 * (this.gpu.lcdcY);

            const shades = this.gpu.bgPaletteData.shades;

            // Loop through every single horizontal pixel for this line 
            for (let i = 0; i < 160; i++) {
                if (i >= adjXpos) {
                    // Two's Complement on high tileset
                    let tileOffset = 0;
                    if (!this.gpu.lcdControl.bgWindowTiledataSelect__4) {
                        tileOffset = 256;
                        if (tile > 127) {
                            tile = tile - 256;
                        }
                    }

                    const pixel = shades[this.gpu.tileset[tile + tileOffset][y][x]];
                    // Re-map the tile pixel through the palette
                    let c = colors[pixel];

                    if (!this.gpu.lcdControl.bgWindowEnable0) c = new Uint8Array([0xFF, 0xFF, 0xFF]);

                    // Plot the pixel to canvas
                    this.imageGameboy.data[canvasIndex + 0] = c[0];
                    this.imageGameboy.data[canvasIndex + 1] = c[1];
                    this.imageGameboy.data[canvasIndex + 2] = c[2];
                    this.imageGameboy.data[canvasIndex + 3] = 255;


                    // Window X debug
                    if (this.showBorders && (((mapOffset + lineOffset) % 32 === 0 && x === 0) || (mapIndex < 16 && y === 0))) {
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
                        lineOffset++;
                        // If going offscreen, just exit the loop
                        if (lineOffset > 32) {
                            break;
                        }
                        tile = this.gpu.vram[mapOffset + lineOffset];
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
                            const prePalette = this.gpu.tileset[tile + ((h / 8) - 1)][pixelY][pixelX];
                            const pixel = flags.paletteNumberDMG ? this.gpu.objPaletteData1.shades[prePalette] : this.gpu.objPaletteData0.shades[prePalette];
                            const c = colors[pixel];


                            if (flags.behindBG && this.imageGameboy.data[canvasIndex] !== colors[this.gpu.bgPaletteData.shades[0]][1]) continue;

                            // Simulate transparency before transforming through object palette
                            if (prePalette !== 0) {
                                this.imageGameboy.data[canvasIndex + 0] = c[0];
                                this.imageGameboy.data[canvasIndex + 1] = c[1];
                                this.imageGameboy.data[canvasIndex + 2] = c[2];
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
    renderTiles() {
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
    }
}