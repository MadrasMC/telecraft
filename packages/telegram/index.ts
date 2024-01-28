import { Plugin, Messenger } from "../types/index.ts";

import { EventEmitter } from "node:events";

// Telegraf
import { Telegraf, Context } from "npm:telegraf";
import { message } from "npm:telegraf/filters";
import type { Convenience, Update, Message } from "npm:telegraf/types";
// --

import {
	code,
	MCChat,
	ChatComponent,
	escapeHTML,
	deunionise,
	isCommand,
	parseCommand,
} from "./utils.ts";
import { version } from "../version.ts";
const pkg = { name: "telegram", version } as const;

const tgOpts = { parse_mode: "HTML" } as const;

const createError = (...str: string[]) =>
	new Error(`[${pkg.name}@${pkg.version}] ` + str.join(" "));

type Opts = {
	/** Enable the plugin */
	enable: boolean;
	/** Telegram Bot Token */
	token: string;
	/** Telegram Chat ID */
	chatId: string | number;
	/** Telegraf Options */
	// Todo(mkr): Telegraf.Options after 4.0.1
	telegraf?: any;
};

type messenger = Messenger<string | number>;

type Month =
	| "January"
	| "February"
	| "March"
	| "April"
	| "May"
	| "June"
	| "July"
	| "August"
	| "September"
	| "October"
	| "November"
	| "December";

const seasonMap = {
	January: "winter",
	February: "winter",
	March: "spring",
	April: "spring",
	May: "spring",
	June: "summer",
	July: "summer",
	August: "summer",
	September: "autumn",
	October: "autumn",
	November: "autumn",
	December: "winter",
} as const;

const seasonEmoji = {
	winter: "❄️",
	spring: "🌸",
	summer: "☀️",
	autumn: "🍂",
};

const timeToEmoji = (hours: number) => {
	if (hours < 5) return "🌌";
	if (hours < 10) return "🌄";
	if (hours < 14) return "🌅";
	if (hours < 17) return "🏙";
	if (hours < 20) return "🌇";
	if (hours > 23) return "🌌";
	else return "🌃";
};

