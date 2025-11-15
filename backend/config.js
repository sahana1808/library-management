// config.js
require('dotenv').config();

module.exports = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/library_db',
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:5500',
  jwtSecret: process.env.JWT_SECRET || 'change_this_secret'
};
