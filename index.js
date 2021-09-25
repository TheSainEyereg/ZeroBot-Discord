const {Client, Collection, Intents} = require("discord.js");
const fs = require("fs");
const {token, defaults} = require("./config.json");

const Messages = global.Messages = require("./core/Messages.js");
const Logs = global.Logs = require("./core/Logs.js");
const Servers = global.Servers = require("./core/Servers.js");
const Permissions = global.Permissions = require("./core/Permissions.js");
const Localization = global.Localization = require("./core/Localization.js")

const bot = new Client({
    intents: [
        Intents.FLAGS.GUILDS, 
        Intents.FLAGS.GUILD_MESSAGES,
        //Intents.FLAGS.GUILD_MEMBERS, //Whitelist required
        Intents.FLAGS.GUILD_INVITES,
        Intents.FLAGS.GUILD_VOICE_STATES,
        Intents.FLAGS.GUILD_MESSAGE_REACTIONS,
        Intents.FLAGS.DIRECT_MESSAGES
    ],
    partials: ["CHANNEL", "MESSAGE"], 
    allowedMentions: {parse:["users", "roles"], repliedUser:true}
})
bot.commands = new Collection();
bot.cooldowns = new Collection();
bot.localization = new Collection();

const string = `Bot started at ${new Date().toLocaleString("en-US")}`;
Logs.regular(__filename, `🔵 ${string} 🔵`, {pre:"\n"});
Logs.critical(__filename, `🔴 ${string} 🔴`, {pre:"\n"});
Logs.security(__filename, `🟠 ${string} 🟠`, {pre:"\n"});

for (const folder of fs.readdirSync(`./commands`)) {
    if (fs.lstatSync(`./commands/${folder}`).isFile()) continue;
    const {ignore} = require("./commands/config.json");
    if (ignore.includes(folder)) continue;
	const files = fs.readdirSync(`./commands/${folder}`).filter(file => file.endsWith(".js"));
	for (const file of files) {
		const command = require(`./commands/${folder}/${file}`);
		bot.commands.set(command.name, command);
	}
}

for (const file of fs.readdirSync("./localization")) {
    const localization = require(`./localization/${file}`);
    bot.localization.set(localization.name, localization);
}

process.on("unhandledRejection", e => {
    console.error(e);
    Logs.critical(__filename, `Unhandled promise rejection error: ${e}`);
})

bot.on("error", e => console.error(`Another error: ${e}`));
bot.on("warn", e => console.warn(`Warning: ${e}`));

bot.on("shardReady", _ => console.log("Connected to WebSocket!"));
bot.on("shardDisconnect", _ => console.log("Looks like connection to WebSocket was lost, I will reconnect immediately when coonection appears."));
bot.on("shardReconnecting", _ => console.log("Im reconnecting to WebSocket now..."));
bot.on("shardResume", _ => console.log("Reconnected to WebSocket!"));
bot.on("shardError", e => console.error(`Websocket connection error: ${e}`));

bot.once("ready", _ => {
    bot.guilds.cache.forEach(guild => Servers.checkCfg(guild.id));
    Logs.regular(__filename, `Bot is ready! (${bot.user.tag})`)
    bot.user.setActivity(`${bot.guilds.cache.size} servers`, { type: "WATCHING" });
	console.log(`Logged in as "${bot.user.tag}"\n${bot.guilds.cache.size} servers total.`);
})

bot.on("guildCreate", async guild => {
    console.log(`Joined new guild ${guild.name}`);
    Logs.regular(__filename, `Joined new guild ${guild.id}`);
    Servers.checkCfg(guild.id)
    bot.user.setActivity(`${bot.guilds.cache.size} servers`, { type: "WATCHING" });
})
bot.on("guildDelete", async guild => {
    console.log(`Kicked from guild ${guild.name}`);
    Logs.regular(__filename, `Kicked from guild ${guild.id}`);
    bot.user.setActivity(`${bot.guilds.cache.size} servers`, { type: "WATCHING" });
})

