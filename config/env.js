require('dotenv').config();
['MONGO_URI', 'JWT_SECRET'].forEach((k) => {
  if (!process.env[k]) {
    console.error(`Missing required environment variable: ${k}`);
    process.exit(1);
  }
});
const nodeEnv = process.env.NODE_ENV || 'development';
module.exports = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  clientUrls: (process.env.CLIENT_URLS || 'http://localhost:5173').split(',').map((s) => s.trim()),
  siteUrl: (process.env.SITE_URL || 'http://localhost:5000').replace(/\/$/, ''),
  whatsappNumber: process.env.WHATSAPP_NUMBER || '919999999999',
  cookieSameSite: process.env.COOKIE_SAMESITE || 'lax',
  admin: {
    name: process.env.ADMIN_NAME || 'Store Admin',
    email: process.env.ADMIN_EMAIL,
    password: process.env.ADMIN_PASSWORD,
  },
};
