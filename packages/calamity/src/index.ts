import { Plugin } from "@telecraft/types";

const pkg = require("../package.json") as { name: string; version: string };

const sleep = (t: number) => new Promise(r => setTimeout(r, t));

// const newSpawn = [460, 136, -9608].join(" ");
const newSpawn = [-26, 95, 37].join(" ");

const posParser = (data: string) =>
	data
		.trim()
		.replace(/[\[\]d]/g, "")
		.split(", ")
		.map(x => parseFloat(x.trim()));

const calamity: Plugin<{
	enable: boolean;
}> = config => ({
	name: pkg.name,
	version: pkg.version,
	start: async ({ events, store, server }) => {
		if (!config.enable) return;

		const cue = (target: string, title: string, subtitle?: string) => {
			server.send(["title", target, "title", `"${title}"`].join(" "));
			if (subtitle)
				server.send(["title", target, "subtitle", `"${subtitle}"`].join(" "));
		};

		type StoreUser = {
			migrated?: boolean;
		};

		const getPos = async (player: string) => {
			server.send(["data get entity", player, "Pos"].join(" "));

			return new Promise<string>(resolve => {
				function dataParser(ctx: any) {
					if (ctx.user === player) {
						resolve(posParser(ctx.data).join(" "));
						events.off("minecraft:data", dataParser);
					}
				}

				events.on("minecraft:data", dataParser);
			});
		};

		const effect = async (
			player: string,
			effect: string,
			params: string = "5 5 5 0.25 2000",
		) => {
			server.send(["particle", effect, await getPos(player), params].join(" "));
		};

		const calamityStore = await store<StoreUser>();

		events.on("minecraft:join", async ctx => {
			const user: string = ctx.user;
			const u = await calamityStore.get(user);

			if (u) return;

			let interval: NodeJS.Timeout;

			const actions = [
				() => cue(user, "Prepare for migration.", "You have 5:00 minutes."),
				() => sleep(30 * 1000),
				() => cue(user, "Prepare for migration.", "You have 4:30 minutes."),
				() => sleep(30 * 1000),
				() => cue(user, "Prepare for migration.", "You have 4:00 minutes."),
				() => sleep(30 * 1000),
				() => cue(user, "Prepare for migration.", "You have 3:30 minutes."),
				() => sleep(30 * 1000),
				() => cue(user, "Prepare for migration.", "You have 3:00 minutes."),
				() => sleep(30 * 1000),
				() => cue(user, "Prepare for migration.", "You have 2:30 minutes."),
				() => sleep(30 * 1000),
				() => cue(user, "Prepare for migration.", "You have 2:00 minutes."),
				() => sleep(30 * 1000),
				() => cue(user, "Prepare for migration.", "You have 1:30 minutes."),
				() => sleep(30 * 1000),
				() => cue(user, "Prepare for migration.", "You have 1:00 minute."),
				() => sleep(30 * 1000),
				() => cue(user, "Prepare for migration.", "You have 30 seconds."),
				() => sleep(20 * 1000),
				() =>
					cue(user, "You have 10 seconds.", "Logout now if you need more time"),
				() => sleep(5 * 1000),
				() => {
					interval = setInterval(() => effect(user, "minecraft:portal"), 1000);
				},
				() => sleep(5 * 1000),
				() => cue(user, "Welcome to mkr/craft", "season 2."),
				() => clearInterval(interval),
				() => server.send(["tp", user, newSpawn].join(" ")),
				() => server.send(["spawnpoint", user, newSpawn].join(" ")),
				() => calamityStore.set(user, { migrated: true }),
			];

			let loggedOut;

			const leaveHandler = (ctx: any) => {
				if (ctx.user === user) loggedOut = true;
			};

			events.on("minecraft:leave", leaveHandler);

			for (const action of actions) {
				if (loggedOut) return events.off("minecraft:leave", leaveHandler);

				await action();
			}

			events.off("minecraft:leave", leaveHandler);
		});

		events.on("core:close", () => {
			// cleanup
			calamityStore.close();
		});
	},
});

export default calamity;
