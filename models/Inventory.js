// Stock adjustment history (one row per stock change)
const mongoose = require('mongoose');
const schema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', index: true },
    sku: String,
    productName: String,
    change: { type: Number, required: true },
    stockAfter: { type: Number, required: true },
    reason: String,
    orderId: String,
    by: String,
  },
  { timestamps: true }
);
schema.index({ createdAt: -1 });
module.exports = mongoose.model('Inventory', schema);
