/**
 * Copied from https://minecraft.fandom.com/wiki/Death_messages
 */
const msgs = `
Arrows

    <player> was shot by <player/mob>
        Appears when the player is killed by an arrow shot by a player or mob using a bow or crossbow.
        When the player is killed by an arrow shot from a dispenser or summoned with /summon, the death message is <player> was shot by Arrow/Spectral Arrow.
    <player> was shot by <player/mob> using <item>
        Appears when the player is killed by an arrow shot by a player or mob using a renamed bow or crossbow.

Snowballs

    <player> was pummeled by <player/mob>
        Is coded to appear when the player is killed by a snowball, egg or ender pearl shot by a player or mob. This is practically impossible, as these projectiles do not deal damage.
            Blazes take damage from snowballs, which means that naming a blaze and killing it with snowballs will send this message to the game's log.
            Because of MC-72151, a snow golem's snowballs are able to hurt and kill wolves, after which the message would appear to the owner of the tamed wolf.
        Theoretically, when the player is killed by a snowball or egg shot from a dispenser or summoned with /summon, or an ender pearl summoned with /summon, the death message is <player> was pummeled by Snowball/Thrown Egg/Thrown Ender Pearl.
    <player> was pummeled by <player/mob> using <item>
        Is coded to appear when the player is killed by a snowball, egg or ender pearl shot by a player or mob that is holding a renamed item during the player's death. This is impossible, as these projectiles do not deal damage. However, as stated above, blazes take damage from snowballs, and snow golems can kill wolves, and if the killer in each case is holding a renamed item, this message appears instead.

Cactus

    <player> was pricked to death
        Appears when the player is killed because they were touching a cactus.
    <player> walked into a cactus whilst trying to escape <player/mob>
        Appears when the player is hurt by a player or mob then killed by touching a cactus.

Drowning

    <player> drowned
        Appears when the player runs out of air underwater and is killed from drowning damage.
        Also appears in the game's log when a named blaze, enderman, strider or snow golem takes lethal damage from being in water, and when a named cod, salmon, pufferfish, tropical fish, squid or glow squid takes lethal damage from being out of water.
    <player> drowned whilst trying to escape <player/mob>
        Appears when the player is hurt by a player or mob then dies from drowning.
        Also appears in the game's log when one of the aforementioned mobs is hurt by a player or mob then dies from drowning.

Elytra

    <player> experienced kinetic energy
        Appears when the player is killed by hitting a wall while flying with elytra on.
    <player> experienced kinetic energy whilst trying to escape <player/mob>
        Appears when the player is hurt by a player or mob then hits a wall while flying with elytra on.

Explosions

    <player> blew up
        Appears when the player is killed by TNT activated by redstone mechanisms, fire, dispensed out from a dispenser or by an end crystal.
    <player> was blown up by <player/mob>
        Appears when the player is hurt by a player or mob then killed by TNT activated by redstone mechanisms, fire, dispensed out from a dispenser or by an end crystal.
        Also appears when the player is killed by an entity that exploded, or by TNT activated by a player or mob, either by using flint and steel or a fire charge on the block or shooting it with an arrow that is on fire.
    <player> was blown up by <player/mob> using <item>
        Appears when the player is killed by an entity holding a renamed item that exploded, or by TNT activated by a player or mob holding a renamed item during the player's death.
    <player> was killed by [Intentional Game Design]
        Appears when the player is killed by a bed exploding in the Nether or the End, or by a charged respawn anchor exploding in the Overworld or the End.
        Includes a click-event link to MCPE-28723.

Falling

    <player> hit the ground too hard
        Appears when the player is killed by a less than 5 block fall, ender pearl damage, or falling while riding an entity that died due to fall damage.
    <player> hit the ground too hard whilst trying to escape <player/mob>
        Appears when the player is hurt by a player or mob then killed by either a fall from less than 5 blocks, ender pearl damage, or when riding an entity that died due to fall damage.
    <player> fell from a high place
        Appears when the player is killed by a greater than 5 block fall.
    <player> fell off a ladder
        Appears when the player is killed by falling after being on a ladder.
    <player> fell off some vines
        Appears when the player is killed by falling after being on a vine.
    <player> fell off some weeping vines
        Appears when the player is killed by falling after being on a weeping vine.
    <player> fell off some twisting vines
        Appears when the player is killed by falling after being on a twisting vine.
    <player> fell off scaffolding
        Appears when the player is killed by falling after traversing up or down through scaffolding.
            If the player falls from scaffolding that doesn't have scaffolding below it, it just counts as a greater than 5 block fall ("fell from a high place").
    <player> fell while climbing
        Appears when the player is killed by falling after being on a climbable block that is not one of the aforementioned ones.
            Only cave vines fall into this category in the vanilla game, however one can make more blocks climbable using data packs.
        Also appears when the player falls from any climbable block, changes dimension before dying, and then dies to fall damage.
            This can happen even without the use of data packs.
    death.fell.accident.water
        Appears when the player dies to fall damage in water, which is ordinarily impossible because water cancels all fall damage.
        Currently replicable in 1.13+ by taking fall damage on a waterlogged slab in a minecart, or by having a trident enchanted with an insanely high level of Riptide, then trying to use it inside deep water bodies.
        This death message is untranslated due to MC-195467.
            Before 1.16, this message was translated as <player> fell out of the water.
    <player> was impaled on a stalagmite
        Appears when the player falls on a pointed dripstone and dies.
    <player> was impaled on a stalagmite whilst fighting <player/mob>
        Appears when the player is hurt by a player or mob then falls on a pointed dripstone and dies.

Falling blocks

    <player> was squashed by a falling anvil
        Appears when the player is killed by an anvil falling on their head.
    <player> was squashed by a falling anvil whilst fighting <player/mob>
        Appears when the player is hurt by a player or mob then killed by a falling anvil.
    <player> was squashed by a falling block
        Appears when the player is killed by a falling block (other than an anvil or pointed dripstone) modified to inflict damage.
    <player> was squashed by a falling block whilst fighting <player/mob>
        Appears when the player is hurt by a player or mob then killed by a falling block modified to inflict damage.
    <player> was skewered by a falling stalactite
        Appears when the player is killed by a falling pointed dripstone.
    <player> was skewered by a falling stalactite whilst fighting <player/mob>
        Appears when the player is hurt by a player or mob and then killed by a falling pointed dripstone.

Fire

    <player> went up in flames
        Appears when the player is killed because they were in a fire source block.
    <player> walked into fire whilst fighting <player/mob>
        Appears when the player is hurt by a player or mob then enters a fire source block.
    <player> burned to death
        Appears when the player is killed because they were on fire, but not in a fire source block.
        Also appears in the game's log when a named snow golem dies because of being in a hot biome.
    <player> was burnt to a crisp whilst fighting <player/mob>
        Appears when the player is hurt by a player or mob then killed because they were on fire.
        Also appears in the game's log when a named snow golem is hurt by a player or mob then dies to the heat in a hot biome.

Firework rockets

    <player> went off with a bang
        Appears when the player is killed by the explosion of a firework rocket.
    <player> went off with a bang due to a firework fired from <item> by <player/mob>
        Appears when the player is killed by the explosion of a firework rocket shot from a renamed crossbow.

Lava

    <player> tried to swim in lava
        Appears when the player is killed because they were in lava.
    <player> tried to swim in lava to escape <player/mob>
        Appears when the player is hurt by a player or mob then enters lava.

Lightning

    <player> was struck by lightning
        Appears when the player is killed by a lightning bolt.
    <player> was struck by lightning whilst fighting <player/mob>
        Appears when the player is hurt by a player or mob then killed by a lightning bolt.

Magma Block

    <player> discovered the floor was lava
        Appears when the player is killed because they were standing on a magma block.
    <player> walked into danger zone due to <player/mob>
        Appears when the player is hurt by a player or mob then killed by magma block damage.

Magic (Instant Damage / Evoker Fangs / Guardian laser)

    <player> was killed by magic
        Appears when the player is killed by Instant Damage given with /effect, by an evoker fang summoned with /summon or by an arrow of harming shot from a dispenser or summoned with /summon.
    <player> was killed by magic whilst trying to escape <player/mob>
        Appears when the player is hurt by a player or mob then killed by Instant Damage or an evoker fang that didn't originate from a player or mob.
    <player> was killed by <player/mob> using magic
        Appears when the player is killed by a potion or arrow of Harming shot by a player or mob, by an evoker fang summoned by an evoker or by the extra damage from a guardian's or elder guardian's laser.
            If the player was killed by a splash potion of Harming shot from a dispenser or summoned with /summon, the death message is <player> was killed by Potion using magic.
            If the player was killed by the cloud created by a lingering potion of Harming shot from a dispenser or summoned with /summon, the death message is <player> was killed by Area Effect Cloud using magic.
    <player> was killed by <player/mob> using <item>
        Appears when the player is killed by one of the aforementioned ways but the player or mob is holding a renamed item during the player's death.

Powder Snow

    <player> froze to death
        Appears when the player is killed because they were in powder snow for too long.
    <player> was frozen to death by <player/mob>
        Appears when the player is hurt by a player or mob then dies from freezing damage.

Players and mobs

    <player> was slain by <player/mob>
        Appears when the player is hurt by a player or mob and killed.
        This death message is actually two different death messages: <player> was slain by <mob> and <player> was slain by <player>.
            This means they can be customized completely independently of each other using resource packs.
        <player> was slain by <player> also appears when a parrot is fed a cookie.
            If the parrot was named, the message will appear in the game's log. If it was tamed, the message will be sent to its owner.
        <player> was slain by <mob> also appears when the player is killed by a shulker using a shulker bullet, or a llama using its llama spit.
            If the player was killed by a shulker bullet or llama spit summoned with /summon, the death message is <player> was slain by Shulker Bullet/Llama Spit.
    <player> was slain by <player/mob> using <item>
        Appears when the player is hurt by a player or mob holding a renamed item and killed.
        This death message is actually two different death messages: <player> was slain by <mob> using <item> and <player> was slain by <player> using <item>.
            This means they can be customized completely independently of each other using resource packs.
        <player> was slain by <player> using <item> also appears when a parrot is fed a cookie by a player holding a named item in their main hand.
        <player> was slain by <mob> using <item> also appears when the player is killed by a shulker holding a renamed item using a shulker bullet, or a llama holding a renamed item using its llama spit.
    <player> was fireballed by <player/mob>
        Appears when the player is killed by a fireball shot by a player or mob.
        When the player is killed by a fireball shot from a dispenser or summoned with /summon, the death message is <player> burned to death.
    <player> was fireballed by <player/mob> using <item>
        Appears when the player is killed by a fireball shot by a player or mob that was holding a renamed item during the player's death.
    <player> was stung to death
        Appears when the player is killed by a bee.
    death.attack.sting.item‌[until JE 1.19] / <player> was stung to death by <player/mob> using <item>‌[upcoming: JE 1.19]
        Appears when the player is killed by a bee that was holding a renamed item during the player's death.
        This death message is untranslated due to MC-186851.‌[until JE 1.19]
    <player> was shot by a skull from <player/mob>
        Appears when the player is killed by a wither skull shot by a player or mob (only possible with the Wither).
        When the player is killed by a wither skull summoned with /summon, the death message is <player> was killed by magic.
    death.attack.witherSkull.item‌[until JE 1.19] / <player> was shot by a skull from <player/mob> using <item>‌[upcoming: JE 1.19]
        Appears when the player is killed by a wither skull shot by a player or mob that is holding a renamed item during the player's death.
        This death message is untranslated due to MC-186148.‌[until JE 1.19]
    <player> was obliterated by a sonically-charged shriek‌[upcoming: JE 1.19]
        Appears when the player is killed by a warden using its sonic boom.
    <player> was obliterated by a sonically-charged shriek whilst trying to escape <player/mob> wielding <item>‌[upcoming: JE 1.19]
        Appears when the player is killed by a warden holding a renamed item using its sonic boom.

Starving

    <player> starved to death
        Appears when the player plays in hard or hardcore and is killed by hunger damage because their hunger bar was at 0.
        Also appears in the game's log when a named vex takes damage after 30-119 seconds from when it was spawned.
    <player> starved to death whilst fighting <player/mob>
        Appears when the player plays in hard or hardcore and is hurt by a player or mob then killed by hunger damage.
        Also appears in the game's log when a named vex dies after being hurt by a player or mob.

Suffocation

    <player> suffocated in a wall
        Appears when the player is killed because they were inside of a non-transparent block.
    <player> suffocated in a wall whilst fighting <player/mob>
        Appears when the player is hurt by a player or mob then killed by suffocation damage.
    <player> was squished too much
        Appears when the player is killed by the maxEntityCramming gamerule.
    <player> was squashed by <player/mob>
        Appears when the player is hurt by a player or mob then killed by the maxEntityCramming gamerule.

Sweet Berry Bushes

    <player> was poked to death by a sweet berry bush
        Appears when the player is killed because they were in a sweet berry bush.
    <player> was poked to death by a sweet berry bush whilst trying to escape <player/mob>
        Appears when the player is hurt by a player or mob then enters a sweet berry bush.

Thorns enchantment

    <player> was killed trying to hurt <player/mob>
        Appears when the player is killed because they hurt a guardian, elder guardian, or a player or mob wearing armor enchanted with Thorns.
    <player> was killed by <item> trying to hurt <player/mob>
        Appears when the player is killed because they hurt a guardian, elder guardian, or a player or mob wearing armor enchanted with Thorns and holding a renamed item.

Trident

    <player> was impaled by <player/mob>
        Appears when the player is killed by a trident shot by a player or mob.
        When the player is killed by a trident shot from a dispenser‌[upcoming: JE Combat Tests] or summoned with /summon, the death message is <player> was impaled by Trident.
    <player> was impaled by <player/mob> with <item>
        Appears when the player is killed by a trident shot by a player or mob that was holding a renamed item during the player's death.

Void

    <player> fell out of the world
        Appears when the player is killed by being 64 blocks below the lowest point where blocks can be placed or by using /kill.[3]
    <player> didn't want to live in the same world as <player/mob>
        Appears when the player is hurt by a player or mob then killed by the void or /kill.[3]

Wither effect

    <player> withered away
        Appears when the player is killed by the Wither status effect.
    <player> withered away whilst fighting <player/mob>
        Appears when the player is hurt by a player or mob then killed by the Wither status effect.

Drying out

    <player> died from dehydration
        Appears in the game's log when a named dolphin or axolotl dies to being out of water.
    <player> died from dehydration whilst trying to escape <player/mob>
        Appears in the game's log when a named dolphin or axolotl is hurt by a player or mob then dies to being out of water.

Generic death

    <player> died
        Is coded to appear only when the player achieves a death that is not assigned to a damage type (magic, cactus etc.) or is assigned to the generic damage type. Currently replicable in 1.17.1+ by naming a bee with a name tag, letting it sting a player, waiting for it to die and looking at the game's log.
    <player> died because of <player/mob>
        Is coded to appear only when the player is hurt by a player or mob then achieves a death that is not assigned to a damage type or is assigned to the generic damage type. Currently replicable in 1.17.1+ by naming a bee with a name tag, letting it sting a player, punching it while waiting for it to die naturally and looking at the game's log.

Unsendable death messages

NOTE: These death messages are technically able to appear, but their conditions cannot be met in vanilla Minecraft.

    <player> was roasted in dragon breath
        Is coded to appear when the player achieves a death that is assigned to the dragonBreath damage type.
        Was added in 15w31c, appeared when the player was killed by a fireball shot by the ender dragon, but since then it has been unused, because dragon fireballs no longer deal impact damage.
        See MC-84595 for more info.
    <player> was roasted in dragon breath by <player/mob>
        Is coded to appear when the player is hurt by a player or mob then achieves a death that is assigned to the dragonBreath damage type.
        Was added later on to accompany the previous one.
    <player> was burnt to a crisp whilst fighting <player/mob> wielding <item>‌[upcoming: JE 1.19]
        Is coded to appear when the player achieves a death that is assigned to onFire, which is a player/mob damage type in this case (the normal one is an environmental damage type), caused by a player or mob holding a renamed item.
        In other words, this should appear when the player is killed by a fireball shot from a dispenser or summoned with /summon, while simultaneously, the nonexistent player or mob that shot it is holding a renamed item. This obviously is not possible.

Unused death messages

NOTE: These death messages have no code to make them appear, so they appear only in the en_us.json file.

    <player> was doomed to fall
    <player> was doomed to fall by <player/mob>
        Was intended to show up when the player was attacked before taking lethal fall damage.
    <player> was doomed to fall by <player/mob> using <item>
        Was intended to show up when the player was attacked with a renamed item before taking lethal fall damage.
    <player> fell too far and was finished by <player/mob>
        Was intended to show up when the player took fall damage and was killed by another player or mob.
    <player> fell too far and was finished by <player/mob> using <item>
        Was intended to show up when the player took fall damage and was killed by another player or mob holding a renamed item.
    <player> was stung to death by <player/mob>
        The death message "<player> was stung to death" should have a <player/mob> variable, but the vanilla translation does not include it.
    <player> went off with a bang whilst fighting <player/mob>
        The death message "<player> went off with a bang" should have a <player/mob> variable, but the vanilla translation does not include it.
    <player> was obliterated by a sonically-charged shriek whilst trying to escape <player/mob>‌[upcoming: JE 1.19]
        The death message "<player> was obliterated by a sonically-charged shriek" should have a <player/mob> variable, but the vanilla translation does not include it.
    <player> was killed by even more magic
        Has a hover event, with text Actually, message was too long to deliver fully. Sorry! Here's stripped version: [message]
        Appears when the regular death message is too large to send. This situation is almost impossible to trigger normally.[needs testing]`;

const lines = msgs
	// remove zero width spaces
	.replace(/[\u200B-\u200D\uFEFF]/g, "")
	.split("\n")
	.filter(
		x =>
			// starts with space (indented)
			x[0] === " " &&
			// but not 5 spaces (more than one indent)
			!x.startsWith("     "),
	)
	.flatMap(x => (x.includes(" / ") ? x.split(" / ") : x))
	.map(x => x.replace(/\[((until)|(upcoming)).+?\]/, "").trim());

function escapeRegExp(str: string) {
	return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

export function getDeathMessages(this: { username: () => string }) {
	const user = this.username();

	const replacer = (x: string) => {
		let i = 0;
		return (
			"(" +
			escapeRegExp(x).replace(/<.+?>/g, match =>
				// only replace the first matching <player> with user
				i === 0 && match === "<player>" ? "" : "(.+?)",
			) +
			")"
		);
	};

	const hasPlayer = lines
		.filter(line => line.startsWith("<player>"))
		.map(replacer);
	const others = lines
		.filter(line => !line.startsWith("<player>"))
		.map(replacer);

	return `((?<user>${user})(${hasPlayer.join("|")}))|${others.join("|")}`;
}