const Telegram: Plugin<Opts, [], messenger["exports"]> = opts => {
	if (!opts.token) throw createError("'token' was not provided");

	const bot = new Telegraf(opts.token, opts.telegraf);
	const botID = opts.token.split(":")[0];

	const ev = new EventEmitter();

	const on = ev.on.bind(ev);
	const off = ev.off.bind(ev);
	const once = ev.off.bind(ev);
	const emit: messenger["emit"] = ev.emit.bind(ev);

	const telegram = {
		async send(type: "private" | "chat", user: string | number, msg: string) {
			await bot.telegram.sendMessage(user, msg, tgOpts);
		},
		on,
		once,
		off,
		cmdPrefix: "/",
	};

	return {
		name: pkg.name,
		version: pkg.version,
		exports: telegram,
		start: ({ events, store, server, console }) => {
			if (!opts?.enable) return;

			const send = (msg: string) => telegram.send("chat", opts.chatId, msg);

			bot.command("chatid", ctx => ctx.reply(ctx.chat?.id?.toString()!));

			let mode: "minecraft" | "vintagestory" | undefined = undefined;

			let wasAnnoyed = false;

			bot.command("list", ctx => {
				if (!mode && !wasAnnoyed) {
					wasAnnoyed = true;
					return ctx.reply("Server is starting.");
				}
				if (mode === "minecraft") return server.send("/list");
				else if (mode === "vintagestory") return server.send("/list c");
				throw new Error("Unknown server mode: " + mode);
			});

			bot.command("time", ctx => {
				if (!mode && !wasAnnoyed) {
					wasAnnoyed = true;
					return ctx.reply("Server is starting.");
				}
				if (mode === "minecraft") return server.send("/time query daytime");
				else if (mode === "vintagestory") return server.send("/time");
				throw new Error("Unknown server mode: " + mode);
			});

			events.on("vs:started", ctx => {
				mode = "vintagestory";
			});

			events.on("vs:join", ctx => {
				send(code(ctx.player + " joined the server"));
			});

			events.on("vs:leave", ctx => send(code(ctx.player + " left the server")));

			events.on("vs:message", ctx => {
				send(code(ctx.player) + " " + escapeHTML(ctx.text));
			});

			events.on(
				"vs:time",
				(ctx: {
					worldtime: {
						date: number;
						month: Month;
						year: number;
						hours: number;
						minutes: number;
					};
				}) => {
					const { date, month, year, hours, minutes } = ctx.worldtime;
					const time = `${hours}:${minutes} on ${month} ${date} of year ${year}`;
					const timeEmoji = timeToEmoji(hours);
					const season = seasonMap[month];
					const seasonMoji = seasonEmoji[season];
					return send(
						`${timeEmoji} ${time}.\n${seasonMoji} It's ${season} in the north.`,
					);
				},
			);

			events.on("vs:list", (ctx: { players: string[] }) => {
				send(
					`Players online (<code>${ctx.players.length}</code>):\n${ctx.players
						.map(x => "<code>" + x + "</code>")
						.join("\n")}`,
				);
			});

			events.on("minecraft:started", ctx => {
				mode = "minecraft";
			});

			events.on("minecraft:message", ctx => {
				send(code(ctx.user) + " " + escapeHTML(ctx.text));
			});

			events.on("minecraft:self", ctx =>
				send(code("* " + ctx.user + " " + ctx.text)),
			);

			events.on("minecraft:say", ctx =>
				send(code(ctx.user + " says: " + ctx.text)),
			);

			events.on("minecraft:join", ctx => {
				send(code(ctx.user + " joined the server"));
			});

			events.on("minecraft:leave", ctx =>
				send(code(ctx.user + " left the server")),
			);

			events.on("minecraft:list", (ctx: { players: string[] }) => {
				send(
					`Players online (<code>${ctx.players.length}</code>):\n${ctx.players
						.map(x => "<code>" + x + "</code>")
						.join("\n")}`,
				);
			});

			events.on("minecraft:death", ctx => send(code(ctx.text)));

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

			const captionMedia = (
				name: string,
				msg: Message | undefined,
			): ChatComponent[] => {
				const coloured: ChatComponent[] = [
					{ text: "[", color: "white" },
					{ text: name, color: "gray" },
					{ text: "]", color: "white" },
				];

				return msg && "caption" in msg
					? coloured.concat(MCChat.text(msg?.caption || ""))
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

			const isSelf = (ctx?: { from?: { id: number } }) =>
				String(ctx?.from?.id) === botID;

			const getSender = (ctx: Context<Update.MessageUpdate>) =>
				isSelf(ctx)
					? extractMinecraftUsername(
							ctx.message && "text" in ctx.message ? ctx.message.text : "",
					  )
					: getTelegramName(ctx.message);

			const handledTypes: Convenience.MessageSubType[] = [
				"voice",
				"video_note",
				"video",
				"animation",
				"venue",
				"text",
				"successful_payment",
				"sticker",
				"photo",
				"location",
				"invoice",
				"game",
				"dice",
				"document",
				"contact",
				"audio",
				"poll",
			];

			const msgType = (msg: Message | undefined) =>
				msg && handledTypes.find(type => type in msg);

			const getCaptioned = (msg: Message | undefined) => {
				const thisType = handledTypes.find(type => msg && type in msg);
				if (thisType === "text") return msg && deunionise(msg)?.text;
				if (thisType)
					return captionMedia(thisType.split("_").join(" ").toUpperCase(), msg);
			};

			const vsmessage = (ctx: Context<Update.MessageUpdate>) => {
				const thisType = msgType(ctx.message);
				const text = "text" in ctx.message ? ctx.message.text : `[${thisType}]`;
				const from = ctx.from.username ?? getTelegramName(ctx.message);
				return server.send(`/announce TG:${from}: ${text}`);
			};

			const handler = (
				ctx: Context<Update.MessageUpdate>,
				next: () => Promise<void>,
			) => {
				const isLinkedGroup = String(ctx.message?.chat.id) === opts.chatId;
				const isBotPM = ctx.message?.chat.type === "private";

				if (!mode) return next();
				if (mode === "vintagestory") return vsmessage(ctx);

				const messageText = getCaptioned(ctx.message) || "";
				const isMessageCommand =
					typeof messageText == "string" && isCommand(messageText);

				if (isMessageCommand) {
					// commands can be from either PM or linked group
					if (!(isLinkedGroup || isBotPM)) return next();
				} else {
					// regular texts must be from linked group
					if (!isLinkedGroup || isBotPM) return next();
					// if it's indeed from the linked group but
					// no players are online, don't relay
					// else if (players.list.length < 1) return next();
				}

				const reply = ctx.message && deunionise(ctx.message)?.reply_to_message;
				const self = isSelf(ctx);

				const fromDetails = self
					? {
							from: { name: getSender(ctx) },
							source: "minecraft" as const,
					  }
					: {
							from: {
								name: getSender(ctx),
								username: ctx.from?.username!,
								id: ctx.from?.id!,
								source: ctx.chat?.id!,
								type: isBotPM ? ("private" as const) : ("chat" as const),
							},
							source: "self" as const,
					  };

				const replyDetails = reply && {
					replyTo: {
						from:
							String(reply.from?.id) === botID
								? extractMinecraftUsername("text" in reply ? reply.text : "")
								: getTelegramName(reply),
						text:
							(isSelf(reply)
								? removeMinecraftUsername("text" in reply ? reply.text : "")
								: getCaptioned(reply)) || "",
						source: isSelf(reply) ? ("minecraft" as const) : ("self" as const),
					},
				};

				const emitCtx = Object.assign(
					{ text: messageText },
					fromDetails,
					replyDetails,
				);

				if (
					emitCtx.source === "self" &&
					typeof emitCtx.text === "string" &&
					isCommand(emitCtx.text)
				) {
					const cmd = parseCommand(emitCtx.text);
					emit(cmd.cmd, Object.assign(emitCtx, cmd));
				} else {
					const chatMessage = MCChat.message(emitCtx);

					return server.send("tellraw @a " + JSON.stringify(chatMessage));
				}
			};

			bot.on(
				handledTypes.map(type => message(type)),
				handler,
			);

			events.once("core:close", () => {
				console.log("Stopping bot...");
				bot.stop();
				console.log("Bot stopped.");
			});

			bot.catch(console.error);

			bot.launch(opts.telegraf);
		},
	};
};

export default Telegram;
