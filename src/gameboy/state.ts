import GameBoy from './gameboy';
import * as pako from 'pako';
import { writeDebug } from './tools/debug';

type State = {

};

function SaveState(gb: GameBoy, slot: number) {
    let gpu = gb.gpu;
    let cpu = gb.cpu;
    let timer = gb.timer;
    let bus = gb.bus;

    let state: State = {
       
    };

    let data = pako.deflate(JSON.stringify(state), { level: 9 });
    localStorage[`savestate-${slot}`] = btoa(String.fromCharCode(...data));
}

function LoadState(gb: GameBoy, slot: number) {
    let data = pako.inflate(Uint8Array.from(localStorage[`savestate-${slot}`]));

    let state = JSON.parse(String.fromCharCode(...data));

    writeDebug(state);
}