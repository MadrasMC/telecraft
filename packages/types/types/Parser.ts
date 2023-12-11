import { Server } from "./Server.ts";
import { Events } from "./Events.ts";

export type Parser = (
	server: Server,
	emit: Events["emit"],
) => (line: string) => void;
