#!/bin/env node

import { start } from "repl";
import { inspect } from "util";
import { EOL } from "os";
import { red, green, blue } from "chalk";
import Store from "@telecraft/store";
import type { Store as TelecraftStore } from "@telecraft/types";

import { commands } from "./commands";

const getCmd = (
	cmdx: string,
	rest: string[],
):
	| false
	| Error
	| {
			args: string[];
			name: string;
			description: string;
	  } => {
	const cmd = commands.find(x => x.name === cmdx);
	if (!cmd) return false;

	const required = cmd.args.filter(([, , req]) => req);
	if (required.length > rest.length) {
		const [arg, desc] = required[rest.length];
		return new Error(`${red("missing argument")} '${arg}': ${desc}`);
	}

	return { ...cmd, args: rest };
};

const dbPath = process.argv[2] || process.cwd();
const store = Store(dbPath);

type UnwrapP<P extends Promise<any>> = P extends Promise<infer X> ? X : never;

type Context = {
	store?: UnwrapP<ReturnType<TelecraftStore>> | undefined;
	mode?: string;
	asked?: [() => void, () => void];
};

const context: Context = {};

console.log(`${green("database:")} ${dbPath}` + EOL);

const r = start({
	prompt: blue("# "),
	writer: x => x,
	ignoreUndefined: true,

	completer: (line: string) => {
		const completions = commands.map(x => x.name);
		const hits = completions.filter(c => c.startsWith(line));
		// Show all completions if none found
		return [hits.length ? hits : completions, line];
	},

	eval: async (line, _, __, _callback) => {
		const callback = (str: string | Promise<string> | undefined) =>
			Promise.resolve(str).then(val => _callback(null, val + EOL));

		const [cmdx, ...rest] = line.trim().split(" ");

		if (context.asked) {
			if (["y", "yes"].includes(cmdx.toLowerCase())) {
				return context.asked[0]();
			} else {
				return context.asked[1]();
			}
		}

		const cmd = getCmd(cmdx, rest);

		if (!cmd) return callback(`${red("command not found")}: '${cmdx}'`);
		if (cmd instanceof Error) return callback(cmd.message);

		if (cmd.name === "exit") return r.close();
		if (cmd.name === "open") {
			const storeName = cmd.args[0];
			context.store = await store(storeName)();
			r.setPrompt(blue(storeName + " # "));
			return callback(`${green("'open'")}: store '${storeName}'`);
		}

		if (!context.store)
			return callback(`${red(`'${cmd.name}'`)}: no store opened`);

		switch (cmd.name) {
			case "get": {
				return callback(
					context.store
						.get(cmd.args[0])
						.then(value => inspect(value, undefined, undefined, true))
						.catch(e => `${red("'get'")}: ${e} not found`),
				);
			}

			case "set": {
				return callback(
					context.store
						.set(cmd.args[0], JSON.parse(cmd.args.slice(1).join(" ")))
						.then(() => `${green("'set'")}: ${cmd.args[0]}`)
						.catch((e: Error) => `${red("'set'")}: ${e.message}`),
				);
			}

			case "del": {
				return callback(
					context.store
						.remove(cmd.args[0])
						.then(() => `${green("'del'")}: ${cmd.args[0]}`)
						.catch((e: Error) => `${red("'del'")}: ${e.message}`),
				);
			}

			case "clear": {
				const store = context.store;

				context.asked = [
					() =>
						callback(
							store
								.clear()
								.then(() => `${green("'clear'")}: success`)
								.catch((e: Error) => `${red("'clear'")}: ${e.message}`),
						),
					() => callback("Cancelled."),
				];

				return process.stdout.write(
					"This will clear the entire store. Proceed? (y/n)",
				);
			}
		}
	},
});
