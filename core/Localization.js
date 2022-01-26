const Servers = require("./Servers");
const {defaults} = require("../config.json");
const { Client, Guild } = require("discord.js");

module.exports = {
	/**
	 * Get Object with localized strings for a specific language
	 * @param {Client} client - The client to use.
	 * @param {String} language - The language to use.
	 * @param {String} item - Localization file key
	 * @returns {Object} - The localization object.
	*/
	get(client, lang, item) {
		if (!client) throw Error("No client given!");
		if (!lang) throw Error("No language given!");
		const got_l = client.localization.get(lang);
		const default_l = client.localization.get(defaults.language);
		if (item && !(got_l[item] || default_l[item])) throw Error("Item does not exists!");
		if (item) return Object.keys(got_l).every(item => Object.keys(default_l).includes(item)) && Object.keys(default_l).every(item => Object.keys(got_l).includes(item)) ? got_l[item] : default_l[item];
		return got_l ? got_l : default_l;
	},
	/**
	 * Get Object with localized strings for a specific server
	 * @param {Client} client - The client to use.
	 * @param {Guild} guild - The guild to use.
	 * @param {String} item - Localization file key
	 * @returns {Object} - The localization object.
	*/
	server(client, guild, item) {return this.get(client, Servers.get(guild.id, "language"), item)}
}