import { Plugin } from "../../types/index.d.ts";

const pkg = {
	name: "calamity",
	version: "1.0.0-beta.1",
} as const;

const sleep = (t: number) => new Promise<void>(r => setTimeout(r, t));

const newSpawn = [460, 136, -9608].join(" ");
// const newSpawn = [-26, 95, 37].join(" ");

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

			function* actions() {
				yield cue(user, "Prepare for migration.", "You have 5:00 minutes.");
				yield sleep(30 * 1000);
				yield cue(user, "Prepare for migration.", "You have 4:30 minutes.");
				yield sleep(30 * 1000);
				yield cue(user, "Prepare for migration.", "You have 4:00 minutes.");
				yield sleep(30 * 1000);
				yield cue(user, "Prepare for migration.", "You have 3:30 minutes.");
				yield sleep(30 * 1000);
				yield cue(user, "Prepare for migration.", "You have 3:00 minutes.");
				yield sleep(30 * 1000);
				yield cue(user, "Prepare for migration.", "You have 2:30 minutes.");
				yield sleep(30 * 1000);
				yield cue(user, "Prepare for migration.", "You have 2:00 minutes.");
				yield sleep(30 * 1000);
				yield cue(user, "Prepare for migration.", "You have 1:30 minutes.");
				yield sleep(30 * 1000);
				yield cue(user, "Prepare for migration.", "You have 1:00 minute.");
				yield sleep(30 * 1000);
				yield cue(user, "Prepare for migration.", "You have 30 seconds.");
				yield sleep(20 * 1000);
				yield cue(
					user,
					"You have 10 seconds.",
					"Logout now if you need more time",
				);
				yield sleep(5 * 1000);
				yield (interval = setInterval(
					() => effect(user, "minecraft:portal"),
					1000,
				));
				yield sleep(5 * 1000);
				yield cue(user, "Welcome to mkr/craft", "season 2.");
				yield clearInterval(interval);
				yield server.send(["tp", user, newSpawn].join(" "));
				yield server.send(["spawnpoint", user, newSpawn].join(" "));
				yield calamityStore.set(user, { migrated: true });
				yield effect(user, "minecraft:end_rod", "0.5 1 0.5 0.05 40");
				yield server.send(
					["playsound", "ui.toast.challenge_complete", "master", user].join(
						" ",
					),
				);
			}

			let loggedOut;

			const leaveHandler = (ctx: any) => {
				if (ctx.user === user) {
					loggedOut = true;
					clearInterval(interval);
					events.off("minecraft:leave", leaveHandler);
				}
			};

			events.on("minecraft:leave", leaveHandler);

			for (const action of actions()) {
				await action;
				if (loggedOut) return;
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
