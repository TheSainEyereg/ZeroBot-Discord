const Messages = require("../../components/Messages.js")

module.exports = {
	name: "args-info",
	description: "Gives args info.",
	arguments: ["Arguments"],
	access: "superuser",
	execute(message, args) {
		Messages.regular(message, `Arguments: \`${args.join(", ")}\`\nArguments length: ${args.length}`);
	},
};