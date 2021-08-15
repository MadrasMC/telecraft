import { Plugin, Messenger } from "@telecraft/types";
import { CtxBase } from "@telecraft/types/types/Messenger";

import DiscordJS, {
	Intents,
	TextBasedChannels,
	Channel,
	TextChannel,
} from "discord.js";
import { EventEmitter } from "events";
import { MCChat, escapeHTML, code, isCommand, parseCommand } from "./utils";

const pkg = require("../package.json") as { name: string; version: string };

const createError = (...str: string[]) =>
	new Error(`[${pkg.name}@${pkg.version}] ` + str.join(" "));

const isGuildTextChannel = (
	channel: TextBasedChannels | Channel,
): channel is TextChannel => channel.type === "GUILD_TEXT";

type Opts = {
	enable: boolean;
	token: string;
	channelId: string;
};

type DiscordMessenger = Messenger<string, CtxBase, "chat">;

const Discord: Plugin<Opts, [], DiscordMessenger["exports"]> = opts => {
	const client = new DiscordJS.Client({
		intents: [Intents.FLAGS.GUILD_MESSAGES],
	});
	const ev = new EventEmitter();

	const on = ev.on.bind(ev);
	const off = ev.off.bind(ev);
	const once = ev.off.bind(ev);
	const emit: DiscordMessenger["emit"] = ev.emit.bind(ev);

	const discord: DiscordMessenger["exports"] = {
		async send(type: "chat", channelId: string, msg) {
			const channel = await client.channels.cache.get(channelId);
			if (!channel || !channel.isText()) return;
			channel.send(msg);
		},
		on,
		once,
		off,
		cmdPrefix: "!",
	};

	return {
		name: pkg.name,
		version: pkg.version,
		exports: discord,
		start: async ({ events, server, console }, []) => {
			if (opts.enable) {
				let playersOnline = 0;

				let channel: TextChannel;

				const send = (msg: string) => channel && channel.send(msg);

				client.on("ready", async () => {
					const chan = await client.channels.cache.get(opts.channelId);

					if (!chan || !isGuildTextChannel(chan))
						throw createError(
							"Fatal: Could not obtain requested channel, or it was not a text channel!",
						);

					channel = chan;

					console.log(`Bound to channel '${chan.name}'`);
				});

				events.on("minecraft:started", () => {
					client.on("message", message => {
						const channel = message.channel;

						if (
							// nobody online
							playersOnline < 1 ||
							// itsa me, bot
							message.author.id === client.user?.id ||
							// not the chosen one
							channel.id !== opts.channelId
						)
							return;

						if (isGuildTextChannel(channel)) {
							const messageText = message.content;

							type x = keyof number;

							const x: object = { x: "" };

							if (isCommand(messageText)) {
								const cmd = parseCommand(messageText);

								const ctx = {
									from: {
										id: message.author.id,
										source: channel.id,
										type: "chat" as const,
									},
									...cmd,
								};

								emit(cmd.cmd, ctx);
							} else {
								const chatMessage = MCChat.message({
									from: message.author.username,
									channel: channel.id,
									text: messageText,
								});

								server.send("tellraw @a " + JSON.stringify(chatMessage));
							}
						}
					});

					events.on("minecraft:message", ctx => {
						send(code(ctx.user) + " " + escapeHTML(ctx.text));
					});

					events.on("minecraft:join", ctx => {
						send(code(ctx.user + " joined the server"));
						playersOnline += 1;
					});

					events.on("minecraft:leave", ctx => {
						send(code(ctx.user + " left the server"));
						playersOnline -= 1;
					});

					events.on("minecraft:self", ctx =>
						send(code("* " + ctx.user + " " + ctx.text)),
					);

					events.on("minecraft:say", ctx =>
						send(code(ctx.user + " says: " + ctx.text)),
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
				});

				client.login(opts.token);
			}
		},
	};
};

export default Discord;
