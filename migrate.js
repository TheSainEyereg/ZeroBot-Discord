const fs = require("fs");
const Servers = require("./components/Servers.js");
for (const file of fs.readdirSync("./storage")) {
	const settings = Servers.get(file.split(".")[0]);
	if (typeof settings.logs == "undefined" || typeof settings.volume == "undefined") {console.log(file+" already migrated!"); continue}
	Servers.set(file.split(".")[0], {
		logsChannel: settings.logs,
		musicMode: 1,
		musicChannel: false,
		musicVolume: settings.volume,

		logs: undefined,
		volume: undefined,
		dj: undefined,
		djs: undefined
	});
	console.log(file+" migrated!");
}