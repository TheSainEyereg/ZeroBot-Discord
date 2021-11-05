const fs = require("fs");
const { exec } = require("child_process");
const Messages = require("../../core/Messages.js");
const Logs = require("../../core/Logs.js");

module.exports = {
	name: "update",
	description: "Checking for commands update",
	access: "superuser",
	execute(message, args) {
        exec("git pull", (e, so, se) => {
            if (e) return Messages.critical(message, `Error in execution: \n\`\`\`${e}\`\`\``);
            if (so == `Already up to date.\n`) return Messages.warning(message, `You already up to date!`);
            Logs.security(__filename, `${message.author.id} (${message.author.tag}) has started updating!...`, {nonl: true});
            Messages.warning(message, `Update found. Reloading commands and localization...`);
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
                        Logs.critical(__filename, `Error in \`${file}\` reload:\n\`\`\`${e}\`\`\``);
                        return Messages.critical(message, `Error in \`${file}\` reload:\n\`\`\`${e}\`\`\``);
                    }
                }
            }
            for (const file of fs.readdirSync("./localization")) {
                delete require.cache[require.resolve(`../../localization/${file}`)]
                const localization = require(`../../localization/${file}`);
                message.client.localization.set(file.split(".")[0], localization);
            }
            Logs.security(__filename, `Completed!`);
            Messages.success(message, "Completed!", {big:true});
        });
	}
};