const path = require('path');
const { loadFilesRecursively } = require('../utils/fileLoader');

/**
 * Dynamically loads event modules and registers them on the client.
 * @param {import('discord.js').Client} client - Discord.js client instance.
 * @returns {Promise<void>}
 */
async function loadEvents(client) {
  const eventsDir = path.join(__dirname, '..', 'events');
  const files = loadFilesRecursively(eventsDir);

  for (const filePath of files) {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const event = require(filePath);

    if (!event?.name || typeof event.execute !== 'function') {
      // eslint-disable-next-line no-console
      console.warn(`[Events] Skipping ${filePath} due to invalid export shape.`);
      continue;
    }

    if (event.once) {
      client.once(event.name, (...args) => event.execute(...args, client));
    } else {
      client.on(event.name, (...args) => event.execute(...args, client));
    }
  }

  // eslint-disable-next-line no-console
  console.log(`[Events] Loaded ${files.length} events.`);
}

module.exports = {
  loadEvents
};
