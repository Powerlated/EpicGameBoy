class LCDCRegister {
    // https://gbdev.gg8.se/wiki/articles/Video_Display#LCD_Control_Register
    lcdDisplayEnable7 = false; // Bit 7 - LCD Display Enable             (0=Off, 1=On)
    tilemapSelect___6 = false; // Bit 6 - Window Tile Map Display Select (0=9800-9BFF, 1=9C00-9FFF)
    enableWindow____5 = false; // Bit 5 - Window Display Enable          (0=Off, 1=On)
    bgWindowTiledataSelect__4 = false; // Bit 4 - BG & Window Tile Data Select   (0=8800-97FF, 1=8000-8FFF)
    bgTilemapSelect_3 = false; // Bit 3 - BG Tile Map Display Select     (0=9800-9BFF, 1=9C00-9FFF)
    spriteSize______2 = false; // Bit 2 - OBJ (Sprite) Size              (0=8x8, 1=8x16)
    bgWindowPriority1 = false; // Bit 1 - OBJ (Sprite) Display Enable    (0=Off, 1=On)
    spriteDisplay___0 = false; // Bit 0 - BG/Window Display/Priority     (0=Off, 1=On)

    get numerical(): number {
        let flagN = 0;
        if (this.lcdDisplayEnable7) flagN = flagN | 0b10000000;
        if (this.tilemapSelect___6) flagN = flagN | 0b01000000;
        if (this.enableWindow____5) flagN = flagN | 0b00100000;
        if (this.bgWindowTiledataSelect__4) flagN = flagN | 0b00010000;
        if (this.bgTilemapSelect_3) flagN = flagN | 0b00001000;
        if (this.spriteSize______2) flagN = flagN | 0b00000100;
        if (this.bgWindowPriority1) flagN = flagN | 0b00000010;
        if (this.spriteDisplay___0) flagN = flagN | 0b00000001;
        return flagN;
    }

    set numerical(i: number) {
        this.lcdDisplayEnable7 = (i & (1 << 7)) != 0;
        this.tilemapSelect___6 = (i & (1 << 6)) != 0;
        this.enableWindow____5 = (i & (1 << 5)) != 0;
        this.bgWindowTiledataSelect__4 = (i & (1 << 4)) != 0;
        this.bgTilemapSelect_3 = (i & (1 << 3)) != 0;
        this.spriteSize______2 = (i & (1 << 2)) != 0;
        this.bgWindowPriority1 = (i & (1 << 1)) != 0;
        this.spriteDisplay___0 = (i & (1 << 0)) != 0;
    }
}

class LCDStatusRegister {
    // https://gbdev.gg8.se/wiki/articles/Video_Display#FF41_-_STAT_-_LCDC_Status_.28R.2FW.29
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

        flagN = flagN | this.mode & 0b11;
        return flagN;
    }

    set numerical(i: number) {
        this.lyCoincidenceInterrupt6 = (i & (1 << 6)) != 0;
        this.mode2OamInterrupt_____5 = (i & (1 << 5)) != 0;
        this.mode1VblankInterrupt__4 = (i & (1 << 4)) != 0;
        this.mode0HblankInterrupt__3 = (i & (1 << 3)) != 0;
        this.coincidenceFlag_______2 = (i & (1 << 2)) != 0;

        // this.mode = i & 0b11; // this is read only when numerically setting
    }
}

class BGPaletteData {
    shade3 = 0; // Bit 7-6 
    shade2 = 0; // Bit 5-4
    shade1 = 0; // Bit 3-2
    shade0 = 0; // Bit 1-0

    get numerical(): number {
        let n = 0;
        this.shade3 = this.shade3 | n << 6;
        this.shade2 = this.shade2 | n << 4;
        this.shade1 = this.shade1 | n << 2;
        this.shade0 = this.shade0 | n << 0;
        return n;
    }

    set numerical(i: number) {
        this.shade3 = (i >> 6) & 0b11;
        this.shade2 = (i >> 4) & 0b11;
        this.shade1 = (i >> 2) & 0b11;
        this.shade0 = (i >> 0) & 0b11;
    }

    lookup(index: number) {
        switch (index) {
            case 3: return this.shade3;
            case 2: return this.shade2;
            case 1: return this.shade1;
            case 0: return this.shade0;
            default: return 0;
        }
    }
}

function transformColor(color: number): number {
    switch (color) {
        case 3: return 0x000000; // [255, 255, 255]
        case 2: return 0x606060; // [192, 192, 192]
        case 1: return 0xC0C0C0; // [96, 96, 96]
        default: return 0xFFFFFF; // [0, 0, 0]
    }
}

class GPU {
    gb: GameBoy;

    vram = new Uint8Array(0x2000);

    totalFrameCount = 0;

    // [tile][row][pixel]
    tileset = new Array(0x1800 + 1).fill(0).map(() => Array(8).fill(0).map(() => Array(8).fill(0)));

