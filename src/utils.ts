export const escape = (s: string) =>
	s
		// escape HTML entities
		.replace(/>/g, "&gt;")
		.replace(/</g, "&lt;")
		.replace(/&/g, "&amp;");

export const code = (s: string | number) => escape(`<code>${s}</code>`);
