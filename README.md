# telecraft

Pluggable Minecraft and Vintage Story server bridge and administration tools.

## Building

```sh
deno compile -A --unstable --output telecraft packages/cli/index.ts
```

Having child process permission already means telecraft can do everything. This is a required permission because telecraft will spawn your game server. Additionally, telecraft may need to open various files (config, database, network). `-A` grants all permissions, for simplicity.

`--unstable` is required for Deno.Kv store.

##### TODO: publish builds via CI

## Usage

> _[(Skip to config options)](docs/CONFIG.md)_

Create a config file with at least the following options:

```json
{
	"launch": "/usr/bin/env java -Xmx4096M -Xms1024M -jar /path/to/server.jar nogui",
	"parser": "vanilla",
	"version": "1.19"
}
```

Save it as `telecraft.json` and run:

```sh
telecraft
```

This will launch a vanilla Minecraft server with 4GB of RAM allocated, parsing its stdout as Minecraft 1.19.

By itself the above steps do almost nothing other than run the game server. All functionality is in the plugins. You can add a plugins array to your config. The following enables bi-directional bridge with a Telegram chat:

```json
"plugins": [
	{
		"name": "telegram",
		"token": "1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
		"chatId": -1001234567890,
		"allowList": true
	}
]
```

Now that you know how to run telecraft, you can read the [config options](docs/CONFIG.md) to learn more about what you can do with it.
