module.exports = (q, defLimit = 12, maxLimit = 100) => {
  const page = Math.max(parseInt(q.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(q.limit, 10) || defLimit, 1), maxLimit);
  return { page, limit, skip: (page - 1) * limit };
};
