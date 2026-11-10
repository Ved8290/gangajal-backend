const mongoose = require('mongoose');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Settings = require('../models/BusinessSettings');
const stock = require('../services/stockService');
const { createOrder, computeTotals } = require('../services/orderService');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const paginate = require('../utils/paginate');
const { escapeRegex, STOCK_STATUSES } = require('../utils/constants');

const idFilter = (id) => (mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { orderId: id }] } : { orderId: String(id) });
const findOrder = async (id) => {
  const o = await Order.findOne(idFilter(id));
  if (!o) throw new ApiError(404, 'Order not found');
  return o;
};

function buildFilter(q) {
  const f = {};
  if (q.status) f.orderStatus = String(q.status);
  if (q.payment) f.paymentStatus = String(q.payment);
  if (q.q) {
    const r = new RegExp(escapeRegex(String(q.q).trim()), 'i');
    f.$or = [{ orderId: r }, { 'customer.fullName': r }, { 'customer.mobile': r }, { 'customer.pincode': r }];
  }
  const from = q.from ? new Date(q.from) : null;
  const to = q.to ? new Date(q.to) : null;
  if ((from && !isNaN(from)) || (to && !isNaN(to))) {
    f.createdAt = {};
    if (from && !isNaN(from)) f.createdAt.$gte = from;
    if (to && !isNaN(to)) { to.setHours(23, 59, 59, 999); f.createdAt.$lte = to; }
  }
  return f;
}

// ---- public ----
exports.create = asyncHandler(async (req, res) => {
  const { idempotencyKey } = req.body;
  if (idempotencyKey) {
    const existing = await Order.findOne({ idempotencyKey });
    if (existing) return res.json({ success: true, duplicate: true, order: existing });
  }
  try {
    const order = await createOrder(req.body);
    res.status(201).json({ success: true, order });
  } catch (e) {
    if (e.code === 11000 && idempotencyKey) {
      const existing = await Order.findOne({ idempotencyKey });
      if (existing) return res.json({ success: true, duplicate: true, order: existing });
    }
    throw e;
  }
});

// Customer tracking: needs Order ID + mobile number. Internal notes are never returned.
exports.track = asyncHandler(async (req, res) => {
  const o = await Order.findOne({ orderId: req.body.orderId.toUpperCase(), 'customer.mobile': req.body.mobile }).lean();
  if (!o) throw new ApiError(404, 'No order found with these details');
  res.json({
    success: true,
    order: {
      orderId: o.orderId, orderStatus: o.orderStatus, whatsappConfirmed: o.whatsappConfirmed, paymentStatus: o.paymentStatus, paymentMethod: o.paymentMethod,
      trackingNumber: o.trackingNumber, items: o.items, subtotal: o.subtotal, shippingCharges: o.shippingCharges, discount: o.discount, totalAmount: o.totalAmount, createdAt: o.createdAt,
      statusHistory: o.statusHistory.map((h) => ({ status: h.status, at: h.at })),
    },
  });
});

// ---- admin ----
exports.list = asyncHandler(async (req, res) => {
  const f = buildFilter(req.query);
  const { page, limit, skip } = paginate(req.query, 20);
  const [items, total] = await Promise.all([Order.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Order.countDocuments(f)]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

exports.getOne = asyncHandler(async (req, res) => res.json({ success: true, order: await findOrder(req.params.id) }));

exports.updateStatus = asyncHandler(async (req, res) => {
  const order = await findOrder(req.params.id);
  const { status, note, trackingNumber } = req.body;
  if (order.orderStatus === 'Cancelled') throw new ApiError(400, 'A cancelled order cannot be changed');
  if (order.orderStatus === status) throw new ApiError(400, 'Order is already in this status');
  const by = req.admin.name;

  if (STOCK_STATUSES.includes(status) && !order.stockDeducted) await stock.deduct(order, by);
  if (status === 'Cancelled') {
    if (order.stockDeducted) await stock.restore(order, by);
    await Customer.updateOne({ mobile: order.customer.mobile }, { $inc: { totalOrders: -1, totalAmount: -order.totalAmount } });
  }
  if (status === 'Confirmed' && !order.whatsappConfirmed) { order.whatsappConfirmed = true; order.whatsappConfirmedAt = new Date(); }
  if (trackingNumber !== undefined) order.trackingNumber = trackingNumber;
  order.orderStatus = status;
  order.statusHistory.push({ status, note: note || '', by });
  await order.save();
  res.json({ success: true, order });
});

exports.update = asyncHandler(async (req, res) => {
  const order = await findOrder(req.params.id);
  const b = req.body;
  ['paymentMethod', 'paymentStatus', 'adminNotes', 'trackingNumber'].forEach((k) => { if (b[k] !== undefined) order[k] = b[k]; });
  if (b.whatsappConfirmed !== undefined) { order.whatsappConfirmed = b.whatsappConfirmed; order.whatsappConfirmedAt = b.whatsappConfirmed ? new Date() : undefined; }
  if (b.customer) ['fullName', 'mobile', 'whatsapp', 'address', 'city', 'district', 'state', 'pincode', 'landmark', 'notes'].forEach((k) => { if (b.customer[k] !== undefined) order.customer[k] = b.customer[k]; });
  if (b.discount !== undefined) {
    order.discount = Math.min(b.discount, order.subtotal + order.shippingCharges);
    order.totalAmount = computeTotals(order.subtotal, { freeShippingThreshold: 0, shippingCharges: order.shippingCharges }, order.discount).totalAmount;
  }
  await order.save();
  res.json({ success: true, order });
});

exports.remove = asyncHandler(async (req, res) => {
  const order = await findOrder(req.params.id);
  if (order.stockDeducted) await stock.restore(order, req.admin.name, 'Order deleted');
  if (order.orderStatus !== 'Cancelled') await Customer.updateOne({ mobile: order.customer.mobile }, { $inc: { totalOrders: -1, totalAmount: -order.totalAmount } });
  await order.deleteOne();
  res.json({ success: true });
});

const esc = (v) => {
  let s = v === undefined || v === null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`; // block CSV formula injection
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
exports.exportCsv = asyncHandler(async (req, res) => {
  const orders = await Order.find(buildFilter(req.query)).sort({ createdAt: -1 }).limit(10000).lean();
  const head = ['Order ID', 'Date', 'Customer', 'Mobile', 'WhatsApp', 'Address', 'City', 'District', 'State', 'PIN', 'Products', 'Subtotal', 'Shipping', 'Discount', 'Total', 'Payment Method', 'Payment Status', 'Order Status', 'Tracking', 'Notes'];
  const rows = orders.map((o) => [o.orderId, new Date(o.createdAt).toISOString().slice(0, 16).replace('T', ' '), o.customer.fullName, o.customer.mobile, o.customer.whatsapp, o.customer.address, o.customer.city, o.customer.district, o.customer.state, o.customer.pincode, o.items.map((i) => `${i.name.en} x${i.quantity}`).join('; '), o.subtotal, o.shippingCharges, o.discount, o.totalAmount, o.paymentMethod, o.paymentStatus, o.orderStatus, o.trackingNumber, o.adminNotes]);
  const csv = '\uFEFF' + [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
  res.set({ 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"` }).send(csv);
});
