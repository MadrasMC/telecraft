import { JSONable, Store } from "../types/types/Store.ts";

import fs from "node:fs";
import path from "node:path";

const nativeConsole = console;

type Opts = { debug?: boolean; console?: Console };

const pkg = {
	name: "store",
	version: "1.0.0-beta.5",
} as const;

const StoreProvider = (
	location: string,
	{ debug = false, console = nativeConsole }: Opts = {},
) => {
	const stat = fs.statSync(location);

	if (!stat.isDirectory()) throw new TypeError("No directory at " + location);

	fs.accessSync(location, fs.constants.R_OK | fs.constants.W_OK);

	return ((name: string) => {
		return async <V extends JSONable>() => {
			const targetPath = path.resolve(location, name);

			const store = await Deno.openKv(targetPath);

			const ret: Awaited<ReturnType<Store>> = {
				async get(key) {
					return store.get([key]).catch(e => {
						if (debug) {
							console.error(
								`[@telecraft/store@${pkg.version}] Error while fetching ${key} from store ${name}`,
							);
							console.error(e);
						}
						return null;
					});
				},
				async set(key, value) {
					return store.set([key], value).then(() => value);
				},
				async find(query) {
					for await (const item of store.list({ prefix: [] }))
						if (query(item.value as V))
							return [item.key[0] as string, item.value as V];

					return null;
				},
				async *list() {
					for await (const item of store.list({ prefix: [] }))
						yield [item.key[0] as string, item.value as V] as const;
				},
				async remove(key) {
					return store.delete([key]);
				},
				async close() {
					return store.close();
				},
			};

			return ret;
		};
	}) as (name: string) => Store;
};

export default StoreProvider;
