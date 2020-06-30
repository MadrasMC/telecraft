import { Parser } from "./types/Parser";
import { Store } from "./types/Store";
import { TelecraftPlugin } from "./types/Plugin";

type Ctx = {
	config: {};
	parser: Parser;
	store: Store;
	plugins: TelecraftPlugin[];
};

export default ({ config, parser, store, plugins }: Ctx) => {};
