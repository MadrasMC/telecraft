import { Plugin, Messenger } from "@telecraft/types";
import { CtxBase } from "@telecraft/types/types/Messenger";

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
		timeout?: number;
	},
	[Messenger["exports"]]
> = config => ({
	name: pkg.name,
	version: pkg.version,
	dependencies: [config.use],
	start: async ({ events, store, server }, [messenger]) => {
		if (!config.enable) return;
		if (!messenger)
			throw createError(
				"Plugin was enabled, but dependency 'messenger' was not passed",
			);

		const timeout = config.timeout || 60 * 1000;

		type StoreUser = {
			messengerId?: Messenger["identifier"];
			gameMode?: string;
			op?: boolean;
		};

		const authStore = await store<StoreUser>();

		const authCache = new Map<
			string,
			{
				lockRef?: NodeJS.Timeout;
				code?: string;
				gameMode?: gameModes;
				op?: boolean;
				hasTimedOut?: boolean;
				hasSentAuth?: boolean;
			}
		>();

		const setAuthCache = (
			player: string,
			details: Partial<AuthCache[string]>,
		) => {
			authCache.set(player, { ...authCache.get(player), ...details });
		};

		const lock = async (user: string, storeUser: StoreUser | null) => {
			server.send(`effect give ${user} minecraft:blindness 1000000`);
			server.send(`effect give ${user} minecraft:slowness 1000000 255`);
			server.send(`gamemode spectator ${user}`);
			server.send(`deop ${user}`);

			// auth timeout
			setTimeout(() => {
				const cacheUser = authCache.get(user);

				// player auth'd before timeout
				if (!cacheUser) return;

				// player has auth'd but unlock is still in progress
				if (cacheUser.hasSentAuth) return;

				/*
					In case the user auths after the timeout duration
					but before they could be kicked.
				*/
				cacheUser.hasTimedOut = true;

				/*
					Unlock the user but avoid setting their
					gamemode back to survival, since if the kick
					fails for some reason the user could gain
					access to the target account without auth
				*/
				clearLock(user, storeUser?.messengerId, {
					success: false,
					reason: "Auth timed out. Try again.",
				});
			}, timeout);
		};

		const clearLock = async (
			user: string,
			messengerId: Messenger["identifier"],
			{
				success,
				reason,
			}:
				| { success: true; reason?: never }
				| { success: false; reason?: string },
		) => {
			const opts = await authStore.get(user);
			const cacheUser = authCache.get(user);

			const mode = opts?.gameMode || authCache.get(user)?.gameMode;
			const op = opts?.op || authCache.get(user)?.op;

			authCache.delete(user);

			if (success) {
				server.send(`effect clear ${user} minecraft:blindness`);
				server.send(`effect clear ${user} minecraft:slowness`);
				server.send(`gamemode ${mode} ${user}`);
				if (op) server.send(`op ${user}`);

				cacheUser?.lockRef && clearTimeout(cacheUser.lockRef);
				await authStore.set(user, { messengerId: messengerId });
			} else {
				server.send(`kick ${user} ${reason}`);
				messenger.send("private", messengerId, `Auth for ${user} ${reason}`);
			}
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

			events.once(
				"minecraft:deop",
				(ctx: { user?: string; op?: string; notop?: string }) =>
					setAuthCache(player, { op: Boolean(ctx.op) }),
			);

			const lockUser = (ctx: any) => {
				const data = parse(ctx.data) as any;

				if (data.user != player) return;
				else events.off("minecraft:data", lockUser);

				lock(player, storeUser);

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
			};

			events.on("minecraft:data", lockUser);
		});

		events.on("minecraft:leave", async (ctx: { user: string }) => {
			const cacheUser = authCache.get(ctx.user);

			if (!cacheUser) return;
			if (cacheUser.hasTimedOut) return;

			const storeUser = await authStore.get(ctx.user);

			await authStore.set(ctx.user, {
				messengerId: storeUser?.messengerId,
				gameMode: storeUser?.gameMode || cacheUser.gameMode,
				op: storeUser?.op || cacheUser.op,
			});

			cacheUser.lockRef && clearTimeout(cacheUser.lockRef);

			authCache.delete(ctx.user);
		});

		messenger.on("link", async (ctx: CtxBase) => {
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

			// cannot be undefined since it's literally matched from authCache above
			const cacheUser = authCache.get(match)!;

			// auth has timed out; user will be kicked shortly
			if (cacheUser.hasTimedOut) return;
			cacheUser.hasSentAuth = true;

			await clearLock(match, fromId, { success: true });

			messenger.send(ctx.from.type, fromId, "Link successful!");
		});

		messenger.on("unlink", async (ctx: CtxBase) => {
			const fromId = ctx.from.id;
			const sourceId = ctx.from.source;
			const username = ctx.from.name;

			const existingUser = await authStore.find(
				record => record?.messengerId == fromId,
			);

			if (!existingUser)
				return messenger.send(
					ctx.from.type,
					sourceId,
					"You can't unlink if you never linked.",
				);

			await authStore.remove(existingUser[0]);

			/*
				Kick the player in case they're still logged in.
				We could check if the player is online, but this
				action is fairly lightweight and harmless, so just
				doing it regardless wouldn't hurt.
			*/
			server.send(`kick ${existingUser[0]}`);

			return messenger.send(
				ctx.from.type,
				sourceId,
				`Successfully unlinked ${username} from \`${existingUser[0]}\``,
			);
		});

		messenger.on("auth", async (ctx: CtxBase) => {
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

			// auth has timed out; user will be kicked shortly
			if (cacheUser.hasTimedOut) return;
			cacheUser.hasSentAuth = true;

			await clearLock(mcName, record.messengerId, { success: true });

			return messenger.send(
				ctx.from.type,
				sourceId,
				"You have successfully authenticated yourself.",
			);
		});

		events.on("core:close", () => {
			// cleanup
			authStore.close();
		});
	},
});

export default auth;
