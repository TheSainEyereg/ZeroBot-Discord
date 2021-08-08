module.exports = {
	name: "eval",
    aliases: ["exec", "execute"],
    description: "Command that executes JS.",
    arguments: ["[Code]"],
    access: ["superuser"],
	async execute(message, args) {
        try {
            eval(args.join(" "))
        } catch (e) {
            Logs.critical(__filename, `Error in eval: ${e}`);
            Messages.critical(message, `Error in eval:\n\`\`\`${e}\`\`\``)
        }
	}
};