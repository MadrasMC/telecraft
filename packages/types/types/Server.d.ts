export type Reader = (line: string, cancel: () => void) => void;

export type Server = {
	send: (msg: string) => void;
	/** Call cancel callback from reader to stop propagation to other readers and to Telecraft parser */
	read: (reader: Reader) => void;
	/** Call cancel callback from reader to stop propagation to other readers and to Minecraft server */
	input: (reader: Reader) => void;
};
