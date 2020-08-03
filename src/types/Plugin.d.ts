import { Events } from "./Events";
import { Store } from "./Store";
import { Server } from "./Server";

export type Plugin = {
	name: string;
	plugin: (config: any, events: Events, store: Store, server: Server) => void;
};
