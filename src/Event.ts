export default abstract class Event {
	abstract event: string;
	abstract execute(...args: (unknown | undefined)[]): void;
	once = false;
}
