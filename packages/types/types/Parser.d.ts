import { Server } from "./Server";
import { Events } from "./Events";

export type Parser = (server: Server, emit: Events["emit"]) => (line: string) => void;
