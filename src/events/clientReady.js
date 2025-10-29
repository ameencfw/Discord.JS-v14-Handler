module.exports = {
  name: 'clientReady',
  once: true,
  /**
   * Runs once when the client becomes ready.
   * @param {import('discord.js').Client} client - Discord.js client instance.
   * @returns {Promise<void>}
   */
  async execute(client) {
    console.log(`[Client] Logged in as ${client.user.tag}`);

    try {
      await client.user.setPresence({
        status: 'online',
        activities: [
          {
            name: 'Managing commands',
            type: 0
          }
        ]
      });
    } catch (error) {
      console.error('Failed to set presence:', error);
    }
  }
};
