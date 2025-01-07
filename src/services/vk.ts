import assert from "node:assert";
import { createDecipheriv, CipherGCMTypes } from "node:crypto";
import { spawn } from "node:child_process";
import ffmpegPath from "ffmpeg-static";
import { API } from "vk-io";

export const regex = {
	playlist: /^https?:\/\/vk\.(?:com|ru)\/(?:music\/(?:album|playlist)\/|.+z=audio_playlist)(?<id>-?\d+_\d+)/,
	track: /^https?:\/\/vk\.(?:com|ru)\/audio(?<id>-?\d+_\d+)/
};

export interface Audio {
	id: string;
	owner_id: number;
	artist: string;
	title: string;
	duration: number;
	url: string;
	thumb: {
		width: number;
		height: number;
		photo_34: string;
		photo_68: string;
		photo_135: string;
		photo_270: string;
		photo_300: string;
		photo_600: string;
		photo_1200: string;
	};
}

export class VKService {
	private api: API | null = null;

	public async init(token: string) {
		this.api = new API({ token, apiVersion: "5.245" });

		await this.api.account.getProfileInfo({});
	}

	private async fetchAudios(audios: string[]) {
		assert(this.api, "API is not initialized");

		return await this.api.call("audio.getById", { audios }) as Audio[];
	}

	public async getTrack(id: string) {
		assert(this.api, "API is not initialized");

		const items = await this.fetchAudios([ id ]);
		return items[0];
	}

	public async getPlaylist(id: string) {
		assert(this.api, "API is not initialized");

		const [owner_id, playlist_id] = id.split("_");
		assert(owner_id && playlist_id, "Invalid playlist id");

		const { audio_ids } = await this.api.call("audio.getPlaylistById", { owner_id, playlist_id, extra_fields: "audio_ids" }) as { audio_ids: { audio_id: string }[] };
		return await this.fetchAudios(audio_ids.map(a => a.audio_id));
	}

	public async search(q: string, count?: number, offset?: number) {
		assert(this.api, "API is not initialized");

		const { items } = await this.api.call("audio.search", { q, count, offset }) as { items: Omit<Audio, "url">[] };
		return await this.fetchAudios(items.map(a => `${a.owner_id}_${a.id}`));
	}
}

export const stream = async (url: string) => {
	assert(url, "URL is required");
	assert(ffmpegPath, "ffmpeg is required");

	const lines = await fetch(url)
		.then(r => r.text())
		.then(s => s.split("\n"));
	
	const pubKeyUrl = lines
		.find(l => l.startsWith("#EXT-X-KEY"))
		?.split("\"")
		?.find(k => k.startsWith("https"));
	
	assert(pubKeyUrl, "Could not find key url");
	
	const pubKey = await fetch(pubKeyUrl)
		.then(r => r.arrayBuffer())
		.then(a => Buffer.from(a));
	
	const [ base ] = url.split("index.m3u8");
	
	let buffer = Buffer.alloc(0);
	
	let encryptionEnabled = false;
	
	for (const line of lines) {
		if (line.startsWith("#EXT-X-KEY"))
			encryptionEnabled = line.includes("AES-128");
	
		if (line.startsWith("seg-")) {
			let ts = await fetch(base + line)
				.then(r => r.arrayBuffer())
				.then(a => Buffer.from(a));
	
			if (encryptionEnabled) {
				const iv = ts.subarray(0, 16);
				const data = ts.subarray(16);
				const key = createDecipheriv("aes-128-cbc" as CipherGCMTypes, pubKey, iv);
				ts = Buffer.concat([key.update(data), key.final()]);
			}
	
			buffer = Buffer.concat([ buffer, ts ]);
		}
	}
	
	const process = spawn(ffmpegPath, ["-i", "-", "-f", "mp3", "pipe:1"]);
	
	const { stdin, stdout: stream } = process;
	stdin.write(buffer);
	stdin.end();

	return stream;
};