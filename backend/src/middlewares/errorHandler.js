// Express error-handling middleware (must declare 4 args)
const errorHandler = (err, req, res, next) => {
  console.error('[sira-backend] error:', err);

  const status = err.status || err.statusCode || 500;

  res.status(status).json({
    error: {
      message: err.message || 'Internal Server Error',
      status,
    },
  });
};

module.exports = errorHandler;
