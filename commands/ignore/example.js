const Messages = require("../../components/Messages"); // Requires "Messages" components for cool looking messages

module.exports = { // Opens command module
	name: "example", // Command name
	aliases: ["test", "sample"], // Example can also be called with "test" or "sample" 
	description: "Example command", // Displays in help command
	arguments: ["(Something)"], // Displays in help command and also uses for command execution check
	optional: true, // Is arguments optional?
	access: ["user", "dj", "moderator", "administrator", "owner", "superuser"], // Who can execute this command
	execute(message, args) { // Main function ( Dont change function args pls ;) )
		if (!args[0]) return Messages.warning(message, "No args but anyway Hello ;)"); // Checks if first argument is present, if not, It sends warning message
		Messages.success(message, args[0]); // If arguments present it repeats first argument in message (Like something is completed)
	} // Closes main function
}; // Closes command module
