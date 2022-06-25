const axios = require('axios');
const Logs = require("../../components/Logs");
const Messages = require("../../components/Messages");
const Localization = require("../../components/Localization");

module.exports = {
	name: "coub",
	optional: true,
	execute(message, args) {
		const l = Localization.server(message.client, message.guild, this.name);
		message.channel.sendTyping();

		function getCoub(coub) {
			axios.get(`https://coub.com/api/v2/coubs/${coub}`)
			.then(res => {
				const url = res.data.file_versions.share.default;
				const link = `https://coub.com/view/${res.data.permalink}`;
				if (!url || !link) return Messages.critical(message, l.get_video_error);
				message.channel.send({content: `<${link}>`, files: [{
					attachment: url,
					name: "coub.mp4"
				}]});
			})
			.catch(e => {
				Logs.critical(`${this.name} command`, `Error in fetching coub info: ${e}`);
				return Messages.critical(message, `${l.fetch_coub_error}: \`\`\`${e}\`\`\``);
			});
		}
		
		if (args[0] && args[0].match(/^(https?:\/\/)?coub\.com\/view\//gi)) {
			const coub = args[0].split(args[0].match(/^(https?:\/\/)?coub\.com\/view\//gi)[0])[1].replace("/", "");
			getCoub(coub);
		} else {
			const communities = ["anime", "animals-pets", "blogging", "standup-jokes", "mashup", "movies", "gaming", "cartoons", "art", "live-pictures", "music", "news", "sports", "science-technology", "food-kitchen", "celebrity", "nature-travel", "fashion", "dance", "cars", "memes", /*"nsfw"*/];
			const order = {
				"daily": "daily?",
				"rising": "rising?",
				"fresh": "fresh?",
				"top": "fresh?order_by=likes_count&",
				"views": "fresh?order_by=views_count&"
			};
	
			if (!communities.includes(args[0]) || !args[0]) return Messages.advanced(message, 
				l.communities, 
				`**${communities.join("**\n**")}**`, 
				{custom:`${l.help[0]} ${Servers.get(message.guild.id, "prefix")}coub ${l.help[1]}`}
			);
	
			const correct = Object.keys(order).includes(args[1]) && args[1];
			if (args[1] && !correct) Messages.warning(message, l.order_warn);
			message.channel.sendTyping();
	
			const per_page = 25;
			axios.get(`https://coub.com/api/v2/timeline/community/${args[0]}/${correct ? order[args[1]] : "daily?"}per_page=${per_page}`)
			.then(res => {
				const coubs = res.data.coubs;
				if (!coubs) return Messages.critical(message, l.get_list_error);
				const coub = coubs[Math.floor(Math.random()*per_page-1)].id;
				if (!coub) return Messages.critical(message, l.get_coub_error);
				getCoub(coub);
			})
			.catch(e => {
				Logs.critical(`${this.name} command`, `Error in fetching coubs list: ${e}`);
				return Messages.critical(message, `${l.fetch_list_error}: \`\`\`${e}\`\`\``);
			});
		}
	}
};
