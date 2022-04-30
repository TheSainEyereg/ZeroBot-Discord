const {
	joinVoiceChannel,
	VoiceConnectionStatus,
	VoiceConnectionDisconnectReason,
	entersState,
	AudioPlayerStatus,
	createAudioPlayer,
	NoSubscriberBehavior,
	createAudioResource,
	StreamType,
	getVoiceConnection
} = require("@discordjs/voice");
const config = require("../../config.json");
const Messages = require("../../core/Messages");
const Servers = require("../../core/Servers");
const play = require("play-dl");
const { default: axios } = require("axios");
const { Readable } = require("stream");

module.exports = {
	name: "play",
	optional: false, //if (!args[0]) //resume
	aliases: ["p"],
	async execute(message, args) {
		let l = Localization.server(message.client, message.guild, this.name);
		const url = args.join(" ");
		const client = message.client;
		const member = message.member;
		const channel = member?.voice.channel;
		if (!channel) return Messages.warning(message, l.join_warn);
		if (!channel.permissionsFor(message.client.user).has("CONNECT") || !channel.permissionsFor(message.client.user).has("SPEAK")) return Messages.warning(message, l.perm_warn);

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
			if (getVoiceConnection(message.guild.id)?.state.status === VoiceConnectionStatus.Ready) return getVoiceConnection(message.guild.id);

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
								connection.destroy();
								message.client.queue.delete(message.guild.id);
							}
						} else if (connection.rejoinAttempts < 5) {
							await wait((connection.rejoinAttempts + 1) * 5_000);
							connection.rejoin();
						} else {
							connection.destroy();
							message.client.queue.delete(message.guild.id);
						}

						const newChannelId = newState.subscription?.connection?.joinConfig?.channelId;
						if (queue && (newChannelId !== queue.voiceChannel.id)) queue.voiceChannel =  message.guild.channels.cache.get(newChannelId);
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
			const player = createAudioPlayer({
				behaviors: {
					noSubscriber: NoSubscriberBehavior.Play
				}
			});
			let stream;
			let streamType;
			try {
				if (song.service === "YouTube" || song.service === "SoundCloud") {
					const pdl = await play.stream(song.url);
					stream = pdl.stream;
					streamType = pdl.type;
					stream.on("error", e => {
						if (e.message === "Premature close") return;
						Messages.critical(queue.textChannel, `${l.playdl_error}: \n\`${e}\``);
						console.error(e);
						if (queue) {
							queue.list.shift();
							return getMusicPlayer(queue.list[0]);
						}
					});
				}
				if (song.service === "URL" || song.service.includes("URL")) {
					const buffer = await axios.get(song.url, {responseType: 'arraybuffer'})
					stream = Readable.from(buffer.data);
					stream.on("error", e => {
						Messages.critical(queue.textChannel, `${l.url_error}: \n\`${e}\``);
						console.error(e);
						if (queue) {
							queue.list.shift();
							return getMusicPlayer(queue.list[0]);
						}
					});
				}
			} catch (e) {
				Messages.critical(queue.textChannel, `${l.get_error}\n\`${e}\``);
				queue.list.shift();
				return getMusicPlayer(queue.list[0]);
			}
			try {
				queue.resource = createAudioResource(stream, {
				  inputType: streamType || StreamType.Arbitrary,
				  inlineVolume: true
				});
				queue.resource.volume.setVolumeLogarithmic(queue.volume * 0.5)
				player.play(queue.resource);
			} catch (e) {
				console.error(e);
				Messages.critical(queue.textChannel, `${l.play_error}\n\`${e}\``);
				return;
			}// HERE_BLYAT
			Messages.advanced(queue.textChannel, l.started, song.title, {custom: `${l.requested} ${song.requested.tag}`, icon: song.requested.displayAvatarURL({ format: "png", size: 256 })})
			return entersState(player, AudioPlayerStatus.Playing, 5_000);
		}

		async function startMusicPlayback() {
			if (!queue) return;
			const connection = await joinChannel(queue.voiceChannel);
			if (queue.voiceChannel.members.size === 1) {
				Messages.warning(queue.textChannel, l.all_left);
				message.client.queue.delete(message.guild.id);
				connection.destroy();
				return;
			}
			if (queue.list.length === 0) {
				setTimeout(_ => {
					if (!queue.playing && queue?.list?.length === 0) {
						message.client.queue.delete(message.guild.id);
						if (connection?.state.status == "ready") connection.destroy();
					}
				}, 120000);
				return;
			}
			queue.player = await getMusicPlayer(queue.list[0]);
			connection.subscribe(queue.player);
			queue.playing = true;
	
			queue.player.on(AudioPlayerStatus.Idle, _ => {
				queue.playing = false;
				if (queue !== null) {
					if (queue.loop == "queue") queue.list.push(queue.list[0]);
					if (queue.loop != "song") queue.list.shift();
					startMusicPlayback();
				}
			});
		}

		play.setToken({
			soundcloud: {
				clientId: config.SCClient || (await play.getFreeClientID())
			}
		})
		
		const type = await play.validate(url);

		if (type === "yt_video") {
			try {
				const info = await play.video_info(url);
				if (!info) return Messages.warning(message, l.cant_yts);
				const song = {
					service: "YouTube",
					title: info.video_details.title,
					thumbnail: info.video_details.thumbnails[0].url,
					duration: parseInt(info.video_details.durationInSec),
					url: info.video_details.url,
					id: info.video_details.id,
					requested: message.author 
				}
				queue.list.push(song);
				if (queue.list.length > 1) return Messages.success(message, `${l.added[0]} \`${song.title}\` ${l.added[1]}`);
			} catch (e) {
				console.error(e)
				return Messages.critical(message, `Can't get YT video info:\n\`${e}\``)
			}
		} else if (type === "yt_playlist") {
			try {
				const playlist = await play.playlist_info(url);
				const list = await playlist.all_videos();

				if (!list) return Messages.warning(message, l.cant_ytp);

				for (let i = 0; i < (list.length > 200 ? 200 : list.length); i++) {
					const info = list[i];
					const song = {
						service: "YouTube",
						title: info.title,
						thumbnail: info.thumbnails[0].url,
						duration: info.durationInSec,
						url: info.url,
						id: info.id,
						requested: message.author 
					}
					queue.list.push(song);
				}
				Messages.success(message, `${l.added_many[0]} ${list.length} ${l.added_many[1]}`);
			} catch (e) {
				console.error(e)
				return Messages.critical(message, `Can't get YT playlist info:\n\`${e}\``)
			}
		} else if (type === "so_track") {
			Messages.warning(message, l.sc_disabled);
		} else if (type === "so_playlist") {
			Messages.warning(message, l.sc_disabled);
		} else if (type === "search") {
			const result = await play.search(url, {limit: 1});
			if (result.length === 0) return Messages.warning(message, l.cant_find);
			const song = {
				service: "YouTube",
				title: result[0].title,
				thumbnail: result[0].thumbnails[0].url,
				duration: result[0].durationInSec,
				url: result[0].url,
				id: result[0].id,
				requested: message.author 
			}
			queue.list.push(song);
			if (queue.list.length > 1) return Messages.success(message, `${l.added[0]} \`${song.title}\` ${l.added[1]}`);

		} else {
			await axios.get(url).then(res => {
				if (!res.headers["content-type"].match(/^(audio|video)\/.+$/gi)) return Messages.warning(message, l.not_media);
				const song = {
					service: "URL",
					title: "[URL] "+ (url.length > 50 ? url.substr(0, 50)+"..." : url),
					thumbnail: "https://olejka.ru/r/03d291545d.png",
					duration: 0, // Idk how to calculate this
					url: url,
					requested: message.author 
				}
				queue.list.push(song);
				if (queue.list.length > 1) return Messages.success(message, `${l.added[0]} \`${song.title}\` ${l.added[1]}`);
			}).catch(e =>  Messages.critical(message, `${l.cant_url}\n\`${e}\``));
		}

		if (!queue.playing) {startMusicPlayback()};
	}
}