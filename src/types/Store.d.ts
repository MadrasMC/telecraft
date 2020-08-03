export type Store = {
	get: (key: string | string[]) => Promise<string | null>;
	set: <T>(key: string | string[], value: T) => Promise<T>;
};
