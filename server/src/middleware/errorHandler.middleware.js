const { env } = require('../config/env');

// Catches errors thrown/passed via next(err) anywhere in the app.
// Must be registered LAST in app.js, after all routes.
function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal server error';

  if (statusCode === 500) {
    // Only log unexpected errors loudly; expected 4xx are normal client mistakes.
    console.error('[Unhandled Error]', err);
  }

  res.status(statusCode).json({
    error: message,
    details: err.details || undefined,
    stack: env.nodeEnv === 'development' ? err.stack : undefined,
  });
}

// 404 handler for unmatched routes - registered right before errorHandler.
function notFound(req, res, next) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };
