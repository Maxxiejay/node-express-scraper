const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error(err.stack);

  // Default error
  let error = { ...err };
  error.message = err.message;

  // Axios errors
  if (err.response) {
    error.message = `HTTP ${err.response.status}: ${err.response.statusText}`;
    error.statusCode = err.response.status;
  }

  // Network errors
  if (err.code === 'ENOTFOUND') {
    error.message = 'Website not found or network error';
    error.statusCode = 404;
  }

  // Timeout errors
  if (err.code === 'ECONNABORTED') {
    error.message = 'Request timeout - website took too long to respond';
    error.statusCode = 408;
  }

  // Connection refused
  if (err.code === 'ECONNREFUSED') {
    error.message = 'Connection refused by the target website';
    error.statusCode = 503;
  }

  // Invalid URL
  if (err.message.includes('Invalid URL')) {
    error.statusCode = 400;
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };