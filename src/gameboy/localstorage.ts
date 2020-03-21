import GameBoy from "./core/gameboy";
import { MBCWithRAM } from "./core/memory/mbc/mbc";

export function saveSram(name: string, sram: Uint8Array) {
    localStorage.setItem(`sram-${name}`, btoa(String.fromCharCode(...sram)));
}

export function loadSram(name: string): Uint8Array | void {
    const item = localStorage.getItem(`sram-${name}`);
    if (item == undefined) {
        console.info(`SRAM for "${name}" not found in localStorage, not loading.`);
    } else {
        return Uint8Array.from(atob(item), c => c.charCodeAt(0));
    }
}