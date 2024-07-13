import MusicQueue from "./components/MusicQueue";
import { MusicServices } from "./enums";
import { Song } from "./interfaces/music";

export default abstract class LyricsProvider {
	queue: MusicQueue;
	abstract service: MusicServices;

	abstract stop(): void;
	abstract run(): void;
	abstract update(song: Song): void;

	constructor(queue: MusicQueue) {
		this.queue = queue;
	}
}