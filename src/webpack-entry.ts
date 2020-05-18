import 'file-loader?name=[name].[ext]!./index.html';
import 'file-loader?name=[name].[ext]!./index.js';
import * as GameBoy from '../core/gameboy';
import { startDebugging } from './gameboy/tools/debug';
import CanvasVideoPlugin from './gameboy/canvasvideoplugin';
import { get, set } from 'idb-keyval';
import { saveSram, loadSram } from './gameboy/localstorage';


declare global {
    interface Window {
        saveSram: typeof saveSram,
        loadSram: typeof loadSram,
        startDebugging: typeof startDebugging,
        CanvasVideoPlugin: typeof CanvasVideoPlugin,
        GameBoy: typeof GameBoy.GameBoy,
        Disassembler: typeof GameBoy.Disassembler;
    }
}

window.saveSram = saveSram;
window.loadSram = loadSram;
window.startDebugging = startDebugging;
window.CanvasVideoPlugin = CanvasVideoPlugin;

window.GameBoy = GameBoy.GameBoy;
window.Disassembler = GameBoy.Disassembler;