const logger = require('../config/logger');
const billStopService = require('../services/bill-stop.service');

/**
 * Search customer by ID or Meter Number
 * @route GET /api/bill-stop/search
 */
const searchCustomer = async (req, res) => {
  try {
    const { searchValue } = req.query;

    if (!searchValue) {
      return res.status(400).json({
        success: false,
        message: 'Search value is required'
      });
    }

    logger.info(`[Bill Stop] Searching for customer: ${searchValue}`);

    // Search customer with billing status from Oracle
    const result = await billStopService.searchCustomerWithBillingStatus(searchValue);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: result.message || 'Customer not found'
      });
    }

    res.json({
      success: true,
      data: result.data,
      message: 'Customer found successfully'
    });
  } catch (error) {
    logger.error('[Bill Stop] Error searching customer:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search customer',
      error: error.message
    });
  }
};

/**
 * Get bill stop records
 * @route GET /api/bill-stop/records
 */
const getBillStopRecords = async (req, res) => {
  try {
    logger.info('[Bill Stop] Fetching bill stop records');

    // TODO: Implement fetching bill stop records from database

    res.json({
      success: true,
      data: [
        {
          id: 1,
          customerId: '12345678',
          customerName: 'Sample Customer',
          meterNumber: '87654321',
          nocs: 'Banasree',
          stopDate: '2024-01-15',
          resumeDate: null,
          status: 'Stopped',
          reason: 'Customer request'
        }
      ],
      count: 1,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('[Bill Stop] Error fetching records:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill stop records',
      error: error.message
    });
  }
};

/**
 * Stop billing for a customer
 * @route POST /api/bill-stop/stop
 */
const stopBilling = async (req, res) => {
  try {
    const { customerId, reason } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }

    logger.info(`[Bill Stop] Stopping billing for customer: ${customerId}`);

    // TODO: Implement stop billing logic
    // This will update the database to mark billing as stopped

    res.json({
      success: true,
      message: 'Billing stopped successfully',
      data: {
        customerId,
        stopDate: new Date().toISOString(),
        reason: reason || 'No reason provided'
      }
    });
  } catch (error) {
    logger.error('[Bill Stop] Error stopping billing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop billing',
      error: error.message
    });
  }
};

/**
 * Resume billing for a customer
 * @route POST /api/bill-stop/resume
 */
const resumeBilling = async (req, res) => {
  try {
    const { customerId } = req.body;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }

    logger.info(`[Bill Stop] Resuming billing for customer: ${customerId}`);

    // TODO: Implement resume billing logic
    // This will update the database to mark billing as active

    res.json({
      success: true,
      message: 'Billing resumed successfully',
      data: {
        customerId,
        resumeDate: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('[Bill Stop] Error resuming billing:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume billing',
      error: error.message
    });
  }
};

/**
 * Get bill stop history for a customer
 * @route GET /api/bill-stop/history/:customerId
 */
const getBillStopHistory = async (req, res) => {
  try {
    const { customerId } = req.params;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID is required'
      });
    }

    logger.info(`[Bill Stop] Fetching history for customer: ${customerId}`);

    // TODO: Implement fetching bill stop history from database

    res.json({
      success: true,
      data: [
        {
          id: 1,
          customerId,
          action: 'STOPPED',
          date: '2024-01-15',
          reason: 'Customer request',
          performedBy: 'admin'
        },
        {
          id: 2,
          customerId,
          action: 'RESUMED',
          date: '2024-02-01',
          reason: 'Payment received',
          performedBy: 'admin'
        }
      ],
      count: 2,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('[Bill Stop] Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch bill stop history',
      error: error.message
    });
  }
};

/**
 * Run bill stop analysis
 * @route POST /api/bill-stop/run-analysis
 */
const runAnalysis = async (req, res) => {
  try {
    const username = req.user?.username || 'unknown';

    logger.info(`[Bill Stop] Running analysis, triggered by: ${username}`);

    const result = await billStopService.runBillStopAnalysis(username);

    res.json({
      success: true,
      message: 'Bill stop analysis completed successfully',
      data: result.data
    });
  } catch (error) {
    logger.error('[Bill Stop] Error running analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run bill stop analysis',
      error: error.message
    });
  }
};

