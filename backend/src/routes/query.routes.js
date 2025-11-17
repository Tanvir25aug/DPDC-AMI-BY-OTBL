const express = require('express');
const router = express.Router();
const queryController = require('../controllers/query.controller');
const { authenticate, checkPermission } = require('../middleware/auth');
const { validateQueryExecution, validatePagination } = require('../middleware/validators');
const { queryLimiter } = require('../middleware/rateLimiter');

/**
 * @route   POST /api/queries/execute
 * @desc    Execute Oracle query
 * @access  Private
 */
router.post(
  '/execute',
  authenticate,
  queryLimiter,
  validateQueryExecution,
  queryController.executeQuery
);

/**
 * @route   POST /api/queries/execute-export
 * @desc    Execute query and export results
 * @access  Private
 */
router.post(
  '/execute-export',
  authenticate,
  checkPermission('can_export_reports'),
  queryLimiter,
  validateQueryExecution,
  queryController.executeAndExport
);

/**
 * @route   POST /api/queries/export
 * @desc    Export data to specified format
 * @access  Private
 */
router.post(
  '/export',
  authenticate,
  checkPermission('can_export_reports'),
  queryController.exportData
);

/**
 * @route   GET /api/queries/history
 * @desc    Get query execution history
 * @access  Private
 */
router.get(
  '/history',
  authenticate,
  validatePagination,
  queryController.getQueryHistory
);

/**
 * @route   GET /api/queries/statistics
 * @desc    Get query execution statistics
 * @access  Private (Admin only)
 */
router.get(
  '/statistics',
  authenticate,
  checkPermission('can_view_audit_logs'),
  queryController.getStatistics
);

/**
 * @route   GET /api/queries/test-connection
 * @desc    Test Oracle database connection
 * @access  Private (Admin only)
 */
router.get(
  '/test-connection',
  authenticate,
  checkPermission('can_manage_users'),
  queryController.testConnection
);

module.exports = router;
