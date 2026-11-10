const Product = require('../models/Product');
const Order = require('../models/Order');
const Customer = require('../models/Customer');
const Settings = require('../models/BusinessSettings');
const nextOrderId = require('../utils/orderId');
const ApiError = require('../utils/ApiError');

exports.computeTotals = (subtotal, settings, discount = 0) => {
  const free = settings.freeShippingThreshold > 0 && subtotal >= settings.freeShippingThreshold;
  const shippingCharges = free ? 0 : settings.shippingCharges;
  return { shippingCharges, totalAmount: Math.max(subtotal + shippingCharges - discount, 0) };
};

// Prices always come from the database, never from the browser
exports.createOrder = async ({ customer, items, paymentMethod, idempotencyKey }) => {
  const settings = await Settings.get();
  const qtyById = new Map();
  items.forEach((i) => qtyById.set(String(i.productId), (qtyById.get(String(i.productId)) || 0) + i.quantity));
  const products = await Product.find({ _id: { $in: [...qtyById.keys()] }, active: true });
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const lines = [];
  let subtotal = 0;
  for (const [pid, qty] of qtyById) {
    const p = byId.get(pid);
    if (!p) throw new ApiError(400, 'One or more products are no longer available', 'PRODUCT_UNAVAILABLE');
    if (p.stock < qty) throw new ApiError(409, p.stock ? `Only ${p.stock} of "${p.name.en}" left in stock` : `"${p.name.en}" is out of stock`, 'OUT_OF_STOCK');
    lines.push({ product: p._id, sku: p.sku, name: { mr: p.name.mr, hi: p.name.hi, en: p.name.en }, size: p.size, price: p.effectivePrice, quantity: qty });
    subtotal += p.effectivePrice * qty;
  }
  const { shippingCharges, totalAmount } = exports.computeTotals(subtotal, settings);
  const orderId = await nextOrderId();
  const order = await Order.create({
    orderId,
    idempotencyKey: idempotencyKey || undefined,
    customer: { ...customer, whatsapp: customer.whatsapp || customer.mobile },
    items: lines,
    subtotal,
    shippingCharges,
    totalAmount,
    paymentMethod: paymentMethod || 'UPI',
    statusHistory: [{ status: 'Pending WhatsApp Confirmation', note: 'Order placed on website', by: 'customer' }],
  });
  const c = order.customer;
  await Customer.findOneAndUpdate(
    { mobile: c.mobile },
    { $set: { fullName: c.fullName, whatsapp: c.whatsapp, address: c.address, city: c.city, district: c.district, state: c.state, pincode: c.pincode, landmark: c.landmark, preferredLanguage: c.preferredLanguage, lastOrderAt: new Date() }, $inc: { totalOrders: 1, totalAmount: totalAmount } },
    { upsert: true }
  );
  return order;
};
