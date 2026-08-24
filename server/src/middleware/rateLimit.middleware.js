const rateLimit = require('express-rate-limit');
const { env } = require('../config/env');

// General API limiter - applied globally in app.js.
const apiLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: env.rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again shortly.' },
});

// Stricter limiter for auth endpoints to slow down brute-force attempts.
const authLimiter = rateLimit({
  windowMs: env.rateLimitWindowMs,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many auth attempts, please try again shortly.' },
});

module.exports = { apiLimiter, authLimiter };
