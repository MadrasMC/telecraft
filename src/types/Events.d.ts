type Event = string | string[];
type Listener = (ctx: any) => void;

export type Events = {
	on: (event: Event, listener: Listener) => Events;
	off: (event: Event, listener: Listener) => Events;
	once: (event: Event, listener: Listener) => Events;
	emit: (event: Event, ctx: any) => Events;
};
