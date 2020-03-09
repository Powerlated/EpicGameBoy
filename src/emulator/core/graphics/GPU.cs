using System;

namespace DMSharp
{

    public class GPU
    {
        public static byte[][] colors =
        {
            new byte[] {0xFF, 0xFF, 0xFF},
            new byte[] {0xC0, 0xC0, 0xC0},
            new byte[] {0x60, 0x60, 0x60},
            new byte[] {0x00, 0x00, 0x00}
        };

        public GameBoy gb;

        public byte[] oam = new byte[256];
        public byte[] vram = new byte[8192];

        long totalFrameCount = 0;

        // [tile][row][pixel]
        public int[,,] tileset = new int[1024, 8, 8];

        public LCDCRegister lcdControl = new LCDCRegister(); // 0xFF40
        public LCDStatusRegister lcdStatus = new LCDStatusRegister(); // 0xFF41

        public PaletteData bgPaletteData = new PaletteData(); // 0xFF47
        public PaletteData objPaletteData0 = new PaletteData(); // 0xFF48
        public PaletteData objPaletteData1 = new PaletteData(); // 0xFF49

        public byte scrY = 0; // 0xFF42
        public byte scrX = 0; // 0xFF43

        public byte lcdcY = 0; // 0xFF44 - Current scanning line

        public byte lYCompare = 0; // 0xFF45 - Request STAT interrupt and set STAT flag in LCDStatus when lcdcY == lcdcYCompare 

        public byte windowYpos = 0; // 0xFF4A
        public byte windowXpos = 0; // 0xFF4B


        public long modeClock = 0;
        public int frameClock = 0;

        public long cycles = 0;

        public bool showBorders = false;

        public byte[] imageGameboy = new byte[160 * 144 * 3];
        public byte[] imageGameboyOut = new byte[160 * 144 * 3];

        // Thanks for the timing logic, http://imrannazar.com/GameBoy-Emulation-in-JavaScript:-Graphics
        public void Step()
        {
            // TODO: FIX: THE GPU CLOCK DOES NOT RUN WHEN THE LCD IS DISABLED
            // You don't have to be cycle-accurate for everything

            if (this.lcdControl.lcdDisplayEnable7)
            {
                this.modeClock += this.gb.cpu.lastInstructionCycles;
                switch (this.lcdStatus.mode)
                {
                    // Read from OAM - Scanline active
                    case 2:
                        if (this.lYCompare == this.lcdcY && this.lcdStatus.lyCoincidenceInterrupt6)
                        {
                            Util.WriteDebug("Coincidence");
                            this.lcdStatus.coincidenceFlag_______2 = true;
                            this.gb.interrupts.requestLCDstatus();
                        }

                        this.renderScanline();

                        if (this.modeClock >= 80)
                        {
                            this.modeClock -= 80;
                            this.lcdStatus.mode = 3;
                        }
                        break;

                    // Read from VRAM - Scanline active
                    case 3:
                        if (this.modeClock >= 172)
                        {
                            this.modeClock -= 172;
                            this.lcdStatus.mode = 0;

                            if (this.lcdStatus.mode0HblankInterrupt__3)
                            {
                                this.gb.interrupts.requestLCDstatus();
                            }
                        }
                        break;


                    // Hblank
                    case 0:
                        if (this.modeClock >= 204)
                        {
                            this.modeClock -= 204;
                            this.lcdcY++;

                            // THIS NEEDS TO BE 144, THAT IS PROPER TIMING!
                            if (this.lcdcY >= 144)
                            {
                                // If we're at LCDCy = 144, enter Vblank
                                this.lcdStatus.mode = 1;
                                // Fire the Vblank interrupt
                                this.gb.interrupts.requestVblank();
                                this.totalFrameCount++;

                                if (this.lcdStatus.mode1VblankInterrupt__4)
                                {
                                    this.gb.interrupts.requestLCDstatus();
                                }

                                Array.Copy(this.imageGameboy, this.imageGameboyOut, imageGameboy.Length);
                            }
                            else
                            {
                                // Enter back into OAM mode if not Vblank
                                this.lcdStatus.mode = 2;
                                if (this.lcdStatus.mode2OamInterrupt_____5)
                                {
                                    this.gb.interrupts.requestLCDstatus();
                                }
                            }
                        }
                        break;

                    // Vblank
                    case 1:
                        if (this.modeClock >= 456)
                        {
                            this.modeClock -= 456;

                            this.lcdcY++;

                            if (this.lcdcY >= 154)
                            {
                                this.lcdcY = 0;
                                this.lcdStatus.mode = 2;
                            }
                        }
                        break;
                }
            }
            else
            {
                this.modeClock = 0;
                this.lcdStatus.mode = 0;
                this.lcdcY = 0;
            }
        }

