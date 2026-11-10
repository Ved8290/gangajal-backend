const Counter = require('../models/Counter');
// Atomic, race-free sequence per year -> GJ-2026-0001
module.exports = async function nextOrderId() {
  const year = new Date().getFullYear();
  const c = await Counter.findOneAndUpdate({ _id: `order-${year}` }, { $inc: { seq: 1 } }, { new: true, upsert: true });
  return `GJ-${year}-${String(c.seq).padStart(4, '0')}`;
};
