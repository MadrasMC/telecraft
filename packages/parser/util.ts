import { Parser } from "../types/index.ts";

export type ParseGroup = { [k: string]: () => string };

export type ExtendParser<P extends ParseGroup> = <NP extends ParseGroup>(
	newParseGroup: NP,
) => ExtendableParser<MappedId<P & NP>>;

export type ExtendableParser<BaseParser extends ParseGroup> = Parser & {
	extend: ExtendParser<BaseParser>;
};

// hacky unroll unions into single interface types
export type MappedId<T> = {} & { [P in keyof T]: T[P] };

export const ParserFactory = <P extends ParseGroup>(
	parseGroup: P,
): ExtendableParser<P> => {
	const boundParseGroup = {} as {
		[k in keyof P]: (line: string) => RegExpExecArray | null;
	};

	for (const bit in parseGroup) {
		// Todo(mkr): find cleaner way to do this
		if (["timestamp", "loglevel", "prefix"].includes(bit)) continue;
		const regexp = new RegExp(parseGroup.prefix() + parseGroup[bit]());
		boundParseGroup[bit] = (line: string) => regexp.exec(line);
	}

	const Parser: Parser = (server, emit) => async line => {
		for (const type in boundParseGroup) {
			const result = boundParseGroup[type](line);
			if (result) emit("minecraft:" + type, result.groups);
		}
	};

	const extend: ExtendParser<P> = newParseGroup =>
		ParserFactory({
			...parseGroup,
			...newParseGroup,
		});

	return Object.assign(Parser, { extend });
};
