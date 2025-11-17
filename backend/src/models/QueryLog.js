const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const QueryLog = sequelize.define('QueryLog', {
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
  query_text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  execution_time: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Execution time in milliseconds'
  },
  rows_returned: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'success',
    validate: {
      isIn: [['success', 'error', 'timeout']]
    }
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  executed_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'query_logs',
  timestamps: false,
  underscored: true
});

module.exports = QueryLog;
