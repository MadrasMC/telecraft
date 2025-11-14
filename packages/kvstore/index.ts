import { Database } from "bun:sqlite";

import type { JSONable, CreateStore } from "../types/types/Store.ts";
import { version } from "../version.ts";
const pkg = { name: "store", version } as const;

const nativeConsole = console;

type Opts = { debug?: boolean; console?: Console };

const StoreProvider = (location: string, { debug = false, console = nativeConsole }: Opts = {}) => {
	return ((namespace: string) => {
		return async <V extends JSONable>() => {
			const db = new Database(location);

			db.prepare(
				`
				CREATE TABLE IF NOT EXISTS kv (
					key TEXT NOT NULL PRIMARY KEY,
					value TEXT NOT NULL
				) WITHOUT ROWID;
				`,
			).run();

			const prepared = {
				all: db.query(`SELECT key, value FROM kv WHERE key LIKE ? || '%'`),
				get: db.query(`SELECT value FROM kv WHERE key = ?`),
				set: db.query(`INSERT OR REPLACE INTO kv (key, value) VALUES (?, ?)`),
				del: db.query(`DELETE FROM kv WHERE key = ?`),
			};

			const ret: Awaited<ReturnType<CreateStore>> = {
				async get(keypart) {
					const key = [namespace, keypart].join(":");
					try {
						const result = prepared.get.get(key) as { value: string } | null;
						if (!result) return null;
						return JSON.parse(result.value) as V;
					} catch (e) {
						console.error(`[@telecraft/store@${pkg.version}] Error while fetching key ${key}`);
						console.error(e);
						return null;
					}
				},
				async set(keypart, value) {
					const key = [namespace, keypart].join(":");
					if (debug) console.log("Writing", { key, value });
					prepared.set.run(key, JSON.stringify(value));
					if (debug) console.debug(`[@telecraft/store@${pkg.version}] Set key ${key}`);
					return value;
				},
				async *list() {
					for (const row of prepared.all.iterate(namespace + ":")) {
						const { key, value } = row as { key: string; value: string };
						const keypart = (key as string).slice(namespace.length + 1);
						yield [keypart, JSON.parse(value as string) as V] as [string, V];
					}
				},
				async find(query) {
					for await (const [keypart, value] of ret.list()) {
						if (query(value, keypart)) return [keypart, value];
					}

					return null;
				},
				async remove(keypart) {
					const key = [namespace, keypart].join(":");
					prepared.del.run(key);
					if (debug) console.debug(`[@telecraft/store@${pkg.version}] Removed key ${key}`);
				},
				async close() {
					db.close();
				},
			};

			return ret;
		};
	}) as (name: string) => CreateStore;
};

export default StoreProvider;
