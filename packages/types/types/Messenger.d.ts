type Listener<Context> = (context: Context) => void;

export type CtxBase<Identifier extends unknown = unknown> = {
	from: {
		id: Identifier;
		name?: string;
		source: Identifier;
		type: "private" | "chat";
	};
	cmd: string;
	value: string;
};

export type Messenger<
	Identifier extends unknown = unknown,
	Context extends CtxBase = CtxBase,
	Type extends "private" | "chat" = "private" | "chat",
> = {
	identifier: Identifier;
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
