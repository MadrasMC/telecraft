import { Parser } from "./types/Parser";
import { Store } from "./types/Store";
import { TelecraftPlugin } from "./types/Plugin";
import { Server } from "./types/Server";

import { spawn } from "child_process";
import { createInterface } from "readline";

import Event from "./util/Event";

type Ctx = {
	config: any;
	parser: Parser;
	store: Store;
	plugins: TelecraftPlugin[];
};

type Reader = Parameters<Server["read"]>[0];

export default ({ config, parser, store, plugins }: Ctx) => {
	const launch = config.server.launch;

	const serverProcess = spawn(launch);

	const readers: Reader[] = [];

	const rl = createInterface({ input: serverProcess.stdout });

	// Create plugin dependencies

	const events = Event();

	const server: Server = {
		send: (msg: string) => {
			serverProcess.stdin.write(msg + "\n");
		},
		read: (reader: (line: string) => void) => {
			readers.push(reader);
		},
	};

	// setup events

	const streamParser = parser(server, events.emit);

	rl.on("line", line => {
		streamParser(line);

		readers.forEach(reader => reader(line));
	});

	// register plugins

	plugins.forEach(plugin => {
		plugin.plugin(config, events, store, server);
	});

	plugins.forEach(plugin => {
		events.emit(["@telecraft/core", "plugin-loaded"], { name: plugin.name });
	});
};
