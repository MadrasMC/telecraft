import { Plugin } from "@telecraft/types";
import DiscordJS from "discord.js";
import { MCChat, escapeHTML, code } from "./utils";

const pkg = require("../package.json") as { name: string; version: string };

const createError = (...str: string[]) =>
	new Error(`[${pkg.name}@${pkg.version}] ` + str.join(" "));

const Discord: Plugin<{
	enable: boolean;
	token: string;
	channelId: string;
}> = opts => {
	return {
		name: pkg.name,
		version: pkg.version,
		dependencies: [],
		exports: null,
		start: async ({ events, server, console }, []) => {
			if (opts.enable) {
				let channel: DiscordJS.Channel | undefined;
				const client = new DiscordJS.Client();
				let playersOnline = 0;

				const send = (message: string) => {
					if (!channel) return;
					channel.send(message);
				};

				client.on("ready", () => {
					channel = client.channels.cache.get(opts.channelId);
					if (!channel)
						throw createError("Could not obtain requested channel!");
					console.log(`Plugin bound to channel '${channel.name}'`);
				});

				events.on("minecraft:started", () => {
					client.on("message", message => {
						if (playersOnline > 0 && message.author.id !== client.user?.id) {
							const chatMessage = MCChat.message({
								from: message.author.username,
								text: message.content,
								channel: message.channel.name,
							});

							server.send("tellraw @a " + JSON.stringify(chatMessage));
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
