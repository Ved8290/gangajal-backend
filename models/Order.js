const mongoose = require('mongoose');
const { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES } = require('../utils/constants');
const { Schema } = mongoose;
const item = new Schema(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    sku: String,
    name: { mr: String, hi: String, en: String },
    size: String,
    price: Number,
    quantity: Number,
  },
  { _id: false }
);
const history = new Schema({ status: String, note: String, by: String, at: { type: Date, default: Date.now } }, { _id: false });
const schema = new Schema(
  {
    orderId: { type: String, unique: true, required: true },
    idempotencyKey: { type: String, unique: true, sparse: true },
    customer: {
      fullName: { type: String, required: true, trim: true },
      mobile: { type: String, required: true, trim: true },
      whatsapp: { type: String, trim: true },
      address: { type: String, required: true, trim: true },
      city: { type: String, required: true, trim: true },
      district: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
      landmark: { type: String, trim: true, default: '' },
      notes: { type: String, trim: true, default: '' },
      preferredLanguage: { type: String, enum: ['mr', 'hi', 'en'], default: 'mr' },
    },
    items: [item],
    subtotal: { type: Number, required: true },
    shippingCharges: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'UPI' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'Pending' },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'Pending WhatsApp Confirmation' },
    whatsappConfirmed: { type: Boolean, default: false },
    whatsappConfirmedAt: Date,
    stockDeducted: { type: Boolean, default: false },
    trackingNumber: { type: String, trim: true, default: '' },
    adminNotes: { type: String, trim: true, default: '' },
    orderDate: { type: Date, default: Date.now },
    statusHistory: [history],
  },
  { timestamps: true }
);
schema.index({ orderStatus: 1, createdAt: -1 });
schema.index({ 'customer.mobile': 1 });
schema.index({ 'customer.pincode': 1 });
schema.index({ 'customer.fullName': 1 });
module.exports = mongoose.model('Order', schema);
