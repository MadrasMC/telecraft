type JSONable = string | number | boolean | any[] | object | null;

export type Store = () => {
	get: (key: string) => Promise<JSONable | null>;
	set: <Value extends JSONable>(key: string, value: Value) => Promise<Value>;
	find: (key: string | RegExp) => Promise<string | null>;
	remove: (key: string) => Promise<void>;
	clear: () => Promise<void>;
	close: () => Promise<void>;
};
