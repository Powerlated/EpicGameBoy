import GPU from "../../core/video/gpu";
import { VideoPlugin } from "../../core/video/videoplugin";

export default class GPUCanvas implements VideoPlugin {

    cGameboy: HTMLCanvasElement;
    ctxGameboyWebGl2: WebGL2RenderingContext;
    ctxGameboy2D: CanvasRenderingContext2D;
    ctxTileset: CanvasRenderingContext2D | null;

    webglFailed = false;

    vertBuf: WebGLBuffer | null = null;
    texCoordBuf: WebGLBuffer | null = null;

    shaderProgram: WebGLProgram | null = null;

    constructor(cGameboy: HTMLCanvasElement, cTileset?: HTMLCanvasElement) {
        this.ctxGameboyWebGl2 = cGameboy.getContext("webgl2")!;
        this.ctxGameboy2D = cGameboy.getContext("2d")!;
        
        this.cGameboy = cGameboy;

        try {

            let gl = this.ctxGameboyWebGl2;

            let vertices = [
                1, 0,
                1, 1,
                0, 1,
                0, 0,
            ];

            const texCoords = [
                0, 0, 0, 0, 0, 0, 0, 0
            ];

            // Create an empty buffer object to store vertex buffer
            this.vertBuf = gl.createBuffer()!;
            // Bind, pass data, unbind
            gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuf);
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

            // Create an empty buffer object to store Index buffer
            this.texCoordBuf = gl.createBuffer()!;
            // Bind, pass data, unbind
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.texCoordBuf);
            gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(texCoords), gl.STATIC_DRAW);

            /*====================== Shaders =======================*/

            let vertCode =
                `
            attribute vec2 aVertex;
            attribute vec2 aTex;
            varying vec2 vTex;
            void main(void) {
                gl_Position = (vec4(aVertex, 0.0, 1.0) * vec4(2.0, -2.0, 1.0, 1.0)) + vec4(-1.0, 1.0, 0.0, 0.0);
                vTex = aTex;
            }
        `;

            let fragCode =
                `
            precision highp float;
            varying vec2 vTex;
            uniform sampler2D sampler0;
            void main(void){
                gl_FragColor = texture2D(sampler0, vTex);
            }
        `;


            let vertShader = gl.createShader(gl.VERTEX_SHADER)!;
            gl.shaderSource(vertShader, vertCode);
            gl.compileShader(vertShader);

            // Create fragment shader object 
            let fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;
            gl.shaderSource(fragShader, fragCode);
            gl.compileShader(fragShader);

            // Create a shader program object to
            // store the combined shader program
            this.shaderProgram = gl.createProgram()!;

            // Attach shaders
            gl.attachShader(this.shaderProgram, vertShader);
            gl.attachShader(this.shaderProgram, fragShader);

            // Link and use
            gl.linkProgram(this.shaderProgram);
            gl.useProgram(this.shaderProgram);

            /* ======= Associating shaders to buffer objects =======*/

            let vLoc = gl.getAttribLocation(this.shaderProgram, "aVertex");
            gl.enableVertexAttribArray(vLoc);
            gl.vertexAttribPointer(vLoc, 2, gl.FLOAT, false, 8, 0);

            let tLoc = gl.getAttribLocation(this.shaderProgram, "aTex");
            gl.enableVertexAttribArray(tLoc);
            gl.vertexAttribPointer(tLoc, 2, gl.FLOAT, false, 8, 0);

            // Enable the depth test
            gl.enable(gl.DEPTH_TEST);
            gl.viewport(0, 0, 160, 144);
        } catch {
            console.log("WebGL 2 initialization failed");
            this.webglFailed = true;
        }

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
        if (!this.webglFailed) {
            const gl = this.ctxGameboyWebGl2;

            let tex = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);

            gl.bindTexture(gl.TEXTURE_2D, tex);

            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 160, 144, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);

            gl.drawArrays(gl.TRIANGLE_FAN, 0, 4);
        } else {
            this.ctxGameboy2D.putImageData(data, 0, 0);
        }
    }

    drawTileset(data: ImageData) {
        if (this.ctxTileset !== null) {
            this.ctxTileset.putImageData(data, 0, 0);
        }

        // this.ctxTileset.fillStyle = 'rgba(255, 255, 128, 1)';
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