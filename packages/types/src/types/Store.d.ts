type JSONable = string | number | boolean | any[] | object | null;

export type Store = <J extends JSONable>() => Promise<{
	get: (key: string) => Promise<J | null>;
	set: <Value extends J>(key: string, value: Value) => Promise<Value>;
	find: <V extends J | null>(
		query: (value: V) => boolean,
	) => Promise<[string, V] | null>;
	remove: (key: string) => Promise<void>;
	clear: () => Promise<void>;
	close: () => Promise<void>;
}>;
