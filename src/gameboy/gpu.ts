class GPU {
    bus: MemoryBus;
    vram = new Uint8Array(0x2000);

    // [tile][row][pixel]
    tileset = new Array(0x1800 + 1).fill(0).map(() => Array(8).fill(0).map(() => Array(8).fill(0)));

    scrollY = 0; // 0xFF42
    scrollX = 0; // 0xFF43

    _lcdcY = 0; // 0xFF44

    c: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    get lcdcY(): number {
        return this._lcdcY;
    }
    set lcdcY(i: number) {
        if (this.lcdcY > 153) {
            this._lcdcY = 0x90;
        } else {
            this._lcdcY = 0x90;
        }
        this._lcdcY = 0x90;
    }

    drawPixel(x, y, r, g, b) {


        this.ctx.fillStyle = "rgba(" + r + "," + g + "," + b + "," + 1 + ")";
        this.ctx.fillRect(x, y, 1, 1);
    }

    clearScreen() {
        var c = document.getElementById("gameboy");
        var ctx = (c as any).getContext("2d");

        ctx.clearRect(0, 0, (c as any).width, (c as any).height);
    }

    step() {
        this.lcdcY++;
        this.clearScreen();

        for (let c = 0; c <= 160; c++) {
            this.drawPixel(c, this.lcdcY, 255, 0, 0);
        }
    }

    renderTiles() {
        this.tileset.forEach((v1, i1) => {
            v1.forEach((v2, i2) => {
                v2.forEach((v3, i3) => {
                    if (v3 == undefined) return;
                    this.drawPixel((i1 * 8) + i3, i2, 256 - ((v3 * 64) - 1), 256 - ((v3 * 64) - 1), 256 - ((v3 * 64) - 1));
                });
            });
        });
    }

    constructor(bus) {
        this.c = document.getElementById("gameboy") as HTMLCanvasElement;
        this.ctx = this.c.getContext("2d");

        this.bus = bus;

        setInterval(() => {
            let debugP = document.getElementById('gpudebug');
            debugP.innerText = `
            Scroll Y: ${this.scrollY}
            Scroll X: ${this.scrollX}

            LCDC Y-Coordinate: ${this.lcdcY}

            Last tile written: 0x${this.lastTile.toString(16)}
            Last row written: 0x${this.lastRow.toString(16)}
            Last pixel written: 0x${this.lastPixel.toString(16)}
            `;
        }, 10);
    }

    vBlank() {
        this.lcdcY = 0x90;
    }

    read(index: number): number {
        return this.vram[index];
    }

    write(index, value) {
        this.vram[index] = value;


        value &= 0x1FFE;

        // Work out which tile and row was updated
        var tile = Math.floor(index / 16);
        var y = Math.floor((index % 16) / 2);

        var sx;
        for (var x = 0; x < 8; x++) {
            // Find bit index for this pixel
            sx = 1 << (7 - x);

            this.lastTile = tile;
            this.lastRow = y;
            this.lastPixel = x;


            // Update tile set
            this.tileset[tile][y][x] =
                ((this.vram[index] & sx) ? 1 : 0) +
                ((this.vram[index + 1] & sx) ? 2 : 0);
        }



    }

    lastTile = 0;
    lastRow = 0;
    lastPixel = 0;
}
