import { Plugin } from "@telecraft/types";
import Telegraf from "telegraf";
import { code } from "./utils";

const tgOpts = { parse_mode: "HTML" } as const;

const CreateError = (...str: string[]) =>
	new Error("[@telecraft/telegram-bridge] " + str.join(" "));

const TelegramBridge = (token: string) => {
	if (!token) throw CreateError("'token' was not provided");

	const bot = new Telegraf(token);

	const telegram = {
		send: (user: string, msg: string) => bot.telegram.sendMessage(user, msg),
	};

	const plugin: Plugin<{
		enable: boolean;
		chatId: string;
		allowList: boolean;
	}> = {
		name: "telecraft-plugin",
		plugin: ({ config } = {}) => (events, store, server) => {
			if (!config?.enable) return;

			const send = (msg: string) =>
				bot.telegram.sendMessage(config.chatId, msg, tgOpts);

			events.on("close", () => bot.stop());
			bot.command("chatid", ctx => ctx.reply(ctx.chat?.id?.toString()!));

			const players = {
				init: false,
				max: 0,
				list: [] as string[],
				add<T extends string>(player: T): T {
					this.list = this.list.filter(x => x !== player).concat([player]);
					return player;
				},
				remove<T extends string>(player: T): T {
					this.list = this.list.filter(x => x !== player);
					return player;
				},
			};

			if (config.allowList) {
				new Promise<[string, string, string[]]>((resolve, reject) => {
					const rejection = setTimeout(
						() => reject(new Error("/list took too long!")),
						300000,
					);

					return events.once("minecraft:playercount", count => {
						clearTimeout(rejection);
						resolve([
							count.current,
							count.max,
							count.players
								.split(/\s*,\s*/)
								.filter((l: string) => l.length > 0),
						]);
					});
				})
					.then(([, max, ps]) => {
						players.init = true;
						players.max = parseInt(max);
						players.list = ps;
					})
					.catch(e => {
						throw new Error(e);
					});

				server.send("list");

				bot.command("list", ctx =>
					players.init
						? ctx.reply(
								`Players online (` +
									`${code(players.list.length)}/${code(players.max)}):\n` +
									code(players.list.join("\n")),
								tgOpts,
						  )
						: ctx.reply("Player list not initialised."),
				);
			}

			events.on("minecraft:user", ctx =>
				send(code(ctx.user) + " " + escape(ctx.text)),
			);

			events.on("minecraft:self", ctx =>
				send(code("* " + ctx.user + " " + ctx.text)),
			);

			events.on("minecraft:say", ctx => send(code(ctx.user + ": " + ctx.text)));

			events.on("minecraft:join", ctx =>
				send(code(players.add(ctx.user) + " joined the server")),
			);

			events.on("minecraft:leave", ctx =>
				send(code(players.remove(ctx.user) + " left the server")),
			);

			events.on("minecraft:death", ctx =>
				send(code(ctx.user + " " + ctx.text)),
			);

			events.on("minecraft:advancement", ctx =>
				send(
					code(ctx.user) +
						" has made the advancement " +
						code("[" + ctx.advancement + "]"),
				),
			);

			events.on("minecraft:goal", ctx =>
				send(
					code(ctx.user) +
						" has reached the goal " +
						code("[" + ctx.goal + "]"),
				),
			);

			events.on("minecraft:challenge", ctx =>
				send(
					code(ctx.user) +
						" has completed the challenge " +
						code("[" + ctx.challenge + "]"),
				),
			);

			events.on("close", () => bot.stop());
		},
	};

	return {
		telegram,
		plugin,
	};
};

export default TelegramBridge;
