const fs = require("fs");
const Messages = require("../../core/Messages.js");
const Logs = require("../../core/Logs.js");


module.exports = {
	name: "reload",
	description: "Reloads a command(s)",
	arguments: ["[cmdname (or \"all\")]"],
	access: ["superuser"],
	async execute(message, args) {
		if (args[0] == "all") {
			Messages.warning(message, "Reloading all commands...");
            for (const folder of fs.readdirSync(`./commands`)) {
                if (fs.lstatSync(`./commands/${folder}`).isFile()) continue;
                const {ignore} = require("../../commands/config.json");
                if (ignore.includes(folder)) continue;
                const files = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith(".js"));
                for (const file of files) {
                    delete require.cache[require.resolve(`../../commands/${folder}/${file}`)];
                    try {
                        const command = require(`../../commands/${folder}/${file}`);
                        message.client.commands.set(command.name, command);
                    } catch (e) {
                        console.error(e);
                        Logs.critical(__filename, `Error in \`${file}\` reload:\n\`\`\`${e}\`\`\``);
                        return Messages.critical(message, `Error in \`${file}\` reload:\n\`\`\`${e}\`\`\``);
                    }
                }
            }
            Messages.complete(message, "Complete!", {big:true});
		} else {
			const command = message.client.commands.get(args[0]) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));
			if (!command) return Messages.critical(message, `There is no command with name or \`${args[0]}\`!`);
			const folder = fs.readdirSync(`./commands/`).find(folder => !fs.lstatSync(`./commands/${folder}`).isFile() ? fs.readdirSync(`./commands/${folder}`).includes(`${args[0]}.js`) : null);
			delete require.cache[require.resolve(`../../commands/${folder}/${command.name}.js`)];
			try {
				const newCommand = require(`../../commands/${folder}/${command.name}.js`);
				message.client.commands.set(newCommand.name, newCommand);
				Messages.complete(message, `Command \`${command.name}\` was reloaded!`);
			} catch (e) {
                console.error(e);
                Logs.critical(__filename, `Error in \`${file}\` reload:\n\`\`\`${e}\`\`\``);
                return Messages.critical(message, `Error in \`${file}\` reload:\n\`\`\`${e}\`\`\``);
			}
		}
	},
};