import { wasCause, fallCause, otherCause } from "./death";
import { ParserFactory } from "../util";

const V1162 = {
	/* base */
	timestamp: function () {
		return "^\\[(?<time>\\d{2}:\\d{2}:\\d{2})]";
	},
	loglevel: function () {
		return "\\[(?<thread>.*?)/(?<loglevel>.*?)\\]:";
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
	deathCauses: function () {
		return [wasCause, fallCause, otherCause].join("|");
	},
	death: function () {
		return `(?<user>${this.username()})` + `(?<text>${this.deathCauses()})$`;
	},
	advancement: function () {
		return "(?<user>" + this.username() + ") has made the advancement \\[(?<advancement>.+)\\]$";
	},
	challenge: function () {
		return "(?<user>" + this.username() + ") has completed the challenge \\[(?<challenge>.+)\\]$";
	},
	goal: function () {
		return "(?<user>" + this.username() + ") has reached the goal \\[(?<goal>.+)\\]$";
	},
	data: function () {
		return "(?<user>" + this.username() + "|.+?) has the following entity data: (?<data>.+)$";
	},
	entity: function () {
		return "Keeping entity (?<game>\\w+):(?<mob>\\w+) that already exists with UUID (?<uuid>.+)$";
	},
	join: function () {
		return "UUID of player (?<user>" + this.username() + ") is (?<uuid>.+)$";
	},
	vjoin: function () {
		// Vanilla only
		return "(?<user>" + this.username() + ") (\\(formerly known as " + this.username() + "\\) )?joined the game$";
	},
	leave: function () {
		return "(?<user>" + this.username() + ") left the game$";
	},
	playersOnline: function () {
		return "(?<players>(" + this.username() + ")?(\\s*,\\s*(" + this.username() + "))*)$";
	},
	playerCount: function () {
		return "There are (?<current>\\d+) of a max (of )?(?<max>\\d+) players online: " + this.playersOnline();
	},
	say: function () {
		return "\\[(?<user>" + this.username() + ")\\] " + this.text();
	},
	self: function () {
		return "\\* (?<user>" + this.username() + ") " + this.text();
	},
	user: function () {
		return "<(?<user>" + this.username() + ")> " + this.text();
	},
	started: function () {
		return 'Done \\((?<ms>\\d+(\\.\\d+)?)s\\)! For help, type "help"';
	},
};

const Vanilla = {
	"1.16.2": ParserFactory(V1162),
};

export default Vanilla;
