#!/bin/env node

import { start } from "node:repl";
import { inspect } from "node:util";
import { EOL } from "node:os";
import process from "node:process";

import Store from "../store/index.ts";
import type { Store as TelecraftStore } from "../types/index.ts";

import chalk from "npm:chalk";
// @deno-types="npm:@types/lodash"
import _ from "npm:lodash";

const { red, green, blue } = chalk;
const { isMatch } = _;

import { commands } from "./commands.ts";

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

const log = (str: any) => inspect(str, undefined, undefined, true);

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
						.then(value => log(value))
						.catch(e => `${red("'get'")}: ${e} not found`),
				);
			}

			case "find": {
				const jsonable = JSON.parse(cmd.args.join(" "));

				return callback(
					context.store
						.find(val =>
							typeof val === "object" && val
								? isMatch(val, jsonable)
								: val === jsonable,
						)
						.then(res =>
							res
								? `${green("'find'")}: found '${log(res)}'`
								: `${green("'find'")}: did not find results`,
						)
						.catch((e: Error) => `${red("'set'")}: ${e.message}`),
				);
			}

			case "list": {
				try {
					for await (const res of context.store.list()) {
						console.log(log(res));
					}
				} catch (e: any) {
					console.log(`${red("'list'")}: ${e.message}`);
				}

				return callback("");
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
