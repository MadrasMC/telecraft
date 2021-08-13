import type { Readable, Writable } from "stream";

export type IO = {
	stdin: Readable;
	stdout: Writable;
	stderr: Writable;
};
