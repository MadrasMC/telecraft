import core from "@telecraft/core";
import { Vanilla } from "@telecraft/parser";
import Telegram from "@telecraft/telegram";
import Auth from "@telecraft/auth";
import StoreProvider from "@telecraft/store";

const token = "";
const chatId = "";

core({
	config: {
		launch:
			"/usr/bin/env java -Xmx3096M -Xms1024M -jar /home/Library/betacraft/server.jar nogui",
		cwd: "/home/Library/betacraft",
	},
	parser: Vanilla["1.16.2"],
	store: StoreProvider("/home/Library/betacraft/.telecraft/store"),
	plugins: [
		Telegram({ token, enable: true, chatId, list: { allow: true } }),
		Auth({ enable: true, use: "@telecraft/telegram" }),
	],
});
