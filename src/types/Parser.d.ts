export type Parser = (
	stdout: NodeJS.WritableStream,
	emit: (name: string, ctx: any) => void,
) => void;
