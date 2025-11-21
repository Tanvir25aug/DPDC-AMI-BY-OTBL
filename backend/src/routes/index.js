const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const userRoutes = require('./user.routes');
const queryRoutes = require('./query.routes');
const reportsRoutes = require('./reports.routes');
const activityRoutes = require('./activity.routes');
const rcProgressRoutes = require('./rc-progress.routes');
const amiOperationalRoutes = require('./ami-operational.routes');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'DPDC AMI API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
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

module.exports = router;
