import { Plugin } from "@telecraft/types";

const pkg = require("../package.json") as { name: string; version: string };

const rand = () => Math.floor(100 + Math.random() * 900);

const sleep = (t: number) => new Promise(r => setTimeout(r, t));

const primordial = "Alex"; // or "Steve"

// meeting point where Primordial Alex will spawn
const meeting = [0, 64, 0].join(" ");

const newSpawn = [0, 64, 0].join(" ");

const members = [
	"MKRhere",
	"Sparkenstein",
	"zappymussel380",
	"icodelife",
	"solooo7",
	"uditkarode",
	"Sitischu",
	"avestura",
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
			server.send(["title", target, "title", title].join(" "));
			if (subtitle) server.send(["title", target, "subtitle", title].join(" "));
		};

		type StoreUser = {
			userId?: string;
			migrated?: boolean;
		};

		const getPos = async (player: string) => {
			server.send(["data get entity", player, "Pos"].join(" "));

			return new Promise(resolve => {
				function dataParser(ctx: any) {
					if (ctx.user === player) {
						resolve(posParser(ctx.data));
						events.off("minecraft:data", dataParser);
					}
				}

				events.on("minecraft:data", dataParser);
			});
		};

		const calamityStore = await store<StoreUser>();

		let primordialArrived = false;

		server.input(async (line, cancel) => {
			// trigger primordial
			if (line.trim() === "primordial") {
				cancel();

				// Alex has already arrived
				if (primordialArrived) return;

				// give her 5 seconds to prepare
				cue(primordial, "Prepare to start in 5 seconds");
				await sleep(5000);

				// teleport Alex to everyone else
				server.send(["tp", primordial, meeting].join(" "));

				primordialArrived = true;
			}

			// wait for Alex's dialogue to end, then trigger startcalamity manually
			if (line.trim() === "startcalamity") {
				cancel();

				// Alex has to have delivered her speech already
				if (!primordialArrived) return;

				// start thunderstorm
				server.send("weather thunder 1000000000");

				// cue Alex to leave, the moment thunderstorm starts
				cue(primordial, "Exit the game!");

				// give everyone particle effects every 1.5 + random milliseconds
				const timers = members.map(member => ({
					member,
					timer: setInterval(() => {
						setTimeout(
							async () =>
								server.send(
									[
										"particle minecraft:portal",
										await getPos(member),
										"5 5 5 0.25 2000",
									].join(" "),
								),
							rand(),
						);
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
