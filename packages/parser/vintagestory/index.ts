/*
# join
27.1.2024 15:41:47 [Server Event] Priya13 [::ffff:127.0.0.1]:43212 joins.
--
# message
27.1.2024 15:42:15 [Server Chat] Priya13: <strong>Priya13:</strong> hiiii
--
# leave
27.1.2024 15:42:36 [Server Event] Player Priya13 left.
--
# time
28.1.2024 15:30:20 [Server Notification] Handling Console Command /time 
28.1.2024 15:30:20 [Server Notification] Server time: 1. May, Year 0, 08:00
--
# list none
28.1.2024 15:31:08 [Server Notification] Handling Console Command /list c
28.1.2024 15:31:08 [Server Notification] List of online Players

--
# list one
28.1.2024 15:31:36 [Server Notification] Handling Console Command /list c
28.1.2024 15:31:36 [Server Notification] List of online Players
[1] MKRhere [::1]:41206

--
# started
28.1.2024 15:43:12 [Server Event] Dedicated Server now running on Port 42420 and all ips!
--
*/

import { Parser } from "../../types/index.ts";

import {
	char,
	letters,
	digits,
	str,
	sequenceOf,
	choice,
	many1,
	between,
	everyCharUntil,
	endOfInput,
	anyCharExcept,
	startOfInput,
	Parser as P,
	many,
} from "npm:arcsecond";

/* base */

const space = char(" ");
const colon = char(":");
const squared = <T>(parser: P<T>) =>
	between<string, string, string>(char("["))(char("]"))(
		many1(parser).map(xs => xs.join("")),
	);

const date = sequenceOf([digits, char("."), digits, char("."), digits]).map(
	parts => parts.join(""),
);

const time = sequenceOf([digits, colon, digits, colon, digits]).map(parts =>
	parts.join(""),
);

const timestamp = sequenceOf([date, space, time]).map(([date, , time]) => ({
	date,
	time,
}));

const prefix = sequenceOf([startOfInput, timestamp, space]).map(
	([, timestamp]) => ({
		...timestamp,
	}),
);

const player = many1(choice([letters, digits, char("_")])).map(player =>
	player.join(""),
);

const rest = everyCharUntil(endOfInput);

const listPlayer = sequenceOf([
	squared(digits),
	space,
	player,
	space,
	everyCharUntil(endOfInput),
]).map(([_, __, player]) => player);

const SERVER_EVENT = str("[Server Event]");
const SERVER_CHAT = str("[Server Chat]");
const SERVER_NOTIFICATION = str("[Server Notification]");

const parts = sequenceOf([
	timestamp,
	space,
	choice([
		sequenceOf([
			SERVER_EVENT,
			space,
			player,
			space,
			squared(anyCharExcept(char("]"))),
			colon,
			digits,
			space,
			str("joins."),
			endOfInput,
		]).map(([, , player]) => ({ event: "join" as const, player })),
		sequenceOf([
			SERVER_EVENT,
			space,
			str("Player"),
			space,
			player,
			space,
			str("left."),
			endOfInput,
		]).map(([, , , , player]) => ({ event: "leave" as const, player })),
		sequenceOf([SERVER_CHAT, space, player, colon, space, rest]).map(
			([, , player, , , text]) => ({ event: "message" as const, player, text }),
		),
		sequenceOf([
			SERVER_EVENT,
			space,
			str("Dedicated Server now running on Port"),
			space,
			digits,
			space,
			str("and"),
			space,
			everyCharUntil(char("!")),
			str("!"),
			endOfInput,
		]).map(([, , , , port]) => ({
			event: "started" as const,
			port: Number(port),
		})),
		sequenceOf([
			SERVER_NOTIFICATION,
			space,
			str("Server time:"),
			space,
			everyCharUntil(char("\n")),
			str("\n"),
			str("Game Speed:"),
			space,
			rest,
			endOfInput,
		]).map(([, , , , worldtime, , , , gamespeed]) => ({
			event: "time" as const,
			worldtime,
			gamespeed,
		})),
		sequenceOf([
			SERVER_NOTIFICATION,
			space,
			str("List of online Players"),
			str("\n"),
			many(listPlayer),
			endOfInput,
		]).map(([, , , , players]) => ({ event: "list" as const, players })),
	]),
]).map(([timestamp, , event]) => ({ ...timestamp, ...event }));

const stream = Deno.openSync("./test.log", {
	create: true,
	write: true,
	truncate: true,
});
const log = (line: string) =>
	stream.writeSync(new TextEncoder().encode(line + "\n"));
// const log = console.log;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
// Get 4 random numbers
const rand = () => String(Math.floor(1000 + Math.random() * 9000));

const V119: Parser = (server, emit) => {
	let buf = "";
	let timer: number | undefined = undefined;
	let waiting = "";

	const parse = (line: string) => {
		buf = "";
		log("> " + line);
		const result = parts.run(line);
		if (!result.isError)
			return emit("vs:" + result.result.event, result.result);
	};

	return async (line: string) => {
		// clearTimeout(timer);
		const id = rand();

		if (!prefix.run(line).isError) {
			if (buf) parse(buf);
			buf = line;
		} else buf += "\n" + line;

		// timer = setTimeout(() => parse(buf), 50);

		waiting = id;
		await sleep(50);
		if (waiting === id) parse(buf);
	};
};

export const VintageStory = { "1.19": V119 };
