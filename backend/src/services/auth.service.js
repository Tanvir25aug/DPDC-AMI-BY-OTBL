const jwt = require('jsonwebtoken');
const { User, Role } = require('../models');
require('dotenv').config();

class AuthService {
  /**
   * Generate JWT token
   */
  generateToken(user) {
    const payload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role?.name
    };

    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '1h'
    });
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(user) {
    const payload = {
      id: user.id,
      type: 'refresh'
    };

    return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'
    });
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token) {
    try {
      return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  /**
   * Login user
   */
  async login(username, password) {
    // Find user with role
    const user = await User.findOne({
      where: { username },
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'permissions']
      }]
    });

    if (!user) {
      throw new Error('Invalid credentials');
    }

    // Check if user is active
    if (!user.is_active) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      throw new Error('Invalid credentials');
    }

    // Update last login
    await user.update({ last_login: new Date() });

    // Generate tokens
    const token = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: user.toJSON(),
      token,
      refreshToken
    };
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken) {
    const payload = this.verifyRefreshToken(refreshToken);

    const user = await User.findByPk(payload.id, {
      include: [{
        model: Role,
        as: 'role',
        attributes: ['id', 'name', 'permissions']
      }]
    });

    if (!user || !user.is_active) {
      throw new Error('User not found or inactive');
    }

    const newToken = this.generateToken(user);

    return {
      token: newToken
    };
  }

  /**
   * Change password
   */
  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await user.comparePassword(currentPassword);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    await user.update({ password_hash: newPassword });

    return { message: 'Password changed successfully' };
  }
}

module.exports = new AuthService();
