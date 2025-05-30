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
3. Instal and run MongoDB  
3.1 If you had previous version of ZeroBot with SurrealDB then you can use `yarn migrate` to move all data to MongoDB
4. Copy `.env.example` to `.env` and fill in the required fields  
4.1 Obtain cookies and tokens for required services (for Spotify or VK you can launch `yarn spotify` or `yarn vk` and follow the instructions in the terminal)
5. Start the bot with `yarn start`
