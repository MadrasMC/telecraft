export type Command = {
	name: string;
	args: [arg: string, description: string, required?: boolean][];
	description: string;
};

export const commands: Command[] = [
	{
		name: "open",
		args: [["name", "store name/path", true]],
		description: "open a telecraft store",
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
			["value", "value to be set", true],
		],
		description: "set value for given key in the store",
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
