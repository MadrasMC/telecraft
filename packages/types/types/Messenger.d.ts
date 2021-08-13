type Listener<Context> = (context: Context) => void;

export type CtxBase = {
	from: {
		id: string | number;
		source: string | number;
		type: "private" | "chat";
	};
	cmd: string;
	value: string;
};

export type Messenger<
	Context extends CtxBase = CtxBase,
	Identifier extends string | number = string | number,
	Type extends "private" | "chat" = "private" | "chat",
> = {
	context: Context;
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
