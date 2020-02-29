#!/bin/bash
tsc
rm -rf out/*
cp -rv lib out/
mkdir -v out/run 
cp -v src/index.html src/index.js src/index.css src/gameboy.js src/roms.js out/run
cp -v misc/"OPEN ME IN GOOGLE CHROME.html" out/