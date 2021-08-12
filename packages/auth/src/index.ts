import { Plugin, Messenger } from "@telecraft/types";

import { parse } from "nbt-ts";

const pkg = require("../package.json") as { name: string; version: string };

const createError = (...str: string[]) =>
	new Error(`[${pkg.name}@${pkg.version}] ` + str.join(" "));

// Get 4 random numbers
const rand = () => String(Math.floor(1000 + Math.random() * 9000));

const gameModes = ["survival", "creative", "adventure", "spectator"] as const;
type gameModes = typeof gameModes[number];

type Pos = [number, number, number];

type AuthCache = {
	[player: string]: {
		lockRef: NodeJS.Timeout;
		code?: string;
		gameMode: gameModes;
		op?: boolean;
	};
};

const auth: Plugin<
	{
		enable: boolean;
		use: "@telecraft/telegram" | "@telecraft/discord" | "@telecraft/irc";
	},
	[Messenger.exports]
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

		const authStore = await store<{
			messengerId?: string | number;
			gameMode?: string;
			op?: boolean;
		}>();

		const authCache = new Map<
			string,
			{
				lockRef?: NodeJS.Timeout;
				code?: string;
				gameMode?: gameModes;
				op?: boolean;
			}
		>();

		const setAuthCache = (
			player: string,
			details: Partial<AuthCache[string]>,
		) => {
			authCache.set(player, { ...authCache.get(player), ...details });
		};

		const lock = (user: string) => {
			server.send(`effect give ${user} minecraft:blindness 1000000`);
			server.send(`effect give ${user} minecraft:slowness 1000000 255`);
			server.send(`gamemode spectator ${user}`);
			server.send(`deop ${user}`);
		};

		const unlock = async (user: string, messengerId: string | number) => {
			const opts = await authStore.get(user);
			const cacheUser = authCache.get(user);

			const mode = opts?.gameMode || authCache.get(user)?.gameMode;
			const op = opts?.op || authCache.get(user)?.op;

			authCache.delete(user);

			server.send(`effect clear ${user} minecraft:blindness`);
			server.send(`effect clear ${user} minecraft:slowness`);
			server.send(`gamemode ${mode} ${user}`);
			if (op) server.send(`op ${user}`);

			cacheUser?.lockRef && clearTimeout(cacheUser.lockRef);
			await authStore.set(user, { messengerId: messengerId });
		};

		const tpLock = (
			player: string,
			dimension: string,
			pos: Pos,
			gameMode: gameModes,
		) =>
			setAuthCache(player, {
				lockRef: setInterval(() => {
					server.send(
						`execute in ${dimension} run tp ${player} ${pos.join(" ")}`,
					);
				}, 400),
				gameMode,
			});

		events.on("minecraft:join", async (ctx: { user: string }) => {
			const player = ctx.user;
			const storeUser = await authStore.get(player);

			server.send(`data get entity ${player}`);

			lock(player);

			events.once(
				"minecraft:deop",
				(ctx: { user?: string; op?: string; notop?: string }) =>
					setAuthCache(player, { op: Boolean(ctx.op) }),
			);

			events.once("minecraft:data", ctx => {
				const data = parse(ctx.data) as any;

				const playerGameType: gameModes = gameModes[data.playerGameType.value];
				const pos: Pos = data.Pos as Pos;
				const dimension: string = data.Dimension;

				tpLock(player, dimension, pos, playerGameType);

				if (storeUser?.messengerId) {
					const cmd = messenger.cmdPrefix + "auth";

					server.send(`tellraw ${player} "Send ${cmd} to the bridge bot."`);
					messenger.send(
						"private",
						storeUser.messengerId,
						`Send ${cmd} to authenticate yourself.`,
					);
				} else {
					const cmd = messenger.cmdPrefix + "link";

					const code = rand();
					setAuthCache(player, { code });

					server.send(
						// Todo(mkr): make link copyable
						`tellraw ${player} "Send \`${cmd} ${code}\` to the bridge bot."`,
					);
					server.send(`title ${player} title "Send ${cmd} ${code}"`);
					server.send(`title ${player} subtitle "to bridge bot"`);
				}
			});
		});

		events.on("minecraft:leave", async (ctx: { user: string }) => {
			const cacheUser = authCache.get(ctx.user);

			if (!cacheUser) return;

			const storeUser = await authStore.get(ctx.user);

			await authStore.set(ctx.user, {
				messengerId: storeUser?.messengerId,
				gameMode: cacheUser.gameMode,
				op: cacheUser.op,
			});

			cacheUser.lockRef && clearTimeout(cacheUser.lockRef);

			authCache.delete(ctx.user);
		});

		messenger.on(
			"link",
			async (ctx: {
				from: {
					id: string | number;
					source: string | number;
					type: "private" | "chat";
				};
				cmd: string;
				value: string;
			}) => {
				const fromId = ctx.from.id;
				const sourceId = ctx.from.source;

				if (ctx.from.type !== "private")
					return messenger.send(
						"chat",
						sourceId,
						"Send link command in private.",
					);

				if (![...authCache.entries()].length)
					return messenger.send("chat", fromId, "Login to the server first.");

				if (!ctx.value)
					return messenger.send(ctx.from.type, fromId, "No code provided.");

				const match = [...authCache.keys()].find(
					player => authCache.get(player)!.code === ctx.value,
				);

				if (!match)
					return messenger.send(ctx.from.type, fromId, "Incorrect code.");

				await unlock(match, fromId);

				messenger.send(ctx.from.type, fromId, "Link successful!");
			},
		);

		messenger.on(
			"auth",
			async (ctx: {
				from: {
					id: string | number;
					source: string | number;
					type: "private" | "chat";
				};
				cmd: string;
				value: string;
			}) => {
				const fromId = ctx.from.id;
				const sourceId = ctx.from.source;
				const result = await authStore.find(
					record => record?.messengerId === fromId,
				);

				const [mcName, record] = result || [];

				if (!mcName || !record?.messengerId)
					return messenger.send(
						ctx.from.type,
						sourceId,
						"You must link first before using auth.",
					);

				const cacheUser = authCache.get(mcName);

				if (!cacheUser)
					return messenger.send(
						ctx.from.type,
						sourceId,
						"Login to the server first.",
					);

				await unlock(mcName, record.messengerId);

				return messenger.send(
					ctx.from.type,
					sourceId,
					"You have successfully authenticated yourself.",
				);
			},
		);

		events.on("core:close", () => {
			// cleanup
			authStore.close();
		});
	},
});

export default auth;
