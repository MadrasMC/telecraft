import { Events } from "./Events";
import { Store } from "./Store";
import { Server } from "./Server";

export type Plugin<Dep = never> = {
	name: string;
	plugin: (dep: Dep) => (config: any, events: Events, store: Store, server: Server) => void;
};
