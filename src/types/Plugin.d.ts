import { Events } from "./Events";
import { Store } from "./Store";
import { Server } from "./Server";

export type Plugin<Config = any, Dep = never> = {
	name: string;
	plugin: (configuration?: {
		config?: Config;
		dependencies?: Dep;
	}) => (events: Events, store: Store, server: Server) => void;
};
