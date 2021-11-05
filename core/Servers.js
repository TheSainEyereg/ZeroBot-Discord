const fs = require("fs");
const {defaults} = require("../config.json");
const Logs = require("./Logs");

module.exports = {
    default_config: {
        prefix: defaults.prefix,
        language: defaults.language,
        logsChannel: false,
        musicMode: 1,
        musicChannel: false,
        musicVolume: defaults["default-volume"],
        moderators: [],
    },
    checkDir() {!fs.existsSync("./storage") ? fs.mkdirSync("./storage") : null},
	/**
	 * Checks if the server has a config file
	 * @param {String} serverID The ID of the server
	*/
    checkCfg(serverID) {
        if (!parseInt(serverID)) throw Error("serverID is not int!");
        this.checkDir();
        if (fs.existsSync(`./storage/${serverID}.json`) && JSON.parse(fs.readFileSync(`./storage/${serverID}.json`).toString())) return;
        fs.writeFileSync(`./storage/${serverID}.json`, JSON.stringify(this.default_config, null, "\t"), "utf8", null);
        console.log(`Created server config file for server ${serverID}`);
        Logs.regular(__filename, `Created server config file for server ${serverID}`);
    },
	/**
	 * Gets the config of the server
	 * @param {String} serverID The ID of the server
	 * @param {String} [key] The key of the config
	 * @returns {Object | Any} The config of the server or the value of the key
	*/
    get(serverID, key) {
        this.checkCfg(serverID);
        const data = JSON.parse(fs.readFileSync(`./storage/${serverID}.json`).toString());
        if (typeof key === "object") {
            const out = {};
            for (const i in key) {
                //if (typeof data[key[i]] === "undefined") throw Error(`No "${key[i]}" element found!`);
                out[key[i]] = data[key[i]];
            }
            return out;
        } else if (typeof key !== "undefined"){
            //if (typeof data[key] === "undefined") throw Error(`No "${key}" element found!`);
            return data[key];
        } else return data;
    },
	/**
	 * Sets the config of the server
	 * @param {String} serverID The ID of the server
	 * @param {Object | string} key The config or the key of the config
	 * @param {Any} [value] The value of the config
	*/
    set(serverID, key, value) {
        this.checkCfg(serverID);
        if (!parseInt(serverID)) throw Error("serverID is not int!");
        const data = JSON.parse(fs.readFileSync(`./storage/${serverID}.json`).toString());
        if (typeof key === "object") for (const [k,v] of Object.entries(key)) {
            //if (typeof v === "undefined") throw Error("No value given!");
            data[k] = v;
        }
        else {
            //if (typeof value === "undefined") throw Error("No value given!");
            data[key] = value;
        }
        fs.writeFileSync(`./storage/${serverID}.json`, JSON.stringify(data, null, "\t"), "utf8", null);
    }
}