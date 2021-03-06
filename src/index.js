/** 
 * @param {string} selector  
*/
function $(selector) {
    return document.querySelector(selector);
}


/** @type {GameBoy} */
const gb = new GameBoy(true);
// Set the audio and video plugin
// gb.soundChip.ap = new WebAudioHLEPlugin();

let cGameboy = document.getElementById("gameboy");
let cTileset = document.getElementById("tileset");
gb.gpu.vp = new CanvasVideoPlugin(cGameboy, cTileset);

window.gb = gb;
loadRom('pokeyellow');
startDebugging();

repeatDisassemble();

showDebug();
// loadDmgBootRom();


// Handle input
let block = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Enter", "\\", "z", "x", "Tab"];

document.onkeydown = function (e) {
    if (e.key === "s") {
        gb.step();
        e.preventDefault();
    }

    if (e.getModifierState("Shift")) {
        switch (e.key) {
            case "M":
                toggleDarkMode();
                e.preventDefault()
                break;
            case "D":
                $('#enableDebugger').click();
                e.preventDefault();
                break;
            case "T":
                $('#drawTileset').click();
                e.preventDefault();
                break;
            case "F":
                gb.gpu.frameBlending = !gb.gpu.frameBlending;
                e.preventDefault();
                break;
            case "B":
                $('#big-screen').click();
                e.preventDefault();
                break;
            case "F1":
                gb.serialize(1);
                e.preventDefault();
                break;
            case "F2":
                gb.serialize(2);
                e.preventDefault();
                break;
            case "F3":
                gb.serialize(3);
                e.preventDefault();
                break;
            case "F4":
                gb.serialize(4);
                e.preventDefault();
                break;
        }
    } else {
        switch (e.key) {
            case "F1":
                gb.deserialize(1);
                e.preventDefault();
                break;
            case "F2":
                gb.deserialize(2);
                e.preventDefault();
                break;
            case "F3":
                gb.deserialize(3);
                e.preventDefault();
                break;
            case "F4":
                gb.deserialize(4);
                e.preventDefault();
                break;
            case "F5":
                $('#ch1').click();
                e.preventDefault();
                break;
            case "F6":
                $('#ch2').click();
                e.preventDefault();
                break;
            case "F7":
                $('#ch3').click();
                e.preventDefault();
                break;
            case "F8":
                $('#ch4').click();
                e.preventDefault();
                break;
        }
    }

    if (e.getModifierState("Control")) {
        if (e.key === "r") {
            if (confirm('Are you sure you want to reset the emulated Game Boy?') === true)
                $('#reset-button').click();
            e.preventDefault();
        }
    }

    if (block.includes(e.key)) {
        e.preventDefault();
    }

    if (window.altControls) {
        switch (e.key.toLowerCase()) {
            case "a": gb.joypad.left = true; break;
            case "w": gb.joypad.up = true; break;
            case "d": gb.joypad.right = true; break;
            case "s": gb.joypad.down = true; break;

            case "l": gb.joypad.a = true; break;
            case "k": gb.joypad.b = true; break;
        }
    } else {
        switch (e.key.toLowerCase()) {
            case "arrowleft": gb.joypad.left = true; break;
            case "arrowup": gb.joypad.up = true; break;
            case "arrowright": gb.joypad.right = true; break;
            case "arrowdown": gb.joypad.down = true; break;

            case "x": gb.joypad.a = true; break;
            case "z": gb.joypad.b = true; break;
        }
        switch (e.code.toLowerCase()) {
            case "controlleft": gb.setSlomo(true); break;
        }
    }

    switch (e.key) {
        case "Enter": gb.joypad.start = true; break;
        case "\\": gb.joypad.select = true; break;
        case "Tab": gb.setTurbo(true); break;
    }
};
document.onkeyup = function (e) {
    if (block.includes(e.key))
        e.preventDefault();

    if (window.altControls) {
        switch (e.key.toLowerCase()) {
            case "a": gb.joypad.left = false; break;
            case "w": gb.joypad.up = false; break;
            case "d": gb.joypad.right = false; break;
            case "s": gb.joypad.down = false; break;

            case "l": gb.joypad.a = false; break;
            case "k": gb.joypad.b = false; break;
        }
    } else {
        switch (e.key.toLowerCase()) {
            case "arrowleft": gb.joypad.left = false; break;
            case "arrowup": gb.joypad.up = false; break;
            case "arrowright": gb.joypad.right = false; break;
            case "arrowdown": gb.joypad.down = false; break;

            case "x": gb.joypad.a = false; break;
            case "z": gb.joypad.b = false; break;
        }
        switch (e.code.toLowerCase()) {
            case "controlleft": gb.setSlomo(false); break;
        }
    }

    switch (e.key) {
        case "Enter": gb.joypad.start = false; break;
        case "\\": gb.joypad.select = false; break;

        case "Tab": gb.setTurbo(false); break;
    }
};

window.onerror = function (msg, url, linenumber) {
    alert('Error message: ' + msg + '\nURL: ' + url + '\nLine Number: ' + linenumber);
    return true;
};

function loadRom(rom) {
    let raw = atob(ROMS_BASE64[rom]);
    let rawLength = raw.length;

    let array = new Uint8Array(new ArrayBuffer(raw.length));

    for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }

    gb.bus.replaceRom(array);
}

function loadDmgBootRom() {
    let raw = atob(DMG_BOOT_ROM);
    let rawLength = raw.length;

    let array = new Uint8Array(new ArrayBuffer(256));

    for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }

    array.forEach((v, i, a) => {
        gb.bus.bootrom[i] = v;
    });

    gb.bus.bootromLoaded = true;

    disassemble(gb.cpu);
}

