import GameBoy from "../gameboy";
import { HWIO } from "./hwio";

export class DMAController implements HWIO {

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    gb: GameBoy;

    newDmaSourceLow = 0;
    newDmaSourceHigh = 0;

    getNewDmaSource() {
        return (this.newDmaSourceHigh << 8) | this.newDmaSourceLow;
    }

    newDmaDestLow = 0;
    newDmaDestHigh = 0;

    getNewDmaDest() {
        return ((this.newDmaDestHigh << 8) | this.newDmaDestLow) | 0x8000;
    }

    newDmaLength = 0;
    hDmaRemaining = 0;
    hDmaSourceAt = 0;
    hDmaDestAt = 0;
    hDmaCompleted = false;
    hDmaPaused = false;

    gDmaCompleted = false;



    // Source must be < 0xA000
    oamDma(startAddr: number) {
        this.gb.oamDmaCyclesRemaining = 648;
        // writeDebug(`OAM DMA @ ${hex(startAddr, 4)}`);
        for (let i = 0; i < 0xA0; i++) {
            // If $FE00, read from external bus 
            if (startAddr === 0xFE00) {
                this.gb.gpu.writeOam(0xFE00 | i, this.gb.bus.ext.mbc.read(startAddr + i));
            } else { // General bus read
                this.gb.gpu.writeOam(0xFE00 | i, this.gb.bus.read(startAddr + i));
            }
        }
    }


    continueHdma() {
        if (this.hDmaRemaining > 0 && this.hDmaPaused === false) {
            this.newDma(1);
            this.hDmaRemaining--;
            // this.gb.cpuPausedTCyclesRemaining += 8;
        } else {
            this.hDmaRemaining = 0;
            this.hDmaCompleted = true;
        }
    }

    reset() {
        this.newDmaSourceLow = 0;
        this.newDmaSourceHigh = 0;
        this.newDmaDestLow = 0;
        this.newDmaDestHigh = 0;
        this.newDmaLength = 0;
        this.hDmaRemaining = 0;
        this.hDmaSourceAt = 0;
        this.hDmaDestAt = 0;
        this.hDmaCompleted = false;
        this.hDmaPaused = false;
        this.gDmaCompleted = false;
    }

    newDma(length: number) {
        for (let i = 0; i < length; i++) {
            this.gb.tick(8);

            for (let j = 0; j < 16; j++) {
                this.gb.gpu.write(this.hDmaDestAt, this.gb.bus.read(this.hDmaSourceAt));

                this.hDmaSourceAt++;
                this.hDmaSourceAt &= 0xFFFF;
                this.hDmaDestAt++;
                this.hDmaDestAt &= 0xFFFF;
            }
        }
    }

    readHwio(addr: number) {
        switch (addr) {
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
                if (this.gb.cgb) return 0xFF;
                break;
            case 0xFF55:
                if (this.gb.cgb) {
                    if (this.hDmaCompleted || this.gDmaCompleted) {
                        return 0xFF;
                    }
                    else {
                        return this.hDmaRemaining - 1;
                    }
                }
                break;
        }
        return 0xFF;
    }

    writeHwio(addr: number, value: number) {
        switch (addr) {
            case 0xFF51:
                if (this.gb.cgb) {
                    this.newDmaSourceHigh = value;
                    this.hDmaSourceAt = this.getNewDmaSource();
                }
                break;
            case 0xFF52:
                if (this.gb.cgb) {
                    this.newDmaSourceLow = value & 0xF0;
                    this.hDmaSourceAt = this.getNewDmaSource();
                }
                break;
            case 0xFF53:
                if (this.gb.cgb) {
                    this.newDmaDestHigh = value & 0x1F;
                    this.hDmaDestAt = this.getNewDmaDest();
                }
                break;
            case 0xFF54:
                if (this.gb.cgb) {
                    this.newDmaDestLow = value & 0xF0;
                    this.hDmaDestAt = this.getNewDmaDest();
                }
                break;
            case 0xFF55:
                if (this.gb.cgb) {
                    this.newDmaLength = (value & 127) + 1;
                    const newDmaHblank = ((value >> 7) & 1) !== 0;
                    if (newDmaHblank) {
                        // console.log(`Init HDMA ${this.newDmaLength} bytes: ${hex(this.newDmaSource, 4)} => ${hex(this.newDmaDest, 4)}`);
                        this.hDmaRemaining = this.newDmaLength;
                        this.hDmaCompleted = false;
                        this.hDmaPaused = false;
                        this.gDmaCompleted = false;
                    } else {
                        if (this.hDmaRemaining > 0) {
                            this.hDmaPaused = true;
                            this.gDmaCompleted = false;
                            // console.log(`Paused HDMA ${this.hDmaRemaining} bytes remaining`);
                        } else {
                            // console.log(`GDMA ${this.newDmaLength} bytes: ${hex(this.newDmaSource, 4)} => ${hex(this.newDmaDest, 4)}`);
                            this.newDma(this.newDmaLength);
                            this.gDmaCompleted = true;
                        }
                    }
                }
                break;

        }
    }
}