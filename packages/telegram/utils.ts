import { ChatComponent } from "../types/types/Minecraft.ts";

export type { ChatComponent };

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
		source?: "self" | "minecraft";
	};
	cmd: string;
	value: string;
} & (
	| {
			source: "self";
			from: { name: string; username: string; id: number; source: number };
	  }
	| { source: "minecraft"; from: { name: string } }
);

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

	message: (message: {
		source: "self" | "minecraft";
		text: string | ChatComponent[];
		from: { name: string };
		replyTo: {
			from: string;
			text: string | ChatComponent[];
			source: "self" | "minecraft";
		};
	}): ChatComponent[] => [
		...MCChat.sender(
			message.from.name,
			message.source === "self",
			message.replyTo &&
				MCChat.hoverUser(
					"Reply",
					message.replyTo.from,
					message.replyTo.text,
					message.replyTo.source === "self",
				),
		),
		...MCChat.text(message.text),
	],
};
