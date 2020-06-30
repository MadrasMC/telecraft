import { Events } from "./Events";
import { Store } from "./Store";

export type TelecraftPlugin = {
	name: string;
	plugin: (
		config: any,
		events: Events,
		store: Store,
		io: {
			stdin: NodeJS.WritableStream;
			stdout: NodeJS.ReadableStream;
		},
	) => void;
};
