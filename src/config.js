const path = require('path');
const dotenv = require('dotenv');

dotenv.config({
  path: path.resolve(process.cwd(), '.env')
});

const config = {
  botToken: process.env.TOKEN ?? '',
  mongoUri: process.env.MONGO_URI ?? '',
  defaultPrefix: process.env.DEFAULT_PREFIX ?? '!',
  defaultLanguage: process.env.DEFAULT_LANGUAGE ?? 'en',
  clientId: process.env.CLIENT_ID ?? '',
  owners: (process.env.OWNERS ?? '')
    .split(',')
    .map((ownerId) => ownerId.trim())
    .filter(Boolean)
};

module.exports = config;
