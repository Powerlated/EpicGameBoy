import GPU from "../../core/video/gpu";
import { VideoPlugin } from "../../core/video/videoplugin";

export default class GPUCanvas implements VideoPlugin {
    ctxGameboy: CanvasRenderingContext2D;
    ctxTileset: CanvasRenderingContext2D | null;

    constructor(cGameboy: HTMLCanvasElement, cTileset?: HTMLCanvasElement) {
        this.ctxGameboy = cGameboy.getContext("2d")!;

        if (cTileset) {
            this.ctxTileset = cTileset.getContext("2d")!;
        } else {
            this.ctxTileset = null;
        }
    }

    clearScreen() {
        const c = document.getElementById("gameboy");
        const ctx = (c as any).getContext("2d");

        ctx.clearRect(0, 0, (c as any).width, (c as any).height);
    }

    drawGameboy(data: ImageData) {
        this.ctxGameboy.putImageData(data, 0, 0);
    }

    drawTileset(data: ImageData) {
        if (this.ctxTileset !== null) {
            this.ctxTileset.putImageData(data, 0, 0);
        }

        // this.ctxTileset.fillStyle = 'rgba(255, 255, 128, 0.5)';
        // // 0: Bottom half used, 1: Top half used
        // // Draw over unused with transparent yellow
        // if (this.gpu.lcdControl.bgWindowTiledataSelect__4) {
        //     this.ctxTileset.fillRect(0, 32, 256, 63);
        // } else {
        //     this.ctxTileset.fillRect(0, 0, 256, 63);
        // }

        // this.ctxTileset.setLineDash([2]);
        // this.ctxTileset.strokeStyle = '#ff0000';
        // this.ctxTileset.strokeRect(0, 0, 256, 63);
        // this.ctxTileset.strokeStyle = '#0000ff';
        // this.ctxTileset.strokeRect(0, 32, 256, 63);
    }

}