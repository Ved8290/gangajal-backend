const Settings = require('../models/BusinessSettings');
const asyncHandler = require('../utils/asyncHandler');

const FIELDS = ['businessName', 'logo', 'whatsappNumber', 'contactNumber', 'email', 'address', 'shippingCharges', 'freeShippingThreshold', 'lowStockThreshold', 'gst', 'invoice', 'pos'];
exports.get = asyncHandler(async (req, res) => res.json({ success: true, settings: await Settings.get() }));
exports.update = asyncHandler(async (req, res) => {
  const s = await Settings.get();
  FIELDS.forEach((k) => { if (req.body[k] !== undefined) s.set(k, req.body[k]); });
  await s.save();
  res.json({ success: true, settings: s });
});
