import Vanilla from "../vanilla";

const P1162 = {
	...Vanilla["1.16.2"],
	timestamp: function () {
		return "^\\[(?<time>\\d{2}:\\d{2}:\\d{2})";
	},
	loglevel: function () {
		return "(?<loglevel>.*?)\\]:";
	},
};

const PaperMC = {
	"1.16.2": P1162,
};

export default PaperMC;
