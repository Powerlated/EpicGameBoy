import GameBoy from '../../core/gameboy';
import * as pako from 'pako';
import { writeDebug } from './tools/debug';

type State = {

};

function SaveState(gb: GameBoy, slot: number) {
    const gpu = gb.gpu;
    const cpu = gb.cpu;
    const timer = gb.timer;
    const bus = gb.bus;

    const state: State = {
       
    };

    const data = pako.deflate(JSON.stringify(state), { level: 9 });
    localStorage[`savestate-${slot}`] = btoa(String.fromCharCode(...data));
}

function LoadState(gb: GameBoy, slot: number) {
    const data = pako.inflate(Uint8Array.from(localStorage[`savestate-${slot}`]));

    const state = JSON.parse(String.fromCharCode(...data));

    writeDebug(state);
}