import { Server } from "./Server.d.ts";
import { Events } from "./Events.d.ts";

export type Parser = (
	server: Server,
	emit: Events["emit"],
) => (line: string) => void;
