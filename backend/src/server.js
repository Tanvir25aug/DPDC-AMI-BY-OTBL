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
const nocsBalanceScheduler = require('./services/nocs-balance-scheduler.service');

const app = express();
// Trust only the first proxy (Nginx) for X-Forwarded-For headers
// This is more secure than 'trust proxy: true' which trusts all proxies
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true
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
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

module.exports = app;
