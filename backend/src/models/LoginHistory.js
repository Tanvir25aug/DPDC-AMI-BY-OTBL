const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const LoginHistory = sequelize.define('LoginHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true,
    comment: 'IPv4 or IPv6 address'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Browser and device information'
  },
  login_method: {
    type: DataTypes.ENUM('password', 'token', 'refresh'),
    defaultValue: 'password',
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('success', 'failed', 'blocked'),
    defaultValue: 'success',
    allowNull: false
  },
  failure_reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Reason for login failure if status is failed'
  },
  device_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'desktop, mobile, tablet'
  },
  browser: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  os: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  location: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'City, Country from IP geolocation'
  }
}, {
  tableName: 'login_history',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['created_at']
    }
  ]
});

module.exports = LoginHistory;
