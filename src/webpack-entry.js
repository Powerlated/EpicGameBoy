import 'file-loader?name=[name].[ext]!./index.html';
import 'file-loader?name=[name].[ext]!./index.js';
import * as GameBoy from '../core/gameboy';
import { startDebugging } from './gameboy/tools/debug';
import Tone from 'tone';
import ToneJsAudioPlugin from './gameboy/tonejsaudioplugin';
import CanvasRenderPlugin from './gameboy/canvasrenderplugin';
import { get, set } from 'idb-keyval';
import { saveSram, loadSram } from './gameboy/localstorage';

window.saveSram = saveSram;
window.loadSram = loadSram;
window.startDebugging = startDebugging;
window.Tone = Tone;
window.ToneJsAudioPlugin = ToneJsAudioPlugin;
window.CanvasRenderPlugin = CanvasRenderPlugin;


window.GameBoy = GameBoy.GameBoy;
window.Disassembler = GameBoy.Disassembler;
window.Decoder = GameBoy.Decoder;