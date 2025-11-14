// fixes Bun standalone executable Error#message being non-writable
Object.defineProperty(Error.prototype, "message", { writable: true, configurable: true });

import mri from "mri";

import core from "../core/index.ts";

import { Vanilla, PaperMC, FabricMC, VintageStory } from "../parser/index.ts";
import Telegram from "../telegram/index.ts";
import Discord from "../discord/index.ts";
// import IRC from "../irc/index.ts";
import YouTubeLive from "../youtube/index.ts";
import Auth from "../auth/index.ts";
import StoreProvider from "../kvstore/index.ts";
import { parse } from "./config.ts";
import type { Plugin } from "../types/index.ts";
import { version } from "../version.ts";

console.log(`Telecraft v${version}`);

const args = mri(process.argv.slice(2), { alias: { config: "c" } });
const configPath = args.config ?? "./telecraft.json";
const configText = await Bun.file(configPath).text();
const config = parse(configPath, JSON.parse(configText));

const parsers = {
	minecraft: Vanilla,
	papermc: PaperMC,
	fabricmc: FabricMC,
	vintagestory: VintageStory,
};

if (!(config.parser in parsers)) throw new Error(`Unknown parser: ${config.parser}`);

const parser = parsers[config.parser as keyof typeof parsers];
const parserVersioned = config.version ? parser[config.version as keyof typeof parser] : Object.values(parser).at(-1);

if (config.version && !parserVersioned) throw new Error(`Unknown version: ${config.version}`);

if (!parserVersioned) throw new Error("Could not find a parser version");

const plugins: ReturnType<Plugin<any, any>>[] = await Promise.all(
	(config.plugins ?? []).map(async c => {
		// internal plugin
		if ("name" in c) {
			if (c.name === "telegram") return Telegram({ enable: true, ...c });
			if (c.name === "discord") return Discord({ enable: true, ...c });
			// if (c.name === "irc") return IRC({ enable: true, ...c });
			if (c.name === "irc") throw new Error("IRC plugin is temporarily out of maintenance");
			if (c.name === "youtube") return YouTubeLive({ enable: true, ...c });
			if (c.name === "auth") return Auth({ enable: true, use: c.messenger, timeout: c.timeout });
		}

		// dynamically loaded external plugin
		return ((await import(c.url)) as Plugin<any>)(c.config ?? {});
	}),
);

core({
	config: { launch: config.launch, workdir: config.workdir },
	parser: parserVersioned,
	store: StoreProvider(config.store ?? "./telecraft.db"),
	plugins,
});
