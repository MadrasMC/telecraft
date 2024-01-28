import { Parser } from "../../types/index.ts";

import { char, letters, digits, str, sequenceOf, choice, many1, between, everyCharUntil, endOfInput, anyCharExcept, startOfInput, Parser as P, many } from "npm:arcsecond";

type Month = "January" | "February" | "March" | "April" | "May" | "June" | "July" | "August" | "September" | "October" | "November" | "December";

const space = char(" ");
const colon = char(":");
const rest = everyCharUntil(endOfInput);
const squared = <T>(parser: P<T>) => between<string, string, string>(char("["))(char("]"))(many1(parser).map(xs => xs.join("")));

const date = sequenceOf([digits, char("."), digits, char("."), digits]).map(parts => parts.join(""));
const time = sequenceOf([digits, colon, digits, colon, digits]).map(parts => parts.join(""));
const timestamp = sequenceOf([date, space, time]).map(([date, , time]) => ({ date, time }));
const prefix = sequenceOf([startOfInput, timestamp, space]).map(([, timestamp]) => ({ ...timestamp }));

const player = many1(choice([letters, digits, char("_")])).map(player => player.join(""));
const listPlayer = sequenceOf([squared(digits), space, player, space, everyCharUntil(endOfInput)]).map(([_, __, player]) => player);
// 1. May, Year 0, 08:00
const worldtime = sequenceOf(
	//
	[digits, char("."), space, letters, char(","), space, str("Year"), space, digits, char(","), space, digits, colon, digits],
).map(
	// prettier-ignore
	([date ,          ,      , month  ,          ,      ,            ,      , year  ,          ,      , hours ,      , minutes]) =>
		({ date: Number(date), month: month as Month, year: Number(year), hours: Number(hours), minutes: Number(minutes) }),
);

const SERVER_EVENT = str("[Server Event]");
const SERVER_CHAT = str("[Server Chat]");
const SERVER_NOTIFICATION = str("[Server Notification]");

const parts = sequenceOf([
	timestamp,
	space,
	choice([
		// 27.1.2024 15:41:47 [Server Event] Priya13 [::ffff:127.0.0.1]:43212 joins.
		sequenceOf([SERVER_EVENT, space, player, space, squared(anyCharExcept(char("]"))), colon, digits, space, str("joins."), endOfInput])
			// JOIN event
			.map(([, , player]) => ({ event: "vs:join" as const, player })),

		// 27.1.2024 15:42:36 [Server Event] Player Priya13 left.
		sequenceOf([SERVER_EVENT, space, str("Player"), space, player, space, str("left."), endOfInput])
			// LEAVE event
			.map(([, , , , player]) => ({ event: "vs:leave" as const, player })),

		// 28.1.2024 15:43:12 [Server Event] Dedicated Server now running on Port 42420 and all ips!
		sequenceOf([SERVER_EVENT, space, str("Dedicated Server now running on Port"), space, digits, space, str("and"), space, everyCharUntil(char("!")), str("!"), endOfInput])
			// STARTED event
			.map(([, , , , port]) => ({ event: "vs:started" as const, port: Number(port) })),

		// 27.1.2024 15:42:15 [Server Chat] Priya13: <strong>Priya13:</strong> hiiii
		sequenceOf([SERVER_CHAT, space, player, colon, space, sequenceOf([str("<strong>"), player, colon, str("</strong>")]), space, rest])
			// MESSAGE event
			.map(([, , player, , , , , text]) => ({ event: "vs:message" as const, player, text })),

		// 28.1.2024 15:30:20 [Server Notification] Server time: 1. May, Year 0, 08:00
		sequenceOf([SERVER_NOTIFICATION, space, str("Server time:"), space, worldtime, str("\nGame Speed:"), space, rest, endOfInput])
			// TIME event
			.map(([, , , , worldtime, , , , gamespeed]) => ({ event: "vs:time" as const, worldtime, gamespeed })),

		// 28.1.2024 15:31:36 [Server Notification] List of online Players
		// [1] Priya13 [::1]:41206
		//
		sequenceOf([SERVER_NOTIFICATION, space, str("List of online Players"), str("\n"), many(listPlayer), endOfInput])
			// LIST event
			.map(([, , , , players]) => ({ event: "vs:list" as const, players })),
	]),
])
	//
	.map(([timestamp, , event]) => ({ ...timestamp, ...event }));

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
// Get 4 random numbers
const rand = () => String(Math.floor(1000 + Math.random() * 9000));

const V119: Parser = (server, emit) => {
	let buf = "";
	let waiting = "";

	const parse = (line: string) => {
		buf = "";
		const result = parts.run(line);
		if (!result.isError) return emit(result.result.event, result.result);
	};

	return async (line: string) => {
		const id = rand();

		if (!prefix.run(line).isError) {
			if (buf) parse(buf);
			buf = line;
		} else buf += "\n" + line;

		waiting = id;
		await sleep(50);
		if (waiting === id) parse(buf);
	};
};

export const VintageStory = { "1.19": V119 };
