const rateLimit = require('express-rate-limit');
const make = (windowMs, max, message) => rateLimit({ windowMs, max, standardHeaders: true, legacyHeaders: false, message: { success: false, message } });
exports.apiLimiter = make(15 * 60 * 1000, 500, 'Too many requests, please try again later.');
exports.loginLimiter = make(15 * 60 * 1000, 10, 'Too many login attempts, please try again in 15 minutes.');
exports.orderLimiter = make(60 * 60 * 1000, 30, 'Too many orders from this network, please try again later.');
exports.trackLimiter = make(15 * 60 * 1000, 30, 'Too many lookups, please try again later.');
