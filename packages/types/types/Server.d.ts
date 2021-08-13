export type Server = {
	send: (msg: string) => void;
	read: (reader: (line: string) => void) => void;
};
