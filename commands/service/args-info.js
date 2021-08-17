const Messages = require("../../core/Messages.js")

module.exports = {
	name: "args-info",
	description: "Gives args info.",
	arguments: ["Arguments"],
	access: "superuser",
	async execute(message, args) {
        Messages.regular(message, `Arguments: \`${args.join(", ")}\`\nArguments length: ${args.length}`);
	},
};