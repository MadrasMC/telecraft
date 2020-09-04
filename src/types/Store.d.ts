type JSONable = string | number | boolean | any[] | object | null;

export type Store = {
	get: (key: string) => Promise<JSONable>;
	set: <Value extends JSONable>(key: string, value: Value) => Promise<Value>;
	remove: (key: string) => Promise<void>;
	clear: () => Promise<void>;
};
