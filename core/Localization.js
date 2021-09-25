const Servers = require("./Servers");
const {defaults} = require("../config.json");

module.exports = {
    get(client, lang, item) {
        if (!client) throw Error("No client given!")
        if (!lang) throw Error("No language given!");
        const got_l = client.localization.get(lang);
        const default_l = client.localization.get(defaults.language);
        if (item) return Object.keys(got_l).every(item => Object.keys(default_l).includes(item)) && Object.keys(default_l).every(item => Object.keys(got_l).includes(item)) ? got_l[item] : default_l[item];
        return got_l ? got_l : default_l;
    },
    server(client, guild, item) {return this.get(client, Servers.get(guild.id, "language"), item)}
}