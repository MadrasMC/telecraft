import type { Readable, Writable } from "node:stream";

export type IO = {
	stdin: Readable;
	stdout: Writable;
	stderr: Writable;
};
