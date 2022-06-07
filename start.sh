#!/bin/bash
echo "Starting discord bot. You can view bot screen, type screen -dr zerobot"
echo "To exit from screen, press Ctrl+A then Ctrl+D."
cd /home/ubuntu/ZeroBot-Discord

FILE_NAME=$(date +"%Y.%m.%d-%H:%M:%S")".log"

if [ -f "logs/latest.log" ]; then
	mv logs/latest.log logs/$FILE_NAME
fi

/bin/screen -dmS zerobot bash -c "/home/ubuntu/.nvm/versions/node/v17.5.0/bin/node index.js 2>&1 | tee logs/latest.log"
