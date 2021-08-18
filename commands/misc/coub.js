const axios = require('axios');
const Logs = require("../../core/Logs");
const Messages = require("../../core/Messages");

module.exports = {
	name: "coub",
	description: "Shows random 10s coub from  given community",
	arguments: ["[community]", "(order: daily, rising, fresh, top, views)"],
    optional: true,
	async execute(message, args) {
        message.channel.sendTyping();
        
		const communities = ["anime", "animals-pets", "blogging", "standup-jokes", "mashup", "movies", "gaming", "cartoons", "art", "live-pictures", "music", "news", "sports", "science-technology", "food-kitchen", "celebrity", "nature-travel", "fashion", "dance", "cars", "memes", /*"nsfw"*/];
        const order = {
            "daily": "daily?",
            "rising": "rising?",
            "fresh": "fresh?",
            "top": "fresh?order_by=likes_count&",
            "views": "fresh?order_by=views_count&"
        };

        if (!communities.includes(args[0]) || !args[0]) return Messages.advanced(message, 
            "Available communities", 
            `**${communities.join("**\n**")}**`, 
            {custom:`Type ${Servers.get(message.guild.id, "prefix")}coub (community) for random video from specified community.`}
        );

        const correct = Object.keys(order).includes(args[1]) && args[1];
        if (!correct) Messages.warning(message, "Order is not correct, using default order.");

        const per_page = 25;
        axios.get(`https://coub.com/api/v2/timeline/community/${args[0]}/${correct ? order[args[1]] : "daily?"}per_page=${per_page}`)
        .then(res => {
            const coubs = res.data.coubs;
            if (!coubs) return Messages.critical(message, "Error in getting coubs list!");
            const coub = coubs[Math.floor(Math.random()*per_page)].id;
            if (!coub) return Messages.critical(message, "Error in getting coub info!");
            axios.get(`https://coub.com/api/v2/coubs/${coub}`)
            .then(res => {
                const url = res.data.file_versions.share.default;
                const link = `https://coub.com/view/${res.data.permalink}`;
                if (!url || !link) return Messages.critical(message, "Error in getting video!");
                message.channel.send({content: `<${link}>`, files: [{
                    attachment: url,
                    name: "coub.mp4"
                }]});
            })
            .catch(e => {
                Logs.critical(__filename, `Error in fetching coub info: ${e}`);
                return Messages.critical(message, `Error in fetching coub info: \`\`\`${e}\`\`\``);
            });
        })
        .catch(e => {
            Logs.critical(__filename, `Error in fetching coubs list: ${e}`);
            return Messages.critical(message, `Error in fetching coubs list: \`\`\`${e}\`\`\``);
        });
	}
};
