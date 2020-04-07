import 'file-loader?name=[name].[ext]!./index.html';
import 'file-loader?name=[name].[ext]!./index.js';
import * as GameBoy from '../core/gameboy';
import { startDebugging } from './gameboy/tools/debug';
import Tone from 'tone';
import './index.css';
import { get, set } from 'idb-keyval';
import { saveSram, loadSram } from './gameboy/localstorage';
import './ProggyClean.ttf';
window.saveSram = saveSram;
window.loadSram = loadSram;
window.startDebugging = startDebugging;
window.Tone = Tone;

window.GameBoy = GameBoy.GameBoy;
window.Disassembler = GameBoy.Disassembler;
window.Decoder = GameBoy.Decoder;