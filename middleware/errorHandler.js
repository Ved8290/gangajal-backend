const env = require('../config/env');
exports.notFound = (req, res) => res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
exports.errorHandler = (err, req, res, next) => {
  let status = err.status || 500;
  let message = err.message || 'Server error';
  const code = err.code && typeof err.code === 'string' ? err.code : undefined;
  if (err.name === 'ValidationError') { status = 400; message = Object.values(err.errors).map((e) => e.message).join(', '); }
  else if (err.name === 'CastError') { status = 400; message = 'Invalid identifier'; }
  else if (err.code === 11000) { status = 409; message = `Duplicate value for ${Object.keys(err.keyPattern || {}).join(', ')}`; }
  else if (err.name === 'MulterError') { status = 400; message = err.message; }
  if (status >= 500) { console.error(err); if (env.isProd) message = 'Internal server error'; }
  res.status(status).json({ success: false, message, code });
};
