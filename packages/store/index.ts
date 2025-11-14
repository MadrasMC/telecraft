import type { CreateStore, Store, JSONable } from "../types/types/Store.ts";

import fs from "node:fs";
import path from "node:path";
import { Buffer } from "node:buffer";

import levelup from "levelup";
import { default as leveldown } from "leveldown";
import { pEventIterator as iterator } from "p-event";

import { version } from "../version.ts";
const pkg = { name: "store", version } as const;

const nativeConsole = console;

type Opts = { debug?: boolean; console?: Console };

const StoreProvider = (
	location: string,
	{ debug = false, console = nativeConsole }: Opts = {},
) => {
	const stat = fs.statSync(location);

	if (!stat.isDirectory()) throw new TypeError("No directory at " + location);

	fs.accessSync(location, fs.constants.R_OK | fs.constants.W_OK);

	return (name: string): CreateStore => {
		return async <V extends JSONable>(): Promise<Store<V>> => {
			const targetPath = path.resolve(location, name);

			await fs.promises.mkdir(targetPath, { recursive: true });
			const store = levelup(leveldown(targetPath));

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
				find: query => {
					return new Promise((resolve, reject) => {
						let resolved = false;

						const listener = (data: { key: Buffer; value?: Buffer } | null) => {
							if (!data) return;
							const key = String(data.key);
							const value = data.value ? JSON.parse(String(data.value)) : null;
							if (query(value)) {
								resolve([key, value]);
								resolved = true; // ←
							}
						};

						store
							.createReadStream({ keys: true, values: true })
							.on("data", listener)
							.on("error", (err: Error) => reject(err))
							.on("close", () => !resolved && resolve(null));
					});
				},
				list: () => {
					return iterator<Record<string, [string, V][]>, "data">(
						store.createReadStream({
							keys: true,
							values: true,
							keyAsBuffer: false,
							valueAsBuffer: false,
						}),
						"data",
						{ resolutionEvents: ["close"], rejectionEvents: ["error"] },
					);
				},
				remove: key => store.del(key),
				close: () => store.close(),
			};
		};
	};
};

export default StoreProvider;
