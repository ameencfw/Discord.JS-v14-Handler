/* eslint-disable no-console */
const { Collection, REST, Routes } = require('discord.js');
const config = require('../src/config');
const { loadSlashCommands } = require('../src/handlers/slashCommandHandler');
const { loadContextCommands } = require('../src/handlers/contextCommandHandler');

require('../src/structures/SlashCommandBuilder');

/**
 * Bootstraps command loaders without logging in the full client.
 * @returns {Promise<void>}
 */
async function deploy() {
  if (!config.botToken) {
    throw new Error('Missing TOKEN in environment configuration.');
  }

  if (!config.clientId) {
    throw new Error('Missing CLIENT_ID in environment configuration.');
  }

  const mockClient = {
    commands: new Collection(),
    contextCommands: new Collection(),
    slashCommandData: []
  };

  await loadSlashCommands(mockClient);
  await loadContextCommands(mockClient);

  const rest = new REST({ version: '10' }).setToken(config.botToken);

  await rest.put(Routes.applicationCommands(config.clientId), {
    body: mockClient.slashCommandData
  });

  console.log(`Successfully registered ${mockClient.slashCommandData.length} application commands.`);
}

deploy().catch((error) => {
  console.error('Failed to deploy commands:', error);
  process.exitCode = 1;
});
