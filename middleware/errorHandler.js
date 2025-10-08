export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      details: {},
    },
  });
};

export const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.message || 'An unexpected error occurred';

  req.log?.error({ err, requestId: req.id }, 'Request error');

  res.status(statusCode).json({
    error: {
      code,
      message,
      details: err.details || {},
    },
  });
};
