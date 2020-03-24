import GPU, { colors555, OAMFlags, OAMEntry } from "./gpu";
export class GPURenderer {
    gpu: GPU;

    imageGameboyArr = new Uint8ClampedArray(160 * 144 * 4);
    imageGameboyPre = new Uint8Array(160 * 144);
    imageGameboyNoSprites = new Uint8Array(160 * 144);
    imageGameboy = new ImageData(this.imageGameboyArr, 160, 144);
    imageTilesetArr = new Uint8ClampedArray(256 * 96 * 4);


    showBorders = false;

    constructor(gpu: GPU) {
        this.gpu = gpu;
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
        let tileset = attr.vramBank ? this.gpu.tileset1 : this.gpu.tileset0;

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

            const adjX = attr.xFlip ? 7 - x : x;
            const adjY = attr.yFlip ? 7 - y : y;
            const prePalette = tileset[tile + tileOffset][adjY][adjX];
            const pixel = this.gpu.cgbBgPalette.shades[attr.bgPalette][prePalette];
            // Re-map the tile pixel through the palette

            // Plot the pixel to canvas
            this.imageGameboy.data[canvasIndex + 0] = pixel[0];
            this.imageGameboy.data[canvasIndex + 1] = pixel[1];
            this.imageGameboy.data[canvasIndex + 2] = pixel[2];
            this.imageGameboy.data[canvasIndex + 3] = 255;

            this.imageGameboyPre[canvasIndex >> 2] = prePalette;

            this.imageGameboyNoSprites[canvasIndex >> 2] = attr.ignoreSpritePriority ? 1 : 0;

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
                attr = this.gpu.cgbTileAttrs[mapOffset + lineOffset]; // Update attributes too
                tileset = attr.vramBank ? this.gpu.tileset1 : this.gpu.tileset0;
            }
        }
    }

    renderWindow() {
        const xPos = this.gpu.windowXpos - 7;
        const y = this.gpu.currentWindowLine & 0b111; // CORRECT

        // Make sure window is onscreen Y
        if (this.gpu.lcdcY >= this.gpu.windowYpos) {
            let x = 0;                // CORRECT

            const mapBase = this.gpu.lcdControl.windowTilemapSelect___6 ? 1024 : 0;

            const mapIndex = ((this.gpu.currentWindowLine >> 3) * 32) & 1023;
            let mapOffset = mapBase + mapIndex; // 1023   // CORRECT 0x1800

            let attr = this.gpu.cgbTileAttrs[mapOffset];
            let tile = this.gpu.tilemap[mapOffset]; // Add line offset to get correct starting tile
            let tileset = attr.vramBank ? this.gpu.tileset1 : this.gpu.tileset0;

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

                    const adjX = attr.xFlip ? 7 - x : x;
                    const adjY = attr.yFlip ? 7 - y : y;
                    const prePalette = tileset[tile + tileOffset][adjY][adjX];
                    let pixel = this.gpu.cgbBgPalette.shades[attr.bgPalette][prePalette];

                    // Plot the pixel to canvas
                    this.imageGameboy.data[canvasIndex + 0] = pixel[0];
                    this.imageGameboy.data[canvasIndex + 1] = pixel[1];
                    this.imageGameboy.data[canvasIndex + 2] = pixel[2];
                    this.imageGameboy.data[canvasIndex + 3] = 255;

                    this.imageGameboyPre[canvasIndex >> 2] = prePalette;

                    this.imageGameboyNoSprites[canvasIndex >> 2] = attr.ignoreSpritePriority ? 1 : 0;

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
                        attr = this.gpu.cgbTileAttrs[mapOffset]; // Update attributes too
                        tileset = attr.vramBank ? this.gpu.tileset1 : this.gpu.tileset0;
                        // if (GPU._bgtile === 1 && tile < 128) tile += 256;
                    }
                }
            }
        }
    }

    renderSprites() {
        for (let sprite = 0; sprite < this.gpu.scanned.length; sprite++) {
            const HEIGHT = this.gpu.lcdControl.spriteSize______2 ? 16 : 8;

            let scannedSprite = this.gpu.scanned[sprite];

            const yPos = scannedSprite.yPos;
            const xPos = scannedSprite.xPos;
            const tile = scannedSprite.tile;
            const flags = scannedSprite.flags;

            const screenYPos = yPos - 16;
            let screenXPos = xPos - 8;

            const y = (this.gpu.lcdcY - yPos) & 7;
            const pal = this.gpu.gb.cgb ? flags.paletteNumberCGB : + flags.paletteNumberDMG;
            const tileset = flags.vramBank ? this.gpu.tileset1 : this.gpu.tileset0;

            let h = this.gpu.lcdcY > screenYPos + 7 ? 1 : 0;

            let tileOffset = 0;
            if (flags.yFlip && this.gpu.lcdControl.spriteSize______2) {
                if (h == 0) tileOffset = 1;
                else if (h == 1) tileOffset = 0;
            } else {
                tileOffset = h;
            }

            // Draws the 8 pixels.
            for (let x = 0; x < 8; x++) {
                screenXPos = x + xPos - 8;

                // If it's off the edges, skip this pixel
                if (screenXPos < 0 || screenXPos >= 160) continue;

                const pixelX = flags.xFlip ? 7 - x : x;
                const pixelY = flags.yFlip ? 7 - y : y;

                const canvasIndex = ((this.gpu.lcdcY * 160) + screenXPos) * 4;

                // Offset tile by +1 if rendering the top half of an 8x16 sprite

                const prePalette = tileset[tile + tileOffset][pixelY][pixelX];
                const pixel = this.gpu.cgbObjPalette.shades[pal][prePalette];

                let noTransparency = this.gpu.gb.cgb && !this.gpu.lcdControl.bgWindowEnable0;
                if (flags.behindBG && this.imageGameboyPre[canvasIndex >> 2] != 0 && !noTransparency) continue;
                if (this.imageGameboyNoSprites[canvasIndex >> 2] == 1 && !noTransparency) continue;

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