        // TODO: Implement background transparency
        void renderScanline()
        {
            if (this.lcdControl.bgWindowEnable0)
            {
                this.renderVram();
            }

            if (this.lcdControl.spriteDisplay___1)
                this.renderSprites();
        }

        void renderVram()
        {
            // writeDebug("Rendering a scanline @ SCROLL Y:" + this.scrY);
            this.renderBg();
            if (this.lcdControl.enableWindow____5)
            {
                this.renderWindow();
            }
        }

        void renderBg()
        {
            var y = (this.lcdcY + this.scrY) & 0b111; // CORRECT
            var x = (this.scrX) & 0b111;                // CORRECT

            var mapBaseBg = this.lcdControl.bgTilemapSelect_3 ? 0x1C00 : 0x1800;

            var mapIndex = (((this.lcdcY + this.scrY) >> 3) * 32) & 1023;
            var mapOffset = mapBaseBg + mapIndex; // 1023   // CORRECT 0x1800

            var lineOffset = this.scrX >> 3;

            int tile = this.vram[mapOffset + lineOffset]; // Add line offset to get correct starting tile

            var canvasIndex = 160 * 3 * (this.lcdcY);

            var xPos = this.windowXpos - 7;
            // Loop through every single horizontal pixel for this line 
            for (var i = 0; i < 160; i++)
            {
                // Don't bother drawing if WINDOW is overlaying
                if (this.lcdControl.enableWindow____5 && this.lcdcY >= this.windowYpos && i >= xPos) break;

                // Two's Complement on high tileset
                var tileOffset = 0;
                if (!this.lcdControl.bgWindowTiledataSelect__4)
                {
                    tileOffset = 256;
                    if (tile > 127)
                    {
                        tile = tile - 256;
                    }
                }

                var pixel = this.bgPaletteData.shades[this.tileset[tile + tileOffset, y, x]];
                // Re-map the tile pixel through the palette
                var c = colors[pixel];

                // Plot the pixel to canvas
                this.imageGameboy[canvasIndex + 0] = c[0];
                this.imageGameboy[canvasIndex + 1] = c[1];
                this.imageGameboy[canvasIndex + 2] = c[2];


                // Scroll X/Y debug
                if (this.showBorders && (((mapOffset + lineOffset) % 32 == 0 && x == 0) || (mapIndex < 16 && y == 0)))
                {
                    this.imageGameboy[canvasIndex + 0] = 0xFF;
                    this.imageGameboy[canvasIndex + 1] = 0;
                    this.imageGameboy[canvasIndex + 2] = 0;
                }

                canvasIndex += 3;

                // When this tile ends, read another
                x++;
                if (x == 8)
                {
                    x = 0;
                    lineOffset++;
                    lineOffset %= 32; // Wrap around after 32 tiles (width of tilemap) 
                    tile = this.vram[mapOffset + lineOffset];
                }
            }
        }

