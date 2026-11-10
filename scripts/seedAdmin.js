
const dns = require('node:dns');

// Use DNS servers that successfully resolved MongoDB SRV records
dns.setServers(['8.8.8.8', '1.1.1.1']);

const env = require('../config/env');
const connectDB = require('../config/db');
const Admin = require('../models/Admin');
const Settings = require('../models/BusinessSettings');

(async () => {
  await connectDB();

  const { email, password, name } = env.admin;

  if (!email || !password) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in .env');
  }

  if (password.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  const existing = await Admin.findOne({
    email: email.toLowerCase()
  });

  if (existing) {
    console.log('Admin already exists:', email);
  } else {
    await Admin.create({
      name,
      email,
      password,
      role: 'admin'
    });

    console.log('Admin created:', email);
  }

  await Settings.get();

  console.log('Admin seeding completed successfully.');
  process.exit(0);
})().catch((error) => {
  console.error('Admin seeding failed:', error.message);
  process.exit(1);
});
