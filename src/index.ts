import { Parser, Store, Plugin, Server } from "@telecraft/types";

import { spawn } from "child_process";
import { createInterface } from "readline";

import Event from "./util/Event";

type Config = {
	launch: string;
};

type Ctx = {
	config: Config;
	parser: Parser;
	store: Store;
	plugins: { name: string; plugin: ReturnType<Plugin["plugin"]> }[];
};

type Reader = Parameters<Server["read"]>[0];

export default ({ config, parser, store, plugins }: Ctx) => {
	const launch = config.launch;

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
		plugin.plugin(events, store, server);
	});

	plugins.forEach(plugin => {
		events.emit("@telecraft/core:pluginloaded", { name: plugin.name });
	});
};