        void renderWindow()
        {
            var xPos = this.windowXpos - 14;
            var lineOffset = this.windowXpos >> 3;
            var y = (this.lcdcY - this.windowYpos) & 0b111; // CORRECT

            // Make sure window is onscreen Y
            if (this.lcdcY >= this.windowYpos)
            {
                var adjXpos = xPos + this.windowXpos;
                var x = adjXpos & 0b111;                // CORRECT

                var mapBase = this.lcdControl.windowTilemapSelect___6 ? 0x1C00 : 0x1800;

                var mapIndex = (((this.lcdcY - this.windowYpos) >> 3) * 32) & 1023;
                var mapOffset = mapBase + mapIndex; // 1023   // CORRECT 0x1800

                var tile = this.vram[mapOffset]; // Add line offset to get correct starting tile

                var canvasIndex = 160 * 3 * (this.lcdcY);

                var shades = this.bgPaletteData.shades;

                // Loop through every single horizontal pixel for this line 
                for (var i = 0; i < 160; i++)
                {
                    if (i >= adjXpos)
                    {
                        // Two's Complement on high tileset
                        var tileOffset = 0;
                        if (!this.lcdControl.bgWindowTiledataSelect__4)
                        {
                            tileOffset = 256;
                            if (tile > 127)
                            {
                                tile = (byte)(tile - 256);
                            }
                        }

                        var pixel = shades[this.tileset[tile + tileOffset, y, x]];
                        // Re-map the tile pixel through the palette
                        var c = colors[pixel];

                        if (!this.lcdControl.bgWindowEnable0) c = new byte[] { 0xFF, 0xFF, 0xFF };

                        // Plot the pixel to canvas
                        this.imageGameboy[canvasIndex + 0] = c[0];
                        this.imageGameboy[canvasIndex + 1] = c[1];
                        this.imageGameboy[canvasIndex + 2] = c[2];

                        // Window X debug
                        if (this.showBorders && (((mapOffset + lineOffset) % 32 == 0 && x == 0) || (mapIndex < 16 && y == 0)))
                        {
                            this.imageGameboy[canvasIndex + 0] = 0;
                            this.imageGameboy[canvasIndex + 1] = 0;
                            this.imageGameboy[canvasIndex + 2] = 0xFF;
                        }
                        canvasIndex += 3;

                        // When this tile ends, read another
                        x++;
                        if (x == 8)
                        {
                            x = 0;
                            lineOffset++;
                            // If going offscreen, just exit the loop
                            if (lineOffset > 32)
                            {
                                break;
                            }
                            tile = this.vram[mapOffset + lineOffset];
                            // if (GPU._bgtile == 1 && tile < 128) tile += 256;
                        }
                    }
                }
            }
        }


        void renderSprites()
        {
            var spriteCount = 0;
            // 40 sprites in total in OAM
            for (var sprite = 0; sprite < 40; sprite++)
            {
                var oamBase = sprite * 4;

                var yPos = this.oam[oamBase + 0];
                var xPos = this.oam[oamBase + 1];
                var tile = this.oam[oamBase + 2];

                var screenYPos = yPos - 16;
                var screenXPos = xPos - 8;

                var HEIGHT = this.lcdControl.spriteSize______2 ? 16 : 8;

                // Render sprite only if it is visible on this scanline
                if (
                    (this.lcdcY + 8 >= screenYPos && (this.lcdcY <= (screenYPos + HEIGHT + 8)))
                )
                {
                    // TODO: Fix sprite limiting
                    // if (spriteCount > 10) return; // GPU can only draw 10 sprites per scanline
                    // spriteCount++;

                    var flags = new OAMFlags();
                    flags.numerical = this.oam[oamBase + 3];

                    var y = this.lcdcY % 8;

                    for (var h = 8; h <= HEIGHT; h += 8)
                        for (var x = 0; x < 8; x++)
                        {
                            screenYPos = yPos - (24 - h);
                            screenXPos = xPos - 8;

                            screenYPos += y;
                            screenXPos += x;

                            if (screenXPos >= 0 && screenYPos >= 0 && screenXPos < 160 && screenYPos < 144)
                            {

                                var pixelX = flags.xFlip ? 7 - x : x;
                                var pixelY = flags.yFlip ? 7 - y : y;

                                var canvasIndex = ((screenYPos * 160) + screenXPos) * 3;

                                // Offset tile by +1 if rendering the top half of an 8x16 sprite
                                var prePalette = this.tileset[tile + ((h / 8) - 1), pixelY, pixelX];
                                var pixel = flags.paletteNumberDMG ? this.objPaletteData1.shades[prePalette] : this.objPaletteData0.shades[prePalette];
                                var c = colors[pixel];


                                if (flags.behindBG && this.imageGameboy[canvasIndex] != colors[this.bgPaletteData.shades[0]][1]) continue;

                                // Simulate transparency before transforming through object palette
                                if (prePalette != 0)
                                {
                                    this.imageGameboy[canvasIndex + 0] = c[0];
                                    this.imageGameboy[canvasIndex + 1] = c[1];
                                    this.imageGameboy[canvasIndex + 2] = c[2];
                                }

                                // Border debug
                                if (this.showBorders && (pixelX == 0 || pixelX == 7 || pixelY == 0 || pixelY == 7))
                                {
                                    if (this.lcdControl.spriteSize______2)
                                    {
                                        this.imageGameboy[canvasIndex + 0] = 0xFF;
                                        this.imageGameboy[canvasIndex + 1] = 0;
                                        this.imageGameboy[canvasIndex + 2] = 0xFF;
                                    }
                                    else
                                    {
                                        this.imageGameboy[canvasIndex + 0] = 0;
                                        this.imageGameboy[canvasIndex + 1] = 0xFF;
                                        this.imageGameboy[canvasIndex + 2] = 0;
                                    }
                                }
                            }
                        }
                }
            }
        }

