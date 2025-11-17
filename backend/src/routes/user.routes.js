const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticate, checkPermission } = require('../middleware/auth');
const { validateRegistration, validateUserUpdate, validateId, validatePagination } = require('../middleware/validators');

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private (Admin only)
 */
router.get(
  '/',
  authenticate,
  checkPermission('can_manage_users'),
  validatePagination,
  userController.getAllUsers
);

/**
 * @route   GET /api/users/roles
 * @desc    Get all roles
 * @access  Private
 */
router.get('/roles', authenticate, userController.getAllRoles);

/**
 * @route   GET /api/users/:id
 * @desc    Get user by ID
 * @access  Private (Admin only)
 */
router.get(
  '/:id',
  authenticate,
  checkPermission('can_manage_users'),
  validateId,
  userController.getUserById
);

/**
 * @route   POST /api/users
 * @desc    Create new user
 * @access  Private (Admin only)
 */
router.post(
  '/',
  authenticate,
  checkPermission('can_manage_users'),
  validateRegistration,
  userController.createUser
);

/**
 * @route   PUT /api/users/:id
 * @desc    Update user
 * @access  Private (Admin only)
 */
router.put(
  '/:id',
  authenticate,
  checkPermission('can_manage_users'),
  validateId,
  validateUserUpdate,
  userController.updateUser
);

/**
 * @route   DELETE /api/users/:id
 * @desc    Delete (deactivate) user
 * @access  Private (Admin only)
 */
router.delete(
  '/:id',
  authenticate,
  checkPermission('can_manage_users'),
  validateId,
  userController.deleteUser
);

/**
 * @route   GET /api/users/:id/activity
 * @desc    Get user activity logs
 * @access  Private (Admin only)
 */
router.get(
  '/:id/activity',
  authenticate,
  checkPermission('can_view_audit_logs'),
  validateId,
  validatePagination,
  userController.getUserActivity
);

module.exports = router;
