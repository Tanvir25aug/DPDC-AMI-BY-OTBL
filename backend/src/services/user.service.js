const { User, Role, QueryLog } = require('../models');
const { Op } = require('sequelize');

class UserService {
  /**
   * Get all users
   */
  async getAllUsers(options = {}) {
    const {
      page = 1,
      limit = 50,
      search = '',
      role = null,
      isActive = null
    } = options;

    const offset = (page - 1) * limit;

    const where = {};

    // Search filter
    if (search && search !== '' && search !== 'null' && search !== 'undefined') {
      where[Op.or] = [
        { username: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } }
      ];
    }

    // Role filter - ensure it's a valid integer
    if (role && role !== 'null' && role !== 'undefined' && !isNaN(parseInt(role))) {
      where.role_id = parseInt(role);
    }

    // Active status filter - handle string booleans from query params
    if (isActive !== null && isActive !== 'null' && isActive !== 'undefined') {
      // Convert string booleans to actual booleans
      where.is_active = isActive === true || isActive === 'true';
    }

    const { count, rows } = await User.findAndCountAll({
      where,
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'description']
      }],
      attributes: { exclude: ['password_hash'] },
      limit,
      offset,
      order: [['created_at', 'DESC']]
    });

    return {
      users: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(id) {
    const user = await User.findByPk(id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'description', 'permissions']
      }],
      attributes: { exclude: ['password_hash'] }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  /**
   * Create new user
   */
  async createUser(userData) {
    const { username, email, password, role_id } = userData;

    // Check if username exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      throw new Error('Username already exists');
    }

    // Check if email exists
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      throw new Error('Email already exists');
    }

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: password,
      role_id
    });

    return this.getUserById(user.id);
  }

  /**
   * Update user
   */
  async updateUser(id, userData) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new Error('User not found');
    }

    // Check email uniqueness if changing
    if (userData.email && userData.email !== user.email) {
      const existingEmail = await User.findOne({
        where: {
          email: userData.email,
          id: { [Op.ne]: id }
        }
      });
      if (existingEmail) {
        throw new Error('Email already exists');
      }
    }

    // Update user
    const updateData = {};
    if (userData.email) updateData.email = userData.email;
    if (userData.password) updateData.password_hash = userData.password;
    if (userData.role_id !== undefined) updateData.role_id = userData.role_id;
    if (userData.is_active !== undefined) updateData.is_active = userData.is_active;

    await user.update(updateData);

    return this.getUserById(id);
  }

  /**
   * Delete user (soft delete by deactivating)
   */
  async deleteUser(id) {
    const user = await User.findByPk(id);

    if (!user) {
      throw new Error('User not found');
    }

    await user.update({ is_active: false });

    return { message: 'User deactivated successfully' };
  }

  /**
   * Get user activity (query logs)
   */
  async getUserActivity(userId, options = {}) {
    const { page = 1, limit = 20 } = options;
    const offset = (page - 1) * limit;

    const { count, rows } = await QueryLog.findAndCountAll({
      where: { user_id: userId },
      limit,
      offset,
      order: [['executed_at', 'DESC']]
    });

    return {
      logs: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get all roles
   */
  async getAllRoles() {
    return await Role.findAll({
      attributes: ['id', 'name', 'description', 'permissions']
    });
  }
}

module.exports = new UserService();
