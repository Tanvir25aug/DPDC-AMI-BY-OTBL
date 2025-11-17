const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserActivity = sequelize.define('UserActivity', {
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
  activity_type: {
    type: DataTypes.ENUM(
      'login',
      'logout',
      'query_executed',
      'report_generated',
      'data_exported',
      'profile_updated',
      'password_changed',
      'user_created',
      'user_updated',
      'user_deleted',
      'settings_changed',
      'permission_changed'
    ),
    allowNull: false
  },
  activity_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Human-readable description of the activity'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional data related to the activity'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  resource_type: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Type of resource affected (query, user, report, etc.)'
  },
  resource_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'ID of the affected resource'
  },
  status: {
    type: DataTypes.ENUM('success', 'failed', 'warning'),
    defaultValue: 'success',
    allowNull: false
  }
}, {
  tableName: 'user_activities',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['activity_type']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['status']
    }
  ]
});

module.exports = UserActivity;
