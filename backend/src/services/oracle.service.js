const { executeQuery } = require('../config/oracle');
const { QueryLog, User, sequelize } = require('../models');
const { Op } = require('sequelize');
const logger = require('../config/logger');

class OracleService {
  /**
   * Validate query for security
   */
  validateQuery(query) {
    const upperQuery = query.toUpperCase().trim();

    // Block dangerous operations
    const dangerousKeywords = [
      'DROP',
      'DELETE',
      'INSERT',
      'UPDATE',
      'TRUNCATE',
      'ALTER',
      'CREATE',
      'GRANT',
      'REVOKE',
      'EXECUTE',
      'EXEC'
    ];

    for (const keyword of dangerousKeywords) {
      if (upperQuery.includes(keyword)) {
        throw new Error(`Query contains forbidden keyword: ${keyword}`);
      }
    }

    // Must start with SELECT
    if (!upperQuery.startsWith('SELECT')) {
      throw new Error('Only SELECT queries are allowed');
    }

    return true;
  }

  /**
   * Execute Oracle query
   */
  async executeOracleQuery(query, userId, options = {}) {
    const startTime = Date.now();
    let status = 'success';
    let errorMessage = null;
    let result = null;

    try {
      // Validate query
      this.validateQuery(query);

      // Remove trailing semicolon if present (Oracle doesn't like it)
      const cleanQuery = query.trim().replace(/;+$/, '');

      const maxRows = options.maxRows || parseInt(process.env.DEFAULT_PAGE_SIZE) || 1000;

      // Execute query
      result = await executeQuery(cleanQuery, {}, { maxRows });

      const executionTime = Date.now() - startTime;

      // Log query execution
      await QueryLog.create({
        user_id: userId,
        query_text: cleanQuery,
        execution_time: executionTime,
        rows_returned: result.rows.length,
        status: 'success',
        executed_at: new Date()
      });

      logger.info('Query executed successfully', {
        userId,
        executionTime,
        rowCount: result.rows.length
      });

      return {
        success: true,
        data: result.rows,
        metadata: {
          rowCount: result.rows.length,
          executionTime,
          columns: result.metaData
        }
      };

    } catch (error) {
      status = 'error';
      errorMessage = error.message;
      const executionTime = Date.now() - startTime;

      // Log failed query
      await QueryLog.create({
        user_id: userId,
        query_text: query.trim().replace(/;+$/, ''),
        execution_time: executionTime,
        rows_returned: 0,
        status: 'error',
        error_message: errorMessage,
        executed_at: new Date()
      });

      logger.error('Query execution failed', {
        userId,
        error: errorMessage,
        query: query.substring(0, 200)
      });

      throw error;
    }
  }

  /**
   * Get query history
   */
  async getQueryHistory(options = {}) {
    const {
      page = 1,
      limit = 50,
      userId = null,
      status = null,
      startDate = null,
      endDate = null
    } = options;

    const offset = (page - 1) * limit;
    const where = {};

    if (userId) {
      where.user_id = userId;
    }

    if (status) {
      where.status = status;
    }

    if (startDate || endDate) {
      where.executed_at = {};
      if (startDate) where.executed_at[Op.gte] = new Date(startDate);
      if (endDate) where.executed_at[Op.lte] = new Date(endDate);
    }

    const { count, rows } = await QueryLog.findAndCountAll({
      where,
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'email']
      }],
      limit,
      offset,
      order: [['executed_at', 'DESC']]
    });

    return {
      logs: rows,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Test Oracle connection
   */
  async testConnection() {
    try {
      const result = await executeQuery('SELECT 1 AS test FROM DUAL');
      return {
        success: true,
        message: 'Oracle connection successful'
      };
    } catch (error) {
      logger.error('Oracle connection test failed', { error: error.message });
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Get query statistics
   */
  async getQueryStatistics(userId = null) {
    const where = userId ? { user_id: userId } : {};

    const stats = await QueryLog.findAll({
      where,
      attributes: [
        [sequelize.fn('COUNT', sequelize.col('id')), 'total_queries'],
        [sequelize.fn('AVG', sequelize.col('execution_time')), 'avg_execution_time'],
        [sequelize.fn('MAX', sequelize.col('execution_time')), 'max_execution_time'],
        [sequelize.fn('SUM', sequelize.col('rows_returned')), 'total_rows_returned']
      ],
      raw: true
    });

    const statusStats = await QueryLog.findAll({
      where,
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    return {
      overall: stats[0],
      byStatus: statusStats
    };
  }
}

module.exports = new OracleService();
