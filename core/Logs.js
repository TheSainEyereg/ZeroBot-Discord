const fs = require("fs");

module.exports = {
    checkDir() {!fs.existsSync("./logs") ? fs.mkdirSync("./logs") : null},
    getDateString() {
        const date = new Date;
        return `${("0"+date.getFullYear().toString().slice(2)).slice(-2)}.${("0"+(date.getMonth()+1)).slice(-2)}.${("0"+date.getDate()).slice(-2)}-${("0"+date.getHours()).slice(-2)}:${("0"+date.getMinutes()).slice(-2)}:${("0"+date.getSeconds()).slice(-2)}:${("0"+date.getMilliseconds()).slice(-3)}`;
    },
    async regular(source, text, opt) {
        this.checkDir();
        if (!fs.existsSync("./logs/regular.log")) {
            fs.writeFileSync("./logs/regular.log", " -------------------------- Regular log initialized! -------------------------- "); // no newline cuz its ugly
        }
        let out = "";
        if (opt && opt.pre) out+=opt.pre;
        out+=`[${this.getDateString()}] `;
        out+=`(${source.slice(__dirname.length-"/core".length)}): `;
        out+=`${text}${opt && opt.nonl ? "" : "\n"}`;
        fs.appendFileSync("./logs/regular.log", out);
    },
    async critical(source, text, opt) {
        this.checkDir();
        if (!fs.existsSync("./logs/critical.log")) {
            fs.writeFileSync("./logs/critical.log", " -------------------------- Criticals log initialized! -------------------------- "); // no newline cuz its ugly
        }
        let out = "";
        if (opt && opt.pre) out+=opt.pre;
        out+=`[${this.getDateString()}] `;
        out+=`(${source.slice(__dirname.length-"/core".length)}): `;
        out+=`${text}${opt && opt.nonl ? "" : "\n"}`;
        fs.appendFileSync("./logs/critical.log", out);
    },
    async security(source, text, opt) {
        this.checkDir();
        if (!fs.existsSync("./logs/security.log")) {
            fs.writeFileSync("./logs/security.log", " -------------------------- Security log initialized! -------------------------- "); // no newline cuz its ugly
        }
        let out = "";
        if (opt && opt.pre) out+=opt.pre;
        out+=`[${this.getDateString()}] `;
        out+=`(${source.slice(__dirname.length-"/core".length)}): `;
        out+=`${text}${opt && opt.nonl ? "" : "\n"}`;
        fs.appendFileSync("./logs/security.log", out);
    }
}