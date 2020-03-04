import 'file-loader?name=[name].[ext]!./index.html';
import ROMS_BASE64 from './roms';
import GameBoy from './gameboy/gameboy';
import { startDebugging } from './gameboy/tools/debug';
import Disassembler from './gameboy/tools/disassembler';
import Tone from 'tone';
import './index.css';
import { get, set } from 'idb-keyval';
import { saveSram, loadSram } from './gameboy/localstorage';
window.saveSram = saveSram;
window.loadSram = loadSram;

set
init();

function loadDefaultBootRom() {
    let raw = atob(ROMS_BASE64.bootrom);
    let rawLength = raw.length;

    let array = new Uint8Array(new ArrayBuffer(256));

    for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }

    array.forEach((v, i, a) => {
        gb.bus.bootrom[i] = v;
    });

    gb.bus.bootromLoaded = true;

    disassemble(cpu);
}

function loadRom(rom) {
    let raw = atob(ROMS_BASE64[rom]);
    let rawLength = raw.length;

    let array = new Uint8Array(new ArrayBuffer(4194304));

    for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }

    gb.bus.ext.replaceRom(array);
}

window.loadDefaultBootRom = loadDefaultBootRom;
window.loadRom = loadRom;

let disassemblyP = document.getElementById('disassembly-output');
let lastDisassembly = "";

function disassemble(cpu) {
    let disassembly = Disassembler.disassemble(cpu);
    if (lastDisassembly != disassembly) {
        disassemblyP.innerHTML = disassembly;
        lastDisassembly = disassembly;
    }
}

function executeAtPc() {
    let cpu = window.cpu;
    let pc = cpu.pc;
    cpu.debugging = false;
    if (cpu.breakpoints.has(pc)) {
        cpu.clearBreakpoint(pc);
        cpu.step();
        cpu.setBreakpoint(pc);
    } else {
        cpu.step();
    }

    disassemble(cpu);
}
window.executeAtPc = executeAtPc;

/** 
 * Downloads file
 * 
 * @argument {string} filename 
 * @argument {Uint8Array} arr 
 */
