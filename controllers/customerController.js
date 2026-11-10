const mongoose = require('mongoose');
const Customer = require('../models/Customer');
const Order = require('../models/Order');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const paginate = require('../utils/paginate');
const { escapeRegex } = require('../utils/constants');

exports.list = asyncHandler(async (req, res) => {
  const f = {};
  if (req.query.q) {
    const r = new RegExp(escapeRegex(String(req.query.q).trim()), 'i');
    f.$or = [{ fullName: r }, { mobile: r }, { whatsapp: r }, { pincode: r }];
  }
  const { page, limit, skip } = paginate(req.query, 20);
  const [items, total] = await Promise.all([Customer.find(f).sort({ lastOrderAt: -1 }).skip(skip).limit(limit).lean(), Customer.countDocuments(f)]);
  res.json({ success: true, items, total, page, pages: Math.ceil(total / limit) });
});

exports.getOne = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new ApiError(400, 'Invalid id');
  const customer = await Customer.findById(req.params.id).lean();
  if (!customer) throw new ApiError(404, 'Customer not found');
  const orders = await Order.find({ 'customer.mobile': customer.mobile }).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ success: true, customer, orders });
});
