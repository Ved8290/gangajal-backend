const mongoose = require('mongoose');
const schema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, unique: true },
    whatsapp: String,
    address: String,
    city: String,
    district: String,
    state: String,
    pincode: String,
    landmark: String,
    preferredLanguage: { type: String, default: 'mr' },
    totalOrders: { type: Number, default: 0 },
    totalAmount: { type: Number, default: 0 },
    lastOrderAt: Date,
  },
  { timestamps: true }
);
schema.index({ fullName: 1 });
module.exports = mongoose.model('Customer', schema);
