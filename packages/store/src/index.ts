import { Store } from "@telecraft/types";

import fs from "fs";
import path from "path";

import levelup from "levelup";
import leveldown from "leveldown";

const nativeConsole = console;

type Opts = { debug?: boolean; console?: Console };

const pkg = require("../package.json") as { version: string };

const StoreProvider = (
	location: string,
	{ debug = false, console = nativeConsole }: Opts = {},
) => {
	const stat = fs.statSync(location);

	if (!stat.isDirectory()) throw new TypeError("No directory at " + location);

	fs.accessSync(location, fs.constants.R_OK | fs.constants.W_OK);

	return (name: string): Store => {
		return () => {
			const store = levelup(leveldown(path.resolve(location, name)));

			return {
				get: key =>
					store
						.get(key)
						// parse to object before returning
						.then(value => JSON.parse(value.toString("utf-8")))
						.catch(e => {
							if (debug) {
								console.error(
									`[@telecraft/store@${pkg.version}] Error while fetching ${key} from store ${name}`,
								);
								console.error(e);
							}
							return null;
						}),
				set: (key, value) =>
					store
						// stringify to JSON before writing
						.put(key, Buffer.from(JSON.stringify(value), "utf-8"))
						.then(() => value),
				find: value => {
					return new Promise((resolve, reject) => {
						const listener = (
							data: { key?: any; value?: any } | null,
						) => {
							if (data) {
								const dataLocal = String(data.value);
								console.log(dataLocal);
								if (
									(typeof value === "string" && dataLocal.includes(value)) ||
									dataLocal.match(value)
								) {
									return resolve(String(data.key));
								}
							}
						};

						store.createReadStream({ keys: true, values: true })
							.on("data", listener)
							.on("error", () => { console.log("Fuck this") })
							.on("close", () => { console.log("It's ded") });
						// Todo(mkr): on error
						// Todo(mkr): on close/end
					});
				},
				remove: key => store.del(key),
				clear: () => store.clear(),
				close: () => store.close(),
			};
		};
	};
};

export default StoreProvider;
