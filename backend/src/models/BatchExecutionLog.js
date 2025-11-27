const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BatchExecutionLog = sequelize.define('BatchExecutionLog', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  batch_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'batch_code'
  },
  batch_nbr: {
    type: DataTypes.BIGINT,
    allowNull: true,
    field: 'batch_nbr'
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    comment: 'ST=Running, CM=Complete, ED=Ended, ER=Error, PD=Pending'
  },
  start_time: {
    type: DataTypes.DATE,
    allowNull: false,
    field: 'start_time'
  },
  end_time: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'end_time'
  },
  duration_seconds: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'duration_seconds'
  },
  thread_count: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'thread_count'
  },
  records_processed: {
    type: DataTypes.BIGINT,
    allowNull: true,
    defaultValue: 0,
    field: 'records_processed'
  },
  rps: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    defaultValue: 0
  },
  business_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'business_date'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'error_message'
  },
  snapshot_time: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    field: 'snapshot_time',
    comment: 'When this record was captured from Oracle'
  }
}, {
  tableName: 'batch_execution_logs',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = BatchExecutionLog;
