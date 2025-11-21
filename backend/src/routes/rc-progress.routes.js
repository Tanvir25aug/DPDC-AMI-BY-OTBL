/**
 * RC In Progress Routes
 * Endpoints for Remote Connect commands monitoring and reporting
 */

const express = require('express');
const router = express.Router();
const rcProgressController = require('../controllers/rc-progress.controller');
const { authenticate } = require('../middleware/auth');

// Apply authentication middleware to all routes
router.use(authenticate);

/**
 * @route   GET /api/rc-progress/detailed
 * @desc    Get detailed list of RC commands in progress (paginated)
 * @query   page - Page number (default: 1)
 * @query   limit - Records per page (default: 100, max: 1000)
 * @query   nocs - Filter by NOCS name (optional)
 * @query   durationStatus - Filter by NORMAL/WARNING/ALERT/STUCK (optional)
 * @query   minMinutes - Filter by minimum minutes elapsed (optional)
 * @access  Private (requires authentication)
 */
router.get('/detailed', rcProgressController.getRCInProgressDetailed);

/**
 * @route   GET /api/rc-progress/summary
 * @desc    Get summary statistics for RC In Progress (dashboard cards)
 * @access  Private (requires authentication)
 */
router.get('/summary', rcProgressController.getRCInProgressSummary);

/**
 * @route   GET /api/rc-progress/by-nocs
 * @desc    Get NOCS breakdown for RC In Progress (charts)
 * @access  Private (requires authentication)
 */
router.get('/by-nocs', rcProgressController.getRCInProgressByNOCS);

/**
 * @route   GET /api/rc-progress/export
 * @desc    Export RC In Progress with customer details
 * @query   format - 'excel' or 'csv' (default: excel)
 * @access  Private (requires authentication)
 */
router.get('/export', rcProgressController.exportRCInProgressWithCustomerDetails);

/**
 * @route   GET /api/rc-progress/export-by-nocs
 * @desc    Export RC In Progress by NOCS (separate tabs for each NOCS)
 * @access  Private (requires authentication)
 */
router.get('/export-by-nocs', rcProgressController.exportRCInProgressByNOCSWithTabs);

/**
 * @route   POST /api/rc-progress/export-filtered
 * @desc    Export filtered RC In Progress with customer details
 * @body    meterNumbers - Array of meter numbers to export
 * @access  Private (requires authentication)
 */
router.post('/export-filtered', rcProgressController.exportFilteredRCInProgress);

module.exports = router;
