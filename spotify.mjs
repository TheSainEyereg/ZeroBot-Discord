/* eslint-disable */
import { platform, argv, stdin as input, stdout as output, exit } from "node:process";
import { execSync } from "node:child_process";
import { createInterface } from "node:readline/promises";
import { createServer } from "node:http";

const openUrl = (url) => execSync(
	platform === "win32"
		? `start "fuck windows" "${url}"`
		:platform === "darwin"
			? `open "${url}"`
			: `xdg-open "${url}"`
);

const port = Number(argv[2] ?? 3000);
const rl = createInterface({ input, output });

console.log(`Put the "http://localhost:${port}" URL into the "Redirect URIs" field of your Spotify app.`);
const
	client_id = await rl.question("Client ID: "),
	client_secret = await rl.question("Client Secret: ");
rl.close();

const server = createServer(async (req, res) => {
	const { url } = req;

	// /?code=xxx
	const [, code] = url.split("code=");

	// Close browser window with "<script>window.close();</script>
	res.write("<html><head><title>Done</title><script>window.close();</script></head><body>You can close this window.</body></html>");
	res.end();

	server.close();

	const data = {
		grant_type: "authorization_code",
		redirect_uri: `http://localhost:${port}`,
		code,
		client_id,
		client_secret
	};

	const { refresh_token } = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: Object.entries(data).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")
	}).then(r => r.json());

	console.log(`Now copy and paste the following env variables into your .env file:	
SPOTIFY_CLIENT_ID = "${client_id}"
SPOTIFY_CLIENT_SECRET = "${client_secret}"
SPOTIFY_REFRESH_TOKEN = "${refresh_token}"
SPOTIFY_MARKET = "US"`);

	exit(0);
});

await new Promise(resolve => server.listen(port, "0.0.0.0", resolve));
const link = `https://accounts.spotify.com/authorize?response_type=code&client_id=${client_id}&redirect_uri=${encodeURIComponent(`http://localhost:${port}`)}`;
console.log(`Opening ${link}`);
openUrl(link);