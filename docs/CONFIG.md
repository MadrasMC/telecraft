# Configuring telecraft

telecraft is configured using a JSON file. By default, it will look for a file named `telecraft.json` in the current working directory. You can specify a different config file using the `--config | -c` option.

- [Config](#config)
  - [launch](#launch-string)
  - [workdir](#workdir-string)
  - [parser](#parser-string)
  - [version](#version-string)
  - [store](#store-string)
  - [plugins](#plugins-plugin)
- [Plugins](#plugins)
  - [telegram](#telegram)
  - [discord](#discord)
  - [youtube](#youtube)
  - [irc](#irc)
  - [auth](#auth)
- [Third-party Plugins](#third-party-plugins)

## Config Options

### `launch` _(string)_

The command to launch the game server. It can be a path to an executable, or a command with arguments. If you need to use shell features like pipes, you can use `sh -c` to run a shell command.

### `workdir` _(string)_

(_string_) The working directory to launch the game server in. The `launch` command will be run in this directory.

### `parser` _(string)_

The parser to use for the game server's stdout. This is used to parse chat messages and other events.

Supported values:

- `minecraft` - Vanilla Minecraft server
- `papermc` - PaperMC server
- `fabricmc` - FabricMC server
- `vintage-story` - Vintage Story server

### `version` _(string)_

The Minecraft version of the server. This is used to parse chat messages and other events.

Supported values:

- `1.19` (for parser `minecraft`, `papermc`, `fabricmc`)
- `1.19` (for parser `vintage-story`)

> Note: Old parser versions will likely just work for newer game versions, but they may miss things like new death messages. It's only rarely that functionality will be broken. For example, since 1.19, Minecraft will add `[Not Secure]` before messages in offline mode (messages are not signed by Mojang server). Typically using the latest available parser version is recommended, regardless of your game version. Do raise an issue if something broke in a new version.

### `store` _(string)_

The store path to use for persistent data. This is primarily passed to plugins to store data to file. It's a Deno.Kv store, based on SQLite.

### `plugins` _(Plugin[])_

An array of plugins to load. Builtin plugins can be specified by name, and third-party plugins can be specified by URL.

Example:

```json
"plugins": [
	{
		"name": "telegram",
		"token": "1234567890:ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890",
		"chatId": -1001234567890,
		"allowList": true
	},
	{
		"url": "https://example.com/x/my-telecraft-plugin@version",
		"config": {
			// ...
		}
	}
]
```

See [Plugins](#plugins) below for more details on each plugin.

## Plugins

The following are official plugins, bundled with telecraft:

- [`telegram`](#telegram)
- [`discord`](#discord)
- [`youtube`](#youtube)
- [`irc`](#irc)
- [`auth`](#auth)

See also [third-party plugins](#third-party-plugins).

### `telegram`

This plugin allows you to bridge messages between the game server and a Telegram chat. It implements a [`Messenger`](../packages/types/types/Messenger.ts) interface, which can be used by other plugins such as [`auth`](#auth).

#### Config

```ts
interface Telegram {
	name: "telegram";
	token: string;
	chatId: number | string;
	allowList?: boolean;
	startTimeout?: number;
}
```

- `token` _(string)_ - The Telegram bot token. You can get this from [@BotFather](https://t.me/BotFather).
- `chatId` _(number)_ - The Telegram chat ID to bridge with. You can get this using [@get_id_bot](https://t.me/get_id_bot).
- `allowList` _(boolean, optional)_ - Whether to allow only users in the Telegram chat to do `/list` to list currently logged in players.
- `startTimeout` _(number, optional)_ - The timeout in milliseconds to wait for the Minecraft server to start before crashing. Defaults to 15 seconds.

### `discord`

This plugin allows you to bridge messages between the game server and a Discord channel. It implements a [`Messenger`](../packages/types/types/Messenger.ts) interface, which can be used by other plugins such as [`auth`](#auth).

#### Config

```ts
interface Discord {
	name: "discord";
	token: string;
	channelId: string;
}
```

- `token` _(string)_ - The Discord bot token. You can get this from the [Discord Developer Portal](https://discord.com/developers/applications).
- `channelId` _(string)_ - The Discord channel ID to bridge with. You can get this by enabling developer mode in Discord settings, then right-clicking on a channel and clicking "Copy ID".

### `youtube`

This plugin allows you to forward messages from a YouTube live chat to in-game chat. It is one way, and does not implement a [`Messenger`](../packages/types/types/Messenger.ts) interface.

#### Config

```ts
interface YouTubeLive {
	name: "youtube";
	videoId: string;
	apiKey: string;
	fetchInterval?: number;
	maxResults?: number;
}
```

- `videoId` _(string)_ - The YouTube video ID to bridge with. You can get this from the URL of the video.
- `apiKey` _(string)_ - The YouTube API key. You can get this from the [Google Developer Console](https://console.developers.google.com/).
- `fetchInterval` _(number, optional)_ - The interval in milliseconds to fetch new messages from YouTube. Defaults to 2 seconds.
- `maxResults` _(number, optional)_ - The maximum number of messages to fetch from YouTube at a time. Defaults to 100.

### `irc`

This plugin allows you to bridge messages between the game server and an IRC channel. It implements a [`Messenger`](../packages/types/types/Messenger.ts) interface, which can be used by other plugins such as [`auth`](#auth).

#### Config

```ts
interface IRC {
	name: "irc";
	server: string;
	nick: string;
	channel: string;
}
```

- `server` _(string)_ - The IRC server to connect to.
- `nick` _(string)_ - The IRC nickname to use.
- `channel` _(string)_ - The IRC channel to bridge with.

### `auth`

This plugin only works for Minecraft; specifically meant for "offline" servers that do not use Mojang's authentication system to verify players are who they say they are.

This plugin allows you to authenticate players using a messenger. It works by repeatedly tp'ing the player in place with blindness and spectator mode while they authenticate, and kicking them if they fail to authenticate within a timeout.

The first time a player joins, they will receive an in-game to send `/link <code>` to the bot via messenger. Once they do so, they will be authenticated and allowed to play. On subsequent joins, they only need to send `/auth` to the bot via messenger.

This is not a fool-proof authentication method, but it is good enough to prevent most griefing. It is recommended to use this in conjunction with a server whitelist.

#### Config

```ts
export interface Auth {
	name: "auth";
	messenger: "telegram" | "discord" | "irc";
	timeout?: number;
}
```

- `messenger` _(string)_ - The messenger plugin to use for authentication. This must be one of the following:
  - `telegram`
  - `discord`
  - `irc`
- `timeout` _(number, optional)_ - The timeout in milliseconds to wait for the player to authenticate before kicking them. Defaults to 20 seconds.

## Third-party Plugins

Third-party plugins can be specified by URL in the `plugins` array in the config. The URL must be a valid URL to a Deno module, and must have a default export that implements the [`Plugin`](../packages/types/types/Plugin.ts) type.

Example:

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
