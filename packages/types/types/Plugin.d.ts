import { Events } from "./Events.d.ts";
import { Store } from "./Store.d.ts";
import { Server } from "./Server.d.ts";

export type Plugin<
	Opts = never,
	Deps extends any[] | [] = [],
	Exports = any,
> = (opts: Opts) => {
	name: string;
	version: string;
	dependencies?: string[];
	exports?: Exports;
	start: (
		props: {
			events: Events;
			store: Store;
			server: Server;
			console: Console;
		},
		dep: Deps,
	) => void;
};
