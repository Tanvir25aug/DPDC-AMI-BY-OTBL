const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

/**
 * NOCS Balance Summary Model
 *
 * Stores cached balance summary for all NOCS areas
 * Data is refreshed hourly from Oracle CC&B database
 *
 * Purpose:
 * - Cache expensive Oracle query results (5-10 min query)
 * - Provide instant response to users (<0.1 seconds)
 * - Survive server restarts
 * - Support multiple backend servers
 *
 * Data Source: Oracle CC&B (ci_acct, ci_ft, ci_sa tables)
 * Update Frequency: Every hour (background scheduler)
 */
const NocsBalanceSummary = sequelize.define('NocsBalanceSummary', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  nocs_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'NOCS area name (e.g., Adabor, Banasree)'
  },
  nocs_code: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: 'Unique NOCS code'
  },
  total_customers: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total number of customers in this NOCS area'
  },
  credit_qty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of customers with CREDIT (advance payment)'
  },
  credit_balance_amt: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Total CREDIT amount (customer has advance)'
  },
  due_qty: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of customers with DUE (unpaid bills)'
  },
  due_balance_amt: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Total DUE amount (customer owes money)'
  },
  net_balance: {
    type: DataTypes.DECIMAL(15, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Net balance = CREDIT - DUE (positive = overall credit, negative = overall due)'
  },
  refresh_duration: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'How long the calculation took (milliseconds)'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When this record was first created'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'When this record was last updated (hourly refresh)'
  }
}, {
  tableName: 'nocs_balance_summary',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      name: 'idx_nocs_code',
      unique: true,
      fields: ['nocs_code']
    },
    {
      name: 'idx_updated_at',
      fields: ['updated_at']
    },
    {
      name: 'idx_nocs_name',
      fields: ['nocs_name']
    }
  ]
});

/**
 * Get summary statistics across all NOCS
 */
NocsBalanceSummary.getSummaryStats = async function() {
  const result = await this.findOne({
    attributes: [
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_nocs'],
      [sequelize.fn('SUM', sequelize.col('total_customers')), 'total_customers'],
      [sequelize.fn('SUM', sequelize.col('credit_qty')), 'total_credit_qty'],
      [sequelize.fn('SUM', sequelize.col('credit_balance_amt')), 'total_credit_amt'],
      [sequelize.fn('SUM', sequelize.col('due_qty')), 'total_due_qty'],
      [sequelize.fn('SUM', sequelize.col('due_balance_amt')), 'total_due_amt'],
      [sequelize.fn('SUM', sequelize.col('net_balance')), 'total_net_balance'],
      [sequelize.fn('MAX', sequelize.col('updated_at')), 'last_updated']
    ],
    raw: true
  });

  return result;
};

/**
 * Get data age (how old is the cached data)
 */
NocsBalanceSummary.getDataAge = async function() {
  const result = await this.findOne({
    attributes: [
      [sequelize.fn('MAX', sequelize.col('updated_at')), 'last_updated']
    ],
    raw: true
  });

  if (!result || !result.last_updated) {
    return null;
  }

  const ageMs = Date.now() - new Date(result.last_updated).getTime();
  return {
    last_updated: result.last_updated,
    age_minutes: Math.floor(ageMs / 60000),
    age_hours: Math.floor(ageMs / 3600000)
  };
};

module.exports = NocsBalanceSummary;
