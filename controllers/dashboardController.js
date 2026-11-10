const Order = require('../models/Order');
const Product = require('../models/Product');
const Settings = require('../models/BusinessSettings');
const asyncHandler = require('../utils/asyncHandler');

exports.stats = asyncHandler(async (req, res) => {
  const settings = await Settings.get();
  const [byStatus, revenue, totalProducts, lowStock, recent] = await Promise.all([
    Order.aggregate([{ $group: { _id: '$orderStatus', count: { $sum: 1 } } }]),
    // Revenue = value of delivered orders (payment is collected manually, so it is never assumed)
    Order.aggregate([{ $match: { orderStatus: 'Delivered' } }, { $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
    Product.countDocuments(),
    Product.find({ active: true, stock: { $lte: settings.lowStockThreshold } }).select('name sku stock').sort({ stock: 1 }).limit(10).lean(),
    Order.find().sort({ createdAt: -1 }).limit(6).select('orderId customer.fullName totalAmount orderStatus createdAt').lean(),
  ]);
  const c = Object.fromEntries(byStatus.map((s) => [s._id, s.count]));
  res.json({
    success: true,
    stats: {
      totalOrders: byStatus.reduce((a, s) => a + s.count, 0),
      pending: c['Pending WhatsApp Confirmation'] || 0,
      confirmed: c.Confirmed || 0,
      processing: (c.Processing || 0) + (c.Packed || 0) + (c.Shipped || 0),
      delivered: c.Delivered || 0,
      cancelled: c.Cancelled || 0,
      revenue: revenue[0]?.total || 0,
      totalProducts,
      lowStockCount: lowStock.length,
      lowStock,
      recent,
    },
  });
});
