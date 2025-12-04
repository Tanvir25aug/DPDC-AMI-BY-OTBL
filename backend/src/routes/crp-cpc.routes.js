const express = require('express');
const router = express.Router();
const crpCpcController = require('../controllers/crp-cpc.controller');
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

// Clear cache (admin only)
router.post('/cache/clear', authenticate, crpCpcController.clearCache);

module.exports = router;
