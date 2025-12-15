const express = require('express');
const router = express.Router();
const reportsController = require('../controllers/reports.controller');
const { authenticate } = require('../middleware/auth');

// All report routes require authentication
router.use(authenticate);

// Get daily RC/DC command count (aggregated totals)
router.get('/daily_connect_disconnect_count', reportsController.getDailyConnectDisconnectCount);

// Get RC/DC NOCS aggregated summary (NOCS breakdown)
router.get('/rc_dc_nocs_aggregated', reportsController.getRCDCNocsAggregated);

// Get RC/DC analytics summary (detailed transactions)
router.get('/rc_dc_analytics_summary', reportsController.getRCDCAnalyticsSummary);

// Get meter-wise commands (detailed meter list) - DEPRECATED
router.get('/meter_wise_commands', reportsController.getMeterWiseCommands);

// Get meter-wise commands PAGINATED (OPTIMIZED for 200+ users, 30k+ records)
router.get('/meter_wise_commands_paginated', reportsController.getMeterWiseCommandsPaginated);

// Get meter-wise commands by NOCS (filtered meter list for specific NOCS)
router.get('/meter_wise_commands_by_nocs', reportsController.getMeterWiseCommandsByNocs);

// Download NOCS report as PDF
router.get('/download_nocs_report_pdf', reportsController.downloadNocsReportPDF);

// Real-time control endpoints
router.post('/realtime/start', reportsController.startRealtime);
router.post('/realtime/stop', reportsController.stopRealtime);
router.get('/realtime/status', reportsController.getRealtimeStatus);
router.post('/realtime/broadcast', reportsController.broadcastNow);

// Payment Collection Reports
router.get('/bank_wise_collection', reportsController.getBankWiseCollection);
router.get('/bank_reconciliation_data', reportsController.getBankReconciliationData);
router.get('/nocs_collection_summary', reportsController.getNocsCollectionSummary);

// Customer Billing Reports
router.get('/customer_billing_details', reportsController.getCustomerBillingDetails);
router.get('/customer_details', reportsController.getCustomerDetails);

// NOCS Balance Summary (Ultra Fast - Pre-calculated hourly)
router.get('/nocs_balance_summary', reportsController.getNocsBalanceSummary);

// NOCS Customer Payoff Balance (Customer-wise breakdown by NOCS)
router.get('/nocs-customer-payoff/:nocsCode', reportsController.getNocsCustomerPayoff);

module.exports = router;
