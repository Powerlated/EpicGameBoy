console.log("Starting emulator test");

global.alert = msg => { console.warn(msg); process.exit(1); };

require('source-map-support').install();
let gameboy = require("./src/gameboy/gameboy");
let fs = require("fs");

console.log("Loading ROM " + process.argv[2]);
let buffer = fs.readFileSync(`${process.argv[2]}`);

let cpu = new gameboy.CPU();
cpu.logging = true;

buffer.forEach((v, i, a) => {
  cpu.bus.memory[i] = v;
});

setTimeout(() => {
  console.log("Starting test");
  cpu.khz();
  setInterval(() => {
    console.log(cpu.totalI);
    if (cpu.totalI > 100000) {
  
      cpu.khzStop();
      fs.writeFileSync("./logs/EpicGameBoy.log", cpu.log.join("\n"));
      fs.writeFileSync("./EpicGameBoy_Full.log", cpu.fullLog.join("\n"));
      console.log("Wrote log file");
      process.exit(0);
    }
  }, 100);

}, 0);
