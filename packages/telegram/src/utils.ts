const escapables = {
	"<": "&lt;",
	">": "&gt;",
	"&": "&amp;",
	"'": "&#39;",
	'"': "&quot;",
};

type UnionToIntersection<U> = (
	U extends unknown ? (k: U) => void : never
) extends (k: infer I) => void
	? I
	: never;

type Deunionise<T extends object> = T & Partial<UnionToIntersection<T>>;

export const deunionise = <T extends object>(t: T): Deunionise<T> => t;

const commandRegex = "^/(?<cmd>[a-zA-Z0-9_]+)";

type CommandText = `/${string}`;

export const isCommand = (s: string): s is CommandText =>
	Boolean(s.match(new RegExp(commandRegex)));

export const parseCommand = <S extends string>(
	s: S,
): typeof s extends CommandText ? { cmd: string; value: string } : null =>
	s.match(new RegExp(commandRegex + "( (?<value>.*))?"))?.groups as any;

export const escapeHTML = (s: string) =>
	s.replace(/<|>|&|"|'/g, r => escapables[r as keyof typeof escapables] || r);

export const code = (s: string | number) => {
	return `<code>${escapeHTML(String(s))}</code>`;
};

export type MsgContext = {
	text: string | ChatComponent[];
	replyTo?: {
		from: string;
		text: string | ChatComponent[];
		source?: "telegram" | "minecraft";
	};
} & (
	| {
			source: "telegram";
			from: { name: string; username: string; id: number; chat: number };
	  }
	| { source: "minecraft"; from: { name: string } }
);

export type ChatComponent =
	| {
			text: string;
			bold?: boolean;
			italic?: boolean;
			underlined?: boolean;
			strikethrough?: boolean;
			obfuscated?: boolean;
			color?:
				| "black"
				| "dark_blue"
				| "dark_green"
				| "dark_aqua"
				| "dark_red"
				| "dark_purple"
				| "gold"
				| "gray"
				| "dark_gray"
				| "blue"
				| "green"
				| "aqua"
				| "red"
				| "light_purple"
				| "yellow"
				| "white"
				| "reset";
			insertion?: string;
			clickEvent?: {
				action: "open_url" | "run_command" | "suggest_command" | "change_page";
				value: string;
			};
			hoverEvent?: {
				action: "show_text" | "show_item" | "show_entity";
				value: ChatComponent[];
			};
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
						color: line.trim().startsWith(">") ? "green" : "white",
					}))
			: text,

	user: (name: string, isTelegram?: boolean): ChatComponent[] =>
		isTelegram
			? [
					{ text: "TG", color: "blue" },
					{ text: ": " + name, color: "white" },
			  ]
			: [name],

	hoverUser: (
		hoverText: string,
		name: string,
		text: string | ChatComponent[],
		isTelegram?: boolean,
	): ChatComponent[] => [
		" (",
		{
			text: hoverText,
			color: "yellow",
			hoverEvent: {
				action: "show_text",
				value: [
					{ text: "<", color: "white" },
					...MCChat.user(name, isTelegram),
					{ text: "> ", color: "white" },
					...MCChat.text(text),
				],
			},
		},
		")",
	],

	sender: (name: string, isTelegram?: boolean, reply?: ChatComponent[]) => [
		"<",
		...MCChat.user(name, isTelegram || false),
		...(reply || []),
		"> ",
	],

	message: (message: MsgContext): ChatComponent[] => [
		...MCChat.sender(
			message.from.name,
			message.source === "telegram",
			message.replyTo &&
				MCChat.hoverUser(
					"Reply",
					message.replyTo.from,
					message.replyTo.text,
					message.replyTo.source === "telegram",
				),
		),
		...MCChat.text(message.text),
	],
};
