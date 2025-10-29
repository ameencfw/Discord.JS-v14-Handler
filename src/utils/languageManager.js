const fs = require('fs');
const path = require('path');
const config = require('../config');

const cache = new Map();
const languagesDir = path.join(__dirname, '..', 'languages');

/**
 * Reads a language JSON file from disk, caching the result.
 * @param {string} languageCode - ISO-like language key (e.g., en, ar).
 * @returns {object}
 */
function getLanguageData(languageCode = config.defaultLanguage) {
  const normalizedCode = languageCode.toLowerCase();

  if (cache.has(normalizedCode)) {
    return cache.get(normalizedCode);
  }

  const resolvedPath = path.join(languagesDir, `${normalizedCode}.json`);

  if (!fs.existsSync(resolvedPath)) {
    if (normalizedCode !== config.defaultLanguage) {
      return getLanguageData(config.defaultLanguage);
    }
    return {};
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    cache.set(normalizedCode, parsed);
    return parsed;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error(`[Languages] Failed to parse ${resolvedPath}:`, error);
    return {};
  }
}

/**
 * Translates a key path using dot-notation (e.g. "commands.ping.reply").
 * Falls back to the default language and then to a provided fallback string.
 * @param {string} languageCode - Language code to load.
 * @param {string} keyPath - Dot-notation path inside the language file.
 * @param {string} [fallback] - Optional fallback string.
 * @returns {string}
 */
function translate(languageCode, keyPath, fallback) {
  const keys = keyPath.split('.');

  const target = getLanguageData(languageCode);
  const defaultTarget = languageCode === config.defaultLanguage ? target : getLanguageData(config.defaultLanguage);

  const valueFromTarget = keys.reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), target);
  if (typeof valueFromTarget === 'string') {
    return valueFromTarget;
  }

  const valueFromDefault = keys.reduce(
    (acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined),
    defaultTarget
  );
  if (typeof valueFromDefault === 'string') {
    return valueFromDefault;
  }

  return fallback ?? keyPath;
}

/**
 * Clears cached language files (useful for hot-reloading).
 * @returns {void}
 */
function clearLanguageCache() {
  cache.clear();
}

module.exports = {
  translate,
  getLanguageData,
  clearLanguageCache
};