    tilemap0 = new Array(256).fill(0).map(() => Array(256).fill(0)); // 9800-9BFF 1024 bytes
    tilemap1 = new Array(256).fill(0).map(() => Array(256).fill(0)); // 9C00-9FFF 1024 bytes

    lcdControl = new LCDCRegister(); // 0xFF40
    lcdStatus = new LCDStatusRegister(); // 0xFF41

    bgPaletteData = new BGPaletteData(); // 0xFF47

    scrollY = 0; // 0xFF42
    scrollX = 0; // 0xFF43

    lcdcY = 0; // 0xFF44 - Current scanning line

    modeClock: number = 0;

    ctxGameboy!: CanvasRenderingContext2D;
    ctxTileset!: CanvasRenderingContext2D;

    clearScreen() {
        var c = document.getElementById("gameboy");
        var ctx = (c as any).getContext("2d");

        ctx.clearRect(0, 0, (c as any).width, (c as any).height);
    }

    // Thanks for the timing logic, http://imrannazar.com/GameBoy-Emulation-in-JavaScript:-Graphics
    step() {
        // Clock the GPU based on how long the last CPU instruction took 
        this.modeClock += this.gb.cpu.lastInstructionCycles;
        switch (this.lcdStatus.mode) {
            // Read from OAM - Scanline active
            case 2:
                if (this.modeClock >= 80) {
                    this.modeClock = 0;
                    this.lcdStatus.mode = 3;
                }
                break;

            // Read from VRAM - Scanline active
            case 3:
                if (this.modeClock >= 172) {
                    this.modeClock = 0;
                    this.lcdStatus.mode = 0;

                    // Write a scanline to the framebuffer
                    if (!IS_NODE) {
                        this.renderScanline();
                    }
                }
                break;


            // Hblank
            case 0:
                if (this.modeClock >= 204) {
                    this.modeClock = 0;
                    this.lcdcY++;

                    if (this.lcdcY == 144) {
                        // If we're at LCDCy = 144, enter Vblank
                        this.lcdStatus.mode = 1;
                        // Fire the Vblank interrupt
                        this.gb.bus.interrupts.requestVblank();
                        this.totalFrameCount++;

                        // Draw to the canvas
                        if (!IS_NODE) {
                            this.drawToCanvasGameboy();
                        }
                    }
                    else {
                        // Enter back into OAM mode if not Vblank
                        this.lcdStatus.mode = 2;
                    }
                }
                break;

            // Vblank
            case 1:
                if (this.modeClock >= 456) {
                    this.modeClock = 0;

                    this.lcdcY++;

                    if (this.lcdcY >= 154) {
                        this.lcdStatus.mode = 2;
                        this.lcdcY = 0;
                    }
                }
                break;
        }


    }

    imageDataGameboy = new Uint8ClampedArray(160 * 144 * 4);
    imageDataTileset = new Uint8ClampedArray(256 * 144 * 4);

    drawToCanvasGameboy() {
        let iData = new ImageData(this.imageDataGameboy, 160, 144);
        this.ctxGameboy.putImageData(iData, 0, 0);
    }

    drawToCanvasTileset() {
        let iData = new ImageData(this.imageDataTileset, 256, 144);

        this.ctxTileset.putImageData(iData, 0, 0);

        this.ctxTileset.fillStyle = 'rgba(255, 255, 128, 0.5)';
        // 0: Bottom half used, 1: Top half used
        // Draw over unused with transparent yellow
        if (this.lcdControl.bgWindowTiledataSelect__4) {
            this.ctxTileset.fillRect(0, 72, 256, 71);
        } else {
            this.ctxTileset.fillRect(0, 0, 256, 71);
        }

        this.ctxTileset.setLineDash([2]);
        this.ctxTileset.strokeStyle = '#ff0000';
        this.ctxTileset.strokeRect(0, 0, 256, 71);
        this.ctxTileset.strokeStyle = '#0000ff';
        this.ctxTileset.strokeRect(0, 72, 256, 72);

    }

    renderScanline() {
        // console.log("Rendering a scanline @ Y:" + this.lcdcY);

        let scrollX = this.scrollX;
        let scrollY = this.scrollY;

        let y = (this.lcdcY + scrollY) & 0b111; // CORRECT
        let x = (scrollX) & 0b111;                // CORRECT

        let mapBase = this.lcdControl.bgTilemapSelect_3 ? 0x1C00 : 0x1800;

        let mapOffset = mapBase + ((Math.floor((this.lcdcY + scrollY) / 8) * 32) & 1023); // 1023   // CORRECT 0x1800

        let lineoffs = scrollX >> 3;

        let tile = this.vram[mapOffset + lineoffs]; // Add line offset to get correct starting tile

        let canvasIndex = 160 * 4 * (this.lcdcY);

        // Loop through every single pixel 
        for (let i = 0; i < 160; i++) {

            // Offset the tile data lookup based off of BG + Window tile data select (false=8800-97FF, true=8000-8FFF)
            let tileOffset = this.lcdControl.bgWindowTiledataSelect__4 ? 0 : 256;

            let pixel = this.bgPaletteData.lookup(this.tileset[tile + tileOffset][y][x]);
            // Re-map the tile pixel through the palette
            let c = transformColor(pixel);

            // Write olive green color when LCD is disabled
            if (!this.lcdControl.lcdDisplayEnable7) {
                c = 0x0f380f;
            }

            // Plot the pixel to canvas
            this.imageDataGameboy[canvasIndex + 0] = (c >> 0) & 0xFF;
            this.imageDataGameboy[canvasIndex + 1] = (c >> 8) & 0xFF;
            this.imageDataGameboy[canvasIndex + 2] = (c >> 16) & 0xFF;
            this.imageDataGameboy[canvasIndex + 3] = 255;
            canvasIndex += 4;

            // When this tile ends, read another
            x++;
            if (x == 8) {
                x = 0;
                lineoffs++;
                lineoffs %= 32; // Wrap around after 20 tiles (width of tilemap) 
                tile = this.vram[mapOffset + lineoffs];
                // if (GPU._bgtile == 1 && tile < 128) tile += 256;
            }
        }
    }

