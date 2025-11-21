const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter
 * Uses Express trust proxy setting (set to 1 in server.js)
 */
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too Many Requests',
    message: 'Too many requests from this IP, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Strict limiter for authentication endpoints
 * Uses Express trust proxy setting (set to 1 in server.js)
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: {
    error: 'Too Many Login Attempts',
    message: 'Too many login attempts, please try again after 15 minutes'
  },
  skipSuccessfulRequests: true
});

/**
 * Query execution rate limiter
 * Uses Express trust proxy setting (set to 1 in server.js)
 */
const queryLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 queries per minute
  message: {
    error: 'Query Rate Limit Exceeded',
    message: 'Too many queries, please slow down'
  }
});

module.exports = {
  apiLimiter,
  authLimiter,
  queryLimiter
};
