#!/bin/bash
echo "Starting discord bot. You can view bot screen, type screen -dr zerobot"
echo "To exit from screen, press Ctrl+A then Ctrl+D."
cd /home/ubuntu/ZeroBot-Discord

STDOUT_FILE_NAME="stdout_"$(date +"%Y.%m.%d-%H:%M:%S")".log"
STDERR_FILE_NAME="stderr_"$(date +"%Y.%m.%d-%H:%M:%S")".log"

if [ -f "logs/stdout_latest.log" ]; then
	mv logs/stdout_latest.log logs/$STDOUT_FILE_NAME
fi
if [ -f "logs/stderr_latest.log" ]; then
	mv logs/stderr_latest.log logs/$STDERR_FILE_NAME
fi

/bin/screen -dmS zerobot bash -c "/home/ubuntu/.nvm/versions/node/v17.0.1/bin/node index.js 1> >(tee logs/stdout_latest.log) 2> >(tee logs/stderr_latest.log)"
