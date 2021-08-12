export type Listener = (context: any) => void;

export type exports = {
	send: (
		type: "private" | "chat",
		identifier: string | number,
		msg: string,
	) => Promise<void>;
	on: (event: string, listener: Listener) => void;
	once: (event: string, listener: Listener) => void;
	off: (event: string, listener: Listener) => void;
	cmdPrefix: string;
};
