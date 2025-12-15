const express = require('express');
const router = express.Router();
const { getPoolHealth } = require('../config/oracle');

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const queryRoutes = require('./query.routes');
const reportsRoutes = require('./reports.routes');
const activityRoutes = require('./activity.routes');
const rcProgressRoutes = require('./rc-progress.routes');
const amiOperationalRoutes = require('./ami-operational.routes');
const crpCpcRoutes = require('./crp-cpc.routes');
const billStopRoutes = require('./bill-stop.routes');

// Health check endpoint with Oracle pool status
router.get('/health', (req, res) => {
  const oracleHealth = getPoolHealth();

  res.json({
    success: true,
    message: 'DPDC AMI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    database: {
      oracle: oracleHealth
    }
  });
});

// Mount routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/queries', queryRoutes);
router.use('/reports', reportsRoutes);
router.use('/activity', activityRoutes);
router.use('/rc-progress', rcProgressRoutes);
router.use('/ami-operational', amiOperationalRoutes);
router.use('/crp-cpc', crpCpcRoutes);
router.use('/bill-stop', billStopRoutes);

module.exports = router;
