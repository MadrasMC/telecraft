import { Plugin } from "@telecraft/types";

const auth: Plugin<{ token: string }> = {
	name: "telecraft-plugin",
	plugin: ({ config } = {}) => (events, store, server) => {
		// do something cool
	},
};
