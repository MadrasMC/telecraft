import { Events, Parser, Store, IO, Server, Plugin } from "@telecraft/types";

import { spawn } from "child_process";
import { createInterface } from "readline";
import { platform, EOL } from "os";
import { PassThrough, Writable } from "stream";

import { decodeStream } from "iconv-lite";

import pkg from "../package.json";
import Event from "./util/Event";

type Config = {
	launch: string;
	cwd?: string;
};

type Ctx = {
	config: Config;
	parser: Parser;
	store: Store;
	io?: IO;
	plugins: ReturnType<Plugin<any>>[];
};

const rl = (stream: NodeJS.ReadableStream) =>
	createInterface({ input: stream });

const decode = (x: NodeJS.ReadableStream) =>
	platform() === "win32" ? x.pipe(decodeStream("win1252")) : x;

const { Console } = console;

const getConsole = (
	io: { stdout: Writable; stderr: Writable },
	mapper: (line: string) => string,
) => {
	const stdout = new PassThrough();
	rl(stdout).on("line", line => io.stdout.write(mapper(line)));

	const stderr = new PassThrough();
	rl(stderr).on("line", line => io.stderr.write(mapper(line)));

	return new Console(stdout, stderr);
};

const getEvents = (events: Events, prefix: string): Events => {
	const emit = (event: string, ...args: any[]) =>
		events.emit([prefix, event].join(":"), ...args);

	return { ...events, emit };
};

export default ({ config, parser, store, plugins = [], io = process }: Ctx) => {
	const [launch, ...options] = config.launch.split(" ");

	const corePrefix = "[" + pkg.name + "@" + pkg.version + "]";

	const console = getConsole(io, line => [corePrefix, line].join(" "));

	const minecraft = spawn(launch, options, { cwd: config.cwd });

	type Reader = Parameters<Server["read"]>[number];
	const readers: Reader[] = [];

	const { stdin } = minecraft;
	const stdout = decode(minecraft.stdout);
	const stderr = decode(minecraft.stderr);

	stdout.pipe(io.stdout);
	stderr.pipe(io.stderr);

	rl(stdout).on("line", line => console.log(line));
	rl(stderr).on("line", line => console.error(line));

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

	plugins.forEach((plugin, idx) => {
		if (!plugin.name || !plugin.version || !plugin.start) {
			throw new Error(
				`${corePrefix} plugins[${idx}] does not return name, version, or start`,
			);
		}

		const prefix = "[" + plugin.name + "@" + plugin.version + "]";

		plugin.start(
			{
				events: getEvents(events, prefix),
				store,
				server,
				console: getConsole(io, line => [prefix, line].join(" ")),
			},
			plugins
				.filter(p => plugin.dependencies?.includes(p.name))
				.map(p => p.exports) || [],
		);
	});

	plugins.forEach(plugin => {
		events.emit("[core]:pluginloaded", {
			name: plugin.name,
			version: plugin.version,
		});
	});

	let alreadyExiting = false;

	const cleanup = () => {
		console.log("Telecraft core is exiting, cleaning up before we go...");
		console.log(
			"Ctrl+C now will dangerously close, potentially losing or corrupting data!",
		);
		process.stdin.pause();
		cliInput.close();
		if (!minecraft.killed) {
			server.send("stop");
			alreadyExiting = true;
		}
		events.emit("[core]:close", {});
		events.removeAllListeners();

		process.on("SIGINT", () => process.exit(500));
	};

	process.on("uncaughtException", error => {
		console.error(error);
		console.log("ERROR! Exiting...");
		cleanup();
	});

	minecraft.once("exit", () => {
		console.log("Minecraft server exited.");
		if (alreadyExiting) console.log("Core is already exiting.");
		else cleanup();
	});

	process.once("SIGINT", cleanup);
	process.once("SIGTERM", cleanup);
};