let disassemblyP = document.getElementById('disassembly-output');
let lastDisassembly = "";

function disassemble(cpu) {
    let disassembly = Disassembler.disassemble(cpu);
    if (lastDisassembly !== disassembly) {
        disassemblyP.innerHTML = disassembly;
        lastDisassembly = disassembly;
    }
}

function executeAtPc() {
    let cpu = gb.cpu;
    let pc = gb.cpu.pc;
    if (cpu.breakpoints[pc]) {
        cpu.clearBreakpoint(pc);
        gb.step();
        cpu.setBreakpoint(pc);
    } else {
        gb.step();
    }

    disassemble(cpu);
}
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
    download(`${gb.bus.romTitle}.sav`, gb.bus.mbc.externalRam);
}

function downloadLog() {
    function downloadText(filename, text) {
        var element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
        element.setAttribute('download', filename);

        element.style.display = 'none';
        document.body.appendChild(element);

        element.click();

        document.body.removeChild(element);
    }
    downloadText("EpicGameBoy.log", gb.cpu.fullLog.join('\n'));
}

$('#enableLogging').addEventListener('change', function (e) {
    cpu.logging = e.target.checked;
}, false);

let drawTilesetInterval = 0;
$('#tileset').style.display = "none";
$('#drawTileset').addEventListener('change', function (e) {
    if (e.target.checked) {
        startDrawingTiles();
        $('#tileset').style.display = "block";
    } else {
        stopDrawingTiles();
        $('#tileset').style.display = "none";
    }

}, false);

$('#volume-slider').addEventListener('input', e => {
    gb.soundChip.soundPlayer.gain.gain.value = e.target.value / 100;
});

$('#ch1').addEventListener('change', e => { gb.soundChip.enable1Out = e.target.checked; });
$('#ch2').addEventListener('change', e => { gb.soundChip.enable2Out = e.target.checked; });
$('#ch3').addEventListener('change', e => { gb.soundChip.enable3Out = e.target.checked; });
$('#ch4').addEventListener('change', e => { gb.soundChip.enable4Out = e.target.checked; });

// Draw tileset by default
function startDrawingTiles() {
    drawTilesetInterval = setInterval(() => {
        gb.gpu.renderTiles();
        gb.gpu.vp.drawTileset(gb.gpu.imageTileset);
    }, 100);
}
function stopDrawingTiles() {
    clearInterval(drawTilesetInterval);
}

$('#displaySerialInput').addEventListener('change', function (e) {
    window.displaySerial = e.target.checked;
}, false);

$('#big-screen').addEventListener('change', function (e) {
    if (e.target.checked) {
        $('#palette').classList.add('hidden');
        $('#tileset').classList.add('hidden');

        $('#gameboy').classList.add('bigscreen');
    } else {
        $('#palette').classList.remove('hidden');
        $('#tileset').classList.remove('hidden');

        $('#gameboy').classList.remove('bigscreen');
    }
}, false);

window.altControls = false;
$('#altControls').addEventListener('change', function (e) {
    window.altControls = e.target.checked;
}, false);

$('#haltInput').addEventListener('change', function (e) {
    gb.cpu.setBreakpoint(parseInt(`0x${e.target.value}`));
}, false);
$('#halt2Input').addEventListener('change', function (e) {
    gb.cpu.haltWhen = parseInt(`${e.target.value}`);
    writeDebug(`Set halt instructions executed to ${parseInt(cpu.haltWhen).toString(10)}`);
}, false);
$('#enableDebugger').addEventListener('change', function (e) {
    if (e.target.checked) {
        showDebug();
    } else {
        hideDebug();
    }
});
$('#nightcoreMode').addEventListener('change', function (e) {
    gb.soundChip.nightcoreMode = e.target.checked;
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

$('#bootromInput').addEventListener('change', function () {
    var reader = new FileReader();
    reader.onload = function () {
        var arrayBuffer = this.result;

        var array = new Uint8Array(arrayBuffer);

        array.forEach((v, i, a) => {
            gb.bus.bootrom[i] = v;
        });

        gb.bus.bootromLoaded = true;
    };
    reader.readAsArrayBuffer(this.files[0]);
}, false);

$('#gameromInput').addEventListener('change', function () {
    var reader = new FileReader();
    reader.onload = function () {
        var arrayBuffer = this.result;
        var array = new Uint8Array(arrayBuffer);

        gb.bus.replaceRom(array);
        // cpu.khz()
        // gb.bus.gpu.frameExecute();
    };
    reader.readAsArrayBuffer(this.files[0]);
}, false);

$('#saveInput').addEventListener('change', function () {
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
        disassemble(gb.cpu);
    }

}

// Set the turbo (TAB) speed multiplier
window.speedMul = 10;

/**
 * 
 * @param {DragEvent} ev 
 */
function dropHandler(ev) {
    if (ev.dataTransfer.files[0] instanceof Blob) {
        console.log('File(s) dropped');

        // Prevent default behavior (Prevent file from being opened)
        ev.preventDefault();

        var reader = new FileReader();
        reader.onload = function () {
            var arrayBuffer = this.result;
            var array = new Uint8Array(arrayBuffer);

            gb.bus.replaceRom(array);
        };
        reader.readAsArrayBuffer(ev.dataTransfer.files[0]);
    }
}

function dragoverHandler(ev) {
    ev.preventDefault();
}

window.addEventListener('drop', dropHandler);
window.addEventListener('dragover', dragoverHandler);

window.onbeforeunload = e => {
    return "Are you sure you want to close Optime GB?";
};

function toggleDarkMode() {
    $('html').classList.toggle('dark-mode')
}