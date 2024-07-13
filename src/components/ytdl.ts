import { Readable } from "node:stream";
import fetch from "node-fetch";

export enum AudioQuality {
	Low = "AUDIO_QUALITY_LOW",
	Medium = "AUDIO_QUALITY_MEDIUM",
	High = "AUDIO_QUALITY_HIGH"
}

export interface VideoInfo {
	streamingData: {
		expiresInSeconds: string;
		adaptiveFormats: {
			url: string;
			mimeType: string;
			bitrate: number;
			width?: number;
			height?: number;
			fps?: number;
			quality: string;
			audioQuality?: string;
			qualityLabel?: string;
			audioSampleRate?: string;
		}[];
	};
}

export async function getYTInfo(videoId: string): Promise<VideoInfo> {
	// hard-coded from https://github.com/yt-dlp/yt-dlp/blob/master/yt_dlp/extractor/youtube.py
	const apiKey = "AIzaSyB-63vPrdThhKuerbB2N_l7Kwwcxj6yUAc";

	const headers = {
		"X-YouTube-Client-Name": "5",
		"X-YouTube-Client-Version": "19.09.3",
		Origin: "https://www.youtube.com",
		"User-Agent": "com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)",
		"content-type": "application/json"
	};

	const b = {
		context: {
			client: {
				clientName: "IOS",
				clientVersion: "19.09.3",
				deviceModel: "iPhone14,3",
				userAgent: "com.google.ios.youtube/19.09.3 (iPhone14,3; U; CPU iOS 15_6 like Mac OS X)",
				hl: "en",
				timeZone: "UTC",
				utcOffsetMinutes: 0
			}
		},
		videoId,
		playbackContext: { contentPlaybackContext: { html5Preference: "HTML5_PREF_WANTS" } },
		contentCheckOk: true,
		racyCheckOk: true
	};

	return fetch(`https://www.youtube.com/youtubei/v1/player?key${apiKey}&prettyPrint=false`, { method: "POST", body: JSON.stringify(b), headers }).then(r => r.json());
}

export async function streamYTAudio(videoId: string, quality: AudioQuality = AudioQuality.Medium) {
	const info = await getYTInfo(videoId);
	const audio = info.streamingData.adaptiveFormats.find(f => f.audioQuality === quality);

	if (!audio)
		throw new Error(`No audio found for quality ${quality}`);

	const { body } = await fetch(audio.url);

	return Readable.from(body);
}