import { Plugin, Messenger } from "../types/index.ts";
import { CtxBase } from "../types/types/Messenger.ts";
import { EventEmitter } from "node:events";
import { MCChat, escapeHTML, code, isCommand, parseCommand } from "./utils.ts";
// @deno-types="npm:@types/irc"
import irc from "npm:irc";

const pkg = {
	name: "irc",
	version: "1.0.0-beta.5",
} as const;

const createError = (...str: string[]) =>
	new Error(`[${pkg.name}@${pkg.version}] ` + str.join(" "));

type Opts = {
	enable: boolean;
	server: string;
	nick: string;
	channel: string;
	clientOpts?: irc.IClientOpts;
};

type IRCMessenger = Messenger<string, CtxBase, "chat">;

const IRC: Plugin<Opts, [], IRCMessenger["exports"]> = opts => {
	const client = new irc.Client(opts.server, opts.nick, {
		channels: [opts.channel],
		...opts.clientOpts,
		autoConnect: false,
	});
	const ev = new EventEmitter();

	const on = ev.on.bind(ev);
	const off = ev.off.bind(ev);
	const once = ev.off.bind(ev);
	const emit: IRCMessenger["emit"] = ev.emit.bind(ev);

	const ircMessenger: IRCMessenger["exports"] = {
		async send(type, channel: string, msg) {
			client.say(channel, msg);
		},
		on,
		once,
		off,
		cmdPrefix: "!",
	};

	return {
		name: pkg.name,
		version: pkg.version,
		exports: ircMessenger,
		start: async ({ events, server, console }, []) => {
			if (!opts.enable) return;

			let playersOnline = 0;

			const send = (msg: string) => client.say(opts.channel, msg);

			events.on("minecraft:started", () => {
				client.addListener(`message${opts.channel}`, (from, message) => {
					if (
						// nobody online
						playersOnline < 1 &&
						// itsa me, bot
						from === opts.nick
					)
						return;

					if (isCommand(message)) {
						const cmd = parseCommand(message);

						const ctx = {
							from: {
								id: from,
								source: opts.channel,
								type: "chat" as const,
							},
							...cmd,
						};

						emit(cmd.cmd, ctx);
					} else {
						const chatMessage = MCChat.message({
							from: from,
							channel: opts.channel,
							text: message,
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

			client.connect(3, () => {
				client.join(opts.channel, async () => {
					const chan = client.chans[opts.channel];

					if (!chan)
						throw createError("Fatal: Could not obtain requested channel");

					console.log(`Bound to channel '${chan.key}'`);
				});
			});
		},
	};
};

export default IRC;
