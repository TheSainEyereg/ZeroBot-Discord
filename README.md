# ZeroBot

A multifunctional open-source bot for Discord written in TypeScript

## Getting Started

1. Install [latest NodeJS](https://nodejs.org/)  
1.1 Install yarn with `npm i -g yarn`
2. Clone repo and build the bot
```sh
git clone https://github.com/TheSainEyereg/ZeroBot-Discord.git
cd ZeroBot-Discord
yarn
yarn build
```
3. Instal and run SurrealDB
4. Copy `.env.example` to `.env` and fill in the required fields  
4.1 Obtain cookies and tokens for required services (for Spotify you can launch `node spotify.js` from root of the project and follow the instructions there)
5. Start the bot with `yarn start`