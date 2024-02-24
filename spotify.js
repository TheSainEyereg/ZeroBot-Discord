const { platform, argv, stdin: input, stdout: output } = require("node:process");
const { execSync } = require("node:child_process");
const { createInterface } = require("node:readline/promises");
const { createServer } = require("node:http");

const openUrl = (url) => execSync(
	platform === "win32"
		? `start "fuck windows" "${url}"`
		:platform === "darwin"
			? `open ${url}`
			: `xdg-open ${url}`
);

const rl = createInterface({ input, output });

const port = Number(argv[2] ?? 3000);

const server = createServer(async (req, res) => {
	const { url } = req;

	// /?code=xxx
	const [, code] = url.split("code=");

	// Close browser window with "<script>window.close();</script>
	res.write("<html><head><title>Done</title><script>window.close();</script></head><body>You can close this window.</body></html>");
	res.end();

	const data = {
		grant_type: "authorization_code",
		code,
		redirect_uri: `http://localhost:${port}`,
		client_id: client.id,
		client_secret: client.secret
	};

	const json = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded"
		},
		body: Object.entries(data).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&")
	}).then(r => r.json());
	
	server.close();

	console.log(`Now copy and paste the following env variables into your .env file:	
SPOTIFY_CLIENT_ID = "${client.id}"
SPOTIFY_CLIENT_SECRET = "${client.secret}"
SPOTIFY_REFRESH_TOKEN = "${json.refresh_token}"
SPOTIFY_MARKET = "US"`);
});

const client = {
	id: null,
	secret: null
};

async function main() {
	console.log(`Put the "http://localhost:${port}" URL into the "Redirect URIs" field of your Spotify app.`);

	client.id = await rl.question("Client ID: ");
	client.secret = await rl.question("Client Secret: ");
	rl.close();
	
	openUrl(`https://accounts.spotify.com/authorize?response_type=code&client_id=${client.id}&redirect_uri=${encodeURIComponent(`http://localhost:${port}`)}`);
}

server.listen(port, "0.0.0.0", main);