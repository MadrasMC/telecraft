import { getDeathMessages } from "./death";
import { ParserFactory } from "../util";

const V116 = {
	/* base */
	timestamp: function () {
		return "^\\[(?<time>\\d{2}:\\d{2}:\\d{2})]";
	},
	loglevel: function () {
		return "\\[(?<thread>.*?)\\/(?<loglevel>.*?)\\]:";
	},
	prefix: function () {
		return [this.timestamp(), this.loglevel(), ""].join(" ");
	},
	username: function () {
		return "[a-zA-Z0-9_]{1,16}";
	},
	text: function () {
		return "(?<text>.*)$";
	},

	/* messages */
	op: function () {
		return `(Made (?<user>${this.username()}) a server operator)|(Nothing changed. The player already is an operator)`;
	},
	deop: function () {
		return `(Made (?<user>${this.username()}) (?<op>no longer a server operator))|(?<notop>Nothing changed. The player is not an operator)`;
	},
	advancement: function () {
		return (
			"(?<user>" +
			this.username() +
			") has made the advancement \\[(?<advancement>.+)\\]$"
		);
	},
	challenge: function () {
		return (
			"(?<user>" +
			this.username() +
			") has completed the challenge \\[(?<challenge>.+)\\]$"
		);
	},
	goal: function () {
		return (
			"(?<user>" + this.username() + ") has reached the goal \\[(?<goal>.+)\\]$"
		);
	},
	data: function () {
		return (
			"(?<user>" +
			this.username() +
			"|.+?) has the following entity data: (?<data>.+)$"
		);
	},
	entity: function () {
		return "Keeping entity (?<game>\\w+):(?<mob>\\w+) that already exists with UUID (?<uuid>.+)$";
	},
	join: function () {
		return (
			"(?<user>" +
			this.username() +
			") (\\(formerly known as " +
			this.username() +
			"\\) )?joined the game$"
		);
	},
	leave: function () {
		return "(?<user>" + this.username() + ") left the game$";
	},
	playersonline: function () {
		return (
			"(?<players>(" +
			this.username() +
			")?(\\s*,\\s*(" +
			this.username() +
			"))*)$"
		);
	},
	playercount: function () {
		return (
			"There are (?<current>\\d+) of a max (of )?(?<max>\\d+) players online: " +
			this.playersonline()
		);
	},
	say: function () {
		return "\\[(?<user>" + this.username() + ")\\] " + this.text();
	},
	self: function () {
		return "\\* (?<user>" + this.username() + ") " + this.text();
	},
	message: function () {
		return "(?:\[Not Secure\] )?<(?<user>" + this.username() + ")> " + this.text();
	},
	started: function () {
		return 'Done \\((?<ms>\\d+(\\.\\d+)?)s\\)! For help, type "help"';
	},
	// moved down so the all the other parsers can be tried first before the expensive death parser
	death: function () {
		/* extend or replace via parser extender */
		return getDeathMessages.call(this);
	},
};

export const Vanilla = {
	"1.16": ParserFactory(V116),
	"1.17": ParserFactory(V116),
	"1.18": ParserFactory(V116),
	"1.19": ParserFactory(V116),
};
