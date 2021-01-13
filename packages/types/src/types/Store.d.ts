type JSONable = string | number | boolean | any[] | object | null;

export type Store = () => Promise<{
	get: (key: string) => Promise<JSONable | null>;
	set: <Value extends JSONable>(key: string, value: Value) => Promise<Value>;
	find: (key: string | RegExp) => Promise<[string, JSONable] | null>;
	remove: (key: string) => Promise<void>;
	clear: () => Promise<void>;
	close: () => Promise<void>;
}>;