        // 160 x 144
        /*         void renderTiles()
                {
                    this.tileset.forEach((v1, i1) =>
                    {
                        v1.forEach((v2, i2) =>
                        {
                            v2.forEach((pixel, i3) =>
                            {
                                if (pixel == undefined) return;

                                var WIDTH = 256;

                                var x = ((i1 * 8) + i3) % WIDTH;
                                var row = Math.floor(((i1 * 8) + i3) / WIDTH);
                                var y = i2 + (row * 8);

                                var c = colors[this.bgPaletteData.shades[pixel]];

                                this.imageTilesetArr[4 * ((y * WIDTH) + x) + 0] = c[0];
                                this.imageTilesetArr[4 * ((y * WIDTH) + x) + 1] = c[1];
                                this.imageTilesetArr[4 * ((y * WIDTH) + x) + 2] = c[2];
                                this.imageTilesetArr[4 * ((y * WIDTH) + x) + 3] = 0xFF; // 100% alpha
                            });
                        });
                    });
                } */


        public GPU(GameBoy gb)
        {
            this.gb = gb;
        }

        public byte Read(ushort index)
        {
            // During mode 3, the CPU cannot access VRAM or CGB palette data
            if (this.lcdStatus.mode == 3 && this.lcdControl.lcdDisplayEnable7) return 0xFF;

            return this.vram[index];
        }

        public void Write(ushort index, byte value)
        {
            // During mode 3, the CPU cannot access VRAM or CGB palette data
            if (this.lcdStatus.mode == 3 && this.lcdControl.lcdDisplayEnable7) return;

            this.vram[index] = value;

            // Write to tile set
            if (index >= 0x0 && index <= 0x17FF)
            {
                index &= 0xFFFE;

                // Work out which tile and row was updated
                int tile = (index / 16);
                int y = (index % 16) / 2;

                for (var x = 0; x < 8; x++)
                {
                    // Find bit index for this pixel
                    byte[] bytes = { this.vram[index], this.vram[index + 1] };

                    var mask = 0b1 << (7 - x);
                    var lsb = bytes[0] & mask;
                    var msb = bytes[1] & mask;

                    // Update tile set
                    this.tileset[tile, y, x] =
                        (lsb != 0 ? 1 : 0) +
                        (msb != 0 ? 2 : 0);
                }
                // Write to tile map
            }
        }

        public void Reset()
        {
            this.totalFrameCount = 0;

            // [tile][row][pixel]
            this.tileset = new int[1024, 8, 8];

            this.lcdControl = new LCDCRegister();
            this.lcdStatus = new LCDStatusRegister();

            this.bgPaletteData = new PaletteData();
            this.objPaletteData0 = new PaletteData();
            this.objPaletteData1 = new PaletteData();

            this.scrY = 0;
            this.scrX = 0;

            this.windowYpos = 0;
            this.windowXpos = 0;

            this.lcdcY = 0;
            this.modeClock = 0;

            Array.Clear(this.vram, 0, this.vram.Length);
            Array.Clear(this.oam, 0, this.oam.Length);
        }

        // Source must be < 0xA000
        public void oamDma(ushort startAddr)
        {
            // writeDebug(`OAM DMA @ ${hex(startAddr, 4)}`);
            for (var i = 0; i < 0x100; i++)
            {
                // If $FE00, read from external bus 
                if (startAddr == 0xFE00)
                {
                    this.oam[i] = this.gb.bus.ext.Read((ushort)(startAddr + i));
                }
                else
                { // General bus read
                    this.oam[i] = this.gb.bus.ReadMem8((ushort)(startAddr + i));
                }
            }
        }
    }
}