
const mongoose = require('mongoose');
const dns = require('node:dns');

const env = require('./env');

// Use DNS servers that worked in your local Node.js test
dns.setServers(['8.8.8.8', '1.1.1.1']);

mongoose.set('strictQuery', true);

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = {
    conn: null,
    promise: null
  };
}

const connectDB = async () => {
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      maxPoolSize: 10,
      bufferCommands: false
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log('MongoDB connected successfully');
    return cached.conn;
  } catch (error) {
    cached.promise = null;
    cached.conn = null;

    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
};

module.exports = connectDB;
