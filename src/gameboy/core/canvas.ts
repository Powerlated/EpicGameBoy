import GPU from "./gpu";

export default class GPUCanvas {
    ctxGameboy: CanvasRenderingContext2D;
    ctxTileset: CanvasRenderingContext2D;

    gpu: GPU;

    constructor(gpu: GPU) {
        let cGameboy = document.getElementById("gameboy") as HTMLCanvasElement;
        this.ctxGameboy = cGameboy.getContext("2d")!;
        let cTileset = document.getElementById("tileset") as HTMLCanvasElement;
        this.ctxTileset = cTileset.getContext("2d")!;
        let gl = this.ctxGameboy;
        this.gpu = gpu;
    }

    render() {

    }

    clearScreen() {
        var c = document.getElementById("gameboy");
        var ctx = (c as any).getContext("2d");

        ctx.clearRect(0, 0, (c as any).width, (c as any).height);
    }

    drawGameboy() {
        this.ctxGameboy.putImageData(this.gpu.imageGameboy, 0, 0);
    }

    drawTileset() {
        let iData = new ImageData(this.gpu.imageTilesetArr, 256, 96);

        this.ctxTileset.putImageData(iData, 0, 0);

        this.ctxTileset.fillStyle = 'rgba(255, 255, 128, 0.5)';
        // 0: Bottom half used, 1: Top half used
        // Draw over unused with transparent yellow
        if (this.gpu.lcdControl.bgWindowTiledataSelect__4) {
            this.ctxTileset.fillRect(0, 32, 256, 63);
        } else {
            this.ctxTileset.fillRect(0, 0, 256, 63);
        }

        this.ctxTileset.setLineDash([2]);
        this.ctxTileset.strokeStyle = '#ff0000';
        this.ctxTileset.strokeRect(0, 0, 256, 63);
        this.ctxTileset.strokeStyle = '#0000ff';
        this.ctxTileset.strokeRect(0, 32, 256, 63);
    }

}