const logger = require('../config/logger');

/**
 * API Protection Middleware
 * Detects and blocks suspicious requests, iframe embeddings, and unauthorized access
 */

/**
 * Check for suspicious referer headers that might indicate iframe embedding
 */
const checkRefererMiddleware = (req, res, next) => {
  const referer = req.get('Referer') || req.get('Referrer');
  const origin = req.get('Origin');
  const host = req.get('Host');

  // If there's a referer, check if it's from an allowed domain
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [];

      // In production, block if referer is from unauthorized domain
      if (process.env.NODE_ENV === 'production' && allowedOrigins.length > 0) {
        const isAllowed = allowedOrigins.some(allowed => {
          try {
            const allowedUrl = new URL(allowed);
            return refererUrl.hostname === allowedUrl.hostname;
          } catch {
            return false;
          }
        });

        if (!isAllowed && refererUrl.hostname !== host) {
          logger.warn(`Blocked request from unauthorized referer: ${referer}`, {
            ip: req.ip,
            userAgent: req.get('User-Agent')
          });

          return res.status(403).json({
            error: 'Forbidden',
            message: 'Access from this source is not allowed'
          });
        }
      }
    } catch (error) {
      // Invalid referer URL - allow it to pass
      logger.debug('Invalid referer URL format:', referer);
    }
  }

  next();
};

/**
 * Detect iframe embedding attempts
 * Check for headers that indicate the request is from an iframe
 */
const detectIframeMiddleware = (req, res, next) => {
  const secFetchDest = req.get('Sec-Fetch-Dest');
  const secFetchMode = req.get('Sec-Fetch-Mode');
  const secFetchSite = req.get('Sec-Fetch-Site');

  // Detect if request is from an iframe
  if (secFetchDest === 'iframe' || secFetchDest === 'embed' || secFetchDest === 'object') {
    logger.warn('Blocked iframe embedding attempt', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      secFetchDest,
      secFetchMode,
      secFetchSite,
      url: req.originalUrl
    });

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Embedding this content in iframes is not allowed'
    });
  }

  next();
};

/**
 * Block requests with suspicious user agents
 */
const blockSuspiciousUserAgents = (req, res, next) => {
  const userAgent = req.get('User-Agent') || '';

  // List of suspicious patterns
  const suspiciousPatterns = [
    /curl/i,
    /wget/i,
    /scrapy/i,
    /bot/i,
    /spider/i,
    /crawler/i,
    /scraper/i
  ];

  // Allow legitimate bots in development
  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  // Check if user agent matches suspicious patterns
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(userAgent));

  if (isSuspicious) {
    logger.warn('Blocked suspicious user agent', {
      ip: req.ip,
      userAgent,
      url: req.originalUrl
    });

    return res.status(403).json({
      error: 'Forbidden',
      message: 'Access denied'
    });
  }

  next();
};

/**
 * Rate limit by IP for API endpoints
 * More aggressive than general rate limiting
 */
const ipRequestTracker = new Map();

const aggressiveRateLimitMiddleware = (req, res, next) => {
  const ip = req.ip;
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const maxRequests = 50; // Maximum 50 requests per minute per IP

  if (!ipRequestTracker.has(ip)) {
    ipRequestTracker.set(ip, []);
  }

  const requests = ipRequestTracker.get(ip);

  // Remove old requests outside the window
  const validRequests = requests.filter(timestamp => now - timestamp < windowMs);

  // Check if limit exceeded
  if (validRequests.length >= maxRequests) {
    logger.warn('Rate limit exceeded', {
      ip,
      requestCount: validRequests.length,
      url: req.originalUrl
    });

    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please slow down.'
    });
  }

  // Add current request
  validRequests.push(now);
  ipRequestTracker.set(ip, validRequests);

  next();
};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  const windowMs = 60 * 1000;

  for (const [ip, requests] of ipRequestTracker.entries()) {
    const validRequests = requests.filter(timestamp => now - timestamp < windowMs);

    if (validRequests.length === 0) {
      ipRequestTracker.delete(ip);
    } else {
      ipRequestTracker.set(ip, validRequests);
    }
  }
}, 5 * 60 * 1000);

/**
 * Combined API protection middleware
 * Apply all protection checks in sequence
 */
const apiProtection = [
  checkRefererMiddleware,
  detectIframeMiddleware,
  aggressiveRateLimitMiddleware
];

/**
 * Strict API protection for sensitive endpoints
 * Includes user agent blocking
 */
const strictApiProtection = [
  checkRefererMiddleware,
  detectIframeMiddleware,
  blockSuspiciousUserAgents,
  aggressiveRateLimitMiddleware
];

module.exports = {
  checkRefererMiddleware,
  detectIframeMiddleware,
  blockSuspiciousUserAgents,
  aggressiveRateLimitMiddleware,
  apiProtection,
  strictApiProtection
};
