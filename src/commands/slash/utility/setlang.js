const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { updateGuildSettings, getGuildSettings } = require('../../../database/mongo');
const config = require('../../../config');

const SUPPORTED_LANGUAGES = [
  { name: 'English', value: 'en' },
  { name: 'Arabic', value: 'ar' }
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setlang')
    .setDescription('Set the language for this server.')
    .addStringOption((option) =>
      option
        .setName('language')
        .setDescription('Language to use for bot responses.')
        .setRequired(true)
        .addChoices(...SUPPORTED_LANGUAGES)
    )
    .setCategory('utility'),
  /**
   * Updates the guild language preference in MongoDB.
   * @param {import('discord.js').ChatInputCommandInteraction} interaction - The command interaction.
   * @param {import('discord.js').Client} client - Discord.js client instance.
   * @returns {Promise<void>}
   */
  async execute(interaction, client) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'This command can only be used in a server.',
        flags: MessageFlags.Ephemeral
      });
      return;
    }

    try {
      const language = interaction.options.getString('language', true);
      const available = SUPPORTED_LANGUAGES.map((lang) => lang.value);

      if (!available.includes(language)) {
        const invalidMessage = client.translate(
          config.defaultLanguage,
          'commands.setlang.invalid',
          `Unsupported language. Available options: ${available.join(', ')}.`
        ).replace('{languages}', available.join(', '));

        await interaction.reply({
          content: invalidMessage,
          flags: MessageFlags.Ephemeral
        });
        return;
      }

      await updateGuildSettings(interaction.guildId, { language });
      const updatedSettings = await getGuildSettings(interaction.guildId);

      const successMessage = client
        .translate(
          updatedSettings.language,
          'commands.setlang.success',
          `Language updated to **${language}**.`
        )
        .replace('{language}', language);

      await interaction.reply({
        content: successMessage,
        flags: MessageFlags.Ephemeral
      });
    } catch (error) {
      console.error('Failed to execute /setlang:', error);
      const fallback = client.translate(client.defaultLanguage, 'errors.generic', 'Something went wrong.');
      await interaction.reply({
        content: fallback,
        flags: MessageFlags.Ephemeral
      });
    }
  }
};
