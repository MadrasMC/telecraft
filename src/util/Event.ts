import { Events } from "@telecraft/types";

type Listener = Parameters<Events["on"]>[1];

export default () => {
	const listeners: {
		[event: string]: Listener[];
	} = {};

	const populate = (event: string) => {
		if (!listeners[event]) {
			listeners[event] = [];
		}
	};

	const events: Events = {
		emit: (event, ctx) => {
			listeners[event]?.forEach(listener => listener(ctx));
			return events;
		},
		on: (event, listener) => {
			populate(event);
			listeners[event].push(listener);
			return events;
		},
		off: (event, listener) => {
			const list = listeners?.[event];
			if (list) {
				const idx = list.findIndex(listener);
				list.splice(idx, 1);
			}
			return events;
		},
		once: (event, listener) => {
			events.on(event, ctx => {
				listener(ctx); // trigger listener once and turn it off
				events.off(event, listener);
			});
			return events;
		},
	};

	return events;
};
