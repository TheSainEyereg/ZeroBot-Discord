const fs = require("fs");
const {prefix, defaults} = require("../config.json");
const Logs = require("./Logs");

module.exports = {
    default_config: {
        prefix: prefix,
        logs: "bot-logs",
        volume: defaults["default-volume"],
        moderators: [],
        dj: false,
        djs: []
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
                if (!data[thing[i]]) throw Error(`No "${thing[i]}" element found!`);
                out[thing[i]] = data[thing[i]];
            }
            return out;
        } else if (typeof thing !== "undefined"){
            if (!data[thing]) throw Error(`No "${thing}" element found!`);
            return data[thing];
        } else return data;
    },
    set(id, thing, value) {
        this.checkCfg(id);
        if (!parseInt(id)) throw Error("Id is not int!");
        const data = JSON.parse(fs.readFileSync(`./storage/${id}.json`).toString());
        if (typeof thing === "object") for (const [k,v] of Object.entries(thing)) {
            if (!v) throw Error("No value given!");
            data[k] = v;
        }
        else {
            if (!value) throw Error("No value given!");
            data[thing] = value;
        }
        fs.writeFileSync(`./storage/${id}.json`, JSON.stringify(data, null, "\t"), "utf8", null);
    }
}