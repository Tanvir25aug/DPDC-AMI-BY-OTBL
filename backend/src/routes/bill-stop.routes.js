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

module.exports = router;
