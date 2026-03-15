const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PageAccessConfig = sequelize.define('PageAccessConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  route_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true
  },
  page_name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  page_group: {
    type: DataTypes.STRING(50),
    allowNull: true
  },
  allowed_roles: {
    type: DataTypes.JSONB,
    defaultValue: ['admin'],
    allowNull: false
  },
  sort_order: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'page_access_config',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = PageAccessConfig;
