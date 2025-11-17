const express = require('express');
const router = express.Router();
const { authenticate, checkPermission } = require('../middleware/auth');
const {
  getUserActivities,
  getUserLoginHistory,
  getUserSessions,
  revokeSession,
  getActivityStats
} = require('../controllers/activity.controller');

/**
 * @route   GET /api/activity/activities
 * @desc    Get current user's activities
 * @access  Private
 */
router.get('/activities', authenticate, getUserActivities);

/**
 * @route   GET /api/activity/login-history
 * @desc    Get current user's login history
 * @access  Private
 */
router.get('/login-history', authenticate, getUserLoginHistory);

/**
 * @route   GET /api/activity/sessions
 * @desc    Get current user's active sessions
 * @access  Private
 */
router.get('/sessions', authenticate, getUserSessions);

/**
 * @route   DELETE /api/activity/sessions/:sessionId
 * @desc    Revoke a user session
 * @access  Private
 */
router.delete('/sessions/:sessionId', authenticate, revokeSession);

/**
 * @route   GET /api/activity/stats
 * @desc    Get current user's activity statistics
 * @access  Private
 */
router.get('/stats', authenticate, getActivityStats);

/**
 * @route   GET /api/activity/user/:userId/activities
 * @desc    Get specific user's activities (admin only)
 * @access  Private + Admin
 */
router.get(
  '/user/:userId/activities',
  authenticate,
  checkPermission('can_manage_users'),
  getUserActivities
);

/**
 * @route   GET /api/activity/user/:userId/login-history
 * @desc    Get specific user's login history (admin only)
 * @access  Private + Admin
 */
router.get(
  '/user/:userId/login-history',
  authenticate,
  checkPermission('can_manage_users'),
  getUserLoginHistory
);

module.exports = router;
