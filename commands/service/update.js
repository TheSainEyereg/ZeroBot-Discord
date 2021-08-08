const fs = require("fs");
const { exec } = require("child_process");
const Messages = require("../../core/Messages.js");
const Logs = require("../../core/Logs.js");

module.exports = {
	name: "update",
	description: "Checking for commands update",
	access: ["superuser"],
	async execute(message, args) {
        exec("git pull", (e, so, se) => {
            if (e||se) return Messages.critical(message, `Error in execution: \n\`\`\`${e||se}\`\`\``);
            if (so == `Already up to date.\n`) return Messages.warning(message, `You already up to date!`);
            Logs.security(__filename, `${message.author.id} (${message.author.tag}) has started updating!...`, {nonl: true});
            Messages.warning(message, `Update found. Reloading commands...`);
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
            Logs.security(__filename, `Completed!`);
            Messages.complete(message, "Completed!", {big:true});
        });
	}
};