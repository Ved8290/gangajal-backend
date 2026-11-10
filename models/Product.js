const mongoose = require('mongoose');
const { CATEGORIES } = require('../utils/constants');
const tri = () => ({ mr: { type: String, trim: true, default: '' }, hi: { type: String, trim: true, default: '' }, en: { type: String, trim: true, default: '' } });
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
const schema = new mongoose.Schema(
  {
    name: tri(),
    description: tri(),
    slug: { type: String, unique: true, index: true },
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true },
    category: { type: String, enum: CATEGORIES, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0, default: null },
    effectivePrice: { type: Number, index: true },
    stock: { type: Number, default: 0, min: 0 },
    size: { type: String, trim: true, default: '' },
    images: [{ _id: false, url: String, thumb: String }],
    featured: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);
schema.index({ 'name.en': 1 });
schema.pre('validate', function (next) {
  if (!this.slug) this.slug = `${slugify(this.name.en || 'product')}-${slugify(this.sku || Date.now())}`;
  next();
});
schema.pre('save', function (next) {
  this.effectivePrice = this.discountPrice && this.discountPrice < this.price ? this.discountPrice : this.price;
  next();
});
module.exports = mongoose.model('Product', schema);
