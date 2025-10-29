const mongoose = require('mongoose');
const config = require('../config');

const DEFAULT_GUILD_SETTINGS = {
  prefix: config.defaultPrefix,
  language: config.defaultLanguage
};

const guildSchema = new mongoose.Schema(
  {
    guildId: {
      type: String,
      required: true,
      unique: true
    },
    prefix: {
      type: String,
      default: DEFAULT_GUILD_SETTINGS.prefix
    },
    language: {
      type: String,
      default: DEFAULT_GUILD_SETTINGS.language
    }
  },
  {
    timestamps: true
  }
);

// Avoid model recompilation in watch mode.
const GuildModel = mongoose.models.Guild || mongoose.model('Guild', guildSchema);

const guildSettingsCache = new Map();

/**
 * Establishes a connection to MongoDB using Mongoose.
 * @returns {Promise<void>}
 */
async function connectMongo() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (!config.mongoUri) {
    throw new Error('Missing MONGO_URI in environment configuration.');
  }

  try {
    await mongoose.connect(config.mongoUri, {
      maxPoolSize: 10
    });
    // eslint-disable-next-line no-console
    console.log('[Database] MongoDB connection established.');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('[Database] MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Retrieves existing guild configuration or creates it with defaults.
 * Uses an in-memory cache to minimize database lookups.
 * @param {string} guildId - The Discord guild identifier.
 * @returns {Promise<{guildId: string, prefix: string, language: string}>}
 */
async function getGuildSettings(guildId) {
  if (!guildId) {
    throw new Error('getGuildSettings called without a guildId.');
  }

  const cached = guildSettingsCache.get(guildId);
  if (cached) {
    return cached;
  }

  let guildConfig = await GuildModel.findOne({ guildId }).lean();

  if (!guildConfig) {
    guildConfig = await GuildModel.create({
      guildId,
      ...DEFAULT_GUILD_SETTINGS
    });
  }

  const settings = {
    guildId: guildConfig.guildId,
    prefix: guildConfig.prefix ?? DEFAULT_GUILD_SETTINGS.prefix,
    language: guildConfig.language ?? DEFAULT_GUILD_SETTINGS.language
  };

  guildSettingsCache.set(guildId, settings);
  return settings;
}

/**
 * Updates guild configuration values and refreshes the cache.
 * @param {string} guildId - The Discord guild identifier.
 * @param {Partial<{prefix: string, language: string}>} updates - New values to persist.
 * @returns {Promise<{guildId: string, prefix: string, language: string}>}
 */
async function updateGuildSettings(guildId, updates = {}) {
  if (!guildId) {
    throw new Error('updateGuildSettings called without a guildId.');
  }

  const sanitizedUpdates = {};

  if (typeof updates.prefix === 'string') {
    sanitizedUpdates.prefix = updates.prefix;
  }

  if (typeof updates.language === 'string') {
    sanitizedUpdates.language = updates.language;
  }

  const merged = {
    ...DEFAULT_GUILD_SETTINGS,
    ...sanitizedUpdates
  };

  await GuildModel.updateOne(
    { guildId },
    {
      $set: merged
    },
    { upsert: true }
  );

  const updatedSettings = {
    guildId,
    ...merged
  };

  guildSettingsCache.set(guildId, updatedSettings);
  return updatedSettings;
}

/**
 * Clears the cached guild settings. Useful across shards or tests.
 * @param {string} [guildId] - Optional guild ID to clear. Clears all when undefined.
 * @returns {void}
 */
function clearGuildSettingsCache(guildId) {
  if (guildId) {
    guildSettingsCache.delete(guildId);
    return;
  }

  guildSettingsCache.clear();
}

module.exports = {
  connectMongo,
  getGuildSettings,
  updateGuildSettings,
  clearGuildSettingsCache,
  DEFAULT_GUILD_SETTINGS
};
