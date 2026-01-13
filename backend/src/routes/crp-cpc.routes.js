const express = require('express');
const router = express.Router();
const crpCpcController = require('../controllers/crp-cpc.controller');
const billStopBatchController = require('../controllers/billStopBatch.controller');
const { authenticate } = require('../middleware/auth');

/**
 * CRP-CPC Routes
 * All routes require authentication
 */

// Get CRP-CPC list with pagination and search
// Query params: page, limit, search
router.get('/list', authenticate, crpCpcController.getCRPCPCList);

// Get CPC details for a specific CRP
// Params: crpId
router.get('/details/:crpId', authenticate, crpCpcController.getCPCDetails);

// Get CPC count by NOCS for a specific CRP
// Params: crpId
router.get('/nocs-summary/:crpId', authenticate, crpCpcController.getCPCNocsSummary);

// Get detailed export data with CPC customer information
// Query params: search, filterConnectionCount, filterBillStop, filterActiveBilling, sortBy, limit
router.get('/export/detailed', authenticate, crpCpcController.getDetailedExport);

// Get bill stop analysis (OLD - Direct Oracle query with timeout issues)
// Returns summary and detailed data for CPC customers with bill stop issues
// router.get('/bill-stop-analysis', authenticate, crpCpcController.getBillStopAnalysis);

// Get bill stop analysis (NEW - From PostgreSQL batch data)
// Much faster, returns ALL data, no timeout
router.get('/bill-stop-analysis', authenticate, billStopBatchController.getBillStopAnalysis);

// Trigger bill stop batch job manually
router.post('/bill-stop-batch/trigger', authenticate, billStopBatchController.triggerBatchJob);

// Get bill stop batch status
router.get('/bill-stop-batch/status', authenticate, billStopBatchController.getBatchStatus);

// Get bill stop batch history
router.get('/bill-stop-batch/history', authenticate, billStopBatchController.getBatchHistory);

// Clear cache (admin only)
router.post('/cache/clear', authenticate, crpCpcController.clearCache);

module.exports = router;
