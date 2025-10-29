const { getGuildSettings } = require('../database/mongo');

module.exports = {
  name: 'messageCreate',
  /**
   * Handles prefix command execution and guild prefix resolution.
   * @param {import('discord.js').Message} message - Incoming message payload.
   * @param {import('discord.js').Client} client - Discord.js client instance.
   * @returns {Promise<void>}
   */
  async execute(message, client) {
    if (message.author.bot) {
      return;
    }

    let prefix = client.defaultPrefix;
    let language = client.defaultLanguage;

    try {
      if (message.guild) {
        const settings = await getGuildSettings(message.guild.id);
        prefix = settings.prefix ?? prefix;
        language = settings.language ?? language;
      }
    } catch (error) {
      console.error('Failed to fetch guild settings:', error);
    }

    if (!message.content.startsWith(prefix)) {
      return;
    }

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();

    if (!commandName) {
      return;
    }

    const resolvedName = client.prefixCommands.get(commandName)
      ? commandName
      : client.aliases.get(commandName);

    if (!resolvedName) {
      return;
    }

    const command = client.prefixCommands.get(resolvedName);

    if (!command) {
      return;
    }

    try {
      await command.execute(client, message, args, prefix);
    } catch (error) {
      console.error(`Prefix command ${resolvedName} failed:`, error);
      const fallback = client.translate(language, 'errors.generic', 'Something went wrong.');
      await message.channel.send({ content: fallback });
    }
  }
};
