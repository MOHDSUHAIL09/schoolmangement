import { ENV } from '../config/env.js';
import { logger } from '../utils/logger.js';

export const notFound = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  logger.error(`[${req.method}] ${req.url} - ${message}`, err);

  // Mongoose Bad ObjectId
  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    statusCode = 400;
    message = 'Resource not found or invalid identifier format.';
  }

  // Mongoose Duplicate Key Error (11000)
  if (err.code === 11000) {
    statusCode = 400;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `Duplicate value entered for ${field}. Please use another value.`;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((val) => val.message)
      .join(', ');
  }

  // Information Disclosure Defense (Anti-Reconnaissance):
  // Never expose raw stack traces or internal filesystem paths to client
  res.status(statusCode).json({
    success: false,
    message,
    ...(ENV.NODE_ENV === 'development' && {
      debugHint: 'Check server logs for detailed diagnostic trace.'
    })
  });
};
