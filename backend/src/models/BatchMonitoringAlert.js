const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BatchMonitoringAlert = sequelize.define('BatchMonitoringAlert', {
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
  alert_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'alert_type',
    comment: 'FAILED, LONG_RUNNING, LOW_RPS, STUCK, MISSING'
  },
  alert_severity: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'alert_severity',
    comment: 'INFO, WARNING, CRITICAL'
  },
  alert_message: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'alert_message'
  },
  batch_execution_log_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'batch_execution_log_id'
  },
  business_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    field: 'business_date'
  },
  acknowledged: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  acknowledged_by: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'acknowledged_by'
  },
  acknowledged_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'acknowledged_at'
  },
  email_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    field: 'email_sent'
  },
  email_sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'email_sent_at'
  }
}, {
  tableName: 'batch_monitoring_alerts',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = BatchMonitoringAlert;
