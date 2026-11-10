const mongoose = require('mongoose');
const Product = require('../models/Product');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const paginate = require('../utils/paginate');
const { escapeRegex } = require('../utils/constants');

const FIELDS = ['name', 'description', 'sku', 'category', 'price', 'discountPrice', 'stock', 'size', 'images', 'featured', 'active'];
const pick = (b) => FIELDS.reduce((o, k) => (b[k] !== undefined ? { ...o, [k]: b[k] } : o), {});
const SORTS = { price_asc: { effectivePrice: 1 }, price_desc: { effectivePrice: -1 }, newest: { createdAt: -1 } };

exports.list = asyncHandler(async (req, res) => {
  const q = req.query;
  const f = {};
  if (!(req.admin && q.all === 'true')) f.active = true;
  if (q.category) f.category = String(q.category);
  if (q.featured === 'true') f.featured = true;
  if (q.minPrice || q.maxPrice) {
    f.effectivePrice = {};
    if (q.minPrice) f.effectivePrice.$gte = Number(q.minPrice);
    if (q.maxPrice) f.effectivePrice.$lte = Number(q.maxPrice);
  }
  if (q.search) {
    const r = new RegExp(escapeRegex(String(q.search).trim()), 'i');
    f.$or = [{ 'name.mr': r }, { 'name.hi': r }, { 'name.en': r }, { sku: r }];
  }
  const { page, limit, skip } = paginate(q, 12);
  const [items, total] = await Promise.all([Product.find(f).sort(SORTS[q.sort] || SORTS.newest).skip(skip).limit(limit).lean(), Product.countDocuments(f)]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

exports.getOne = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const filter = mongoose.isValidObjectId(id) ? { $or: [{ _id: id }, { slug: id }] } : { slug: id };
  const product = await Product.findOne(filter).lean();
  if (!product || (!product.active && !req.admin)) throw new ApiError(404, 'Product not found');
  const related = await Product.find({ active: true, category: product.category, _id: { $ne: product._id } }).limit(4).lean();
  res.json({ success: true, product, related });
});

exports.create = asyncHandler(async (req, res) => {
  const product = await Product.create(pick(req.body));
  res.status(201).json({ success: true, product });
});

exports.update = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  product.set(pick(req.body));
  await product.save();
  res.json({ success: true, product });
});

exports.remove = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, 'Product not found');
  res.json({ success: true });
});
