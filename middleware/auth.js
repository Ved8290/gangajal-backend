const jwt = require('jsonwebtoken');
const env = require('../config/env');
const Admin = require('../models/Admin');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const getToken = (req) => req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.slice(7) : null);
async function load(req) {
  const t = getToken(req);
  if (!t) return null;
  const d = jwt.verify(t, env.jwtSecret);
  const admin = await Admin.findById(d.id);
  return admin && admin.active ? admin : null;
}
exports.protect = asyncHandler(async (req, res, next) => {
  let admin;
  try {
    admin = await load(req);
  } catch {
    throw new ApiError(401, 'Session expired. Please log in again.');
  }
  if (!admin) throw new ApiError(401, 'Not authenticated');
  req.admin = admin;
  next();
});
exports.optionalAuth = async (req, res, next) => {
  try {
    req.admin = await load(req);
  } catch {
    req.admin = null;
  }
  next();
};
exports.restrictTo = (...roles) => (req, res, next) => (roles.includes(req.admin.role) ? next() : next(new ApiError(403, 'You do not have permission to do this')));
