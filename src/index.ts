import { Plugin } from "@telecraft/types";

// Get 4 random numbers
const rand = () => String(Math.ceil(Math.random() * 10000));

const gamemodes = ["survival", "creative", "adventure", "survival"];

const auth: Plugin<
	{ enable: boolean },
	{ telegram: { send: (user: string, msg: string) => void } }
> = {
	name: "telegram-auth",
	plugin: ({ config = {}, dependencies: { telegram = null } = {} } = {}) => (
		events,
		store,
		server,
	) => {
		if (!config.enable) return;
		if (!telegram)
			throw new Error(
				"[@telecraft/telegram-auth] Plugin was enabled, but dependency 'telegram' was not passed",
			);

		events.on("minecraft:join", async ctx => {
			const tgUser = await store.get(["minecraft", ctx.user, "tgUser"]);

			server.send(`data get entity ${ctx.user} playerGameType`);
			server.send(`data get entity ${ctx.user} Pos`);
			server.send(`data get entity ${ctx.user} Dimension`);
			server.send(`effect give ${ctx.user} minecraft:blindness 1000000`);
			server.send(`effect give ${ctx.user} minecraft:slowness 1000000 255`);
			server.send(`gamemode spectator ${ctx.user}`);

			if (tgUser) {
				telegram.send(tgUser, "Send /auth to authenticate yourself.");
			} else {
				server.send(`tellraw ${ctx.user} Send /link to the Telegram bot.`);
			}
		});

		events.on("telegram:link", async ctx => {
			const token = rand();
			const tgUser = ctx.user;

			await store.set(["telegram", token, "tgUser"], tgUser);
			telegram.send(tgUser, `Send !link ${token} in Minecraft chat to link.`);
		});

		events.on("minecraft:message", async ctx => {
			const [cmd, ...rest] = ctx.msg.split(" ");
			if (cmd === "!link") {
				const [token] = rest;
				const tgUser = await store.get(["telegram", token, "tgUser"]);
				if (token && tgUser) {
					await store.set(["telegram", tgUser, "user"], ctx.user);
					server.send(
						`tellraw ${ctx.user} Successfully linked with Telegram user.`,
					);
					telegram.send(
						tgUser,
						`Successfully linked with Minecraft player ${ctx.user}.`,
					);
				}
			}
		});

		events.on("telegram:auth", async ctx => {
			const tgUser = ctx.user;

			const player = await store.get(["telegram", tgUser, "user"]);

			if (!player) {
				telegram.send(
					tgUser,
					`Not linked to a Minecraft player. Send /link first.`,
				);
			}
		});
	},
};

export default auth;