bot.on("messageCreate", async message => {
	if (message.author.bot) return;

    const prefix = message.guild ? Servers.get(message.guild.id, "prefix") : null;
    const localization = message.guild ? Localization.server(bot, message.guild, "main") : null;
    if
        (
            (
                (!prefix|| !message.content.startsWith(prefix))
                && ![`<@!${bot.user.id}>`, `<@${bot.user.id}>`].includes(message.content.replace(/\ /g, "")) //Not mention cuz it pases with another text in message
            )
            && message.channel.type != "DM"
        )
    return;

    const { cooldowns } = bot;
    const now = Date.now();
    if (cooldowns.has(message.author.id)) {
        const user = cooldowns.get(message.author.id);
        const timestamp = user.timestamp;
        const amount = user.amount;
        if (now < timestamp + amount) {
			const left = (timestamp + amount - now) / 1000;
            if (!user.warned) {
                if (location) {
                    Messages.warning(message, `${localization.cooldown[0]} ${left.toFixed(1)} ${localization.cooldown[1]}`);
                } else {
                    Messages.warning(message, `Please wait ${left.toFixed(1)} seconds`);
                }
                cooldowns.set(message.author.id, {timestamp: timestamp, amount: amount, warned: true});
            }
            return
        }
    }
    function make_cooldown(amount) {
        if (!cooldowns.has(message.author.id)) {
            const default_amount = defaults["user-cooldown"] * 1000;
            amount ? amount*1000 : null
            cooldowns.set(message.author.id, {timestamp: now, amount: amount ? amount : default_amount, warned: false});
            setTimeout(_ => cooldowns.delete(message.author.id), amount ? amount : default_amount);
        }
    }

    if (message.channel.type == "DM") {
        make_cooldown(); 
        Logs.regular(__filename, `User ${message.author.id} wrote "${message.content}" to DM.`);
        return Messages.critical(message, "Sorry, I'm not accepting commands in DM");
    }

    if (message.content.length > 1800) {
        make_cooldown();
        Logs.security(__filename, `User ${message.author.id} tried to enter 1800+ string.`);
        return Messages.warning(message, "Max message length is 1800");
    }

    if ([`<@!${bot.user.id}>`, `<@${bot.user.id}>`].includes(message.content.replace(/\ /g, ""))) { //Look at line 83
        make_cooldown();
        return Messages.advanced(message, false, `${localization.prefix} \`${prefix}\``, {custom: `${localization.help[0]} ${prefix}help ${localization.help[1]} ${prefix}?`});
    }

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandString = args.shift().toLowerCase().replace(/\ /g,"");
    if (commandString.length == 0) return;
    make_cooldown();
    const command = bot.commands.get(commandString) || bot.commands.find(cmd => cmd.aliases && cmd.aliases.includes(commandString));
    if (!command) return Messages.advanced(message, false, `${localization.not_found} :no_entry_sign:`, {custom: `${localization.help[0]} ${prefix}help ${localization.help[1]} ${prefix}?`, color: Messages.colors.critical});

    if (command.access && !Permissions.has(message, command.access)) {
        Logs.security(__filename, `User ${message.author.id} (Ranks [${Permissions.get(message).join(", ")}]) tried to execute command "${command.name}" ("${commandString}") when it requires higher rank.`);
        return Messages.warning(message, `${localization.rank_warn}\n\`${command.access.join(", ")}\``);
    }
    if (command.arguments && !command.optional && (!args || args.length === 0)) {
        Logs.regular(__filename, `User ${message.author.id} tried to execute command "${command.name}" ("${commandString}" without arguments.)`);
        return Messages.warning(message, `${localization.args_warn}`);
    }

    try {
        await command.execute(message, args);
        Logs.regular(__filename, `Cmd executed! Info:\n${"-".repeat(50)}\nCommand: "${command.name}" ("${commandString}")\nArgs: ${args.join(" ")}\nServer: ${message.guild.id}\nAuthor: ${message.author.id}\n${"-".repeat(50)}`);
        make_cooldown(command.cooldown);
    } catch(e) {
        Logs.critical(__filename, `Error in cmd Execution! Info:\n${"-".repeat(50)}\nError: "${e}"\nServer: ${message.guild.id}\nAuthor: ${message.author.id}\n${"-".repeat(50)}`);
        Messages.critical(message, `${localization.error}`);
        console.error(e);
    };
})

bot.login(token);