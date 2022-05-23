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
const Messages = require("../../components/Messages");
const Servers = require("../../components/Servers");
const play = require("play-dl");
const { default: axios } = require("axios");
const { Readable } = require("stream");

const {YMApi} = require("ym-api");
const { promisify } = require("util");
const ymApi = new YMApi();

const wait = promisify(setTimeout);

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
		if (!channel.permissionsFor(client.user).has("CONNECT") || !channel.permissionsFor(client.user).has("SPEAK")) return Messages.warning(message, l.perm_warn);

		const queueCounstruct = {
			guild: message.guild,
			textChannel: message.channel,
			voiceChannel: channel,
			player: undefined,
			resource: undefined,
			volume: Servers.get(message.guild.id, "musicVolume"),
			loop: false,
			playing: false,
			paused: false,
			skiping: [],
			list: [],

			clear() {
				const wasPlaying = this.playing;
				this.list = [];
				this.playing = false;
				this.paused = false;
				try {
					if (wasPlaying) this.player.stop();
				} catch (e) {}
				client.queue.delete(this.guild.id);
			}
		}
		if (!client.queue.has(message.guild.id)) client.queue.set(message.guild.id, queueCounstruct);
		const queue = client.queue.get(message.guild.id);

		if (!url || url.length < 1) {
			if (queue.paused) {
				const resumeCommand = client.commands.get("resume");
				resumeCommand.execute(message, []);
			} else Messages.warning(message, l.nothing);
			return;
		} 

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
								queue.clear();
								connection.destroy();
							}
						} else if (connection.rejoinAttempts < 5) {
							await wait((connection.rejoinAttempts + 1) * 5_000);
							connection.rejoin();
						} else {
							queue.clear();
							connection.destroy();
						}

						const newChannelId = newState.subscription?.connection?.joinConfig?.channelId;
						if (queue && (newChannelId !== queue.voiceChannel.id)) queue.voiceChannel =  message.guild.channels.cache.get(newChannelId);
					}
				});
				return connection;
			} catch (error) {
				queue.clear();
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
				}
				if (song.service === "URL" || song.service.includes("URL")) {
					const buffer = await axios.get(song.url, {responseType: "arraybuffer"})
					stream = Readable.from(buffer.data);
				}
				if (song.service === "Yandex.Music") {
					const downloadInfo = await ymApi.getTrackDownloadInfo(song.id);
					const directUrl = await ymApi.getTrackDirectLink(downloadInfo.find(i => i.bitrateInKbps === 192).downloadInfoUrl);

					const buffer = await axios.get(directUrl, {responseType: "arraybuffer"})
					stream = Readable.from(buffer.data);
				}
				stream.on("error", e => {
					if (!queue?.playing) return;
					Messages.critical(queue.textChannel, `${l.stream_error}: \n\`${e}\``);
					console.error(e);
					queue.list.shift();
					if (queue.list.length > 0) {
						return getMusicPlayer(queue.list[0]);
					}
				});
				stream.on("end", () => {
					//console.log("Stream ended");
				})
				queue.stream = stream;
			} catch (e) {
				console.error(e);
				Messages.critical(queue.textChannel, `${l.get_error}\n\`${e}\``);
				queue.list.shift();
				if (queue.list.length > 0) {
					return getMusicPlayer(queue.list[0]);
				}
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
				queue.list.shift();
				return getMusicPlayer(queue.list[0]);
			}
			// Messages.advanced(queue.textChannel, l.started, song.title, {custom: `${l.requested} ${song.requested.tag}`, icon: song.requested.displayAvatarURL({ format: "png", size: 256 })})
			return entersState(player, AudioPlayerStatus.Playing, 5_000);
		}

		async function startMusicPlayback() {
			if (queue.list.length === 0) return;
			const connection = await joinChannel(queue.voiceChannel);
			if (queue.voiceChannel.members.size <= 1) {
				Messages.warning(queue.textChannel, l.all_left);
				queue.clear();
				connection.destroy();
				return;
			}
			if (queue.list.length === 0) {
				setTimeout(_ => {
					if (!queue.playing && queue.list.length === 0) {
						queue.clear();
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
				if (queue.list.length > 0) {
					if (queue.loop == "queue") queue.list.push(queue.list[0]);
					if (queue.loop != "song") queue.list.shift();
					startMusicPlayback();
				}
			});
		}

		play.setToken({
			useragent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36",
			soundcloud: {
				clientId: config.SCClient || (await play.getFreeClientID())
			}
		});
		if (config.YMClient?.access_token && config.YMClient?.uid) {
			await ymApi.init({
				access_token: config.YMClient.access_token,
				uid: config.YMClient.uid
			})
		}
		
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
				if (queue.list.length > 1) Messages.success(message, `${l.added[0]} \`${song.title}\` ${l.added[1]}`);
			} catch (e) {
				console.error(e);
				return Messages.critical(message, `${l.cant_yts}\n\`${e}\``);
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
				Messages.success(message, `${l.added_many[0]} ${list.length > 200 ? 200 : list.length} ${l.added_many[1]}`);
			} catch (e) {
				console.error(e);
				return Messages.critical(message, `${l.cant_ytp}\n\`${e}\``);
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
			if (queue.list.length > 1) Messages.success(message, `${l.added[0]} \`${song.title}\` ${l.added[1]}`);

		} else if (url.match(/(https:\/\/)?(www.)?music\.yandex\.ru\/album\/([0-9]+)\/track\/[0-9]+/gi)) { // YM track
			if (!config.YMClient?.access_token || !config.YMClient?.uid) return Messages.warning(message, l.yandex_auth);
			try {
				const id = url.match(/track\/([0-9]+)/gi)[0].replace("track/", "");
				const info = (await ymApi.getTrack(id))[0];
	
				if (!info) return Messages.warning(message, l.cant_yms);
				if (!info.available) return Messages.warning(message, l.unavailable_yms);
	
				const song = {
					service: "Yandex.Music",
					title: info.artists.map(artist => artist.name).join(", ") + " - " + info.title + (info.version ? ` (${info.version})` : ""),
					thumbnail: "https://olejka.ru/r/950e92f598.png",
					duration: Math.floor(info.durationMs / 1000),
					url: `https://music.yandex.ru/album/${info.albums[0].id}/track/${info.id}`,
					id: info.id,
					requested: message.author
				}
				queue.list.push(song);
				if (queue.list.length > 1) return Messages.success(message, `${l.added[0]} \`${song.title}\` ${l.added[1]}`);
			} catch (e) {
				console.error(e);
				return Messages.critical(message, `${l.cant_yms}\n\`${e}\``);
			}
		} else if (url.match(/(https:\/\/)?(www\.)?music\.yandex\.ru\/users\/([A-Za-z0-9-_]+)(\/playlists\/[0-9]+)?/gi)) { // YM playlist
			if (!config.YMClient?.access_token || !config.YMClient?.uid) return Messages.warning(message, l.yandex_auth);
			try {
				const username = url.match(/users\/([A-Za-z0-9-_]+)/gi)[0].replace("users/", "");
				const playlist = url.match(/playlists\/([0-9]+)/gi) ? url.match(/playlists\/([0-9]+)/gi)[0].replace("playlists/", "") : "3";
	
				const list = (await ymApi.getPlaylist(playlist, username)).tracks?.map(track => track.track).filter(track => track.available);
				if (!list) return Messages.warning(message, l.cant_ymp);
	
				for (let i = 0; i < (list.length > 200 ? 200 : list.length); i++) {
					const info = list[i];
					const song = {
						service: "Yandex.Music",
						title: info.artists.map(artist => artist.name).join(", ") + " - " + info.title + (info.version ? ` (${info.version})` : ""),
						thumbnail: "https://olejka.ru/r/950e92f598.png",
						duration: Math.floor(info.durationMs / 1000),
						url: `https://music.yandex.ru/album/${info.albums[0].id}/track/${info.id}`,
						id: info.id,
						requested: message.author
					}
					queue.list.push(song);
				}
				Messages.success(message, `${l.added[0]} \`${list.length > 200 ? 200 : list.length}\` ${l.added[1]}`);
			} catch(e) {
				console.error(e);
				return Messages.critical(message, `${l.cant_yms}\n\`${e}\``);
			}
		} else if (url.match(/(https:\/\/)?(www.)?music\.yandex\.ru\/album\/[0-9]+/gi)) { // YM album
			if (!config.YMClient?.access_token || !config.YMClient?.uid) return Messages.warning(message, l.yandex_auth);
			try {
				const album = url.match(/album\/([0-9]+)/gi)[0].replace("album/", "");

				const list = (await ymApi.getAlbumWithTracks(album))?.volumes[0]?.filter(track => track.available);
				if (!list) return Messages.warning(message, l.cant_yma);
	
				for (let i = 0; i < (list.length > 200 ? 200 : list.length); i++) {
					const info = list[i];
					const song = {
						service: "Yandex.Music",
						title: info.artists.map(artist => artist.name).join(", ") + " - " + info.title + (info.version ? ` (${info.version})` : ""),
						thumbnail: "https://olejka.ru/r/950e92f598.png",
						duration: Math.floor(info.durationMs / 1000),
						url: `https://music.yandex.ru/album/${info.albums[0].id}/track/${info.id}`,
						id: info.id,
						requested: message.author
					}
					queue.list.push(song);
				}
				Messages.success(message, `${l.added[0]} \`${list.length > 200 ? 200 : list.length}\` ${l.added[1]}`);
			} catch (e) {
				console.error(e);
				return Messages.critical(message, `${l.cant_yma}\n\`${e}\``);
			}
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
				if (queue.list.length > 1) Messages.success(message, `${l.added[0]} \`${song.title}\` ${l.added[1]}`);
			}).catch(e =>  Messages.critical(message, `${l.cant_url}\n\`${e}\``));
		}

		if (queue?.paused) {
			const resumeCommand = client.commands.get("resume");
			resumeCommand.execute(message, []);
		};
		if (!queue?.playing) startMusicPlayback();
	}
}