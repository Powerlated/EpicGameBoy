console.log("Starting emulator test");

const { StringDecoder } = require('string_decoder');

global.alert = msg => { console.warn(msg); cleanUp(); };

require('source-map-support').install();
let gameboy = require("./src/gameboy/gameboy");
let fs = require("fs");

console.log("Loading ROM " + process.argv[2]);
let buffer = fs.readFileSync(`${process.argv[2]}`);

let cpu = new gameboy.CPU();
cpu.logging = false;

buffer.forEach((v, i, a) => {
  cpu.bus.memory[i] = v;
});

function cleanUp() {
  console.log(`---- START SERIAL DATA ----`)
  console.log(new StringDecoder("utf8").write(Buffer.from(cpu.bus.serialOut)));
  console.log(`----- END SERIAL DATA -----`)

  cpu.khzStop();
  fs.writeFileSync("./logs/EpicGameBoy.log", cpu.log.join("\n"));
  fs.writeFileSync("./EpicGameBoy_Full.log", cpu.fullLog.join("\n"));
  console.log("Wrote log file");
  process.exit(0);
}

setTimeout(() => {
  console.log("Starting test");
  cpu.khz();
  setInterval(() => {
    console.log(cpu.totalI);
    if (cpu.totalI > 1000000 || cpu.pc == 0xFFFF) {
      cleanUp();
    }
  }, 100);

}, 0);
