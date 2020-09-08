import { Store } from "@telecraft/types";

import fs from "fs";
import path from "path";

import levelup from "levelup";
import leveldown from "leveldown";

const StoreProvider = (location: string) => {
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
						.catch(() => null),
				set: (key, value) =>
					store
						// stringify to JSON before writing
						.put(key, Buffer.from(JSON.stringify(value), "utf-8"))
						.then(() => value),
				remove: key => store.del(key),
				clear: () => store.clear(),
				close: () => store.close(),
			};
		};
	};
};

export default StoreProvider;
