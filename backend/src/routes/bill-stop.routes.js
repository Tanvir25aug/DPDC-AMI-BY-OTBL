const express = require('express');
const router = express.Router();
const billStopController = require('../controllers/bill-stop.controller');
const { authenticate } = require('../middleware/auth');

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/bill-stop/search
 * @desc    Search customer by ID or meter number
 * @access  Private
 */
router.get('/search', billStopController.searchCustomer);

/**
 * @route   GET /api/bill-stop/records
 * @desc    Get all bill stop records
 * @access  Private
 */
router.get('/records', billStopController.getBillStopRecords);

/**
 * @route   POST /api/bill-stop/stop
 * @desc    Stop billing for a customer
 * @access  Private
 */
router.post('/stop', billStopController.stopBilling);

/**
 * @route   POST /api/bill-stop/resume
 * @desc    Resume billing for a customer
 * @access  Private
 */
router.post('/resume', billStopController.resumeBilling);

/**
 * @route   GET /api/bill-stop/history/:customerId
 * @desc    Get bill stop history for a customer
 * @access  Private
 */
router.get('/history/:customerId', billStopController.getBillStopHistory);

/**
 * @route   POST /api/bill-stop/run-analysis
 * @desc    Run bill stop analysis
 * @access  Private
 */
router.post('/run-analysis', billStopController.runAnalysis);

/**
 * @route   GET /api/bill-stop/latest-analysis
 * @desc    Get latest bill stop analysis
 * @access  Private
 */
router.get('/latest-analysis', billStopController.getLatestAnalysis);

/**
 * @route   GET /api/bill-stop/analysis-history
 * @desc    Get bill stop analysis history
 * @access  Private
 */
router.get('/analysis-history', billStopController.getAnalysisHistory);

/**
 * @route   GET /api/bill-stop/reading-audit
 * @desc    Get meter reading audit (expected vs actual monthly reads)
 * @access  Private
 * @query   searchValue - Customer ID or Meter Number
 */
router.get('/reading-audit', billStopController.getReadingAudit);

/**
 * @route   GET /api/bill-stop/reading-audit/batch
 * @desc    Batch reading audit for multiple customers (max 10)
 * @access  Private
 * @query   searchValues - comma-separated Customer IDs or Meter Numbers
 */
router.get('/reading-audit/batch', billStopController.getBatchReadingAudit);

/**
 * @route   GET /api/bill-stop/reading-audit/export
 * @desc    Export reading audit to Excel or PDF
 * @access  Private
 * @query   format - 'excel' or 'pdf'
 * @query   searchValues - comma-separated Customer IDs or Meter Numbers
 */
router.get('/reading-audit/export', billStopController.exportReadingAudit);

module.exports = router;
