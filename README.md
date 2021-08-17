
<!--![Zerobot](https://olejka.ru/s/22136.png)-->
<img src="https://olejka.ru/s/f9223718.png" alt="ZeroBot logo" height="300">

# ZeroBot

A multifunctional opensource discord bot for your server with a big functionality and cool UX.

---
## How to invite
**You can invite bot to your server by this link:**  
### [Soon ;)](https://github.com/TheSainEyereg/ZeroBot-Discord/commits/master)
<!--###[\*Click*](https://discord.com/api/oauth2/authorize?client_id=870241298932723722&permissions=8&scope=bot)-->

---
## How to host
To host this bot yourself:
1. Install NodeJS 16.6.0 or higher.
2. Clone and install dependencies.
```sh
git clone https://github.com/TheSainEyereg/ZeroBot-Discord.git
cd ZeroBot-Discord
npm i
```
3. Create `config.json` like this: 
```json
{
    "token": "YourToken",
    "prefix": "z.",
    "superusers": ["YourDiscordId"],
    "invite": "YourBotInviteLinlk",
    "defaults": {
        "user-cooldown": 3,
        "default-volume": 80
    }
}
```
_p.s. I recommend set defaults to that values._

4. Run bot by typing `npm start` or `node index.js`

---
If you have any troubles on Linux machines with Canvas or another lib, try installing these dependencies:
```sh
sudo apt update 
sudo apt install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
npm i #or npm i canvas
```

---
## Commands
Like my previous bot, you can supplement it with your own commands, following the **[example command](https://github.com/TheSainEyereg/ZeroBot-Discord/blob/master/commands/ignore/example.js)** in `/commands/ignore/` folder. 
