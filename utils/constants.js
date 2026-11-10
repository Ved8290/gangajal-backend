exports.ORDER_STATUSES = ['Pending WhatsApp Confirmation', 'Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered', 'Cancelled'];
// Statuses at which stock must have been deducted
exports.STOCK_STATUSES = ['Confirmed', 'Processing', 'Packed', 'Shipped', 'Delivered'];
exports.PAYMENT_METHODS = ['upi', 'Bank Transfer'];
exports.PAYMENT_STATUSES = ['Pending', 'Paid', 'Failed', 'Refunded'];
exports.CATEGORIES = ['gangajal', 'trambakeshwar', 'kumbh', 'gift'];
exports.LANGS = ['mr', 'hi', 'en'];
exports.escapeRegex = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
