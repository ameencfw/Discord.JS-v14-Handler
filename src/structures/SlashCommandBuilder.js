const { SlashCommandBuilder } = require('discord.js');

/**
 * Adds a `.setCategory()` helper to Discord.js' SlashCommandBuilder.
 * Stores metadata on the builder instance for handler usage.
 * @param {'moderation' | 'fun' | 'utility'} category - The command category.
 * @returns {SlashCommandBuilder}
 */
SlashCommandBuilder.prototype.setCategory = function setCategory(category) {
  this.category = category;
  return this;
};

module.exports = {
  SlashCommandBuilder
};
