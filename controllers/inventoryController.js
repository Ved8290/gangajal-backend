const Product = require('../models/Product');
const Inventory = require('../models/Inventory');
const Settings = require('../models/BusinessSettings');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const paginate = require('../utils/paginate');

exports.list = asyncHandler(async (req, res) => {
  const { page, limit, skip } = paginate(req.query, 30);
  if (req.query.history === 'true') {
    const f = req.query.product ? { product: req.query.product } : {};
    const [items, total] = await Promise.all([Inventory.find(f).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(), Inventory.countDocuments(f)]);
    return res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
  }
  const settings = await Settings.get();
  const f = req.query.lowOnly === 'true' ? { stock: { $lte: settings.lowStockThreshold } } : {};
  const [items, total] = await Promise.all([Product.find(f).select('name sku stock size active images').sort({ stock: 1 }).skip(skip).limit(limit).lean(), Product.countDocuments(f)]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit), lowStockThreshold: settings.lowStockThreshold });
});

exports.adjust = asyncHandler(async (req, res) => {
  const p = await Product.findById(req.params.id);
  if (!p) throw new ApiError(404, 'Product not found');
  const { mode, quantity, reason } = req.body;
  const next = mode === 'set' ? quantity : p.stock + quantity;
  if (next < 0) throw new ApiError(400, 'Stock cannot go below zero');
  const change = next - p.stock;
  p.stock = next;
  await p.save();
  await Inventory.create({ product: p._id, sku: p.sku, productName: p.name.en, change, stockAfter: next, reason: reason || 'Manual adjustment', by: req.admin.name });
  res.json({ success: true, product: p });
});
