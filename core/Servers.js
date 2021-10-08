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
    checkCfg(id) {
        if (!parseInt(id)) throw Error("Id is not int!");
        this.checkDir();
        if (fs.existsSync(`./storage/${id}.json`) && JSON.parse(fs.readFileSync(`./storage/${id}.json`).toString())) return;
        fs.writeFileSync(`./storage/${id}.json`, JSON.stringify(this.default_config, null, "\t"), "utf8", null);
        console.log(`Created server config file for server ${id}`);
        Logs.regular(__filename, `Created server config file for server ${id}`);
    },
    get(id, thing) {
        this.checkCfg(id);
        const data = JSON.parse(fs.readFileSync(`./storage/${id}.json`).toString());
        if (typeof thing === "object") {
            const out = {};
            for (const i in thing) {
                //if (typeof data[thing[i]] === "undefined") throw Error(`No "${thing[i]}" element found!`);
                out[thing[i]] = data[thing[i]];
            }
            return out;
        } else if (typeof thing !== "undefined"){
            //if (typeof data[thing] === "undefined") throw Error(`No "${thing}" element found!`);
            return data[thing];
        } else return data;
    },
    set(id, thing, value) {
        this.checkCfg(id);
        if (!parseInt(id)) throw Error("Id is not int!");
        const data = JSON.parse(fs.readFileSync(`./storage/${id}.json`).toString());
        if (typeof thing === "object") for (const [k,v] of Object.entries(thing)) {
            //if (typeof v === "undefined") throw Error("No value given!");
            data[k] = v;
        }
        else {
            //if (typeof value === "undefined") throw Error("No value given!");
            data[thing] = value;
        }
        fs.writeFileSync(`./storage/${id}.json`, JSON.stringify(data, null, "\t"), "utf8", null);
    }
}