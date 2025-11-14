import type { Plugin, Messenger } from "../types/index.ts";

import { type Channel, Client, ChannelType, TextChannel } from "discord.js";
import { EventEmitter } from "node:events";
import { MCChat, escapeHTML, code, isCommand, parseCommand } from "./utils.ts";
import { version } from "../version.ts";
const pkg = { name: "discord", version } as const;

const createError = (...str: string[]) =>
	new Error(`[${pkg.name}@${pkg.version}] ` + str.join(" "));

const isGuildTextChannel = (channel: Channel): channel is TextChannel =>
	channel.type === ChannelType.GuildText;

type Opts = {
	enable: boolean;
	token: string;
	channelId: string;
};

type messenger = Messenger<string | number>;

const Discord: Plugin<Opts, [], messenger["exports"]> = opts => {
	const client = new Client({ intents: "GuildMessages" });
	const ev = new EventEmitter();

	const on = ev.on.bind(ev);
	const off = ev.off.bind(ev);
	const once = ev.off.bind(ev);
	const emit: messenger["emit"] = ev.emit.bind(ev);

	const discord: messenger["exports"] = {
		async send(type, channelId, msg) {
			if (type === "private")
				throw new Error("Cannot send private messages to Discord yet.");
			if (typeof channelId !== "string")
				throw new Error("Discord channel ID cannot be number.");
			const channel = client.channels.cache.get(channelId);
			if (!channel?.isSendable()) return;
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
		start: async ({ events, server, console }) => {
			if (!opts.enable) return;

			client.login(opts.token);

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
		},
	};
};

export default Discord;
