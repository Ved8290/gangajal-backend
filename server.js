
const env = require('./config/env');
const connectDB = require('./config/db');
const app = require('./app');

const dns = require('node:dns');

dns.setServers(['1.1.1.1', '8.8.8.8']);

connectDB()
  .then(() => {
    app.listen(env.port, () => {
      console.log(
        `Server running on port ${env.port} (${env.nodeEnv})`
      );
    });
  })
  .catch((error) => {
    console.error('Failed to start:', error.message);
    process.exit(1);
  });
