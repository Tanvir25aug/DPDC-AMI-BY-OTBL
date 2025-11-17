const userService = require('../services/user.service');
const logger = require('../config/logger');

class UserController {
  /**
   * Get all users
   */
  async getAllUsers(req, res, next) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        search: req.query.search,
        role: req.query.role,
        isActive: req.query.isActive ? req.query.isActive === 'true' : null
      };

      const result = await userService.getAllUsers(options);

      res.json({
        success: true,
        data: result.users,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(req, res, next) {
    try {
      const user = await userService.getUserById(req.params.id);

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create new user
   */
  async createUser(req, res, next) {
    try {
      const userData = req.body;

      const user = await userService.createUser(userData);

      logger.info('User created', {
        adminId: req.user.id,
        newUserId: user.id,
        username: user.username
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update user
   */
  async updateUser(req, res, next) {
    try {
      const userId = req.params.id;
      const userData = req.body;

      const user = await userService.updateUser(userId, userData);

      logger.info('User updated', {
        adminId: req.user.id,
        updatedUserId: userId
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete user
   */
  async deleteUser(req, res, next) {
    try {
      const userId = req.params.id;

      // Prevent self-deletion
      if (parseInt(userId) === req.user.id) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'You cannot delete your own account'
        });
      }

      const result = await userService.deleteUser(userId);

      logger.info('User deleted', {
        adminId: req.user.id,
        deletedUserId: userId
      });

      res.json({
        success: true,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get user activity logs
   */
  async getUserActivity(req, res, next) {
    try {
      const userId = req.params.id;
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 20
      };

      const result = await userService.getUserActivity(userId, options);

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get all roles
   */
  async getAllRoles(req, res, next) {
    try {
      const roles = await userService.getAllRoles();

      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
