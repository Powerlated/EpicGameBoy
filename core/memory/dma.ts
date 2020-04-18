import GameBoy from "../gameboy";
import { HWIO } from "./hwio";

export class DMAController implements HWIO {

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    gb: GameBoy;

    newDmaSourceLow = 0;
    newDmaSourceHigh = 0;

    get newDmaSource() {
        return (this.newDmaSourceHigh << 8) | this.newDmaSourceLow;
    }

    newDmaDestLow = 0;
    newDmaDestHigh = 0;

    get newDmaDest() {
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
                this.gb.gpu.writeOam(i, this.gb.bus.ext.mbc.read(startAddr + i));
            } else { // General bus read
                this.gb.gpu.writeOam(i, this.gb.bus.readMem8(startAddr + i));
            }
        }
    }


    continueHdma() {
        if (this.hDmaRemaining > 0 && !this.hDmaPaused) {
            this.newDma(this.hDmaSourceAt, this.hDmaDestAt, 16);
            this.hDmaSourceAt += 16;
            this.hDmaDestAt += 16;
            this.hDmaRemaining -= 16;
            this.gb.cpuPausedTCyclesRemaining += 8;
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

    newDma(startAddr: number, destination: number, length: number) {
        this.gb.cpuPausedTCyclesRemaining += 8 * (this.newDmaLength >> 4);
        for (let i = 0; i < length; i++) {
            this.gb.gpu.write(destination, this.gb.bus.readMem8(startAddr));
            startAddr++;
            destination++;
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
                        return (this.hDmaRemaining >> 4) - 1;
                    }
                }
                break;
        }
        return 0xFF;
    }

    writeHwio(addr: number, value: number) {
        switch (addr) {
            case 0xFF51:
                if (this.gb.cgb) this.newDmaSourceHigh = value;
                break;
            case 0xFF52:
                if (this.gb.cgb) this.newDmaSourceLow = value & 0xF0;
                break;
            case 0xFF53:
                if (this.gb.cgb) this.newDmaDestHigh = value & 0x1F;
                break;
            case 0xFF54:
                if (this.gb.cgb) this.newDmaDestLow = value & 0xF0;
                break;
            case 0xFF55:
                if (this.gb.cgb) {
                    this.newDmaLength = ((value & 127) + 1) << 4;
                    let newDmaHblank = ((value >> 7) & 1) !== 0;
                    if (newDmaHblank) {
                        // console.log(`Init HDMA ${this.newDmaLength} bytes: ${hex(this.newDmaSource, 4)} => ${hex(this.newDmaDest, 4)}`);
                        this.hDmaRemaining = this.newDmaLength;
                        this.hDmaSourceAt = this.newDmaSource;
                        this.hDmaDestAt = this.newDmaDest;
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
                            this.newDma(this.newDmaSource, this.newDmaDest, this.newDmaLength);
                            this.gDmaCompleted = true;
                        }
                    }
                }
                break;

        }
    }
}