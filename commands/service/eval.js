const Messages = require("../../core/Messages.js");
const Logs = require("../../core/Logs.js");

module.exports = {
	name: "eval",
	aliases: ["exec", "execute"],
	description: "Command that executes JS.",
	arguments: ["[Code]"],
	access: "superuser",
	async execute(message, args) {
		try {
			eval(args.join(" "));
		} catch (e) {
			console.error(e);
			Logs.critical(`${this.name} command`, `Error in eval: ${e}`);
			Messages.critical(message, `Error in eval:\n\`\`\`${e}\`\`\``);
		}
	}
};