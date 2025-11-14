import type { Events } from "./Events.ts";
import type { CreateStore } from "./Store.ts";
import type { Server } from "./Server.ts";

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
			store: CreateStore;
			server: Server;
			console: Console;
		},
		dep: Deps,
	) => void;
};
