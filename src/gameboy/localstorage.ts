export function saveSram(name: string, sram: Uint8Array) {
    localStorage.setItem(`sram-${name}`, Uint8ToBase64(sram));
}

export function loadSram(name: string): Uint8Array | void {
    const item = localStorage.getItem(`sram-${name}`);
    if (item == undefined) {
        console.info(`SRAM for "${name}" not found in localStorage, not loading.`);
    } else {
        return Uint8Array.from(atob(item), c => c.charCodeAt(0));
    }
}

function Uint8ToBase64(array: Uint8Array) {
    let CHUNK_SIZE = 0x8000;
    let index = 0;
    let length = array.length;
    let result = '';
    let slice;

    while (index < length) {
        slice = array.subarray(index, Math.min(index + CHUNK_SIZE, length));
        result += String.fromCharCode.apply(null, new Array(...slice));
        index += CHUNK_SIZE;
    }

    return btoa(result);
}