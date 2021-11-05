const { Message } = require("discord.js");
const {superusers} = require("../config.json");
const Servers = require("./Servers.js");

module.exports = {
    list: ["user", "moderator", "administrator", "owner", "superuser"],
    /**
	 * Get the permission level of a message author
	 * @param {Message} message - The message to get the user permission level of
	 * @returns {Array} - The permission level of the user
	 */
	get(message) {
        const perms = [];
        if (superusers.includes(message.author.id)) perms.push("superuser");
        if (message.author.id == message.guild.ownerID) perms.push("owner");
        if (message.member.permissions.has("ADMINISTRATOR")) perms.push("administrator");
        if (Servers.get(message.guild.id, "moderators").includes(message.author.id)) perms.push("moderator");
        perms.push("user");
        return perms;
    },
	/**
	 * Get the permission level of a user from its ID
	 * @param {Message} message - The message to get guild data from
	 * @param {string} userID - The ID of the user to get the permission level of
	 * @param {CallableFunction} callback - The callback function to call with the permission level
	 * @returns {Array} - The permission level of the user
	*/
    getId(message, userID, callback) { //fuck v13
        if (!parseInt(userID)) throw Error("Id is not int!");
        if (typeof callback === "undefined") throw Error("No callback!");
        message.guild.members.fetch(userID).then(member => {
            const perms = [];
            if (superusers.includes(userID)) perms.push("superuser");
            if (member.id == message.guild.ownerId) perms.push("owner");
            if (member.permissions.has("ADMINISTRATOR")) perms.push("administrator");
            if (Servers.get(message.guild.id, "moderators").includes(userID)) perms.push("moderator");
            perms.push("user");
            callback(perms)
        })
    },
	/**
	 * Check if a message author has a permission level
	 * @param {Message} message - The message to get the user permission level of
	 * @param {string | Array} perm - The permission level to check for
	 * @returns {boolean} - Whether the user has the permission level
	 */
    has(message, perm) {
        if (typeof perm != "object" && !this.list.includes(perm)) throw Error("This permission does not exist!");
        const perms = this.get(message);
        const list = typeof perm == "object" ? perm : this.list.slice(this.list.indexOf(perm));
        for (p of perms) if (list.includes(p)) return true;
        return false;
    },
	/**
	 * Check if a userID has a permission level
	 * @param {Message} message - The message to get guild data from
	 * @param {string} userID - The ID of the user to get the permission level of
	 * @param {string | Array} perm - The permission level to check for
	 * @param {CallableFunction} callback - The callback function to call with the permission level
	 * @returns {boolean} - Whether the user has the permission level
	*/
    hasId(message, userID, perm, callback) {
        if (typeof perm != "object" && !this.list.includes(perm)) throw Error("This permission does not exist!");
        this.getId(message, userID, perms => {
            const list = typeof perm == "object" ? perm : this.list.slice(this.list.indexOf(perm));
            for (p of perms) if (list.includes(p)) return callback(true);
            return callback(false);
        });
    }
}
