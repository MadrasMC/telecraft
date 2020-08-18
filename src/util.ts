import { Parser } from "@telecraft/types";

export type ParseGroup = { [k: string]: () => string };
export type ExtendParser<P extends ParseGroup> = <NP extends ParseGroup>(
	newParseGroup: NP,
) => MappedId<P & NP>;
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
		boundParseGroup[bit] = (line: string) =>
			new RegExp(parseGroup[bit]()).exec(line);
	}

	const Parser: Parser = (server, emit) => line => {
		for (const type in boundParseGroup) {
			const result = boundParseGroup[type](line);
			if (result) emit("minecraft:" + type, result.groups);
		}
	};

	const extend: ExtendParser<P> = newParseGroup => ({
		...parseGroup,
		...newParseGroup,
	});

	return Object.assign(Parser, { extend });
};
