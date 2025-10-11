export type JSONable = string | number | boolean | any[] | object | null;

export type Store<V extends JSONable> = {
	get: (key: string) => Promise<V | null>;
	set: <Value extends V>(key: string, value: Value) => Promise<Value>;
	find: (query: (value: V) => boolean) => Promise<[string, V] | null>;
	list: () => AsyncIterableIterator<[string, V]>;
	remove: (key: string) => Promise<void>;
	close: () => Promise<void>;
};

export type CreateStore = <V extends JSONable>() => Promise<Store<V>>;