function download(filename, arr) {
    let element = document.createElement('a');
    let blob = new Blob([arr.buffer], { type: 'application/octet-stream' });
    element.href = window.URL.createObjectURL(blob);
    element.download = filename;

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function downloadSave() {
    download(`${gb.bus.ext.romTitle}.sav`, gb.bus.ext.mbc.externalRam);
}
window.downloadSave = downloadSave;

function downloadLog() {
    download("EpicGameBoy.log", cpu.fullLog.join('\n'));
}

document.querySelector('#enableLogging').addEventListener('change', function (e) {
    cpu.logging = e.target.checked;
}, false);

let drawTilesetInterval = 0;
document.getElementById('tileset').style.display = "none";
document.querySelector('#drawTileset').addEventListener('change', function (e) {
    if (e.target.checked) {
        startDrawingTiles();
        document.getElementById('tileset').style.display = "block";
    } else {
        stopDrawingTiles();
        document.getElementById('tileset').style.display = "none";
    }

}, false);

// Draw tileset by default
function startDrawingTiles() {
    drawTilesetInterval = setInterval(() => {
        gb.gpu.renderTiles();
        gb.gpu.drawToCanvasTileset();
    }, 10);
}
function stopDrawingTiles() {
    clearInterval(drawTilesetInterval);
}

document.querySelector('#displaySerialInput').addEventListener('change', function (e) {
    window.displaySerial = e.target.checked;
}, false);

document.querySelector('#big-screen').addEventListener('change', function (e) {
    if (e.target.checked) {
        document.getElementById('palette').classList.add('hidden');
        document.getElementById('tileset').classList.add('hidden');

        document.getElementById('gameboy').classList.add('bigscreen');
    } else {
        document.getElementById('palette').classList.remove('hidden');
        document.getElementById('tileset').classList.remove('hidden');

        document.getElementById('gameboy').classList.remove('bigscreen');
    }
}, false);

document.querySelector('#haltInput').addEventListener('change', function (e) {
    cpu.setBreakpoint(parseInt(`0x${e.target.value}`));
}, false);
document.querySelector('#halt2Input').addEventListener('change', function (e) {
    cpu.haltWhen = parseInt(`${e.target.value}`);
    writeDebug(`Set halt instructions executed to ${parseInt(cpu.haltWhen).toString(10)}`);
}, false);
document.querySelector('#enableDebugger').addEventListener('change', function (e) {
    if (e.target.checked) {
        showDebug();
    } else {
        hideDebug();
    }
});

function showDebug() {
    window.globalDebug = true;
    let debugElements = document.getElementsByClassName('debug');
    for (let i = 0; i < debugElements.length; i++) {
        debugElements[i].classList.remove('hidden');
    }
}
function hideDebug() {
    window.globalDebug = false;
    let debugElements = document.getElementsByClassName('debug');
    for (let i = 0; i < debugElements.length; i++) {
        debugElements[i].classList.add('hidden');
    }
}

document.querySelector('#bootromInput').addEventListener('change', function () {
    var reader = new FileReader();
    reader.onload = function () {
        var arrayBuffer = this.result;

        var array = new Uint8Array(arrayBuffer);

        array.forEach((v, i, a) => {
            gb.bus.bootrom[i] = v;
        });
    };
    reader.readAsArrayBuffer(this.files[0]);
}, false);

document.querySelector('#gameromInput').addEventListener('change', function () {
    var reader = new FileReader();
    reader.onload = function () {
        var arrayBuffer = this.result;
        var array = new Uint8Array(arrayBuffer);

        gb.bus.ext.replaceRom(array);
        // cpu.khz()
        // gb.bus.gpu.frameExecute();
    };
    reader.readAsArrayBuffer(this.files[0]);
}, false);

document.querySelector('#saveInput').addEventListener('change', function () {
    var reader = new FileReader();
    reader.onload = function () {
        var arrayBuffer = this.result;
        var array = new Uint8Array(arrayBuffer);

        gb.bus.loadSave(array);
    };
    reader.readAsArrayBuffer(this.files[0]);
}, false);

function repeatDisassemble() {
    requestAnimationFrame(repeatDisassemble);

    if (window.globalDebug) {
        disassemble(cpu);
    }

}

function init() {
    let gb = new GameBoy();
    window.cpu = gb.cpu;
    window.gb = gb;

    loadRom('pokeyellow');
    startDebugging();

    repeatDisassemble();

    showDebug();

    // Handle input
    let block = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", "\\", "z", "x", "Tab"];

    document.onkeydown = function (e) {
        if (e.getModifierState("Shift")) {
            if (e.key == "D") {
                document.querySelector('#enableDebugger').click();
                e.preventDefault();
            }
            if (e.key == "T") {
                document.querySelector('#drawTileset').click();
                e.preventDefault();
            }
            if (e.key == "B") {
                document.querySelector('#big-screen').click();
                e.preventDefault();
            }
        }

        if (block.includes(e.key))
            e.preventDefault();

        switch (e.key) {
            case "ArrowLeft":
                gb.bus.joypad.dpad.left = true;
                break;
            case "ArrowUp":
                gb.bus.joypad.dpad.up = true;
                break;
            case "ArrowRight":
                gb.bus.joypad.dpad.right = true;
                break;
            case "ArrowDown":
                gb.bus.joypad.dpad.down = true;
                break;

            case "x":
                gb.bus.joypad.buttons.a = true;
                break;
            case "z":
                gb.bus.joypad.buttons.b = true;
                break;
            case "Enter":
                gb.bus.joypad.buttons.start = true;
                break;
            case "\\":
                gb.bus.joypad.buttons.select = true;
                break;

            case "Tab":
                gb.speedMul = 8;
                break;
        }
    };
    document.onkeyup = function (e) {
        if (block.includes(e.key))
            e.preventDefault();

        switch (e.key) {
            case "ArrowLeft":
                gb.bus.joypad.dpad.left = false;
                break;
            case "ArrowUp":
                gb.bus.joypad.dpad.up = false;
                break;
            case "ArrowRight":
                gb.bus.joypad.dpad.right = false;
                break;
            case "ArrowDown":
                gb.bus.joypad.dpad.down = false;
                break;

            case "x":
                gb.bus.joypad.buttons.a = false;
                break;
            case "z":
                gb.bus.joypad.buttons.b = false;
                break;
            case "Enter":
                gb.bus.joypad.buttons.start = false;
                break;
            case "\\":
                gb.bus.joypad.buttons.select = false;
                break;

            case "Tab":
                gb.speedMul = 1;
                break;
        }
    };

    // Start tone.js
    document.querySelector('html').addEventListener('click', () => {
        Tone.start();
    });
    document.querySelector('html').addEventListener('touchstart', () => {
        Tone.start();
    });
}

function dropHandler(ev) {
    console.log('File(s) dropped');

    // Prevent default behavior (Prevent file from being opened)
    ev.preventDefault();

    var reader = new FileReader();
    reader.onload = function () {
        var arrayBuffer = this.result;
        var array = new Uint8Array(arrayBuffer);

        gb.bus.ext.replaceRom(array);
    };
    reader.readAsArrayBuffer(ev.dataTransfer.files[0]);
}
window.dropHandler = dropHandler;

function dragOverHandler(ev) {
    ev.preventDefault();
}
window.dragOverHandler = dragOverHandler;