const mongoose = require('mongoose');
const env = require('../config/env');
const schema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    businessName: { type: String, default: 'Gangajal & Trambakeshwar Jal' },
    logo: { type: String, default: '' },
    whatsappNumber: { type: String, default: '' },
    contactNumber: { type: String, default: '' },
    email: { type: String, default: '' },
    address: { type: String, default: 'Nashik, Maharashtra, India' },
    shippingCharges: { type: Number, default: 50, min: 0 },
    freeShippingThreshold: { type: Number, default: 1000, min: 0 },
    lowStockThreshold: { type: Number, default: 10, min: 0 },
    gst: { enabled: { type: Boolean, default: false }, number: { type: String, default: '' }, rate: { type: Number, default: 5 } },
    invoice: {
      prefix: { type: String, default: 'INV' },
      footerNote: { type: String, default: 'Thank you for your order!' },
      terms: { type: String, default: '' },
    },
    pos: {
      paperSize: { type: String, enum: ['58mm', '80mm', 'A4'], default: '80mm' },
      showLogo: { type: Boolean, default: true },
      showQr: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);
schema.statics.get = function () {
  return this.findOneAndUpdate({ key: 'main' }, { $setOnInsert: { key: 'main', whatsappNumber: env.whatsappNumber } }, { new: true, upsert: true });
};
module.exports = mongoose.model('BusinessSettings', schema);
