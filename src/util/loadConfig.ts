import { readFileSync } from "fs";
import { resolve } from "path";

import ConfigParser from "./configParser";

const cwd = process.cwd();

let config;

try {
	config = readFileSync(resolve(cwd, "tcraft.config"), "utf-8");
} catch {
	config = "";
}

export default ConfigParser(config);
