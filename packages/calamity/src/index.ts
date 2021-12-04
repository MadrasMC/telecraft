import { Plugin } from "@telecraft/types";

const pkg = require("../package.json") as { name: string; version: string };

const rand = () => Math.floor(100 + Math.random() * 900);

const sleep = (t: number) => new Promise(r => setTimeout(r, t));

const primordial = "Alex"; // or "Steve"

// meeting point where Primordial Alex will spawn
// const meeting = [9046, 160, -1048].join(" ");
const meeting = [-44, 95, 24].join(" ");

// const newSpawn = [460, 136, -9608].join(" ");
const newSpawn = [-26, 95, 37].join(" ");

const members = [
	"MKRhere",
	"Sparkenstein",
	"zappymussel380",
	"icodelife",
	"solooo7",
	"uditkarode",
];

const shuffle = <X, Xs extends X[]>(xs: Xs): X[] =>
	xs
		.map(value => ({ value, sort: Math.random() }))
		.sort((a, b) => a.sort - b.sort)
		.map(({ value }) => value);

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

		let primordialArrived = false;

		let primordialEffect: NodeJS.Timeout;

		server.input(async (line, cancel) => {
			if (line.trim() === "reset") {
				cancel();

				primordialArrived = false;
				server.send("weather clear");
				if (primordialEffect) clearInterval(primordialEffect);
			}

			// trigger primordial
			if (line.trim() === "1.") {
				cancel();

				// Alex has already arrived
				if (primordialArrived) return;

				// give her 5 seconds to prepare
				cue(primordial, "Prepare to start in 5 seconds");
				await sleep(5000);

				// teleport Alex to everyone else
				server.send(["tp", primordial, meeting].join(" "));

				primordialEffect = setInterval(() => {
					effect(primordial, "minecraft:end_rod", "0.5 1 0.5 0.05 40");
				}, 1000);

				primordialArrived = true;
			}

			// wait for Alex's dialogue to end, then trigger startcalamity manually
			if (line.trim() === "2.") {
				cancel();

				// Alex has to have delivered her speech already
				if (!primordialArrived) return;

				// start thunderstorm
				server.send("weather thunder 1000000");

				// cue Alex to leave 13 seconds after thunderstorm starts
				// so she can deliver her final message
				await sleep(13000);
				if (primordialEffect) clearInterval(primordialEffect);
				cue(primordial, "Exit the game");

				// give everyone particle effects every 1.5 + random milliseconds
				const timers = members.map(member => ({
					member,
					timer: setInterval(() => {
						setTimeout(async () => effect(member, "minecraft:portal"), rand());
					}, 1500),
				}));

				// wait for 10 seconds for everyone to sufficiently panic
				await sleep(10000);

				// shuffle the member list and prepare final teleport
				shuffle<typeof timers[number], typeof timers>(timers).forEach(
					(timer, i) => {
						// let MKRhere stay until last
						if (timer.member === members[0]) return;

						setTimeout(() => {
							// teleport member to new spawn, exit scene
							server.send(["tp", timer.member, newSpawn].join(" "));

							// clear particle effects timer
							clearInterval(timer.timer);

							// change spawnpoint
							server.send(["spawnpoint", timer.member, newSpawn].join(" "));

							// save migrated members for later plugin
							calamityStore.set(timer.member, { migrated: true });

							// teleport each randomly selected member 2 seconds after previous
						}, i * 2000);
					},
				);

				setTimeout(() => {
					const timer = timers.find(timer => timer.member === members[0])!;

					// cue weather to stop
					server.send("weather clear");

					// teleport MKRhere to new spawn
					server.send(["tp", timer.member, newSpawn].join(" "));
					// clear particle effects timer
					clearInterval(timer.timer);

					// change spawnpoint
					server.send(["spawnpoint", timer.member, newSpawn].join(" "));

					// save migrated members for later plugin
					calamityStore.set(timer.member, { migrated: true });

					// wait for 10 seconds after everyone else has teleported
				}, members.length * 2000 + 10000);
			}
		});

		events.on("core:close", () => {
			// cleanup
			calamityStore.close();
		});
	},
});

export default calamity;
