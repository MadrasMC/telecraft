import { Plugin } from "@telecraft/types";

import { parse } from "nbt-ts";

const pkg = require("../package.json") as { name: string; version: string };

const createError = (...str: string[]) =>
	new Error(`[${pkg.name}@${pkg.version}] ` + str.join(" "));

// Get 4 random numbers
const rand = () => String(Math.ceil(Math.random() * 10000));

const gamemodes = ["adventure", "survival", "creative", "spectator"] as const;
type gamemodes = typeof gamemodes[number];

type Messenger = {
	send: (user: string | number, msg: string) => Promise<void>;
	on: (type: string, listener: (context: any) => void) => void;
};

type Pos = [number, number, number];

type AuthCache = {
	[player: string]: {
		lockRef: NodeJS.Timeout;
		code?: string;
	};
};

const auth: Plugin<
	{ enable: boolean; use: "@telecraft/telegram" | "@telecraft/irc" },
	[Messenger]
> = config => ({
	name: pkg.name,
	version: pkg.version,
	dependencies: [config.use],
	start: async ({ events, store, server, console }, [messenger]) => {
		if (!config.enable) return;
		if (!messenger)
			throw createError(
				"Plugin was enabled, but dependency 'messenger' was not passed",
			);

		const authstore = await store();

		const authCache: AuthCache = {};

		const lock = (user: string) => {
			server.send(`effect give ${user} minecraft:blindness 1000000`);
			server.send(`effect give ${user} minecraft:slowness 1000000 255`);
			server.send(`gamemode spectator ${user}`);
			server.send(`deop ${user}`);
		};

		const unlock = (
			user: string,
			mode: typeof gamemodes[number],
			isOp: boolean = false,
		) => {
			server.send(`effect clear ${user} minecraft:blindness`);
			server.send(`effect clear ${user} minecraft:slowness`);
			server.send(`gamemode ${mode} ${user}`);
			if (isOp) server.send(`op ${user}`);
		};

		const tpLock = (player: string, dimension: string, pos: Pos) =>
			(authCache[player] = {
				lockRef: setInterval(() => {
					server.send(
						`execute in ${dimension} run tp ${player} ${pos.join(" ")}`,
					);
				}, 400),
			});

		const setCode = (player: string) => (authCache[player].code = rand());

		events.on("minecraft:join", async ctx => {
			const tgUser = (await authstore.get(ctx.user)) as number;

			server.send(`data get entity ${ctx.user}`);

			let playerGameType: gamemodes;
			let pos: Pos;
			let dimension: string;

			lock(ctx.user);

			events.once("minecraft:data", ctx => {
				const data = parse(ctx.data) as any;

				playerGameType = data.playerGameType;
				pos = data.Pos as Pos;
				dimension = data.Dimension;

				tpLock(ctx.user, dimension, pos);

				if (tgUser) {
					server.send(`tellraw ${ctx.user} "Send /auth to the bridge bot."`);
					messenger.send(tgUser, "Send /auth to authenticate yourself.");
				} else {
					setCode(ctx.user);

					server.send(
						`tellraw ${ctx.user} "Send \`/link ${
							authCache[ctx.user].code
						}\` to the bridge bot."`,
					);
				}
			});
		});

		events.on("minecraft:leave", (ctx: { user: string }) => {
			if (!authCache[ctx.user]) return;

			clearTimeout(authCache[ctx.user].lockRef);
			delete authCache[ctx.user];
		});

		messenger.on("link", async ctx => {
			const chatId = ctx.from.id;

			if (!Object.keys(authCache).length)
				return messenger.send(chatId, "Login to the server first.");

			if (!ctx.value) return messenger.send(chatId, "No code provided.");

			const match = Object.keys(authCache).find(
				player => authCache[player].code === ctx.value,
			);

			if (!match) return messenger.send(chatId, "Incorrect code.");

			await authstore.set(match, chatId);

			// Todo(mkr): Remember playerGameType & isOp
			unlock(match, "survival");
			clearTimeout(authCache[match]?.lockRef);
			delete authCache[match];

			messenger.send(chatId, "Link successful!");
		});

		messenger.on("auth", async ctx => {
			const chatId = ctx.from.id;
			const result = await authstore.find(ctx.fromID);

			if (!result)
				return messenger.send(chatId, "You must link first before using auth.");

			const [mcName] = result as [string, string];

			// Todo(mkr): Remember playerGameType & isOp
			unlock(mcName, "survival");
			clearTimeout(authCache[mcName]?.lockRef);
			delete authCache[mcName];

			return messenger.send(
				chatId,
				"You have successfully authenticated yourself.",
			);
		});

		events.on("core:close", () => {
			// cleanup
			authstore.close();
		});
	},
});

export default auth;
