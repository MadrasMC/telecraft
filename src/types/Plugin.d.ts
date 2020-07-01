import { Events } from "./Events";
import { Store } from "./Store";
import { Server } from "./Server";

export type TelecraftPlugin = {
	name: string;
	plugin: (config: any, events: Events, store: Store, server: Server) => void;
};
