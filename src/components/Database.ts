import { Surreal } from "surrealdb.js";

type ServerSettings = {
	prefix: string;
	language: string;
	musicVolume: number;
	prefixEnabled: boolean;
	musicChannel?: string;
	logChannel?: string;
}

type RestrictedUser = {
	userId: string;
}

type AssociatedModerator = {
	serverId: string;
	userId: string;
}


export default class Database {
	private db: Surreal;
	private configDefault: ServerSettings;

	constructor(configDefault: ServerSettings) {
		this.db = new Surreal();
		this.configDefault = configDefault;
	}

	connect = (url: string, ns: string, db: string) => this.db.connect(url, { ns, db });
	authenticate = (user: string, pass: string) => this.db.signin({ user, pass });

	close = () => this.db.close();


	private prepareGetAndReturnServer = async (serverId: string): Promise<ServerSettings> => {
		const [response] = await this.db.select<ServerSettings>("servers:"+serverId);

		if (!response?.prefix || !response?.language || !response?.musicVolume)
			return (await this.db.create<ServerSettings>("servers:"+serverId, this.configDefault))[0];

		return response;
	};


	getServer = async (serverId: string) => {
		return await this.prepareGetAndReturnServer(serverId);
	};

	updateServer = async (serverId: string, key: keyof ServerSettings, value: ServerSettings[keyof ServerSettings]) => {
		const data = await this.prepareGetAndReturnServer(serverId);

		this.db.update<ServerSettings>("servers:"+serverId, Object.assign(data, { [key]: value }));
	};


	getModerators = async (serverId: string) => {
		const [ result ] = await this.db.query<[AssociatedModerator[]]>("SELECT * FROM moderators WHERE serverId = $serverId", { serverId });

		return result.result?.map(({ userId }) => userId) || [];
	};

	addModerator = (serverId: string, userId: string) => this.db.create<AssociatedModerator>("moderators:"+userId, { serverId, userId });
	removeModerator = (serverId: string, userId: string) => this.db.delete<AssociatedModerator>("moderators:"+userId);


	getRestricted = async () => {
		const result = await this.db.select<RestrictedUser>("restricted");
		
		return result.map(({ userId }) => userId);
	};

	addRestrictedUser = (userId: string) => this.db.create<RestrictedUser>("restricted:"+userId, { userId });
	removeRestrictedUser = (userId: string) => this.db.delete<RestrictedUser>("restricted:"+userId);
}