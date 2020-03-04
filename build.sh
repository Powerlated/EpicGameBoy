#!/bin/bash
webpack
cd ./dist
inliner index.html > EpicGameBoy-inlined.html