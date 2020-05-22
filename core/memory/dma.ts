import GameBoy from "../gameboy";
import { HWIO } from "./hwio";
import { hex } from "../../src/gameboy/tools/util";
import { Serializer } from "../serialize";

export class DMAController implements HWIO {

    constructor(gb: GameBoy) {
        this.gb = gb;
    }

    gb: GameBoy;

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
            case 0xFF52:
            case 0xFF53:
            case 0xFF54:
                return 0xFF;
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
                }
                break;
            case 0xFF52:
                if (this.gb.cgb) {
                    this.hDmaSourceAt &= 0xFF00;
                    this.hDmaSourceAt |= (value & 0xF0);
                }
                break;
            case 0xFF53:
                if (this.gb.cgb) {
                    this.hDmaDestAt &= 0x00FF;
                    this.hDmaDestAt |= ((value & 0x1F) << 8);
                }
                break;
            case 0xFF54:
                if (this.gb.cgb) {
                    this.hDmaDestAt &= 0xFF00;
                    this.hDmaDestAt |= (value & 0xF0);
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
        state.PUT_16LE(this.newDmaLength);
        state.PUT_16LE(this.hDmaRemaining);
        state.PUT_16LE(this.hDmaSourceAt);
        state.PUT_16LE(this.hDmaDestAt);
        state.PUT_BOOL(this.hDmaCompleted);
        state.PUT_BOOL(this.hDmaPaused);
        state.PUT_BOOL(this.gDmaCompleted);
        state.PUT_BOOL(this.oamDmaRunning);
        state.PUT_16LE(this.oamDmaCyclesRemaining);
        state.PUT_16LE(this.oamDmaStart);
        state.PUT_16LE(this.oamDmaStartAddr);
    }

    deserialize(state: Serializer) {
        this.newDmaLength = state.GET_16LE();
        this.hDmaRemaining = state.GET_16LE();
        this.hDmaSourceAt = state.GET_16LE();
        this.hDmaDestAt = state.GET_16LE();
        this.hDmaCompleted = state.GET_BOOL();
        this.hDmaPaused = state.GET_BOOL();
        this.gDmaCompleted = state.GET_BOOL();
        this.oamDmaRunning = state.GET_BOOL();
        this.oamDmaCyclesRemaining = state.GET_16LE();
        this.oamDmaStart = state.GET_16LE();
        this.oamDmaStartAddr = state.GET_16LE();
    }
}