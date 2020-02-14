#!/bin/bash
args=("$@")

tsc
node . "testroms/${args[0]}".gb

cd ./logs

git add EpicGameBoy.stripped.log
git commit -m "Test 1"

# cat ./"${args[0]}".gb.log | tail -n +8 | awk '{print $1 " " $2 " " $3 " " $4 " " $5 " " $6 " " $7 " " $8 " " $9}' | sed '25001,$ d' > ./EpicGameBoy.stripped.log
cat ./"${args[0]}".gb.log | tail -n +8 | awk '{print $1 " " $2 " " $3 " " $4 " " $5 " " $6 " " $7}' | sed '100001,$ d' > ./EpicGameBoy.stripped.log

git add EpicGameBoy.stripped.log
git commit -m "Test 2"

cat ./EpicGameBoy.log | sed '100001,$ d' > ./EpicGameBoy.stripped.log

