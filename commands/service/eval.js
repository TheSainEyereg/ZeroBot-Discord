const Messages = require("../../components/Messages.js");
const Logs = require("../../components/Logs.js");

module.exports = {
	name: "eval",
	aliases: ["exec", "execute"],
	description: "Command that executes JS.",
	arguments: ["[Code]"],
	access: "superuser",
	async execute(message, args) {
		const code = args.join(" ");
		try {
			const result = await eval(code);
			if (code.includes("message.edit(") || code.includes("message.delete(")) return;
			Messages.success(message, `Result: \`\`\`${result}\`\`\``);
		} catch (e) {
			console.error(e);
			Logs.critical(`${this.name} command`, `Error in eval: ${e}`);
			Messages.critical(message, `Error in eval:\n\`\`\`${e}\`\`\``);
		}

	}
};