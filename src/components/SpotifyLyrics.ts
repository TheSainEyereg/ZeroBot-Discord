import { Message, ThreadAutoArchiveDuration, ThreadChannel } from "discord.js";
import config from "../config";
import LyricsProvider from "../LyricsProvider";
import { MusicServices } from "../enums";
import { Song } from "../interfaces/music";
import fetch from "node-fetch";

const { music: { spotify: { lyricsCookie } } } = config;

enum SyncType {
	LineSynced = "LINE_SYNCED",
	Unsynced = "UNSYNCED"
}

interface LyricsResponse {
	lyrics: {
		syncType: SyncType;
		lines: {
			startTimeMs: string;
			endTimeMs: string;
			words: string;
		}[];
		language: string;
	};
	colors: {
		background: number;
		text: number;
	};
}

interface Line {
	startMs: number;
	words?: string;
	next?: number;
}

export default class SpotifyLyrics extends LyricsProvider {
	service = MusicServices.Spotify;

	private auth = {
		expirationMs: 0,
		accessToken: "",
	};

	private color = 0;
	private lyrics: Line[] = [];

	private song: Song | null = null;
	private thread: ThreadChannel | null = null;
	private tempMessage: Message | null = null;
	private timeout: NodeJS.Timeout | null = null;

	private async sendLyrics() {
		if (this.tempMessage) {
			const res = await this.tempMessage.edit({ content: "", embeds: [], files: [] }).catch(() => null);
			this.tempMessage = null;
			if (res)
				return;
		}

	}

	async update(song: Song, paused = false) {
		if (song.service !== MusicServices.Spotify) return;

		this.song = song;

		if (this.auth.expirationMs > Date.now()) {
			if (!lyricsCookie)
				throw new Error("Lyrics cookie is not set");
	
			const res = await fetch("https://open.spotify.com/get_access_token?reason=transport&productType=web_player", {
				method: "GET",
				headers: {
					"App-platform": "WebPlayer",
					Cookie: `sp_dc=${lyricsCookie}`
				}
			});
	
			const auth: { accessToken: string; accessTokenExpirationTimestampMs: number } = await res.json();
	
			this.auth.accessToken = auth.accessToken;
			this.auth.expirationMs = auth.accessTokenExpirationTimestampMs;
		}

		const res = await fetch(`https://spclient.wg.spotify.com/color-lyrics/v2/track/${song.id}?format=json&market=from_token`, {
			method: "GET",
			headers: {
				"App-platform": "WebPlayer",
				"Authorization": `Bearer ${this.auth.accessToken}`
			}
		});

		if (res.status === 404)
			throw new Error("Lyrics not found");

		const { lyrics, colors }: LyricsResponse = await res.json();

		const timeMs = Date.now() - this.queue.startTime;

		if (lyrics.syncType === SyncType.Unsynced) {
			let i = 0;
		
			lyrics.lines.forEach((line, j) => {
				const nextLine = lyrics.lines[j + 1];
				if (j === 0 || (this.lyrics[i].words + nextLine?.words).length >= 2e3) {
					if (j !== 0)
						i++;
					this.lyrics.push({ startMs: i * 1e3, words: line.words });
				}
		
				this.lyrics[i].words += `\n${line.words}`;
			});
		}

		if (lyrics.syncType === SyncType.LineSynced) {
			let extend = false;
			
			lyrics.lines.forEach((line, j) => {
				const nextLine = lyrics.lines[j + 1];
				let lastLyric = this.lyrics[this.lyrics.length - 1];
				
				if (extend && (lastLyric.words + nextLine?.words).length < 2e3) {
					lastLyric.words += `\n${line.words}`;
						
					extend = false;
		
					if (lastLyric.startMs < timeMs)
						lastLyric.startMs = Number(line.startTimeMs);
				} else {
					lastLyric = { startMs: Number(line.startTimeMs), words: line.words };
					this.lyrics.push(lastLyric);
				}
		
				if (lastLyric.startMs < timeMs) {
					extend = true;
					return;
				}
		
				const dif = Number(nextLine?.startTimeMs) - lastLyric.startMs;
		
				if (dif < 1e3)
					extend = true;
		
				if (dif > 6e3)
					this.lyrics.push({ startMs: lastLyric.startMs + 1e3, next: dif - 1e3 });
			});
		}

		this.color = colors.background & 0xffffff;

		// Create thread
		this.thread = await this.queue.textChannel.threads.create({
			name: song.title,
			autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
			reason: "Lyrics thread",
		});

		// Blah blah

		if (!paused)
			await this.run();
	}

	async run() {
		// 
	}

	async stop() {
		if (this.tempMessage) await this.tempMessage.delete().catch(() => null);
		this.tempMessage = null;

		if (this.timeout) clearTimeout(this.timeout);
		this.timeout = null;
	}
}