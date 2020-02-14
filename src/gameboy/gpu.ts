const PaletteBasic = [255, 0, 0, 0];

class GPU {
    bus: MemoryBus;
    vram = new Uint8Array(0x2000);

    steps = 0;

    // [tile][row][pixel]
    tileset = new Array(0x1800 + 1).fill(0).map(() => Array(8).fill(0).map(() => Array(8).fill(0)));

    tilemap0 = new Array(256).fill(0).map(() => Array(256).fill(0)); // 9800-9BFF 1024 bytes
    tilemap1 = new Array(256).fill(0).map(() => Array(256).fill(0)); // 9C00-9FFF 1024 bytes

    scrollY = 0; // 0xFF42
    scrollX = 0; // 0xFF43

    lcdcY = 0; // 0xFF44 - Current scanning line

    mode: number = 0;
    modeClock: number = 0;

    c: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;


    drawPixel(x, y, r, g, b) {
        this.ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + 1 + ")";
        this.ctx.fillRect(x, y, 1, 1);
    }

    clearScreen() {
        var c = document.getElementById("gameboy");
        var ctx = (c as any).getContext("2d");

        ctx.clearRect(0, 0, (c as any).width, (c as any).height);
    }

    // Thanks for the timing logic, http://imrannazar.com/GameBoy-Emulation-in-JavaScript:-Graphics
    step() {
        this.steps++;
        this.modeClock++;

        if (!(this.steps % 4194)) {
            // this.renderTiles();
        }

        switch (this.mode) {
            // Read from OAM - Scanline active
            case 2:
                if (this.modeClock >= 20) {
                    this.modeClock = 0;
                    this.mode = 3;
                }
                break;

            // Read from VRAM - Scanline active
            case 3:
                if (this.modeClock >= 43) {
                    this.modeClock = 0;
                    this.mode = 0;

                    // Write a scanline to the framebuffer
                    if (!isNode()) {
                        this.renderScanline();
                    }
                }
                break;


            // Hblank
            case 0:
                if (this.modeClock >= 51) {
                    this.modeClock = 0;
                    this.lcdcY++;

                    if (this.lcdcY == 144) {
                        this.mode = 1;

                        // Fire the Vblank interrupt
                        if (this.bus.interruptEnableFlag.vBlank)
                            this.bus.cpu.interruptVblank();
                    }
                    else {
                        this.mode = 2;
                    }
                }
                break;

            // Vblank
            case 1:
                if (this.modeClock >= 114) {
                    this.modeClock = 0;
                    this.lcdcY++;

                    if (this.lcdcY > 153) {
                        this.mode = 2;
                        this.lcdcY = 0;

                        this.runningTheCPU = false;

                        if (!isNode()) {
                            this.drawToCanvas();
                        }
                    }
                }
                break;
        }

    }

    imageData = new Uint8ClampedArray(160 * 144 * 4);

    drawToCanvas() {
        let iData = new ImageData(this.imageData, 160, 144);
        this.ctx.putImageData(iData, 0, 0);
    }

    renderScanline() {
        // console.log("Rendering a scanline @ Y:" + this.lcdcY);

        let scrollX = this.scrollX;
        let scrollY = this.scrollY;

        let y = (this.lcdcY + scrollY) & 7; // CORRECT
        let x = (scrollX) & 7;                // CORRECT

        let mapoffs = 0x1800 + ((Math.floor((this.lcdcY + scrollY) / 8) * 32) & 1023);// 1023   // CORRECT 0x1800

        let lineoffs = (scrollX >> 3);

        let tile = this.vram[mapoffs];

        let canvasIndex = 160 * 4 * (this.lcdcY);

        // Loop through every single pixel 
        for (let i = 0; i < 160; i++) {
            // Re-map the tile pixel through the palette
            let c = this.palette(this.tileset[tile][y][x]);

            // Plot the pixel to canvas
            this.imageData[canvasIndex + 0] = c;
            this.imageData[canvasIndex + 1] = c;
            this.imageData[canvasIndex + 2] = c;
            this.imageData[canvasIndex + 3] = 255;
            canvasIndex += 4;

            // When this tile ends, read another
            x++;
            if (x == 8) {
                x = 0;
                lineoffs++;
                tile = this.vram[mapoffs + lineoffs];
                // if (GPU._bgtile == 1 && tile < 128) tile += 256;
            }
        }
    }

    runningTheCPU = false;
    renderSingleFrame() {
        this.runningTheCPU = true;
        cpu.debug = false;
        while (this.runningTheCPU) {
            cpu.step();
        }
    }

    frameExecuteInterval = 0;

    frameExecute() {
        this.frameExecuteInterval = setInterval(() => { this.renderSingleFrame(); }, 16);
    }
    vblankExecute() {
        cpu.debug = false;
        while (this.lcdcY != 144) {
            cpu.step();
        }
    }

    stopFrameExecute() {
        clearInterval(this.frameExecuteInterval);
    }


    palette(i: number) {
        return PaletteBasic[i];
    }

    // 160 x 144
    renderTiles() {
        this.tileset.forEach((v1, i1) => {
            v1.forEach((v2, i2) => {
                v2.forEach((pixel, i3) => {
                    if (pixel == undefined) return;
                    if (i1 > 360) return;

                    let x = ((i1 * 8) + i3) % 160;
                    let row = Math.floor(((i1 * 8) + i3) / 160);
                    let y = i2 + (row * 8);

                    this.drawPixel(x, y, this.palette(pixel), this.palette(pixel), this.palette(pixel));
                });
            });
        });
    }

    constructor(bus) {
        this.bus = bus;

        if (!isNode()) {
            this.c = document.getElementById("gameboy") as HTMLCanvasElement;
            this.ctx = this.c.getContext("2d");

            setInterval(() => {
                let debugP = document.getElementById('gpudebug');
                debugP.innerText = `
            Scroll Y: ${this.scrollY}
            Scroll X: ${this.scrollX}

            LCDC Y-Coordinate: ${this.lcdcY}
            `;
            }, 100);
        }
    }

    read(index: number): number {
        return this.vram[index];
    }

    write(index, value) {
        this.vram[index] = value;

        // Write to tile set
        if (index >= 0x0 && index <= 0x17FF) {
            value &= 0x1FFE;

            // Work out which tile and row was updated
            var tile = Math.floor(index / 16);
            var y = Math.floor((index % 16) / 2);

            var sx;
            for (var x = 0; x < 8; x++) {
                // Find bit index for this pixel
                sx = 1 << (7 - x);

                // Update tile set
                this.tileset[tile][y][x] =
                    ((this.vram[index] & sx) ? 1 : 0) +
                    ((this.vram[index + 1] & sx) ? 2 : 0);
            }
            // Write to tile map
        } else {
            let tileAddrIndex = index;
            let baseOffset: number;
            let tilemapArr: Array<Array<number>>;
            if (tileAddrIndex >= 0x1800 && tileAddrIndex <= 0x1BFF) {
                baseOffset = -0x1800;
                tilemapArr = this.tilemap0;
            } else if (tileAddrIndex >= 0x1C00 && tileAddrIndex <= 0x1FFF) {
                baseOffset = -0x1C00;
                tilemapArr = this.tilemap1;
            }

            tileAddrIndex += baseOffset;

            // Let the fun begin.

            let x = tileAddrIndex % 32;
            let y = Math.floor(tileAddrIndex / 32);

            tilemapArr[x][y] = value;
        }
    }
}