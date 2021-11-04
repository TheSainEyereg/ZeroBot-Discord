const {
	joinVoiceChannel,
	VoiceConnectionStatus,
    VoiceConnectionDisconnectReason,
	entersState,
	AudioPlayerStatus,
	createAudioPlayer,
	createAudioResource,
	StreamType,
    getVoiceConnection
} = require("@discordjs/voice");
const config = require("../../config.json");
const Messages = require("../../core/Messages");
const ytdl = require("ytdl-core");
const scdl = require("soundcloud-downloader").default;
const yts = require("yt-search");
const Servers = require("../../core/Servers");
const { ready } = require("libsodium-wrappers");

module.exports = {
    name: "play",
    description: "Play music",
    arguments: ["(url/serach query)"],
    optional: false, //if (!args[0]) //resume
    aliases: ["p"],
    async execute(message, args) {
        const url = args[0] ? args[0] : "";
        const member = message.member;
        const channel = member?.voice.channel;
        if (!channel) return Messages.warning(message, "You should join to voice channel to use this!");
        if (!channel.permissionsFor(message.client.user).has("CONNECT") || !channel.permissionsFor(message.client.user).has("SPEAK")) return Messages.warning(message, "I have no permissions to connect or speak in this channel!");

        const queueCounstruct = {
            guild: message.guild,
            textChannel: message.channel,
            voiceChannel: channel,
            player: undefined,
            resource: undefined,
            volume: Servers.get(message.guild.id, "musicVolume"),
            loop: false,
            playing: false,
            skiping: [],
            list: []
        }
        if (!message.client.queue.get(message.guild.id)) message.client.queue.set(message.guild.id, queueCounstruct);
        const queue = message.client.queue.get(message.guild.id);

        async function joinChannel(channel) {
            const connection = joinVoiceChannel({
                channelId: channel.id,
                guildId: channel.guild.id,
                adapterCreator: channel.guild.voiceAdapterCreator,
            });
            try {
                await entersState(connection, VoiceConnectionStatus.Ready, 30_000);
                connection.on("stateChange", async (_, newState) => {
                    if (newState.status === VoiceConnectionStatus.Disconnected) {
                        if (newState.reason === VoiceConnectionDisconnectReason.WebSocketClose && newState.closeCode === 4014) {
                            try {
                                await entersState(connection, VoiceConnectionStatus.Connecting, 5_000);
                            } catch {
                                message.client.queue.delete(message.guild.id);
                                connection.destroy();
                            }
                        } else if (connection.rejoinAttempts < 5) {
                            await wait((connection.rejoinAttempts + 1) * 5_000);
                            connection.rejoin();
                        } else {
                            connection.destroy();
                            message.client.queue.delete(message.guild.id);
                        }
                    }
                });
                return connection;
            } catch (error) {
                connection.destroy();
                throw error;
            }
        }

        async function getMusicPlayer(song) {
            if (!song) return;
            const player = createAudioPlayer();
            let stream;
            try {
                switch (song.service) {
                    case "YouTube":
                        stream = await ytdl(song.id, {filter: "audioonly", quality: "highestaudio", highWaterMark: 1 << 25});
						stream.on("error", e => {
                            if (queue) {
                                queue.list.shift();
                                getMusicPlayer(queue.list[0]);
                                return console.error(e);
                            }
						});
                        break;
                    case "SoundCloud":
                        stream = await scdl.download(song.url, config.SCClient);
						stream.on("error", e => {
                            if (queue) {
                                queue.list.shift();
                                getMusicPlayer(queue.list[0]);
                                return console.error(e);
                            }
						});
                        break;
                
                    default:
                        break;
                }
            } catch (e) {
                console.error(e);
                Messages.critical(queue.textChannel, `Error at getting song!\n\`${e}\``);
                return;
            }
            try {
                queue.resource = createAudioResource(stream, {
                  inputType: StreamType.Arbitrary,
                  inlineVolume: true
                });
                queue.resource.volume.setVolumeLogarithmic(queue.volume * 0.5)
                player.play(queue.resource);
            } catch (e) {
                console.error(e);
                Messages.critical(queue.textChannel, `Error at playing song!\n\`${e}\``);
                return;
            }
            Messages.advanced(queue.textChannel, "Started playing:", song.title, {custom: `Requested by ${song.requested.tag}`, icon: song.requested.displayAvatarURL({ format: "png", size: 256 })})
            return entersState(player, AudioPlayerStatus.Playing, 5_000);
        }

        async function startMusicPlayback() {
            if (!queue) return;
            if (queue.list.length === 0) {
                const connection = getVoiceConnection(message.guild.id);
                if (queue.voiceChannel.members.size === 0) { // Think about moving this to the line 146
                    Messages.regular(queue.textChannel, "All members left the channel! Music will be stoped!");
                    message.client.queue.delete(message.guild.id);
                    connection.destroy();
                }
                setTimeout(_ => {
                    if (queue?.list?.length === 0) {
                        message.client.queue.delete(message.guild.id);
                        if (connection.state.status == "ready") connection.destroy();
                    }
                }, 120000);
                return;
            }
            const connection = await joinChannel(channel);
            queue.player = await getMusicPlayer(queue.list[0]);
            connection.subscribe(queue.player);
            queue.playing = true;
    
            queue.player.on(AudioPlayerStatus.Idle, _ => {
                queue.playing = false;
                if (queue !== null) {
                    if (queue.loop) queue.list.push(queue.list[0]);
                    queue.list.shift();
                    startMusicPlayback();
                }
            });
        }

        if (url.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/playlist.+$/gi)) {
            const list = await yts({ listId: url.split("?list=")[1].split("&")[0]});
            if (!list) return Messages.warning(message, "Can't get this YouTube playlist!");
            const size = list.videos.length;
            for (let i = 0; i < (size > 200 ? 200 : size); i++) {
                const info = list.videos[i];
                const song = {
                    service: "YouTube",
                    title: info.title,
                    thumbnail: info.thumbnail,
                    duration: info.duration.seconds,
                    url: "https://www.youtube.com/watch?v="+info.videoId,
                    id: info.videoId,
                    requested: message.author 
                }
                queue.list.push(song);
            }
            Messages.complete(message, `Added ${list.videos.length} songs to queue!`);
        } else if (url.match(/^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.?be)\/watch.+$/gi)) {
            try {
                const info = await ytdl.getInfo(url);
                if (!info) return Messages.warning(message, "Can't get this song from YouTube!");
                const song = {
                    service: "YouTube",
                    title: info.videoDetails.title,
                    thumbnail: info.videoDetails.thumbnails[0].url,
                    duration: parseInt(info.videoDetails.lengthSeconds),
                    url: info.videoDetails.video_url,
                    id: info.videoDetails.videoId,
                    requested: message.author 
                }
                queue.list.push(song);
                if (queue.list.length > 1) return Messages.complete(message, `Added \`${song.title}\` to queue!`);
            } catch (e) {
                console.error(e)
                return Messages.critical(message, `YTDL Error!\n\`${e}\``)
            }
        } else if (url.match(/^(https?:\/\/)?(soundcloud\.com)\/(.*)$/gi)) {
            Messages.warning(message, "Sorry, SoundCloud is  temporarily disabled, use YouTube instead.");
        } else/*if (url.match(/^(https?:\/\/)?(soundcloud\.com)\/.*\/(sets|likes)(.*)$/gi)) {
            if (url.match(/^(https?:\/\/)?(soundcloud\.com)\/.*\/likes(.*)$/gi)) {
                const list = await scdl.getLikes({profileUrl: url}, config.SCClient);
                if (!list) return Messages.warning(message, "Can't get this SoundCloud playlist!");
                const size = list.collection.length;
                for (let i = 0; i < (size > 200 ? 200 : size); i++) {
                    const info = list.collection[i].track;
                    const song = {
                        service: "SoundCloud",
                        title: `${info.title} (${info.user.username})`,
                        thumbnail: info.artwork_url ? info.artwork_url : info.user.avatar_url,
                        duration: Math.floor(info.duration/1000),
                        url: info.permalink_url,
                        requested: message.author 
                    }
                    queue.list.push(song);
                }
                Messages.complete(message, `Added ${size} songs to queue!`);
            } else {
                const list = await scdl.getSetInfo(url);
                if (!list) return Messages.warning(message, "Can't get this SoundCloud playlist!");
                const size = list.tracks.length
                for (let i = 0; i < (size > 200 ? 200 : size); i++) {
                    const info = list.tracks[i];
                    const song = {
                        service: "SoundCloud",
                        title: `${info.title} (${info.user.username})`,
                        thumbnail: info.artwork_url ? info.artwork_url : info.user.avatar_url,
                        duration: Math.floor(info.duration/1000),
                        url: info.permalink_url,
                        requested: message.author 
                    }
                    queue.list.push(song);
                }
                Messages.complete(message, `Added ${size} songs to queue!`);
            }
            
        } else if (url.match(/^(https?:\/\/)?(soundcloud\.com)\/(.*)$/gi)) {
            try {
                const info = await scdl.getInfo(url);
                if (!info) return Messages.warning(message, "Can't get this song from SoundCloud!");
                const song = {
                    service: "SoundCloud",
                    title: `${info.title} (${info.user.username})`,
                    thumbnail: info.artwork_url ? info.artwork_url : info.user.avatar_url,
                    duration: Math.floor(info.duration/1000),
                    url: info.permalink_url,
                    requested: message.author 
                }
                queue.list.push(song);
                if (queue.list.length > 1) return Messages.complete(message, `Added \`${song.title}\` to queue!`);
            } catch (e) {
                console.error(e)
                return Messages.critical(message, `SCDL Error!\n\`${e}\``)
            }
        } else*/ if (url.match(/^https?:\/\/.+$/gi)) {
            return Messages.warning(message, "Sorry, raw links curently is not supported!")
        } else {
            const search = await yts.search(args.join(" "));
            if (search.videos.length === 0) return Messages.warning(message, "Sorry, nothing found!");
            const song = {
                service: "YouTube",
                title: search.videos[0].title,
                thumbnail: search.videos[0].thumbnail,
                duration: search.videos[0].duration.seconds,
                url: search.videos[0].url,
                id: search.videos[0].videoId,
                requested: message.author 
            }
            queue.list.push(song);
            if (queue.list.length > 1) return Messages.complete(message, `Added \`${song.title}\` to queue!`);
        }
        if (!queue.playing) {startMusicPlayback()};
    }
}