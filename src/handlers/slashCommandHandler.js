const path = require('path');
const { Collection, REST, Routes } = require('discord.js');
const { loadFilesRecursively } = require('../utils/fileLoader');
const config = require('../config');

/**
 * Loads all slash commands dynamically from the commands directory.
 * Populates the client's command collection and stores JSON payloads for deployment.
 * @param {import('discord.js').Client} client - Discord.js client instance.
 * @returns {Promise<void>}
 */
async function loadSlashCommands(client) {
  const commandsDir = path.join(__dirname, '..', 'commands', 'slash');
  const files = loadFilesRecursively(commandsDir);

  client.commands = client.commands ?? new Collection();
  client.slashCommandData = [];

  for (const filePath of files) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const command = require(filePath);

    if (!command?.data || typeof command.execute !== 'function') {
      // eslint-disable-next-line no-console
      console.warn(`[SlashCommands] Skipping ${filePath} due to invalid export shape.`);
      continue;
    }

    const commandName = command.data.name;

    client.commands.set(commandName, {
      ...command,
      category: command.data.category ?? 'utility'
    });

    client.slashCommandData.push(command.data.toJSON());
  }

  // eslint-disable-next-line no-console
  console.log(`[SlashCommands] Loaded ${client.commands.size} slash commands.`);
}

/**
 * Registers slash commands with Discord globally.
 * Uses the stored JSON payloads produced during loadSlashCommands.
 * @param {import('discord.js').Client} client - Discord.js client instance.
 * @returns {Promise<void>}
 */
async function registerSlashCommands(client) {
  if (!client?.user) {
    throw new Error('registerSlashCommands called before the client is ready.');
  }

  if (!Array.isArray(client.slashCommandData)) {
    throw new Error('registerSlashCommands missing command data. Did you call loadSlashCommands?');
  }

  const rest = new REST({ version: '10' }).setToken(config.botToken);

  try {
    await rest.put(Routes.applicationCommands(client.user.id), {
      body: client.slashCommandData
    });

    // eslint-disable-next-line no-console
    console.log(`[SlashCommands] Registered ${client.slashCommandData.length} slash commands.`);
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[SlashCommands] Failed to register commands:', error);
    throw error;
  }
}

module.exports = {
  loadSlashCommands,
  registerSlashCommands
};
