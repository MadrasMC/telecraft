import https from "https";

import core from "@telecraft/core";
import { Vanilla } from "@telecraft/parser";
import Telegram from "@telecraft/telegram";
import Auth from "@telecraft/auth";
import StoreProvider from "@telecraft/store";
import YouTubeLive from "@telecraft/youtube";

import { chatId, token, videoId, apiKey } from "./config";

core({
	config: {
		launch: "/usr/bin/env java -Xmx3096M -Xms1024M -jar server.jar nogui",
		cwd: "/media/Mizu/Minecraft/mkrcraft/server",
	},
	parser: Vanilla["1.16"],
	store: StoreProvider(
		"/media/Mizu/Minecraft/mkrcraft/server/.telecraft/store",
	),
	plugins: [
		Telegram({
			token,
			enable: true,
			chatId,
			list: { allow: true },
			telegraf: {
				telegram: {
					agent: new https.Agent({
						// @ts-ignore
						family: 6,
					}),
				},
			},
		}),
		Auth({ enable: true, use: "@telecraft/telegram" }),
		YouTubeLive({
			enable: true,
			videoId,
			apiKey,
		}),
	],
});
