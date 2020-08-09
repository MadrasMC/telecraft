type Listener = (ctx: any) => void;

export type Events = {
	on: (event: string, listener: Listener) => Events;
	off: (event: string, listener: Listener) => Events;
	once: (event: string, listener: Listener) => Events;
	emit: (event: string, ctx: any) => Events;
};
