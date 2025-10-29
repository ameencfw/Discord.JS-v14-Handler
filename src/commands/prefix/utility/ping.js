const { getGuildSettings } = require('../../../database/mongo');

module.exports = {
  name: 'ping',
  description: 'Check the bot latency.',
  category: 'utility',
  aliases: ['pong'],
  /**
   * Responds with latency using the guild language.
   * @param {import('discord.js').Client} client - Discord.js client instance.
   * @param {import('discord.js').Message} message - The triggering message.
   * @param {string[]} args - Additional arguments supplied with the command.
   * @param {string} prefix - The prefix used for the command.
   * @returns {Promise<void>}
   */
  async execute(client, message) {
    try {
      const guildSettings = message.guild
        ? await getGuildSettings(message.guild.id)
        : { language: client.defaultLanguage };

      const replyTemplate = client.translate(
        guildSettings.language,
        'commands.ping.reply',
        'Pong!'
      );

      const latency = Math.round(client.ws.ping);
      await message.channel.send(`${replyTemplate} (${latency}ms)`);
    } catch (error) {
      console.error('Failed to execute !ping:', error);
      const fallback = client.translate(client.defaultLanguage, 'errors.generic', 'Something went wrong.');
      await message.channel.send(fallback);
    }
  }
};
