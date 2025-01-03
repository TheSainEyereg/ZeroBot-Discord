import fetch from "node-fetch";
import config from "../config";
import { Readable } from "stream";

const { music: { cobaltUrl } } = config;

export const stream = async (url: string) => {
	const res = await fetch(`${cobaltUrl}/`, {
		method: "POST",
		headers: {
			"Accept": "application/json",
			"Content-Type": "application/json"
		},
		body: JSON.stringify({
			url,
			downloadMode: "audio",
			audioFormat: "ogg"
		})
	});

	const data = await res.json() as { status: "error"; error: { code: string } } | { status: "tunnel"; url: string };

	if (data.status === "error")
		throw new Error(data.error.code);

	if (data.status !== "tunnel")
		throw new Error("Can't get tunnel URL");

	const { url: tunnelUrl } = data as { url: string };

	const stream = await fetch(tunnelUrl)
		.then(res => Readable.from(res.body));

	return stream;
};