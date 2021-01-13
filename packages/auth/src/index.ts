import { Plugin } from "@telecraft/types";

import { parse } from "nbt-ts";

const pkg = require("../package.json") as { name: string; version: string };

const createError = (...str: string[]) =>
	new Error(`[${pkg.name}@${pkg.version}] ` + str.join(" "));

// Get 4 random numbers
const rand = () => String(Math.ceil(Math.random() * 10000));

const gamemodes = ["adventure", "survival", "creative", "spectator"] as const;
type gamemodes = typeof gamemodes[number];

// const waitForUserData = (event: Events, user: string) => {
// 	new Promise((res, rej) =>
// 		event.once("minecraft:data", ctx => {
// 			let data;
// 			try {
// 				data = parse(ctx.data);
// 			} catch {
// 				// Not the data we're expecting
// 				return waitForUserData(event, user);
// 			}

// 			// if (data.)
// 		}),
// 	);
// };

type Messenger = {
	send: (user: string, msg: string) => Promise<void>;
	on: (type: string, listener: (context: any) => void) => void;
};

type Pos = [number, number, number];

type AuthCode = {
	player: string,
	code: string
}

const authCodes = {
	list: [] as AuthCode[],
	add<T extends AuthCode>(code: T): T {
		this.list = this.list.filter(x => x.player !== code.player).concat([code]);
		return code;
	},
	find<T extends string>(code: T): AuthCode | undefined {
		const match = this.list.filter(x => x.code === code);
		if(match.length > 0) {
			this.list = this.list.filter(x => x !== match[0]);
			return match[0];
		} else {
			return undefined;
		}
	},
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
			setInterval(() => {
				server.send(
					`execute in ${dimension} run tp ${player} ${pos.join(" ")}`,
				);
			}, 400);

		events.on("minecraft:join", async ctx => {
			const tgUser = await authstore.get(ctx.user);

			server.send(`data get entity ${ctx.user}`);

			let playerGameType: gamemodes;
			let pos: Pos;
			let dimension: string;
			let lockRef: NodeJS.Timeout;

			lock(ctx.user);

			events.once("minecraft:data", ctx => {
				const data = parse(ctx.data) as any;

				playerGameType = data.playerGameType;
				pos = data.Pos as Pos;
				dimension = data.Dimension;

				lockRef = tpLock(ctx.user, dimension, pos);
			});

			if (typeof tgUser === "string") {
				messenger.send(tgUser, "Send /auth to authenticate yourself.");
			} else {
				const code: AuthCode = {
					player: ctx.user,
					code: rand()
				}

				authCodes.add(code);
				server.send(`tellraw ${ctx.user} "Send /link ${code.code} to the bridge bot."`);
			}

			const clearOnLeave = (ctx2: { user: string }) => {
				if (ctx.user === ctx2.user) {
					clearTimeout(lockRef);
					events.off("minecraft:leave", clearOnLeave);
				}
			};

			events.on("minecraft:leave", clearOnLeave);

			messenger.on("link", async ctx => {
				const chatId = ctx.chatID;

				if(ctx.value !== undefined) {
					const match = authCodes.find(ctx.value);

					if(match !== undefined) {
						await authstore.set(match.player, ctx.fromID);
						messenger.send(chatId, "Link successful!");
					} else {
						messenger.send(chatId, "Incorrect code!");
					}
				} else {
					messenger.send(chatId, "No code provided!");
				}
			});

			messenger.on("auth", async ctx => {
				const chatID = ctx.chatID;
				const mcName = await authstore.find(ctx.fromID);

				if(mcName !== undefined) {
					unlock(String(mcName), "survival");
					messenger.send(chatID, "You have successfully authenticated yourself!");
				} else {
					messenger.send(chatID, "You must link before using auth!");
				}
			});
		});

		// events.on(`${config.use}:link`, async ctx => {
		// 	const token = rand();
		// 	const tgUser = ctx.user;

		// 	await authstore.set(["telegram", token, "tgUser"], tgUser);
		// 	messenger.send(tgUser, `Send !link ${token} in Minecraft chat to link.`);
		// });

		// events.on("minecraft:message", async ctx => {
		// 	const [cmd, ...rest] = ctx.msg.split(" ");
		// 	if (cmd === "!link") {
		// 		const [token] = rest;
		// 		const tgUser = await authstore.get(["telegram", token, "tgUser"]);
		// 		if (token && tgUser) {
		// 			await authstore.set(["telegram", tgUser, "user"], ctx.user);
		// 			server.send(
		// 				`tellraw ${ctx.user} "Successfully linked with Telegram user."`,
		// 			);
		// 			messenger.send(
		// 				tgUser,
		// 				`Successfully linked with Minecraft player ${ctx.user}.`,
		// 			);
		// 		}
		// 	}
		// });

		// events.on(`${config.use}:auth`, async ctx => {
		// 	const tgUser = ctx.user;

		// 	const player = await authstore.get(["telegram", tgUser, "user"]);

		// 	if (!player) {
		// 		messenger.send(
		// 			tgUser,
		// 			`Not linked to a Minecraft player. Send /link first.`,
		// 		);
		// 	}

		// 	// unlock(ctx.user, mode);
		// });

		events.on("core:close", () => {
			// cleanup
			authstore.close();
		});
	},
});

export default auth;
