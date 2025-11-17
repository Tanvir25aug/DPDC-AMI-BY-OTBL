const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserSession = sequelize.define('UserSession', {
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
  session_token: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    comment: 'JWT refresh token or session ID'
  },
  ip_address: {
    type: DataTypes.STRING(45),
    allowNull: true
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  device_type: {
    type: DataTypes.STRING(50),
    allowNull: true
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
    allowNull: true
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  },
  last_activity: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time this session was used'
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'Session expiration time'
  }
}, {
  tableName: 'user_sessions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    {
      fields: ['user_id']
    },
    {
      fields: ['session_token']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['expires_at']
    }
  ]
});

// Instance method to check if session is valid
UserSession.prototype.isValid = function() {
  return this.is_active && new Date() < new Date(this.expires_at);
};

// Instance method to revoke session
UserSession.prototype.revoke = async function() {
  this.is_active = false;
  await this.save();
};

module.exports = UserSession;
