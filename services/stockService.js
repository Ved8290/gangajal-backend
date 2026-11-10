const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const ApiError = require('../utils/ApiError');

// Deduct stock for every line of an order (all-or-nothing)
exports.deduct = async (order, by) => {
  const done = [];
  try {
    for (const it of order.items) {
      const p = await Product.findOneAndUpdate({ _id: it.product, stock: { $gte: it.quantity } }, { $inc: { stock: -it.quantity } }, { new: true });
      if (!p) throw new ApiError(409, `Insufficient stock for ${it.name?.en || it.sku}`, 'OUT_OF_STOCK');
      done.push({ it, p });
    }
  } catch (e) {
    for (const { it } of done) await Product.updateOne({ _id: it.product }, { $inc: { stock: it.quantity } });
    throw e;
  }
  await Inventory.insertMany(done.map(({ it, p }) => ({ product: p._id, sku: p.sku, productName: p.name.en, change: -it.quantity, stockAfter: p.stock, reason: 'Order confirmed', orderId: order.orderId, by })));
  order.stockDeducted = true;
};

// Give stock back (only called when stock had been deducted)
exports.restore = async (order, by, reason = 'Order cancelled') => {
  const logs = [];
  for (const it of order.items) {
    const p = await Product.findOneAndUpdate({ _id: it.product }, { $inc: { stock: it.quantity } }, { new: true });
    if (p) logs.push({ product: p._id, sku: p.sku, productName: p.name.en, change: it.quantity, stockAfter: p.stock, reason, orderId: order.orderId, by });
  }
  if (logs.length) await Inventory.insertMany(logs);
  order.stockDeducted = false;
};
