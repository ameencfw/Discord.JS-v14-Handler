const path = require('path');
const { Collection, ApplicationCommandType } = require('discord.js');
const { loadFilesRecursively } = require('../utils/fileLoader');

/**
 * Generates the internal storage key for a context command.
 * @param {string} name - The command name.
 * @param {import('discord.js').ApplicationCommandType} type - Command type.
 * @returns {string}
 */
function buildContextKey(name, type) {
  return `${name.toLowerCase()}:${type}`;
}

/**
 * Loads context menu commands (User and Message) into the client.
 * Also appends payloads to the slash command registration array.
 * @param {import('discord.js').Client} client - Discord.js client instance.
 * @returns {Promise<void>}
 */
async function loadContextCommands(client) {
  const contextDir = path.join(__dirname, '..', 'context');
  const files = loadFilesRecursively(contextDir);

  client.contextCommands = client.contextCommands ?? new Collection();
  client.slashCommandData = client.slashCommandData ?? [];

  for (const filePath of files) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const command = require(filePath);

    if (!command?.data || typeof command.execute !== 'function') {
      // eslint-disable-next-line no-console
      console.warn(`[ContextCommands] Skipping ${filePath} due to invalid export shape.`);
      continue;
    }

    const json = command.data.toJSON();
    const commandType = json.type ?? ApplicationCommandType.User;
    const key = buildContextKey(json.name, commandType);

    client.contextCommands.set(key, command);
    client.slashCommandData.push(json);
  }

  // eslint-disable-next-line no-console
  console.log(`[ContextCommands] Loaded ${client.contextCommands.size} context commands.`);
}

module.exports = {
  loadContextCommands,
  buildContextKey
};
