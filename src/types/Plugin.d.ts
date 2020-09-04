import { Events } from "./Events";
import { Store } from "./Store";
import { Server } from "./Server";

export type Plugin<
	Opts = never,
	Deps extends any[] | [] = [],
	Exports = any
> = (
	opts: Opts,
) => {
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
