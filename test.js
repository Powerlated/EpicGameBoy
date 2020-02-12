console.log("Starting emulator test");

global.alert = msg => console.warn(msg);

require('source-map-support').install();
let gameboy = require("./src/gameboy/gameboy");
let fs = require("fs");

console.log("Loading ROM");
let buffer = fs.readFileSync("./06-ld r,r.gb");

let cpu = new gameboy.CPU();

buffer.forEach((v, i, a) => {
  cpu.bus.memory[i] = v;
});

setTimeout(() => {
  console.log("Starting test");
  cpu.khz();
}, 0);
setTimeout(() => {
  cpu.khzStop();
  fs.writeFileSync("EpicGameBoy.log", cpu.log.join("\n"));
  console.log("Wrote log file");
}, 4000);
