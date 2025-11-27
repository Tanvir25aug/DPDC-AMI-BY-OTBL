/**
 * AMI Operational Routes
 * Endpoints for AMI operational metrics and batch monitoring
 */

const express = require('express');
const router = express.Router();
const amiOperationalController = require('../controllers/ami-operational.controller');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/ami-operational/pending-imd
 * @desc    Get pending IMD count
 * @access  Private (requires authentication)
 */
router.get('/pending-imd', amiOperationalController.getPendingIMDCount);

/**
 * @route   GET /api/ami-operational/bill-count
 * @desc    Get bill count for a specific date
 * @query   date - Date in YYYY-MM-DD format (optional, defaults to today)
 * @access  Private (requires authentication)
 */
router.get('/bill-count', amiOperationalController.getBillCount);

/**
 * @route   GET /api/ami-operational/running-batches
 * @desc    Get currently running batches (status = 'ST')
 * @access  Private (requires authentication)
 */
router.get('/running-batches', amiOperationalController.getRunningBatches);

/**
 * @route   GET /api/ami-operational/batch-performance
 * @desc    Get batch job performance with date range filter
 * @query   startDate - Start date in YYYY-MM-DD format (optional)
 * @query   endDate - End date in YYYY-MM-DD format (optional)
 * @access  Private (requires authentication)
 */
router.get('/batch-performance', amiOperationalController.getBatchPerformance);

/**
 * @route   GET /api/ami-operational/active-alerts
 * @desc    Get active (unacknowledged) alerts with counts by severity
 * @access  Private (requires authentication)
 */
router.get('/active-alerts', amiOperationalController.getActiveAlerts);

/**
 * @route   GET /api/ami-operational/batch-logs
 * @desc    Get batch execution logs with filters
 * @query   batchCode - Filter by batch code (optional)
 * @query   status - Filter by status (optional)
 * @query   startDate - Filter by start date (optional)
 * @query   endDate - Filter by end date (optional)
 * @query   limit - Number of records to return (optional, default 100)
 * @access  Private (requires authentication)
 */
router.get('/batch-logs', amiOperationalController.getBatchLogs);

/**
 * @route   GET /api/ami-operational/batch-timeline
 * @desc    Get batch workflow timeline with today's execution status
 * @access  Private (requires authentication)
 */
router.get('/batch-timeline', amiOperationalController.getBatchTimeline);

/**
 * @route   GET /api/ami-operational/batch-health
 * @desc    Get batch health summary including success rates and recent failures
 * @query   days - Number of days to look back (optional, default 7)
 * @access  Private (requires authentication)
 */
router.get('/batch-health', amiOperationalController.getBatchHealth);

/**
 * @route   POST /api/ami-operational/acknowledge-alert/:id
 * @desc    Acknowledge an alert by ID
 * @param   id - Alert ID
 * @access  Private (requires authentication)
 */
router.post('/acknowledge-alert/:id', amiOperationalController.acknowledgeAlert);

module.exports = router;
