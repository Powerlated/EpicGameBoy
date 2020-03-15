import 'file-loader?name=[name].[ext]!./index.html';
import 'file-loader?name=[name].[ext]!./index.js';
import ROMS_BASE64 from './roms';
import * as GameBoy from './gameboy/gameboy';
import { startDebugging } from './gameboy/tools/debug';
import Tone from 'tone';
import './index.css';
import { get, set } from 'idb-keyval';
import { saveSram, loadSram } from './gameboy/localstorage';
window.saveSram = saveSram;
window.loadSram = loadSram;
window.ROMS_BASE64 = ROMS_BASE64
window.startDebugging = startDebugging;
window.Tone = Tone;

window.GameBoy = GameBoy.GameBoy;
window.Disassembler = GameBoy.Disassembler;
window.Decoder = GameBoy.Decoder;