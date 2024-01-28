export type ChatComponent =
	| {
			text: string;
			bold?: boolean;
			italic?: boolean;
			underlined?: boolean;
			strikethrough?: boolean;
			obfuscated?: boolean;
			color?:
				| "black"
				| "dark_blue"
				| "dark_green"
				| "dark_aqua"
				| "dark_red"
				| "dark_purple"
				| "gold"
				| "gray"
				| "dark_gray"
				| "blue"
				| "green"
				| "aqua"
				| "red"
				| "light_purple"
				| "yellow"
				| "white"
				| "reset";
			insertion?: string;
			clickEvent?: {
				action: "open_url" | "run_command" | "suggest_command" | "change_page";
				value: string;
			};
			hoverEvent?: {
				action: "show_text" | "show_item" | "show_entity";
				value: ChatComponent[];
			};
	  }
	| string;
