import { Plugin } from "../types/index.ts";
import axios from "npm:axios";

import { MCChat, MsgContext } from "./utils.ts";
import { LiveChatMessage } from "./types.ts";

const pkg = {
	name: "youtube",
	version: "1.0.0-beta.5",
} as const;

const sleep = (t: number) => new Promise(r => setTimeout(r, t));

const createError = (...str: string[]) =>
	new Error(`[${pkg.name}@${pkg.version}] ` + str.join(" "));

const YoutubeLive: Plugin<{
	enable: boolean;
	videoId: string;
	apiKey: string;
	fetchInterval?: number;
	maxResults?: number;
}> = opts => {
	return {
		name: pkg.name,
		version: pkg.version,
		dependencies: [],
		exports: null,
		start: async ({ events, server, console }, []) => {
			try {
				if (opts.enable) {
					/* fetch live chat ID from video ID */
					const liveDetails = await axios.get(
						"https://www.googleapis.com/youtube/v3/videos",
						{
							params: {
								part: "liveStreamingDetails",
								id: opts.videoId,
								key: opts.apiKey,
							},
						},
					);

					const items = liveDetails.data.items;

					if (!items || items.length != 1)
						throw createError("Cannot get live chat ID for video!");

					const liveChatId = items[0].liveStreamingDetails.activeLiveChatId;

					/* continually fetch messages and broadcast them to Minecraft */
					let stopFetching = false;
					let lastCheckedTime: number;
					let playersOnline = 0;

					const fetchMessages = async (): Promise<void> => {
						if (stopFetching) return;

						if (playersOnline > 0) {
							const messageHolder: { data: { items: LiveChatMessage[] } } =
								await axios.get(
									"https://www.googleapis.com/youtube/v3/liveChat/messages",
									{
										params: {
											maxResults: opts.maxResults || 100,
											part: "id,snippet,authorDetails",
											liveChatId,
											key: opts.apiKey,
										},
									},
								);

							console.log("Got messages", messageHolder.data.items.length);

							const messages = messageHolder.data.items;
							for (let message of messages) {
								try {
									if (message.snippet.hasDisplayContent) {
										const sender = message.authorDetails.displayName;
										const text = message.snippet.displayMessage;
										const time = new Date(
											message.snippet.publishedAt,
										).getTime();

										if (!lastCheckedTime || lastCheckedTime < time) {
											lastCheckedTime = time;
											const ytContext: MsgContext = {
												text: text,
												from: sender,
											};

											const chatMessage = MCChat.message(ytContext);
											server.send("tellraw @a " + JSON.stringify(chatMessage));
										}
									}
								} catch (e) {
									console.log("Failed to get a message");
								}
							}
						}

						await sleep(opts.fetchInterval || 2000);
						return fetchMessages();
					};

					fetchMessages();

					events.on("minecraft:started", async () => {
						events.on("minecraft:join", () => {
							playersOnline += 1;
						});

						events.on("minecraft:leave", () => {
							playersOnline -= 1;
						});

						events.on("core:close", () => {
							stopFetching = true;
						});
					});
				}
			} catch (e) {
				throw createError(String(e));
			}
		},
	};
};

export default YoutubeLive;
