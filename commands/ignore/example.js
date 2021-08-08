const Messages = require("../../core/Messages");

module.exports = {
	name: "example", //Command name
    aliases: ["test", "sample"], //Example can also be called with "test" or "sample" 
    description: "Example command", //Displays in help command
    arguments: ["(Something)"], //Displays in help command and also uses for command execution check
    optional: true, //Is arguments optional?
    access: ["user", "dj", "moderator", "administrator", "owner", "superuser"], //Who can execute this command
	async execute(message, args) { //Main function (Dont change function args pls ;))
        if (!args[0]) return Messages.warning(message, "No args but anyway Hello ;)");
        Messages.complete(message, args[0]);
	}
};