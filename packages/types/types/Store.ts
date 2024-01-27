export type JSONable = string | number | boolean | any[] | object | null;

export type Store = <V extends JSONable>() => Promise<{
	get: (key: string) => Promise<V | null>;
	set: <Value extends V>(key: string, value: Value) => Promise<Value>;
	find: (query: (value: V) => boolean) => Promise<[string, V] | null>;
	list: () => AsyncGenerator<[string, V]>;
	remove: (key: string) => Promise<void>;
	close: () => Promise<void>;
}>;
