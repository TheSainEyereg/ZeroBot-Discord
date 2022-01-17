#!/bin/bash
echo "Starting discord bot. You can view bot screen, type screen -r zerobot."
echo "To exit from screen, press Ctrl+A then Ctrl+D."
cd /home/ubuntu/ZeroBot-Discord

FILE_NAME="stdout_"$(date +"%Y.%m.%d-%H:%M:%S")".log"

if [ -f "logs/stdout_latest.log" ]; then
	mv logs/stdout_latest.log logs/$FILE_NAME
fi

/bin/screen -dmS zerobot bash -c "/home/ubuntu/.nvm/versions/node/v17.0.1/bin/node index.js | tee logs/stdout_latest.log"
