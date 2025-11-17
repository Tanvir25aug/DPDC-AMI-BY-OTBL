const { UserActivity, LoginHistory } = require('../models');
const UAParser = require('ua-parser-js');

/**
 * Parse user agent string to extract device, browser, and OS information
 */
function parseUserAgent(userAgentString) {
  if (!userAgentString) {
    return {
      device_type: null,
      browser: null,
      os: null
    };
  }

  const parser = new UAParser(userAgentString);
  const result = parser.getResult();

  return {
    device_type: result.device.type || 'desktop',
    browser: result.browser.name ? `${result.browser.name} ${result.browser.version || ''}`.trim() : null,
    os: result.os.name ? `${result.os.name} ${result.os.version || ''}`.trim() : null
  };
}

/**
 * Get IP address from request
 */
function getIpAddress(req) {
  return req.headers['x-forwarded-for']?.split(',')[0] ||
         req.headers['x-real-ip'] ||
         req.connection.remoteAddress ||
         req.socket.remoteAddress ||
         null;
}

/**
 * Log user activity
 */
async function logActivity(userId, activityType, options = {}) {
  try {
    const {
      description,
      metadata = null,
      req = null,
      resourceType = null,
      resourceId = null,
      status = 'success'
    } = options;

    let ip_address = null;
    let user_agent = null;

    if (req) {
      ip_address = getIpAddress(req);
      user_agent = req.headers['user-agent'] || null;
    }

    await UserActivity.create({
      user_id: userId,
      activity_type: activityType,
      activity_description: description,
      metadata,
      ip_address,
      user_agent,
      resource_type: resourceType,
      resource_id: resourceId,
      status
    });
  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error - activity logging should not break the main flow
  }
}

/**
 * Log login attempt
 */
async function logLogin(userId, status, options = {}) {
  try {
    const {
      req = null,
      method = 'password',
      failureReason = null,
      location = null
    } = options;

    let ip_address = null;
    let user_agent = null;
    let deviceInfo = {};

    if (req) {
      ip_address = getIpAddress(req);
      user_agent = req.headers['user-agent'] || null;
      deviceInfo = parseUserAgent(user_agent);
    }

    await LoginHistory.create({
      user_id: userId,
      ip_address,
      user_agent,
      login_method: method,
      status,
      failure_reason: failureReason,
      location,
      ...deviceInfo
    });
  } catch (error) {
    console.error('Error logging login:', error);
  }
}

/**
 * Activity logging middleware
 */
function activityMiddleware(activityType, descriptionFn) {
  return async (req, res, next) => {
    // Store original send function
    const originalSend = res.send;

    // Override send function
    res.send = function(data) {
      // Log activity after successful response
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const description = typeof descriptionFn === 'function'
          ? descriptionFn(req, res)
          : descriptionFn;

        logActivity(req.user.id, activityType, {
          description,
          req,
          metadata: {
            endpoint: req.originalUrl,
            method: req.method
          }
        }).catch(err => console.error('Activity logging error:', err));
      }

      // Call original send
      originalSend.apply(res, arguments);
    };

    next();
  };
}

module.exports = {
  logActivity,
  logLogin,
  activityMiddleware,
  parseUserAgent,
  getIpAddress
};
