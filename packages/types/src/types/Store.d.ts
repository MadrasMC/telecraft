type JSONable = string | number | boolean | any[] | object | null;

export type Store = <J extends JSONable>() => Promise<{
	get: (key: string) => Promise<J | null>;
	set: <Value extends J>(key: string, value: Value) => Promise<Value>;
	find: (key: string | RegExp) => Promise<[string, J] | null>;
	remove: (key: string) => Promise<void>;
	clear: () => Promise<void>;
	close: () => Promise<void>;
}>;
