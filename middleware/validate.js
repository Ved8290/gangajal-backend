const { validationResult } = require('express-validator');
module.exports = (req, res, next) => {
  const r = validationResult(req);
  if (r.isEmpty()) return next();
  const errors = r.array().map((e) => ({ field: e.path, message: e.msg }));
  res.status(400).json({ success: false, message: `Invalid input: ${errors.map((e) => e.field).join(', ')}`, errors });
};
