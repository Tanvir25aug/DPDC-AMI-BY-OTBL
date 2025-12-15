const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * Bill Stop Analysis Model
 *
 * Stores analysis of customers with active billing vs stopped billing
 * Data is refreshed on-demand by clicking "Refresh Analysis" button
 *
 * Purpose:
 * - Analyze customer billing status (active vs stopped)
 * - Store summary statistics in PostgreSQL
 * - Show last update time
 * - Fast access without running expensive Oracle query every time
 *
 * Data Source: Oracle CC&B (ci_bseg, ci_sa, ci_sp_char tables)
 * Update Frequency: On-demand (manual refresh button)
 */
const BillStopAnalysis = sequelize.define('BillStopAnalysis', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  total_customers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total number of customers analyzed'
  },
  active_billing_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of customers billed in current month (active)'
  },
  stopped_billing_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of customers NOT billed in current month (stopped)'
  },
  analysis_month: {
    type: DataTypes.STRING(7),
    allowNull: false,
    comment: 'Month of analysis (YYYY-MM format, e.g., 2024-12)'
  },
  current_month_start: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: 'First day of current month used for comparison'
  },
  query_duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'How long the Oracle query took (milliseconds)'
  },
  processing_duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'How long the data processing took (milliseconds)'
  },
  performed_by: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Username who triggered the analysis'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When this analysis was performed'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When this record was last updated'
  }
}, {
  tableName: 'bill_stop_analysis',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_analysis_month',
      fields: ['analysis_month']
    },
    {
      name: 'idx_created_at',
      fields: ['created_at']
    }
  ]
});

/**
 * Get latest analysis
 */
BillStopAnalysis.getLatest = async function() {
  return await this.findOne({
    order: [['created_at', 'DESC']],
    limit: 1
  });
};

/**
 * Get data age (how old is the latest analysis)
 */
BillStopAnalysis.getDataAge = async function() {
  const latest = await this.getLatest();

  if (!latest) {
    return null;
  }

  const ageMs = Date.now() - new Date(latest.created_at).getTime();
  return {
    last_updated: latest.created_at,
    age_minutes: Math.floor(ageMs / 60000),
    age_hours: Math.floor(ageMs / 3600000),
    age_days: Math.floor(ageMs / 86400000)
  };
};

/**
 * Get analysis history (last N records)
 */
BillStopAnalysis.getHistory = async function(limit = 10) {
  return await this.findAll({
    order: [['created_at', 'DESC']],
    limit: limit
  });
};

module.exports = BillStopAnalysis;
