import core from "@telecraft/core";
import { Vanilla } from "@telecraft/parser";
import Telegram from "@telecraft/telegram";
import Auth from "@telecraft/auth";
import StoreProvider from "@telecraft/store";

import { telegram, launch, storePath } from "./config.example";

core({
	config: {
		launch: launch.cmd,
		cwd: launch.cwd,
	},
	parser: Vanilla["1.16"],
	store: StoreProvider(storePath),
	plugins: [
		Telegram({
			token: telegram.token,
			enable: true,
			chatId: telegram.chatId,
			list: { allow: true },
		}),
		Auth({ enable: true, use: "@telecraft/telegram" }),
	],
});
