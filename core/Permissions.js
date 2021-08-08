const {superusers} = require("../config.json");
const Servers = require("./Servers.js");

module.exports = {
    check(message) {
        if (superusers.includes(message.author.id)) return "superuser";
        else if (message.author.id == message.guild.ownerID) return "owner";
        else if (message.member.permissions.has("ADMINISTRATOR")) return "administrator";
        else if (Servers.get(message.guild.id, "moderators").includes(message.author.id)) return "moderator";
        else if (Servers.get(message.guild.id, "djs").includes(message.author.id)) return "dj";
        else return "user";
    },
    checkId(message, id, callback) { //fuck v13
        if (typeof callback === "undefined") throw Error("No callback!");
        message.guild.members.fetch(id).then(member => {
            if (superusers.includes(id)) return callback("superuser");
            else if (member.id == message.guild.ownerId) return callback("owner");
            else if (member.permissions.has("ADMINISTRATOR")) return callback("administrator");
            else if (Servers.get(message.guild.id, "moderators").includes(id)) return callback("moderator");
            else if (Servers.get(message.guild.id, "djs").includes(id)) return callback("dj");
            else return callback("user");
        })
    }
}