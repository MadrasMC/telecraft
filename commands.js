/*
  NOTE: in the args array, you the first element must have three elements,
  where the third element is if it's required. If it's not required and
  no arguments are given, the 'arg' array in index.js will stay undefined.
  Other elements in the array should not have a third element.
*/

export const commands = [
  {
    name: "open",
    args: [
      ["location", "path to leveldb store", true],
    ],
    description: "open a leveldb database",
  },
  {
    name: "mode",
    args: [
      ["mode", "switch working mode", false],
    ],
    description:
      "fetch current mode or switch it between 'object' and 'string'",
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
    name: "get",
    args: [
      ["key", "the key to query the store for", true],
    ],
    description: "fetch the value for a key in the store",
  },
];
