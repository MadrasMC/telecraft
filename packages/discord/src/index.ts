import { Plugin } from "@telecraft/types";
import DiscordJS from 'discord.js';
import { MCChat, MsgContext } from "./utils";

const pkg = require("../package.json") as { name: string; version: string };

const createError = (...str: string[]) =>
	new Error(`[${pkg.name}@${pkg.version}] ` + str.join(" "));

const Discord: Plugin<{
	enable: boolean;
	token: string;
}> = opts => {
	return {
		name: pkg.name,
		version: pkg.version,
		dependencies: [],
		exports: null,
		start: async ({ events, server, console }, []) => {
			if(opts.enable) {
				const client = new DiscordJS.Client();
				let playersOnline = 0;

				client.on('ready', () => {
					events.on("minecraft:started", () => {
						client.on('message', message => {
							if(playersOnline > 0) {
								const chatMessage = MCChat.message({
									from: message.author.username,
									text: message.content,
									channel: message.channel.name
								});
	
								server.send("tellraw @a " + JSON.stringify(chatMessage));
							}
						});
					});

					events.on("minecraft:join", () => {
						playersOnline += 1;
					});

					events.on("minecraft:leave", () => {
						playersOnline -= 1;
					});
				});

				client.login(opts.token);
			}
		},
	};
};

export default Discord;
