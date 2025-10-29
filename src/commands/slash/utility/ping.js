const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { getGuildSettings } = require('../../../database/mongo');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Check the bot latency.')
    .setCategory('utility'),
  /**
   * Responds with the bot latency using the guild language.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction - The command interaction.
   * @param {import('discord.js').Client} client - Discord.js client instance.
   * @returns {Promise<void>}
   */
  async execute(interaction, client) {
    try {
      const guildSettings = interaction.guildId
        ? await getGuildSettings(interaction.guildId)
        : { language: client.defaultLanguage };

      const replyTemplate = client.translate(
        guildSettings.language,
        'commands.ping.reply',
        'Pong!'
      );

      const latency = Math.round(client.ws.ping);
      await interaction.reply({
        content: `${replyTemplate} (${latency}ms)`
      });
    } catch (error) {
      const fallback = client.translate(client.defaultLanguage, 'errors.generic', 'Something went wrong.');
      console.error('Failed to execute /ping:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: fallback });
      } else {
        await interaction.reply({ content: fallback, flags: MessageFlags.Ephemeral });
      }
    }
  }
};
