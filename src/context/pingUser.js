const { ContextMenuCommandBuilder, ApplicationCommandType, MessageFlags } = require('discord.js');
const { getGuildSettings } = require('../database/mongo');

module.exports = {
  data: new ContextMenuCommandBuilder()
    .setName('Ping User')
    .setType(ApplicationCommandType.User),
  /**
   * Sends a localized acknowledgement when the context menu is used.
   * @param {import('discord.js').UserContextMenuCommandInteraction} interaction - The context interaction.
   * @param {import('discord.js').Client} client - Discord.js client instance.
   * @returns {Promise<void>}
   */
  async execute(interaction, client) {
    try {
      const guildSettings = interaction.guildId
        ? await getGuildSettings(interaction.guildId)
        : { language: client.defaultLanguage };

      const template = client.translate(
        guildSettings.language,
        'commands.ping.context_reply',
        `Ping! Hello, ${interaction.targetUser.displayName ?? interaction.targetUser.username}`
      );

      const response = template.replace('{user}', interaction.targetUser.displayName ?? interaction.targetUser.username);

      await interaction.reply({
        content: response,
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error('Failed to run context command Ping User:', error);
      const fallback = client.translate(client.defaultLanguage, 'errors.generic', 'Something went wrong.');
      await interaction.reply({
        content: fallback,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
