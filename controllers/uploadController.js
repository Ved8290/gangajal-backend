const path = require('path');
const crypto = require('crypto');
const sharp = require('sharp');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const DIR = path.join(__dirname, '..', 'uploads');
// Resizes to a 1200px and a 400px WebP so pages load fast on mobile
exports.images = asyncHandler(async (req, res) => {
  if (!req.files?.length) throw new ApiError(400, 'No image uploaded');
  const out = [];
  for (const f of req.files) {
    const name = crypto.randomBytes(12).toString('hex');
    await sharp(f.buffer).rotate().resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(DIR, `${name}.webp`));
    await sharp(f.buffer).rotate().resize({ width: 400, height: 400, fit: 'cover' }).webp({ quality: 78 }).toFile(path.join(DIR, `${name}-thumb.webp`));
    out.push({ url: `/uploads/${name}.webp`, thumb: `/uploads/${name}-thumb.webp` });
  }
  res.status(201).json({ success: true, images: out });
});
