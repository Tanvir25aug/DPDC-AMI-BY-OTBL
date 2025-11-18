const oracleService = require('../services/oracle.service');
const reportService = require('../services/report.service');
const logger = require('../config/logger');

class QueryController {
  /**
   * Execute Oracle query
   */
  async executeQuery(req, res, next) {
    try {
      const { query, maxRows } = req.body;
      const userId = req.user.id;

      const result = await oracleService.executeOracleQuery(query, userId, { maxRows });

      res.json({
        success: true,
        data: result.data,
        metadata: result.metadata
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Execute query and export
   */
  async executeAndExport(req, res, next) {
    try {
      const { query, format, maxRows } = req.body;
      const userId = req.user.id;

      // Execute query
      const result = await oracleService.executeOracleQuery(query, userId, { maxRows });

      if (!result.data || result.data.length === 0) {
        return res.status(404).json({
          error: 'No Data',
          message: 'Query returned no results'
        });
      }

      // Export data
      const exportResult = await reportService.exportData(result.data, format, {
        title: 'Query Report',
        columns: result.metadata.columns?.map(col => col.name)
      });

      // Set headers
      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);

      res.send(exportResult.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get query history
   */
  async getQueryHistory(req, res, next) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || 50,
        userId: req.query.userId,
        status: req.query.status,
        startDate: req.query.startDate,
        endDate: req.query.endDate
      };

      const result = await oracleService.getQueryHistory(options);

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get query statistics
   */
  async getStatistics(req, res, next) {
    try {
      const userId = req.query.userId || null;

      const stats = await oracleService.getQueryStatistics(userId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Test Oracle connection
   */
  async testConnection(req, res, next) {
    try {
      const result = await oracleService.testConnection();

      res.json({
        success: result.success,
        message: result.message
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Export existing data
   */
  async exportData(req, res, next) {
    try {
      const { data, format, title } = req.body;

      if (!data || !Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'Data array is required'
        });
      }

      const exportResult = await reportService.exportData(data, format, {
        title: title || 'Report'
      });

      res.setHeader('Content-Type', exportResult.contentType);
      res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);

      res.send(exportResult.data);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get list of all NOCS names
   */
  async getNocsList(req, res, next) {
    try {
      logger.info('Fetching NOCS list', { userId: req.user?.id });

      const nocsList = await oracleService.getNocsList();

      res.json({
        success: true,
        data: nocsList,
        count: nocsList.length
      });
    } catch (error) {
      logger.error('Error fetching NOCS list', { error: error.message });
      next(error);
    }
  }

  /**
   * Get due summary for a specific NOCS
   */
  async getNocsDueSummary(req, res, next) {
    try {
      const { nocsName } = req.params;

      if (!nocsName) {
        return res.status(400).json({
          error: 'Bad Request',
          message: 'NOCS name is required'
        });
      }

      logger.info('Fetching NOCS due summary', { nocsName, userId: req.user?.id });

      const summary = await oracleService.getNocsDueSummary(nocsName);

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      logger.error('Error fetching NOCS due summary', { error: error.message });
      next(error);
    }
  }
}

module.exports = new QueryController();
