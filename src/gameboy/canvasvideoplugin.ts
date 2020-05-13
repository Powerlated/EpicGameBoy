import GPU from "../../core/video/gpu";
import { VideoPlugin } from "../../core/video/videoplugin";

export default class GPUCanvas implements VideoPlugin {
    ctxGameboy: WebGL2RenderingContext;
    ctxTileset: CanvasRenderingContext2D | null;

    constructor(cGameboy: HTMLCanvasElement, cTileset?: HTMLCanvasElement) {
        this.ctxGameboy = cGameboy.getContext("webgl2")!;

        let gl = this.ctxGameboy;


        let vertices = [
            -1, 1, 0.0,
            -1, -1, 0.0,
            1, -1, 0.0,
            1, 1, 0.0
        ];

        const indices = [3, 2, 1, 3, 1, 0];

        // Create an empty buffer object to store vertex buffer
        let vertex_buffer = gl.createBuffer();

        // Bind appropriate array buffer to it
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

        // Pass the vertex data to the buffer
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // Unbind the buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        // Create an empty buffer object to store Index buffer
        let Index_Buffer = gl.createBuffer();

        // Bind appropriate array buffer to it
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);

        // Pass the vertex data to the buffer
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        // Unbind the buffer
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        /*====================== Shaders =======================*/

        // Vertex shader source code
        let vertCode =
            'attribute vec3 coordinates;' +
            'void main(void) {' +
            ' gl_Position = vec4(coordinates, 1.0);' +
            '}';

        // Create a vertex shader object
        let vertShader = gl.createShader(gl.VERTEX_SHADER)!;

        // Attach vertex shader source code
        gl.shaderSource(vertShader, vertCode);

        // Compile the vertex shader
        gl.compileShader(vertShader);

        // Fragment shader source code
        let fragCode =
            'void main(void) {' +
            ' gl_FragColor = vec4(1.0, 0.0, 0.0, 1);' +
            '}';

        // Create fragment shader object 
        let fragShader = gl.createShader(gl.FRAGMENT_SHADER)!;

        // Attach fragment shader source code
        gl.shaderSource(fragShader, fragCode);

        // Compile the fragmentt shader
        gl.compileShader(fragShader);

        // Create a shader program object to
        // store the combined shader program
        let shaderProgram = gl.createProgram()!;

        // Attach a vertex shader
        gl.attachShader(shaderProgram, vertShader);

        // Attach a fragment shader
        gl.attachShader(shaderProgram, fragShader);

        // Link both the programs
        gl.linkProgram(shaderProgram);

        // Use the combined shader program object
        gl.useProgram(shaderProgram);

        /* ======= Associating shaders to buffer objects =======*/

        // Bind vertex buffer object
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);

        // Bind index buffer object
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, Index_Buffer);

        // Get the attribute location
        let coord = gl.getAttribLocation(shaderProgram, "coordinates");

        // Point an attribute to the currently bound VBO
        gl.vertexAttribPointer(coord, 3, gl.FLOAT, false, 0, 0);

        // Enable the attribute
        gl.enableVertexAttribArray(coord);

        /*============= Drawing the Quad ================*/

        // Clear the canvas
        gl.clearColor(0, 0, 1, 1);

        // Enable the depth test
        gl.enable(gl.DEPTH_TEST);

        // Clear the color buffer bit
        gl.clear(gl.COLOR_BUFFER_BIT);


        // Set the view port
        gl.viewport(0, 0, cGameboy.width, cGameboy.height);

        // Draw the triangle
        gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);

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
        const gl = this.ctxGameboy;
        gl.blitFramebuffer(0, 0, 160, 144, 0, 0, 160, 144, gl.COLOR_BUFFER_BIT, gl.NEAREST);
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