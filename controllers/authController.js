const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Admin = require('../models/Admin');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const cookieOpts = { httpOnly: true, secure: env.isProd || env.cookieSameSite === 'none', sameSite: env.cookieSameSite, path: '/' };
const safe = (a) => ({ id: a._id, name: a.name, email: a.email, role: a.role });

exports.login = asyncHandler(async (req, res) => {
  const admin = await Admin.findOne({ email: req.body.email }).select('+password');
  if (!admin || !admin.active || !(await admin.comparePassword(req.body.password))) throw new ApiError(401, 'Invalid email or password');
  const token = jwt.sign({ id: admin._id }, env.jwtSecret, { expiresIn: env.jwtExpires });
  res.cookie('token', token, { ...cookieOpts, maxAge: 7 * 24 * 60 * 60 * 1000 });
  res.json({ success: true, admin: safe(admin) });
});
exports.logout = (req, res) => {
  res.clearCookie('token', cookieOpts);
  res.json({ success: true });
};
exports.me = (req, res) => res.json({ success: true, admin: safe(req.admin) });
