import { Parser, Store, Plugin, Server } from "@telecraft/types";

import { spawn } from "child_process";
import { createInterface } from "readline";
import { platform, EOL } from "os";
import { decodeStream } from "iconv-lite";

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

const rl = (stream: NodeJS.ReadableStream) => createInterface({ input: stream });

const decode = (x: NodeJS.ReadableStream) => (platform() === "win32" ? x.pipe(decodeStream("win1252")) : x);

type Reader = Parameters<Server["read"]>[0];

export default ({ config, parser, store, plugins }: Ctx) => {
	const [launch, ...options] = config.launch.split(" ");

	// @ts-ignore
	const serverProcess = spawn(launch, options, { cwd: config.cwd });

	const readers: Reader[] = [];

	const { stdin } = serverProcess;
	const stdout = decode(serverProcess.stdout);
	const stderr = decode(serverProcess.stderr);

	const minecraftOutput = rl(stdout);
	const cliInput = rl(process.stdin);

	// Create plugin dependencies

	const events = Event();

	const server: Server = {
		send: (msg: string) => {
			stdin.write(msg + EOL);
		},
		read: (reader: (line: string) => void) => {
			readers.push(reader);
		},
	};

	cliInput.on("line", server.send);

	// setup events

	const streamParser = parser(server, events.emit);

	minecraftOutput.on("line", line => {
		streamParser(line);

		readers.forEach(reader => reader(line));
	});

	// register plugins

	plugins.forEach(plugin => {
		plugin.plugin(events, store, server);
	});

	plugins.forEach(plugin => {
		events.emit("core:pluginloaded", { name: plugin.name });
	});

	process.on("uncaughtException", error => {
		console.error(error);
		console.log("ERROR! Exiting...");
		server.send("stop");
		setTimeout(() => {
			process.exit(1);
		}, 5 * 1000);
	});

	process.on("exit", () => {
		console.log("Exiting...");
		server.send("stop");
		setTimeout(() => {
			process.exit(1);
		}, 5 * 1000);
	});
};
