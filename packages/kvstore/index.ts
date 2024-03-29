import { JSONable, Store } from "../types/types/Store.ts";
import { version } from "../version.ts";
const pkg = { name: "store", version } as const;

const nativeConsole = console;

type Opts = { debug?: boolean; console?: Console };

const StoreProvider = (
	location: string,
	{ debug = false, console = nativeConsole }: Opts = {},
) => {
	return ((namespace: string) => {
		return async <V extends JSONable>() => {
			const store = await Deno.openKv(location);

			const ret: Awaited<ReturnType<Store>> = {
				async get(key) {
					return store.get([namespace, key]).catch(e => {
						if (debug) {
							console.error(
								`[@telecraft/store@${pkg.version}] Error while fetching ${key} from store ${namespace}`,
							);
							console.error(e);
						}
						return null;
					});
				},
				async set(key, value) {
					return store.set([namespace, key], value).then(() => value);
				},
				async find(query) {
					for await (const item of store.list({ prefix: [namespace] }))
						if (query(item.value as V))
							return [item.key[0] as string, item.value as V];

					return null;
				},
				async *list() {
					for await (const item of store.list({ prefix: [namespace] }))
						yield [item.key[0] as string, item.value as V] as const;
				},
				async remove(key) {
					return store.delete([namespace, key]);
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