    executeUntilVblank() {
        this.gb.cpu.debugging = false;
        while (this.lcdcY != 144) {
            this.gb.cpu.step();
        }
    }

    // 160 x 144
    renderTiles() {
        this.tileset.forEach((v1, i1) => {
            v1.forEach((v2, i2) => {
                v2.forEach((pixel, i3) => {
                    if (pixel == undefined) return;
                    if (i1 > 360) return;

                    const WIDTH = 256;

                    let x = ((i1 * 8) + i3) % WIDTH;
                    let row = Math.floor(((i1 * 8) + i3) / WIDTH);
                    let y = i2 + (row * 8);

                    let c = transformColor(this.bgPaletteData.lookup(pixel));

                    this.imageDataTileset[4 * ((y * WIDTH) + x) + 0] = (c >> 0) & 0xFF;
                    this.imageDataTileset[4 * ((y * WIDTH) + x) + 1] = (c >> 8) & 0xFF;
                    this.imageDataTileset[4 * ((y * WIDTH) + x) + 2] = (c >> 16) & 0xFF;
                    this.imageDataTileset[4 * ((y * WIDTH) + x) + 3] = 0xFF; // 100% alpha
                });
            });
        });
    }

    constructor(gb: GameBoy) {
        this.gb = gb;

        if (!IS_NODE) {
            let cTileset = document.getElementById("tileset") as HTMLCanvasElement;
            let cGameboy = document.getElementById("gameboy") as HTMLCanvasElement;
            this.ctxTileset = cTileset.getContext("2d")!;
            this.ctxGameboy = cGameboy.getContext("2d")!;
        }
    }

    read(index: number): number {
        // During mode 3, the CPU cannot access VRAM or CGB palette data
        if (this.lcdStatus.mode == 3 && this.lcdControl.lcdDisplayEnable7) return 0xFF;

        return this.vram[index];
    }

    write(index: number, value: number) {
        // During mode 3, the CPU cannot access VRAM or CGB palette data
        if (this.lcdStatus.mode == 3 && this.lcdControl.lcdDisplayEnable7) return;

        this.vram[index] = value;

        // Write to tile set
        if (index >= 0x0 && index <= 0x17FF) {
            index &= 0xFFFE;

            // Work out which tile and row was updated
            let tile = Math.floor(index / 16);
            let y = Math.floor((index % 16) / 2);

            let mask;
            for (var x = 0; x < 8; x++) {
                // Find bit index for this pixel
                let bytes = [this.vram[index], this.vram[index + 1]];

                mask = 0b1 << (7 - x);
                let lsb = bytes[0] & mask;
                let msb = bytes[1] & mask;

                let tileOffset = this.lcdControl.bgWindowTiledataSelect__4 ? 0 : 0;

                // Update tile set
                this.tileset[tile + tileOffset][y][x] =
                    (lsb != 0 ? 1 : 0) +
                    (msb != 0 ? 2 : 0);
            }
            // Write to tile map
        }
    }

    reset() {
        this.vram = new Uint8Array(0x2000);

        this.totalFrameCount = 0;

        // [tile][row][pixel]
        this.tileset = new Array(0x1800 + 1).fill(0).map(() => Array(8).fill(0).map(() => Array(8).fill(0)));

        this.tilemap0 = new Array(256).fill(0).map(() => Array(256).fill(0)); // 9800-9BFF 1024 bytes
        this.tilemap1 = new Array(256).fill(0).map(() => Array(256).fill(0)); // 9C00-9FFF 1024 bytes

        this.lcdControl = new LCDCRegister(); // 0xFF40
        this.lcdStatus = new LCDStatusRegister(); // 0xFF41

        this.bgPaletteData = new BGPaletteData(); // 0xFF47

        this.scrollY = 0; // 0xFF42
        this.scrollX = 0; // 0xFF43

        this.lcdcY = 0; // 0xFF44 - Current scanning line
        this.modeClock = 0;
    }
}