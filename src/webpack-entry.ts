import 'file-loader?name=[name].[ext]!./index.html';
import 'file-loader?name=[name].[ext]!./index.js';
import * as GameBoy from '../core/gameboy';
import { startDebugging } from './gameboy/tools/debug';
import WebAudioPlugin from './gameboy/webaudioplugin';
import CanvasVideoPlugin from './gameboy/canvasvideoplugin';
import { get, set } from 'idb-keyval';
import { saveSram, loadSram } from './gameboy/localstorage';
import { ParseVBM } from '../core/movies/vbm';

declare global {
    interface Window {
        saveSram: typeof saveSram,
        loadSram: typeof loadSram,
        startDebugging: typeof startDebugging,
        WebAudioPlugin: typeof WebAudioPlugin,
        CanvasVideoPlugin: typeof CanvasVideoPlugin,
        GameBoy: typeof GameBoy.GameBoy,
        Disassembler: typeof GameBoy.Disassembler;
        ParseVBM: typeof ParseVBM;
    }
}

window.saveSram = saveSram;
window.loadSram = loadSram;
window.startDebugging = startDebugging;
window.WebAudioPlugin = WebAudioPlugin;
window.CanvasVideoPlugin = CanvasVideoPlugin;

window.GameBoy = GameBoy.GameBoy;
window.Disassembler = GameBoy.Disassembler;
window.ParseVBM = ParseVBM;