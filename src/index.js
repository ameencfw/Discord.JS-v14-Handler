/* eslint-disable no-console */
const { Client, GatewayIntentBits, Partials } = require('discord.js');
const config = require('./config');
const { connectMongo } = require('./database/mongo');
const { loadSlashCommands, registerSlashCommands } = require('./handlers/slashCommandHandler');
const { loadPrefixCommands } = require('./handlers/prefixCommandHandler');
const { loadContextCommands } = require('./handlers/contextCommandHandler');
const { loadEvents } = require('./handlers/eventHandler');
const { translate } = require('./utils/languageManager');

// Extend SlashCommandBuilder with .setCategory()
require('./structures/SlashCommandBuilder');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
  partials: [Partials.Message, Partials.Channel, Partials.User],
  allowedMentions: { repliedUser: false }
});

client.defaultPrefix = config.defaultPrefix;
client.defaultLanguage = config.defaultLanguage;
client.translate = translate;

/**
 * Performs the bootstrapping steps: database, commands, events, and login.
 * @returns {Promise<void>}
 */
async function bootstrap() {
  if (!config.botToken) {
    throw new Error('Missing TOKEN in environment configuration.');
  }

  await connectMongo();
  await loadSlashCommands(client);
  await loadContextCommands(client);
  await loadPrefixCommands(client);
  await loadEvents(client);

  client.once('clientReady', async () => {
    try {
      await registerSlashCommands(client);
    } catch (error) {
      console.error('Failed to register slash commands:', error);
    }
  });

  await client.login(config.botToken);
}

bootstrap().catch((error) => {
  console.error('Bot failed to initialize:', error);
  process.exitCode = 1;
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled promise rejection:', reason);
});

process.on('SIGINT', async () => {
  console.info('Gracefully shutting down...');
  await client.destroy();
  process.exit(0);
});
