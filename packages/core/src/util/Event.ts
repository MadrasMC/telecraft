import { EventEmitter } from "events";

export default function Event() {
	const events = new EventEmitter();
	events.setMaxListeners(20);

	(["on", "off", "once", "emit"] as const).forEach(f => {
		//@ts-ignore TypeScript unable to understand:
		events[f] = events[f].bind(events);
	});

	return events;
}
