const multer = require('multer');
const ApiError = require('../utils/ApiError');
module.exports = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) => (/^image\/(jpeg|png|webp)$/.test(file.mimetype) ? cb(null, true) : cb(new ApiError(400, 'Only JPG, PNG or WebP images are allowed'))),
});
