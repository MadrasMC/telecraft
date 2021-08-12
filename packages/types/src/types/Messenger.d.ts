type Listener<Context> = (context: Context) => void;

export type Messenger<
	Context,
	Identifier extends string | number = string | number,
	Type extends "private" | "chat" = "private" | "chat",
> = {
	listener: Listener<Context>;
	emit: (ev: string, ctx: Context) => void;
	exports: {
		send: (type: Type, identifier: Identifier, msg: string) => Promise<void>;
		on: (event: string, listener: Listener<Context>) => void;
		once: (event: string, listener: Listener<Context>) => void;
		off: (event: string, listener: Listener<Context>) => void;
		cmdPrefix: string;
	};
};