/**
 * Get latest bill stop analysis
 * @route GET /api/bill-stop/latest-analysis
 */
const getLatestAnalysis = async (req, res) => {
  try {
    logger.info('[Bill Stop] Fetching latest analysis');

    const result = await billStopService.getLatestAnalysis();

    res.json(result);
  } catch (error) {
    logger.error('[Bill Stop] Error fetching latest analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch latest analysis',
      error: error.message
    });
  }
};

/**
 * Get analysis history
 * @route GET /api/bill-stop/analysis-history
 */
const getAnalysisHistory = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    logger.info(`[Bill Stop] Fetching analysis history (limit: ${limit})`);

    const result = await billStopService.getAnalysisHistory(limit);

    res.json(result);
  } catch (error) {
    logger.error('[Bill Stop] Error fetching analysis history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analysis history',
      error: error.message
    });
  }
};

/**
 * Get meter reading audit for a customer
 * @route GET /api/bill-stop/reading-audit
 */
const getReadingAudit = async (req, res) => {
  try {
    const { searchValue } = req.query;

    if (!searchValue) {
      return res.status(400).json({
        success: false,
        message: 'searchValue is required (Customer ID or Meter Number)'
      });
    }

    logger.info(`[Bill Stop] Reading audit for: ${searchValue}`);

    const result = await billStopService.getCustomerReadingAudit(searchValue);

    if (!result.success) {
      return res.status(404).json(result);
    }

    res.json(result);
  } catch (error) {
    logger.error('[Bill Stop] Error getting reading audit:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get reading audit',
      error: error.message
    });
  }
};

/**
 * Batch reading audit for multiple customers
 * @route GET /api/bill-stop/reading-audit/batch
 * @query searchValues - comma-separated Customer IDs or Meter Numbers (max 10)
 */
const getBatchReadingAudit = async (req, res) => {
  try {
    const raw = req.query.searchValues || '';
    const values = raw.split(',').map(v => v.trim()).filter(Boolean);

    if (values.length === 0) {
      return res.status(400).json({ success: false, message: 'searchValues is required' });
    }
    if (values.length > 10) {
      return res.status(400).json({ success: false, message: 'Maximum 10 customers per request' });
    }

    logger.info(`[Bill Stop] Batch reading audit for ${values.length} customers`);
    const results = await billStopService.getBatchReadingAudit(values);
    res.json({ success: true, results, count: results.length });
  } catch (error) {
    logger.error('[Bill Stop] Batch reading audit error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * Export reading audit to Excel or PDF
 * @route GET /api/bill-stop/reading-audit/export
 * @query format      - 'excel' or 'pdf'
 * @query searchValues - comma-separated Customer IDs or Meter Numbers (max 10)
 */
const exportReadingAudit = async (req, res) => {
  try {
    const { format = 'excel' } = req.query;
    const raw = req.query.searchValues || '';
    const values = raw.split(',').map(v => v.trim()).filter(Boolean);

    if (values.length === 0) {
      return res.status(400).json({ success: false, message: 'searchValues is required' });
    }

    logger.info(`[Bill Stop] Exporting reading audit (${format}) for: ${values.join(', ')}`);

    const results = await billStopService.getBatchReadingAudit(values);
    const hasData = results.some(r => r.success);

    if (!hasData) {
      return res.status(404).json({ success: false, message: 'No data found for provided values' });
    }

    if (format === 'pdf') {
      billStopService.exportReadingAuditPDF(results, res);
    } else {
      await billStopService.exportReadingAuditExcel(results, res);
    }
  } catch (error) {
    logger.error('[Bill Stop] Export error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = {
  searchCustomer,
  getBillStopRecords,
  stopBilling,
  resumeBilling,
  getBillStopHistory,
  runAnalysis,
  getLatestAnalysis,
  getAnalysisHistory,
  getReadingAudit,
  getBatchReadingAudit,
  exportReadingAudit
};
