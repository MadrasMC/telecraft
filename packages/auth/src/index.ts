import { Events, Plugin } from "@telecraft/types";

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
	on: (type: string, content: string) => void;
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
			server.send(`effect clear ${user} minecraft:blindness 1000000`);
			server.send(`effect clear ${user} minecraft:slowness 1000000 255`);
			server.send(`gamemode ${mode} ${user}`);
			if (isOp) server.send(`op ${user}`);
		};

		events.on("minecraft:join", async ctx => {
			const tgUser = await authstore.get("mc:" + ctx.user);

			server.send(`data get entity ${ctx.user}`);

			type Pos = [number, number, number];

			let playerGameType: gamemodes;
			let pos: Pos;
			let dimension: string;

			lock(ctx.user);

			const interval = setInterval(() => {
				pos &&
					server.send(
						`execute in ${dimension} run tp ${ctx.user} ${pos.join(" ")}`,
					);
			}, 400);

			console.log(ctx.user);

			events.once("minecraft:data", ctx => {
				const data = parse(ctx.data) as any;

				playerGameType = data.playerGameType;
				pos = data.Pos as Pos;
				dimension = data.Dimension;
			});

			if (typeof tgUser === "string") {
				messenger.send(tgUser, "Send /auth to authenticate yourself.");
			} else {
				server.send(`tellraw ${ctx.user} "Send /link to the Telegram bot."`);
			}
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
