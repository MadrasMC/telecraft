import core from "../core/index.ts";
import { Vanilla } from "../parser/vanilla/index.ts";
import Telegram from "../telegram/index.ts";
import Auth from "../auth/index.ts";
import StoreProvider from "../store/index.ts";

import { telegram, launch, storePath } from "./config.example.ts";

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
		Auth({ enable: true, use: "@telecraft/telegram", timeout: 40 * 1000 }),
	],
});
