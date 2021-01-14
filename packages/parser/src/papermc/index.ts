import Vanilla from "../vanilla";

const P116 = Vanilla["1.16"].extend({
	timestamp: function () {
		return "^\\[(?<time>\\d{2}:\\d{2}:\\d{2})";
	},
	loglevel: function () {
		return "(?<loglevel>.*?)\\]:";
	},
	// Todo(mkr): verify whether vanilla join works on PaperMC
});

const PaperMC = {
	"1.16": P116,
};

export default PaperMC;
