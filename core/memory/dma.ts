import GameBoy from "../gameboy";
import { HWIO } from "./hwio";
import { hex } from "../../src/gameboy/tools/util";
import { Serializer, PUT_16LE, PUT_BOOL, GET_16LE, GET_BOOL } from "../serialize";

export class DMAController implements HWIO {

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    gb: GameBoy;

    newDmaSourceLow = 0;
    newDmaSourceHigh = 0;

    newDmaDestLow = 0;
    newDmaDestHigh = 0;

    newDmaLength = 0;
    hDmaRemaining = 0;
    hDmaSourceAt = 0;
    hDmaDestAt = 0;
    hDmaCompleted = false;
    hDmaPaused = false;

    gDmaCompleted = false;

    oamDmaRunning = false;
    oamDmaCyclesRemaining = 0;
    oamDmaStart = 0;
    oamDmaStartAddr = 0;

    // Source must be < 0xA000
    setupOamDma(startAddr: number) {
        this.oamDmaStart = 8;
        this.oamDmaStartAddr = startAddr;
        // console.log("START OAM DMA")
        // writeDebug(`OAM DMA @ ${hex(startAddr, 4)}`);
    }

    tick(cycles: number) {
        if (this.oamDmaCyclesRemaining > 0) {
            this.oamDmaCyclesRemaining -= cycles;

            if (this.oamDmaCyclesRemaining <= 0) {
                this.oamDmaRunning = false;
            }
        }

        if (this.oamDmaStart > 0) {
            this.oamDmaStart -= cycles;

            if (this.oamDmaStart <= 0) {
                this.oamDmaCyclesRemaining = 640;
                this.oamDmaRunning = true;

                for (let i = 0; i < 0xA0; i++) {
                    // Feed it directly into OAM, bypassing the write function
                    this.gb.gpu.oam[i] = this.gb.bus.read(this.oamDmaStartAddr + i);
                }
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

        this.oamDmaRunning = false;
        this.oamDmaCyclesRemaining = 0;
        this.oamDmaStart = 0;
        this.oamDmaStartAddr = 0;
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
                    this.hDmaSourceAt &= 0x00FF;
                    this.hDmaSourceAt |= (value << 8);

                    this.newDmaSourceHigh = value;
                }
                break;
            case 0xFF52:
                if (this.gb.cgb) {
                    this.hDmaSourceAt &= 0xFF00;
                    this.hDmaSourceAt |= (value & 0xF0);

                    this.newDmaSourceLow = value & 0xF0;
                }
                break;
            case 0xFF53:
                if (this.gb.cgb) {
                    this.hDmaDestAt &= 0x00FF;
                    this.hDmaDestAt |= ((value & 0x1F) << 8);

                    this.newDmaDestHigh = value & 0x1F;
                }
                break;
            case 0xFF54:
                if (this.gb.cgb) {
                    this.hDmaDestAt &= 0xFF00;
                    this.hDmaDestAt |= (value & 0xF0);

                    this.newDmaDestLow = value & 0xF0;
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

    serialize(state: Serializer) {
        PUT_16LE(state, this.newDmaSourceLow);
        PUT_16LE(state, this.newDmaSourceHigh);
        PUT_16LE(state, this.newDmaDestLow);
        PUT_16LE(state, this.newDmaDestHigh);
        PUT_16LE(state, this.newDmaLength);
        PUT_16LE(state, this.hDmaRemaining);
        PUT_16LE(state, this.hDmaSourceAt);
        PUT_16LE(state, this.hDmaDestAt);
        PUT_BOOL(state, this.hDmaCompleted);
        PUT_BOOL(state, this.hDmaPaused);
        PUT_BOOL(state, this.gDmaCompleted);
        PUT_BOOL(state, this.oamDmaRunning);
        PUT_16LE(state, this.oamDmaCyclesRemaining);
        PUT_16LE(state, this.oamDmaStart);
        PUT_16LE(state, this.oamDmaStartAddr);
    }

    deserialize(state: Serializer) {
        this.newDmaSourceLow = GET_16LE(state);
        this.newDmaSourceHigh = GET_16LE(state);
        this.newDmaDestLow = GET_16LE(state);
        this.newDmaDestHigh = GET_16LE(state);
        this.newDmaLength = GET_16LE(state);
        this.hDmaRemaining = GET_16LE(state);
        this.hDmaSourceAt = GET_16LE(state);
        this.hDmaDestAt = GET_16LE(state);
        this.hDmaCompleted = GET_BOOL(state);
        this.hDmaPaused = GET_BOOL(state);
        this.gDmaCompleted = GET_BOOL(state);
        this.oamDmaRunning = GET_BOOL(state);
        this.oamDmaCyclesRemaining = GET_16LE(state);
        this.oamDmaStart = GET_16LE(state);
        this.oamDmaStartAddr = GET_16LE(state);
    }
}