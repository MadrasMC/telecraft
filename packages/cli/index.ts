import mri from "npm:mri";

import core from "../core/index.ts";

import { Vanilla, PaperMC, FabricMC } from "../parser/index.ts";
import Telegram from "../telegram/index.ts";
import Discord from "../discord/index.ts";
import IRC from "../irc/index.ts";
import YouTubeLive from "../youtube/index.ts";
import Auth from "../auth/index.ts";
import StoreProvider from "../kvstore/index.ts";
import { parse } from "./config.ts";
import { Plugin } from "../types/index.ts";

const args = mri(Deno.args, { alias: { config: "c" } });
const configPath = args.config ?? "./telecraft.json";
const config = parse(configPath, JSON.parse(Deno.readTextFileSync(configPath)));

const parsers = {
	"vanilla": Vanilla,
	"paper": PaperMC,
	"fabric": FabricMC,
	"vintage-story": Vanilla,
};

if (!(config.parser in parsers))
	throw new Error(`Unknown parser: ${config.parser}`);

const parser = parsers[config.parser as keyof typeof parsers];
const version = config.version
	? parser[config.version as keyof typeof parser]
	: [...Object.values(parser)].at(-1);

if (config.version && !version)
	throw new Error(`Unknown version: ${config.version}`);

if (!version) throw new Error("Could not find a parser version");

const plugins: ReturnType<Plugin<any, any>>[] = await Promise.all(
	(config.plugins ?? []).map(async c => {
		// internal plugin
		if ("name" in c) {
			if (c.name === "telegram")
				return Telegram({
					enable: true,
					chatId: c.chatId,
					token: c.token,
					list: { allow: c.allowList, timeout: c.startTimeout },
				});
			if (c.name === "discord") return Discord({ enable: true, ...c });
			if (c.name === "irc") return IRC({ enable: true, ...c });
			if (c.name === "youtube") return YouTubeLive({ enable: true, ...c });
			if (c.name === "auth")
				return Auth({
					enable: true,
					use: `@telecraft/${c.messenger}`,
					timeout: c.timeout,
				});
		}

		// dynamically loaded external plugin
		return ((await import(c.url)) as Plugin<any>)(c.config ?? {});
	}),
);

core({
	config: { launch: config.launch, cwd: config.cwd },
	parser: version,
	store: StoreProvider(config.store ?? "./telecraft.db"),
	plugins,
});
