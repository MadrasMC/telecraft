import { Plugin } from "@telecraft/types";

// Telegraf
import Telegraf, { Middleware } from "telegraf";
import { TelegrafContext } from "telegraf/typings/context";
import { Message, MessageSubTypes } from "telegraf/typings/telegram-types";
import {
	LaunchPollingOptions,
	LaunchWebhookOptions,
} from "telegraf/typings/telegraf";
// --

import { code, MCChat, ChatComponent } from "./utils";

const tgOpts = { parse_mode: "HTML" } as const;

const logError = (error: Error) =>
	console.error(
		"[@telecraft/telegram-bridge] ",
		[error.name, error.message].join(": "),
	);

const createError = (...str: string[]) =>
	new Error("[@telecraft/telegram-bridge] " + str.join(" "));

const TelegramBridge = (token: string) => {
	if (!token) throw createError("'token' was not provided");

	const bot = new Telegraf(token);
	const botID = token.split(":")[0];

	const telegram = {
		send: (user: string, msg: string) => bot.telegram.sendMessage(user, msg),
	};

	const plugin: Plugin<{
		enable: boolean;
		chatId: string;
		allowList: boolean;
		telegraf?: {
			polling?: LaunchPollingOptions;
			webhook?: LaunchWebhookOptions;
		};
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

						// Poll for list every 5 seconds to tolerate unexpectedly missed login/logout
						setInterval(() => server.send("list"), 5 * 60 * 1000);

						events.on("minecraft:playercount", count => {
							players.max = parseInt(count.max);
							players.list = count.players
								.split(/\s*,\s*/)
								.filter((l: string) => l.length > 0);
						});
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

			const captionMedia = (
				name: string,
				msg: Message | undefined,
			): ChatComponent[] => {
				const coloured: ChatComponent[] = [
					{ text: "[", color: "white" },
					{ text: name, color: "gray" },
					{ text: "]", color: "white" },
				];

				return msg?.caption
					? coloured.concat(MCChat.text(msg?.caption))
					: coloured;
			};

			const extractMinecraftUsername = (text: string = "") =>
				text.split(" ").slice(0, 1).join(" ");

			const removeMinecraftUsername = (text: string = "") =>
				text.split(" ").slice(1).join(" ");

			const getTelegramName = (msg?: Message) => {
				const from = msg?.from;
				return [from?.first_name, from?.last_name].filter(Boolean).join(" ");
			};

			const isFromTelegramUser = (ctx?: { from?: { id: number } }) =>
				String(ctx?.from?.id) !== botID;

			const getSender = (ctx: TelegrafContext) =>
				isFromTelegramUser(ctx)
					? getTelegramName(ctx.message)
					: extractMinecraftUsername(ctx.message?.text || "");

			const handledTypes: MessageSubTypes[] = [
				"text",
				"audio",
				"document",
				"photo",
				"sticker",
				"video",
				"voice",
				"contact",
				"location",
				"game",
				"video_note",
			];

			const handler: Middleware<TelegrafContext> = (ctx, next) => {
				const isLinkedGroup = String(ctx.message?.chat.id) === config.chatId;
				const arePlayersOnline = players.list.length > 0;
				if (!isLinkedGroup || !arePlayersOnline) return next();

				const reply = ctx.message?.reply_to_message;

				const getCaptioned = (msg: Message | undefined) => {
					const thisType = handledTypes.find(type => msg && type in msg);
					if (thisType === "text") return msg?.text;
					if (thisType)
						return captionMedia(
							thisType.split("_").join(" ").toUpperCase(),
							msg,
						);
				};

				const chatMessage = MCChat.message({
					from: getSender(ctx),
					text: getCaptioned(ctx.message) || "",
					isTelegram: isFromTelegramUser(ctx),
					...(reply && {
						replyTo: {
							from:
								String(reply.from?.id) === botID
									? extractMinecraftUsername(reply.text)
									: getTelegramName(reply),
							text:
								(isFromTelegramUser(reply)
									? getCaptioned(reply)
									: removeMinecraftUsername(reply?.text)) || "",
							isTelegram: isFromTelegramUser(reply),
						},
					}),
				});

				server.send("tellraw @a " + JSON.stringify(chatMessage));
			};

			bot.on(handledTypes, handler);

			bot.catch(logError);

			bot.launch(config.telegraf);
		},
	};

	return {
		telegram,
		plugin,
	};
};

export default TelegramBridge;
