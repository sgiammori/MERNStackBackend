export const errorHandler = (err, req, res, next) => {
  // Routes set res.status(4xx) before throwing; keep that code instead of turning it into 500
  const status_code = err.status || (res.statusCode >= 400 ? res.statusCode : 500);
  res.status(status_code).json({
    message: err.message || 'Internal Server Error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : null
});
};