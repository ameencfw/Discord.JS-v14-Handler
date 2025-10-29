const path = require('path');
const { Collection } = require('discord.js');
const { loadFilesRecursively } = require('../utils/fileLoader');

/**
 * Loads prefix commands and their aliases into Collections on the client.
 * @param {import('discord.js').Client} client - Discord.js client instance.
 * @returns {Promise<void>}
 */
async function loadPrefixCommands(client) {
  const commandsDir = path.join(__dirname, '..', 'commands', 'prefix');
  const files = loadFilesRecursively(commandsDir);

  client.prefixCommands = client.prefixCommands ?? new Collection();
  client.aliases = client.aliases ?? new Collection();

  for (const filePath of files) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const command = require(filePath);

    if (!command?.name || typeof command.execute !== 'function') {
      // eslint-disable-next-line no-console
      console.warn(`[PrefixCommands] Skipping ${filePath} due to invalid export shape.`);
      continue;
    }

    client.prefixCommands.set(command.name, command);

    if (Array.isArray(command.aliases)) {
      for (const alias of command.aliases) {
        client.aliases.set(alias, command.name);
      }
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[PrefixCommands] Loaded ${client.prefixCommands.size} prefix commands.`);
}

module.exports = {
  loadPrefixCommands
};
