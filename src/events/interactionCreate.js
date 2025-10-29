const { InteractionType, ApplicationCommandType, MessageFlags } = require('discord.js');
const { getGuildSettings } = require('../database/mongo');
const { buildContextKey } = require('../handlers/contextCommandHandler');

module.exports = {
  name: 'interactionCreate',
  /**
   * Handles slash command and context menu interactions.
   * @param {import('discord.js').Interaction} interaction - Interaction payload from Discord.
   * @param {import('discord.js').Client} client - Discord.js client instance.
   * @returns {Promise<void>}
   */
  async execute(interaction, client) {
    try {
      if (interaction.type === InteractionType.ApplicationCommand && interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) {
          await interaction.reply({
            content: 'This command is not available.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        await command.execute(interaction, client);
        return;
      }

      if (interaction.type === InteractionType.ApplicationCommand && interaction.isContextMenuCommand()) {
        const key = buildContextKey(interaction.commandName, interaction.commandType);
        const command = client.contextCommands.get(key);

        if (!command) {
          await interaction.reply({
            content: 'This context menu command is not available.',
            flags: MessageFlags.Ephemeral
          });
          return;
        }

        await command.execute(interaction, client);
        return;
      }
    } catch (error) {
      console.error('Interaction handler error:', error);

      let language = client.defaultLanguage;
      if (interaction.guildId) {
        const settings = await getGuildSettings(interaction.guildId);
        language = settings.language;
      }

      const fallback = client.translate(language, 'errors.generic', 'Something went wrong.');

      if (interaction.replied || interaction.deferred) {
        await interaction.editReply({ content: fallback });
      } else {
        await interaction.reply({
          content: fallback,
          flags: MessageFlags.Ephemeral
        });
      }
    }
  }
};
