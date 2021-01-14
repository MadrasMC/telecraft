export type MsgContext = {
	text: string | ChatComponent[],
	from: string
};

export type ChatComponent =
	| {
			text: string;
			bold: boolean;
			color?:
				| "red"
				| "white";
	  }
	| string;

export const MCChat = {
	text: (text: string | ChatComponent[]): ChatComponent[] =>
		typeof text === "string"
			? text.replace(/\n/g, "\n\n ")
					.split("\n")
					.map(line => ({
						text: line,
						bold: false,
					}))
			: text,

	user: (name: string): ChatComponent[] =>
		[
			{ text: "YT", color: "red", bold: false },
			{ text: ": " + name, color: "white", bold: false },
		],

	sender: (name: string): ChatComponent[] => [
		{ text: "<", bold: true },
		...MCChat.user(name),
		{ text: "> ", bold: true },
	],

	message: (message: MsgContext): ChatComponent[] => [
		...MCChat.sender(
			message.from
		),
		...MCChat.text(message.text),
	],
};
