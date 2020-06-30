import { TelecraftPlugin } from "../types/Plugin";

// Get 4 random numbers
const rand = () => String(Math.ceil(Math.random() * 10000));

const gamemodes = ["survival", "creative", "adventure", "survival"];

const auth: TelecraftPlugin = {
	name: "telegram-auth",
	plugin: (config, events, store, io) => {
		if (!config.enable) return;

		events.on(["minecraft", "join"], async ctx => {
			const tgUser = await store.get(["minecraft", ctx.user, "tgUser"]);

			io.stdin.write(`data get entity ${ctx.user} playerGameType`);
			io.stdin.write(`data get entity ${ctx.user} Pos`);
			io.stdin.write(`data get entity ${ctx.user} Dimension`);
			io.stdin.write(`effect give ${ctx.user} minecraft:blindness 1000000`);
			io.stdin.write(`effect give ${ctx.user} minecraft:slowness 1000000 255`);
			io.stdin.write(`gamemode spectator ${ctx.user}`);

			if (tgUser) {
				events.emit(["tg", "send"], { user: tgUser, msg: "Send /auth to authenticate yourself." });
			} else {
				io.stdin.write(`tellraw ${ctx.user} Send /link to the Telegram bot.`);
			}
		});

		events.on(["telegram", "link"], async ctx => {
			const token = rand();
			const tgUser = ctx.user;

			await store.set(["telegram", token, "tgUser"], tgUser);
			events.emit(["telegram", "send"], { user: tgUser, msg: `Send !link ${token} in Minecraft chat to link.` });
		});

		events.on(["minecraft", "message"], async ctx => {
			const [cmd, ...rest] = ctx.msg.split(" ");
			if (cmd === "!link") {
				const [token] = rest;
				const tgUser = await store.get(["telegram", token, "tgUser"]);
				if (token && tgUser) {
					await store.set(["telegram", tgUser, "user"], ctx.user);
					io.stdin.write(`tellraw ${ctx.user} Successfully linked with Telegram user.`);
					events.emit(["telegram", "send"], {
						user: tgUser,
						msg: `Successfully linked with Minecraft player ${ctx.user}.`,
					});
				}
			}
		});

		events.on(["telegram", "auth"], async ctx => {
			const tgUser = ctx.user;

			const player = await store.get(["telegram", tgUser, "user"]);

			if (!player) {
				events.emit(["telegram", "send"], { user: tgUser, msg: `Not linked to a Minecraft player. Send /link first.` });
			}
		});
	},
};
