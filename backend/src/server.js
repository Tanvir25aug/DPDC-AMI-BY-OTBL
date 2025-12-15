require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const passport = require('./config/passport');
const logger = require('./config/logger');
const { sequelize } = require('./models');
const { initializeOraclePool, closeOraclePool } = require('./config/oracle');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { apiLimiter } = require('./middleware/rateLimiter');
const { apiProtection } = require('./middleware/apiProtection');
const nocsBalanceScheduler = require('./services/nocs-balance-scheduler.service');
const batchMonitoringScheduler = require('./schedulers/batch-monitoring.scheduler');
const teamsService = require('./services/teams.service');
const teamsReportsScheduler = require('./schedulers/teams-reports.scheduler');
const teamsWebhooks = require('./config/teams-webhooks');
const telegramBotService = require('./services/telegram-bot.service');

const app = express();
// Trust only the first proxy (Nginx) for X-Forwarded-For headers
// This is more secure than 'trust proxy: true' which trusts all proxies
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Security middleware - Enhanced protection against iframe embedding and XSS
app.use(helmet({
  // Prevent iframe embedding from ANY domain (including same origin)
  frameguard: {
    action: 'deny' // Completely blocks iframe embedding
  },
  // Content Security Policy - Prevent XSS and data injection
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // Vue.js needs unsafe-inline
      styleSrc: ["'self'", "'unsafe-inline'"], // CSS needs unsafe-inline
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"], // Block all iframes
      frameAncestors: ["'none'"] // Prevent embedding in iframes (CSP equivalent of X-Frame-Options: DENY)
    }
  },
  // Additional security headers
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  noSniff: true, // Prevent MIME type sniffing
  xssFilter: true, // Enable XSS filter
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// CORS configuration - Restrict to specific origins only
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(origin => origin.trim()) || [];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In production, only allow specific origins
    if (process.env.NODE_ENV === 'production' && allowedOrigins.length > 0) {
      if (allowedOrigins.indexOf(origin) === -1) {
        return callback(new Error('CORS policy: This origin is not allowed'), false);
      }
    }

    return callback(null, true);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// Logging
app.use(morgan('combined', { stream: logger.stream }));

// Passport initialization
app.use(passport.initialize());

// Rate limiting
app.use('/api', apiLimiter);

// API Protection - Detect and block iframe embedding, suspicious requests
app.use('/api', apiProtection);

// Mount API routes
app.use('/api', routes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'DPDC AMI by OTBL - API Server',
    version: '1.0.0',
    status: 'running',
    documentation: '/api/health'
  });
});

// 404 handler
app.use(notFoundHandler);

// Error handler
app.use(errorHandler);

// Initialize databases and start server
async function startServer() {
  try {
    // Test PostgreSQL connection
    await sequelize.authenticate();
    logger.info('✅ PostgreSQL connected successfully');

    // Initialize Oracle connection pool
    await initializeOraclePool();
    logger.info('✅ Oracle connection pool initialized');

    // Start NOCS Balance hourly scheduler
    nocsBalanceScheduler.startScheduler();
    logger.info('✅ NOCS Balance Scheduler started (runs hourly)');

    // Start Batch Monitoring Scheduler (only in production)
    if (process.env.NODE_ENV === 'production') {
      logger.info('========================================');
      await batchMonitoringScheduler.startScheduler();
      logger.info('✅ Batch Monitoring Scheduler started (runs every 30 minutes)');
      logger.info('========================================');
    } else {
      logger.info('========================================');
      logger.info('ℹ️  Batch Monitoring Scheduler disabled in development');
      logger.info('========================================');
    }

    // Initialize Teams service and start reports scheduler (only in production)
    if (process.env.NODE_ENV === 'production') {
      logger.info('========================================');
      logger.info('Initializing Microsoft Teams integration...');
      teamsService.initialize(teamsWebhooks.DEFAULT);
      logger.info('✅ Teams service initialized');
      await teamsReportsScheduler.startScheduler();
      logger.info('✅ NOCS Balance Summary Scheduler started (runs every 60 minutes / 1 hour)');
      logger.info('========================================');
    } else {
      logger.info('========================================');
      logger.info('ℹ️  Microsoft Teams reports disabled in development');
      logger.info('========================================');
    }

    // Initialize Telegram Bot (only in production)
    const enableTelegram = process.env.ENABLE_TELEGRAM === 'true';
    if (process.env.NODE_ENV === 'production' && enableTelegram) {
      logger.info('========================================');
      logger.info('Initializing Telegram Bot...');
      telegramBotService.initialize();
      logger.info('✅ Telegram Bot initialized and ready at @DPDC_customerInfo_bot');
      logger.info('========================================');
    } else {
      logger.info('========================================');
      if (process.env.NODE_ENV !== 'production') {
        logger.info('ℹ️  Telegram Bot disabled in development');
      } else {
        logger.info('ℹ️  Telegram Bot disabled (set ENABLE_TELEGRAM=true to enable)');
      }
      logger.info('========================================');
    }

    // Start server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 API: http://localhost:${PORT}/api`);
    });

    // Initialize Socket.IO for real-time updates
    const io = require('socket.io')(server, {
      cors: {
        origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
        credentials: true
      }
    });

    // Store io instance globally for other modules to use
    global.io = io;

    // Socket.IO connection handler
    io.on('connection', (socket) => {
      logger.info(`🔌 Client connected: ${socket.id}`);

      socket.on('disconnect', () => {
        logger.info(`🔌 Client disconnected: ${socket.id}`);
      });
    });

    logger.info('✅ Socket.IO initialized for real-time updates');

    // Graceful shutdown
    const gracefulShutdown = async (signal) => {
      logger.info(`\n${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Stop schedulers
          nocsBalanceScheduler.stopScheduler();
          logger.info('NOCS Balance Scheduler stopped');

          // Stop production-only schedulers
          if (process.env.NODE_ENV === 'production') {
            batchMonitoringScheduler.stopScheduler();
            logger.info('Batch Monitoring Scheduler stopped');

            teamsReportsScheduler.stopScheduler();
            logger.info('Teams Reports Scheduler stopped');
          }

          // Close database connections
          await sequelize.close();
          logger.info('PostgreSQL connection closed');

          await closeOraclePool();
          logger.info('Oracle connection pool closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', {
    promise: promise,
    reason: reason,
    message: reason?.message || reason,
    stack: reason?.stack || 'No stack trace available'
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
