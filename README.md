# Discord.js v14 Handler — Usage Guide

<p align="center">
      <img src="https://img.shields.io/badge/node-^v22.20.0-purple?style=for-the-badge" alt="Node.js">
      <img src="https://img.shields.io/badge/discord.js-^v14-purple?style=for-the-badge" alt="discord.js">
      <img src="https://img.shields.io/badge/version-latest-purple?style=for-the-badge" alt="Latest Version">
</p>

Welcome! This repository contains a production-ready Discord bot starter that mixes slash commands, prefix commands, context menus, MongoDB, and multi-language support. This README focuses on **how to use** each part so you can ship features quickly.

---

## 1. Prerequisites

- Node.js **18 or newer**
- A Discord application & bot token
- A MongoDB connection string

Install packages after cloning:

```bash
npm install
```

---

## 2. Configure the Environment

Create a `.env` in the project root. Start from `.env.example`:

```env
TOKEN=your-discord-bot-token
CLIENT_ID=discord-application-id
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/your-db
DEFAULT_PREFIX=!
DEFAULT_LANGUAGE=en
```

The boot sequence reads these variables via `src/config.js`. Missing `TOKEN` or `MONGO_URI` will throw on startup.

---

## 3. Run the Bot Locally

```bash
# optional: deploy slash/context commands before first run
npm run deploy:commands

# start the bot
npm start
```

Successful output looks like:

```
[Database] MongoDB connection established.
[SlashCommands] Loaded 2 slash commands.
[ContextCommands] Loaded 1 context commands.
[PrefixCommands] Loaded 1 prefix commands.
[Events] Loaded 3 events.
[Client] Logged in as YourBot#0001
```

---

## 4. Project Map

```
src/
├─ commands/
│  ├─ slash/…          # Slash command files grouped by category
│  └─ prefix/…         # Prefix command files grouped by category
├─ context/            # Message/User context menu interactions
├─ events/             # Event listeners auto-registered at boot
├─ languages/          # JSON translation files (en, ar, …)
├─ database/mongo.js   # Mongoose connection + guild helpers
├─ handlers/           # Loaders for commands/context/events
├─ structures/         # Custom builders (SlashCommandBuilder extras)
├─ utils/              # Shared utilities (file loader, language manager)
├─ config.js           # Central config sourced from .env
└─ index.js            # Entry point: bootstraps everything
```

---

## 5. Slash Commands

Slash commands live inside `src/commands/slash/<category>/<name>.js`. Example: `src/commands/slash/utility/ping.js`.

```js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getGuildSettings } = require('../../../database/mongo');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check latency.')
    .setCategory('utility'),
  async execute(interaction, client) {
    const { language } = interaction.guildId
      ? await getGuildSettings(interaction.guildId)
      : { language: client.defaultLanguage };

    const response = client.translate(language, 'commands.ping.reply', 'Pong!');
    await interaction.reply({ content: response });
  }
};
```

- The loader (`src/handlers/slashCommandHandler.js`) automatically reads and registers every file.
- Slash commands are pushed to Discord globally when the client emits `clientReady`.
- Add folders under `slash/` to create new categories (e.g., moderation, fun).

---

## 6. Prefix Commands

Prefix commands live in `src/commands/prefix/<category>/`. Example: `src/commands/prefix/utility/ping.js`.

```js
module.exports = {
  name: 'ping',
  aliases: ['pong'],
  async execute(client, message) {
    const response = client.translate(client.defaultLanguage, 'commands.ping.reply', 'Pong!');
    await message.channel.send(response);
  }
};
```

- `messageCreate.js` resolves the correct prefix from MongoDB (`DEFAULT_PREFIX` fallback).
- `client.aliases` maps aliases to their base command names, so you can register multiple triggers.
- When adding a new command, just drop the file in the right category folder; no manual registration needed.

---

## 7. Context Menu Commands

Context commands are stored in `src/context/`. Example: `src/context/pingUser.js`.

```js
module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Ping User')
    .setType(ApplicationCommandType.User),
  async execute(interaction, client) {
    const message = client.translate('en', 'commands.ping.context_reply', 'Ping! Hello, {user}');
    await interaction.reply({ content: message.replace('{user}', interaction.targetUser.username), flags: MessageFlags.Ephemeral });
  }
};
```

- Context commands share the same deployment pipeline as slash commands (run `npm run deploy:commands`).
- Handler keys combine command name and type (`User` or `Message`) so you can reuse names for both types safely.

---

## 8. Guild Settings & MongoDB

`src/database/mongo.js` handles the MongoDB connection and guild configuration model.

Key helpers:

- `connectMongo()` — called before the bot logs in.
- `getGuildSettings(guildId)` — fetches or creates `{ prefix, language }`, using an in-memory cache.
- `updateGuildSettings(guildId, updates)` — persists new values and refreshes the cache.

Schema (excerpt):

```js
const guildSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  prefix: { type: String, default: config.defaultPrefix },
  language: { type: String, default: config.defaultLanguage }
});
```

---

## 9. Language System

- Language packs reside in `src/languages/<code>.json`. Provided: `en.json`, `ar.json`.
- `src/utils/languageManager.js` loads and caches JSON, falling back to the default language when keys are missing.
- Commands call `client.translate(languageCode, 'path.to.key', 'fallback')`.

Changing language:

1. Run `/setlang <language>` (choices defined in `setlang.js`).
2. The handler saves the language in MongoDB and replies with a localized confirmation.
3. Future interactions/message commands read the stored language automatically.

Add new language files by copying `en.json`, rename to the desired code, and translate the values. Update `SUPPORTED_LANGUAGES` in `src/commands/slash/utility/setlang.js`.

---

## 10. Event Flow

Events live in `src/events/`. They are imported and bound by `src/handlers/eventHandler.js`.

Current events:

- `clientReady.js` — logs the bot in and sets presence; triggers the global command deployment.
- `interactionCreate.js` — routes slash and context commands with error handling & localization.
- `messageCreate.js` — executes prefix commands after resolving prefix and arguments.

Add new events by creating `src/events/<eventName>.js`:

```js
module.exports = {
  name: 'guildCreate',
  async execute(guild, client) {
    console.log(`Joined guild: ${guild.name}`);
  }
};
```

---

## 11. Deploying Commands

Whenever you add or rename slash/context menu commands:

```bash
npm run deploy:commands
```

`scripts/deploy-commands.js` loads command definitions using the same loaders and calls Discord's REST API with `CLIENT_ID` and `TOKEN`.

---

## 12. Troubleshooting

- **Bot starts but commands missing**: run `npm run deploy:commands`, then re-invite your bot if commands were previously cached.
- **MongoDB errors**: confirm `MONGO_URI` is correct and accessible. The process will exit if the connection fails at boot.
- **Localization fallback**: if you see raw translation keys, ensure the key exists in your language file or the default language file.
- **Permission issues**: slash commands require your bot to have the right scopes (`bot` and `applications.commands`) and necessary guild permissions.

---

## 13. Next Steps

- Add more commands under `commands/slash` and `commands/prefix`.
- Extend the language JSON files or connect to a translation management platform.
- Expand the schema in `mongo.js` to track additional guild preferences.
- Integrate moderation helpers, logging hooks, or dashboards as your bot grows.

---

Happy building! If this starter saves you time, consider starring the repo and sharing improvements.

---

## License

This project is distributed under the [MIT License](LICENSE). © AmtiXDev ([@mutesuffering](https://github.com/mutesuffering)).
