export interface Plugin {
	url: string;
	config?: unknown;
}

export interface Telegram {
	name: "telegram";
	token: string;
	chatId: string;
	allowList?: boolean;
	startTimeout?: number;
}

export interface Discord {
	name: "discord";
	token: string;
	channelId: string;
}

export interface YouTubeLive {
	name: "youtube";
	videoId: string;
	apiKey: string;
	fetchInterval?: number;
	maxResults?: number;
}

export interface IRC {
	name: "irc";
	server: string;
	nick: string;
	channel: string;
}

export interface Auth {
	name: "auth";
	messenger: "telegram" | "discord" | "irc";
	timeout?: number;
}

export interface Config {
	launch: string;
	cwd?: string;
	parser: string;
	version?: string;
	store?: string;
	plugins?: (Plugin | Telegram | Discord | YouTubeLive | IRC | Auth)[];
}

const isObject = (value: unknown): value is Record<string, unknown> =>
	value !== null && typeof value === "object";

const isPropString = <O extends Record<string, unknown>, P extends string>(
	obj: O,
	prop: P,
): obj is O & Record<P, string> => typeof obj[prop] === "string";

const isPropStringOrUndef = <
	O extends Record<string, unknown>,
	P extends string,
>(
	obj: O,
	prop: P,
): obj is O & Record<P, string | undefined> =>
	typeof obj[prop] === "string" || typeof obj[prop] === "undefined";

const isPropBooleanOrUndef = <
	O extends Record<string, unknown>,
	P extends string,
>(
	obj: O,
	prop: P,
): obj is O & Record<P, boolean | undefined> =>
	typeof obj[prop] === "boolean" || typeof obj[prop] === "undefined";

const isPropNumberOrUndef = <
	O extends Record<string, unknown>,
	P extends string,
>(
	obj: O,
	prop: P,
): obj is O & Record<P, number | undefined> =>
	typeof obj[prop] === "number" || typeof obj[prop] === "undefined";

const isPropArrayOrUndef = <
	O extends Record<string, unknown>,
	P extends string,
>(
	obj: O,
	prop: P,
): obj is O & Record<P, unknown[] | undefined> =>
	Array.isArray(obj[prop]) || typeof obj[prop] === "undefined";

export function parse(configPath: string, config: unknown): Config {
	class ConfigError extends Error {
		constructor(message: string) {
			super(`Config found at ${configPath}: ` + message);
			this.name = "AssertionError";
		}
	}

	if (!isObject(config)) throw new ConfigError("Config must be an object");

	if (!isPropString(config, "launch"))
		throw new ConfigError("Config.launch must be a string");
	if (!isPropStringOrUndef(config, "cwd"))
		throw new ConfigError("Config.cwd must be a string");
	if (!isPropString(config, "parser"))
		throw new ConfigError("Config.parser must be a string");
	if (!isPropStringOrUndef(config, "version"))
		throw new ConfigError("Config.version must be a string");
	if (!isPropStringOrUndef(config, "store"))
		throw new ConfigError("Config.store must be a string");
	if (!isPropArrayOrUndef(config, "plugins"))
		throw new ConfigError("Config.plugins must be an array");

	for (const plugin of config.plugins ?? []) {
		if (!isObject(plugin))
			throw new ConfigError(
				"Config.plugins must be an array of objects. Found: " + typeof plugin,
			);

		if (isPropString(plugin, "name"))
			switch (plugin.name) {
				case "telegram": {
					if (!isPropString(plugin, "token"))
						throw new ConfigError(
							"Config.plugins[telegram].token must be a string",
						);

					if (!isPropString(plugin, "chatId"))
						throw new ConfigError(
							"Config.plugins[telegram].chatId must be a string",
						);

					if (!isPropBooleanOrUndef(plugin, "allowList"))
						throw new ConfigError(
							"Config.plugins[telegram].allowList must be a boolean",
						);

					if (!isPropNumberOrUndef(plugin, "startTimeout"))
						throw new ConfigError(
							"Config.plugins[telegram].startTimeout must be a number",
						);

					break;
				}
				case "discord": {
					if (!isPropString(plugin, "token"))
						throw new ConfigError(
							"Config.plugins[discord].token must be a string",
						);

					if (!isPropString(plugin, "channelId"))
						throw new ConfigError(
							"Config.plugins[discord].channelId must be a string",
						);

					break;
				}
				case "youtube": {
					if (!isPropString(plugin, "videoId"))
						throw new ConfigError(
							"Config.plugins[youtube].videoId must be a string",
						);

					if (!isPropString(plugin, "apiKey"))
						throw new ConfigError(
							"Config.plugins[youtube].apiKey must be a string",
						);

					if (!isPropNumberOrUndef(plugin, "fetchInterval"))
						throw new ConfigError(
							"Config.plugins[youtube].fetchInterval must be a number",
						);

					if (!isPropNumberOrUndef(plugin, "maxResults"))
						throw new ConfigError(
							"Config.plugins[youtube].maxResults must be a number",
						);

					break;
				}
				case "irc": {
					if (!isPropString(plugin, "server"))
						throw new ConfigError(
							"Config.plugins[irc].server must be a string",
						);

					if (!isPropString(plugin, "nick"))
						throw new ConfigError("Config.plugins[irc].nick must be a string");

					if (!isPropString(plugin, "channel"))
						throw new ConfigError(
							"Config.plugins[irc].channel must be a string",
						);

					break;
				}
				case "auth": {
					if (!isPropStringOrUndef(plugin, "messenger"))
						throw new ConfigError(
							"Config.plugins[auth].messenger must be a string",
						);

					if (!isPropNumberOrUndef(plugin, "timeout"))
						throw new ConfigError(
							"Config.plugins[auth].timeout must be a number",
						);

					break;
				}
				default: {
					throw new ConfigError("Unknown plugin. Found: " + plugin.name);
				}
			}
		else if (!isPropString(plugin, "url"))
			throw new ConfigError(
				"Config.plugins[*] must contain either a name or a url:\n" +
					String(plugin),
			);
	}

	return config as Config;
}
