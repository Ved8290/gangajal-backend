const { body } = require('express-validator');
const { ORDER_STATUSES, PAYMENT_METHODS, PAYMENT_STATUSES, CATEGORIES, LANGS } = require('../utils/constants');
const mobile = /^[6-9]\d{9}$/;

exports.login = [body('email').trim().toLowerCase().isEmail(), body('password').isString().isLength({ min: 6, max: 100 })];

exports.product = [
  body('name.en').trim().notEmpty().isLength({ max: 150 }),
  body('name.mr').trim().notEmpty().isLength({ max: 150 }),
  body('name.hi').trim().notEmpty().isLength({ max: 150 }),
  body('description.*').optional().isString().isLength({ max: 3000 }),
  body('sku').trim().notEmpty().isLength({ max: 40 }),
  body('category').isIn(CATEGORIES),
  body('price').isFloat({ min: 0 }).toFloat(),
  body('discountPrice').optional({ nullable: true, checkFalsy: true }).isFloat({ min: 0 }).toFloat(),
  body('stock').isInt({ min: 0 }).toInt(),
  body('size').optional().isString().isLength({ max: 40 }),
  body('images').optional().isArray({ max: 8 }),
  body('featured').optional().isBoolean().toBoolean(),
  body('active').optional().isBoolean().toBoolean(),
];

exports.createOrder = [
  body('customer.fullName').trim().isLength({ min: 2, max: 100 }),
  body('customer.mobile').trim().matches(mobile).withMessage('Invalid mobile number'),
  body('customer.whatsapp').optional({ checkFalsy: true }).trim().matches(mobile),
  body('customer.address').trim().isLength({ min: 5, max: 300 }),
  body('customer.city').trim().isLength({ min: 2, max: 100 }),
  body('customer.district').trim().isLength({ min: 2, max: 100 }),
  body('customer.state').trim().isLength({ min: 2, max: 100 }),
  body('customer.pincode').trim().matches(/^\d{6}$/).withMessage('Invalid PIN code'),
  body('customer.landmark').optional().trim().isLength({ max: 150 }),
  body('customer.notes').optional().trim().isLength({ max: 500 }),
  body('customer.preferredLanguage').optional().isIn(LANGS),
  body('items').isArray({ min: 1, max: 50 }),
  body('items.*.productId').isMongoId(),
  body('items.*.quantity').isInt({ min: 1, max: 100 }).toInt(),
  body('idempotencyKey').optional().isString().isLength({ min: 8, max: 80 }),
  body('paymentMethod').optional().isIn(['Cash on Delivery', 'UPI on Delivery', 'Bank Transfer']),
];

exports.track = [body('orderId').trim().notEmpty().isLength({ max: 30 }), body('mobile').trim().matches(mobile)];

exports.status = [
  body('status').isIn(ORDER_STATUSES),
  body('note').optional().isString().isLength({ max: 300 }),
  body('trackingNumber').optional().isString().isLength({ max: 80 }),
];

exports.orderUpdate = [
  body('paymentMethod').optional().isIn(PAYMENT_METHODS),
  body('paymentStatus').optional().isIn(PAYMENT_STATUSES),
  body('discount').optional().isFloat({ min: 0 }).toFloat(),
  body('adminNotes').optional().isString().isLength({ max: 2000 }),
  body('trackingNumber').optional().isString().isLength({ max: 80 }),
  body('whatsappConfirmed').optional().isBoolean().toBoolean(),
  body('customer.mobile').optional().matches(mobile),
  body('customer.pincode').optional().matches(/^\d{6}$/),
];

exports.settings = [
  body('whatsappNumber').optional({ checkFalsy: true }).matches(/^\d{10,15}$/).withMessage('WhatsApp number: digits only with country code'),
  body('email').optional({ checkFalsy: true }).isEmail(),
  body('shippingCharges').optional().isFloat({ min: 0 }).toFloat(),
  body('freeShippingThreshold').optional().isFloat({ min: 0 }).toFloat(),
  body('lowStockThreshold').optional().isInt({ min: 0 }).toInt(),
  body('gst.rate').optional().isFloat({ min: 0, max: 100 }).toFloat(),
  body('pos.paperSize').optional().isIn(['58mm', '80mm', 'A4']),
];

exports.inventory = [
  body('mode').isIn(['set', 'adjust']),
  body('quantity').isInt().toInt(),
  body('reason').optional().isString().isLength({ max: 200 }),
];
