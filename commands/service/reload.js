const fs = require("fs");
const Messages = require("../../core/Messages.js");
const Logs = require("../../core/Logs.js");


module.exports = {
	name: "reload",
	description: "Reloads a command(s)",
	arguments: ["[cmdname (or \"all\")]"],
	access: "superuser",
	execute(message, args) {
		if (args[0] == "all") {
			Logs.security(__filename, `${message.author.id} (${message.author.tag}) has started reloading all bot commands!...`);
			message.channel.sendTyping();
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
						Logs.security(__filename, `Failed! Check critical log!`);
						Logs.critical(`${this.name} command`, `Error in \`${file}\` reload:\n\`\`\`${e}\`\`\``);
						return Messages.critical(message, `Error in \`${file}\` reload:\n\`\`\`${e}\`\`\``);
					}
				}
			}
			Logs.security(__filename, `Reloading ompleted!`);
			Messages.success(message, "Completed reloading!");
		} else if (args[0] == "localization"){
			for (const file of fs.readdirSync("./localization")) {
				delete require.cache[require.resolve(`../../localization/${file}`)]
				const localization = require(`../../localization/${file}`);
				message.client.localization.set(file.split(".")[0], localization);
			}
			Messages.success(message, "Reloadede all localizations!");
		} else {
			const command = message.client.commands.get(args[0]) || message.client.commands.find(cmd => cmd.aliases && cmd.aliases.includes(args[0]));
			if (!command) return Messages.critical(message, `There is no command with name or alias \`${args[0]}\`!`);
			Logs.security(__filename, `${message.author.id} (${message.author.tag}) has started reloading "${command.name}" command!...`);
			const folder = fs.readdirSync(`./commands/`).find(folder => !fs.lstatSync(`./commands/${folder}`).isFile() ? fs.readdirSync(`./commands/${folder}`).includes(`${command.name}.js`) : null);
			delete require.cache[require.resolve(`../../commands/${folder}/${command.name}.js`)];
			try {
				const newCommand = require(`../../commands/${folder}/${command.name}.js`);
				message.client.commands.set(newCommand.name, newCommand);
				Logs.security(__filename, `Completed!`);
				Messages.success(message, `Command \`${command.name}\` was reloaded!`);
			} catch (e) {
				console.error(e);
				Logs.security(__filename, `Failed! Check critical log!`);
				Logs.critical(`${this.name} command`, `Error in \`${file}\` reload:\n\`\`\`${e}\`\`\``);
				return Messages.critical(message, `Error in \`${file}\` reload:\n\`\`\`${e}\`\`\``);
			}
		}
	},
};