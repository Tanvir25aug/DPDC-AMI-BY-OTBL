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

module.exports = router;
