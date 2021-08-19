export type Command = {
	name: string;
	args: [arg: string, description: string, required?: boolean][];
	description: string;
};

export const commands: Command[] = [
	{
		name: "open",
		args: [["location", "path to @telecraft/store instance", true]],
		description: "open a leveldb database",
	},
	{
		name: "get",
		args: [["key", "the key to query the store for", true]],
		description: "fetch the value for a key in the store",
	},
	{
		name: "set",
		args: [
			["key", "key to be set", true],
			["value", "value to be set"],
		],
		description:
			"fetch current mode or switch it between 'object' and 'string'",
	},
	{
		name: "del",
		args: [["key", "the key to the store entry to remove", true]],
		description: "remove a key/value pair from the store",
	},
	{
		name: "clear",
		args: [],
		description: "clear the store",
	},
];
