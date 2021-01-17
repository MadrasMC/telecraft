import { Plugin } from "@telecraft/types";
import DiscordJS from "discord.js";
import { EventEmitter } from "events";
import { MCChat, escapeHTML, code, isCommand, parseCommand } from "./utils";

const pkg = require("../package.json") as { name: string; version: string };

const createError = (...str: string[]) =>
	new Error(`[${pkg.name}@${pkg.version}] ` + str.join(" "));

const Discord: Plugin<{
	enable: boolean;
	token: string;
	channelId: string;
}> = opts => {
	let channel: DiscordJS.Channel | undefined;
	const ev = new EventEmitter();

	const on = ev.on.bind(ev);
	const off = ev.off.bind(ev);
	const once = ev.off.bind(ev);
	const emit = ev.emit.bind(ev);

	const discord = {
		send(msg: string) {
			if (!channel) return;
			channel.send(msg);
		},
		on: on.bind(ev),
		once: once.bind(ev),
		off: off.bind(ev),
	};

	return {
		name: pkg.name,
		version: pkg.version,
		dependencies: [],
		exports: discord,
		start: async ({ events, server, console }, []) => {
			if (opts.enable) {
				const client = new DiscordJS.Client();
				let playersOnline = 0;

				client.on("ready", () => {
					channel = client.channels.cache.get(opts.channelId);
					if (!channel)
						throw createError("Could not obtain requested channel!");
					console.log(`Plugin bound to channel '${channel.name}'`);
				});

				events.on("minecraft:started", () => {
					client.on("message", message => {
						if (playersOnline > 0 && message.author.id !== client.user?.id) {
							const messageText = message.content;

							if (isCommand(messageText)) {
								const cmd = parseCommand(messageText);
								emit(cmd.cmd, cmd);
							} else {
								const chatMessage = MCChat.message({
									from: message.author.username,
									text: messageText,
									channel: message.channel.name,
								});

								server.send("tellraw @a " + JSON.stringify(chatMessage));
							}
						}
					});

					events.on("minecraft:message", ctx => {
						discord.send(code(ctx.user) + " " + escapeHTML(ctx.text));
					});

					events.on("minecraft:join", ctx => {
						discord.send(code(ctx.user + " joined the server"));
						playersOnline += 1;
					});

					events.on("minecraft:leave", ctx => {
						discord.send(code(ctx.user + " left the server"));
						playersOnline -= 1;
					});

					events.on("minecraft:self", ctx =>
						discord.send(code("* " + ctx.user + " " + ctx.text)),
					);

					events.on("minecraft:say", ctx =>
						discord.send(code(ctx.user + " says: " + ctx.text)),
					);

					events.on("minecraft:death", ctx =>
						discord.send(code(ctx.user + " " + ctx.text)),
					);

					events.on("minecraft:advancement", ctx =>
						discord.send(
							code(ctx.user) +
								" has made the advancement " +
								code("[" + ctx.advancement + "]"),
						),
					);

					events.on("minecraft:goal", ctx =>
						discord.send(
							code(ctx.user) +
								" has reached the goal " +
								code("[" + ctx.goal + "]"),
						),
					);

					events.on("minecraft:challenge", ctx =>
						discord.send(
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
