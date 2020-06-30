import { assoc } from ".";

const ConfigParser = (config: string) => {
	const lines = config.split("\n");
	const processed = lines
		.map(line => {
			// comment starts with #
			if (line.startsWith("#")) return [];
			const eqpos = line.indexOf("=");
			// no = in statement, ignore
			if (eqpos < 0) return [];
			else
				return [
					line.slice(0, eqpos).trim().split("."),
					line.slice(eqpos + 1).trim(),
				] as const;
		})
		.filter(x => x.length);

	const configObject = {};

	processed.forEach(([path, content]) => {
		let value;
		try {
			value = JSON.parse(content);
		} catch {
			value = content;
		}
		assoc(path, value, configObject);
	});

	return configObject;
};

export default ConfigParser;
