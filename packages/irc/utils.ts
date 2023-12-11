export type MsgContext = {
	text: string | ChatComponent[];
	from: string;
	channel: string;
};

const escapables = {
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
	"'": "&#39;",
	'"': "&quot;",
};

export const escapeHTML = (s: string) =>
	s.replace(/<|>|&|"|'/g, r => escapables[r as keyof typeof escapables] || r);

const commandRegex = "^!(?<cmd>[a-zA-Z0-9_]+)";

type CommandText = `!${string}`;

export const isCommand = (s: string): s is CommandText =>
	Boolean(s.match(new RegExp(commandRegex)));

export const parseCommand = <S extends string>(
	s: S,
): typeof s extends CommandText ? { cmd: string; value: string } : null =>
	s.match(new RegExp(commandRegex + "( (?<value>.*))?"))?.groups as any;

export const code = (message: string) => `\`${message}\``;

export type ChatComponent =
	| {
			text: string;
			bold: boolean;
			color?: "blue" | "white";
	  }
	| string;

export const MCChat = {
	text: (text: string | ChatComponent[]): ChatComponent[] =>
		typeof text === "string"
			? text
					.replace(/\n/g, "\n\n ")
					.split("\n")
					.map(line => ({
						text: line,
						bold: false,
					}))
			: text,

	user: (name: string, channel: string): ChatComponent[] => [
		{ text: `DC / ${channel}`, color: "blue", bold: false },
		{ text: ": " + name, color: "white", bold: false },
	],

	sender: (name: string, channel: string): ChatComponent[] => [
		{ text: "<", bold: true },
		...MCChat.user(name, channel),
		{ text: "> ", bold: true },
	],

	message: (message: MsgContext): ChatComponent[] => [
		...MCChat.sender(message.from, message.channel),
		...MCChat.text(message.text),
	],
};
