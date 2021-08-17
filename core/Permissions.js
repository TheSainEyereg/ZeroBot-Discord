const {superusers} = require("../config.json");
const Servers = require("./Servers.js");

module.exports = {
    list: ["user", "dj", "moderator", "administrator", "owner", "superuser"],
    get(message) {
        const perms = [];
        if (superusers.includes(message.author.id)) perms.push("superuser");
        if (message.author.id == message.guild.ownerID) perms.push("owner");
        if (message.member.permissions.has("ADMINISTRATOR")) perms.push("administrator");
        if (Servers.get(message.guild.id, "moderators").includes(message.author.id)) perms.push("moderator");
        if (Servers.get(message.guild.id, "djs").includes(message.author.id)) perms.push("dj");
        perms.push("user");
        return perms;
    },
    getId(message, id, callback) { //fuck v13
        if (!parseInt(id)) throw Error("Id is not int!");
        if (typeof callback === "undefined") throw Error("No callback!");
        message.guild.members.fetch(id).then(member => {
            const perms = [];
            if (superusers.includes(id)) perms.push("superuser");
            if (member.id == message.guild.ownerId) perms.push("owner");
            if (member.permissions.has("ADMINISTRATOR")) perms.push("administrator");
            if (Servers.get(message.guild.id, "moderators").includes(id)) perms.push("moderator");
            if (Servers.get(message.guild.id, "djs").includes(id)) perms.push("dj");
            perms.push("user");
            callback(perms)
        })
    },
    has(message, permission) {
        if (!typeof permission == "object" && !this.list.includes(permission)) throw Error("This permission does not exist!");
        const perms = this.get(message);
        const list = typeof permission == "object" ? permission : this.list.slice(this.list.indexOf(permission));
        for (p of perms) if (list.includes(p)) {return true};
        return false;
    },
    hasId(message, id, permission, callback) {
        if (!typeof permission == "object" && !this.list.includes(permission)) throw Error("This permission does not exist!");
        this.getId(message, id, perms => {
            const list = typeof permission == "object" ? permission : this.list.slice(this.list.indexOf(permission));
            for (p of perms) if (list.includes(p)) {return callback(true)};
            return callback(false);
        });
    }
}