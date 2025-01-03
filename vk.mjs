/* eslint-disable */
import { stdin as input, stdout as output } from "node:process";
import { createInterface } from "node:readline/promises";

const rl = createInterface({ input, output });

console.log("Visit https://oauth.vk.com/authorize?client_id=6121396&scope=1073737727&redirect_uri=https://oauth.vk.com/blank.html&display=page&response_type=token&revoke=1 and copy redirect url");
const answer = await rl.question("Paste URL here: ");

const queryPairs = answer.split("#").pop()
	?.split("&").map(qp => qp.split("=")).map(([k, v]) => ([k, isNaN(v) ? v : Number(v)]))
	?? [];

const { access_token } = Object.fromEntries(queryPairs);

console.log(`Now copy and paste the following env variables into your .env file:	
VK_TOKEN = "${access_token}"`
);