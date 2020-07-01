import { Events, Event, Listener } from "../types/Events";

export default () => {
	const listeners: {
		[namespace: string]: {
			[event: string]: Listener[];
		};
	} = {};

	const populate = ([namespace, event]: Event) => {
		if (!listeners[namespace]) {
			listeners[namespace] = {};
		}
		if (!listeners[namespace][event]) {
			listeners[namespace][event] = [];
		}
	};

	const events: Events = {
		emit: ([namespace, event], ctx) => {
			listeners?.[namespace]?.[event]?.forEach(listener => listener(ctx));
			return events;
		},
		on: ([namespace, event], listener) => {
			populate([namespace, event]);
			listeners[namespace][event].push(listener);
			return events;
		},
		off: ([namespace, event], listener) => {
			const list = listeners?.[namespace]?.[event];
			if (list) {
				const idx = list.findIndex(listener);
				list.splice(idx, 1);
			}
			return events;
		},
		once: ([namespace, event], listener) => {
			events.on([namespace, event], ctx => {
				listener(ctx); // trigger listener once and turn it off
				events.off([namespace, event], listener);
			});
			return events;
		},
	};

	return events;
};
