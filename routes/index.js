const router = require('express').Router();
const { protect, optionalAuth, restrictTo } = require('../middleware/auth');
const validate = require('../middleware/validate');
const v = require('../validators');
const { loginLimiter, orderLimiter, trackLimiter } = require('../middleware/rateLimiter');
const upload = require('../middleware/upload');
const auth = require('../controllers/authController');
const products = require('../controllers/productController');
const orders = require('../controllers/orderController');
const customers = require('../controllers/customerController');
const dashboard = require('../controllers/dashboardController');
const inventory = require('../controllers/inventoryController');
const settings = require('../controllers/settingsController');
const uploads = require('../controllers/uploadController');

const adminOnly = restrictTo('admin');

// Auth
router.post('/auth/login', loginLimiter, v.login, validate, auth.login);
router.post('/auth/logout', auth.logout);
router.get('/auth/me', protect, auth.me);

// Products (public read, admin write)
router.get('/products', optionalAuth, products.list);
router.get('/products/:id', optionalAuth, products.getOne);
router.post('/products', protect, v.product, validate, products.create);
router.put('/products/:id', protect, v.product, validate, products.update);
router.delete('/products/:id', protect, adminOnly, products.remove);

// Orders
router.post('/orders', orderLimiter, v.createOrder, validate, orders.create);
router.post('/orders/track', trackLimiter, v.track, validate, orders.track);
router.get('/orders/export/csv', protect, orders.exportCsv);
router.get('/orders', protect, orders.list);
router.get('/orders/:id', protect, orders.getOne);
router.put('/orders/:id/status', protect, v.status, validate, orders.updateStatus);
router.put('/orders/:id', protect, v.orderUpdate, validate, orders.update);
router.delete('/orders/:id', protect, adminOnly, orders.remove);

// Customers, dashboard, inventory
router.get('/customers', protect, customers.list);
router.get('/customers/:id', protect, customers.getOne);
router.get('/dashboard/stats', protect, dashboard.stats);
router.get('/inventory', protect, inventory.list);
router.put('/inventory/:id', protect, v.inventory, validate, inventory.adjust);

// Settings (public read: business contact info and shipping rules are shown to customers)
router.get('/settings', settings.get);
router.put('/settings', protect, adminOnly, v.settings, validate, settings.update);

// Image upload
router.post('/upload', protect, upload.array('images', 8), uploads.images);

module.exports = router;
