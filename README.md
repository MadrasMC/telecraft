# telecraft

Pluggable Minecraft server bridge and administration tools.

## Building

```sh
deno compile -A --unstable --output telecraft packages/cli/index.ts
```

Having child process permission already means telecraft can do everything. telecraft will spawn your game server, so this is a required permission. Additionally, telecraft may need to open various files (config, database, network). `-A` grants all permissions, for simplicity.

`--unstable` is required for Deno.Kv store.

## Usage

Create a config file with at least the following options:

```json
{
	"launch": "/usr/bin/env java -Xmx3096M -Xms1024M -jar /path/to/server.jar nogui",
	"parser": "vanilla",
	"version": "1.19"
}
```

Save it as `telecraft.json`. This will launch a vanilla Minecraft server with 3GB of RAM allocated as Minecraft 1.19.

Then run Telecraft:

```sh
telecraft
```

### Plugins

By itself this does almost nothing other than run the server. All functionality is in the plugins. You can add a plugins array to your config. The following enables bi-directional bridge with a Telegram chat:

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

##### TODO: documentation for all builtin plugins

### Third-party plugins

Telecraft supports third-party plugins. These are Deno modules that export a function implementing the [`Plugin`](./packages/types/types/Plugin.ts) type. You can use third-party plugins via URL by simply adding them to your config:

```json
"plugins": [
	{
		"url": "https://example.com/x/my-telecraft-plugin@version/index.ts",
		"config": {
			// ...
		}
	}
]
```
