const oracledb = require('oracledb');
const { getOracleConnection } = require('../config/oracle');
const pgPool = require('../config/postgresDB');
const logger = require('../config/logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Read summary totals from the bill_stop_summary PostgreSQL table
 * (populated nightly by the batch job - no Oracle query needed)
 */
const readSummaryFromBatch = async () => {
  // Get latest batch date — cast to text to avoid timezone shifts on timestamp columns
  const dateResult = await pgPool.query(
    `SELECT batch_date::text AS batch_date FROM bill_stop_summary ORDER BY batch_date DESC LIMIT 1`
  );

  if (dateResult.rows.length === 0) {
    return null;
  }

  // batch_date is now always a plain 'YYYY-MM-DD' string (::text cast prevents Date object timezone issues)
  const latestDate = String(dateResult.rows[0].batch_date).split('T')[0];

  // Aggregate totals across all CRPs for the latest batch date
  const totalsResult = await pgPool.query(
    `SELECT
       SUM(total_cpc_count)      AS total_customers,
       SUM(active_billing_count) AS active_billing_count,
       SUM(bill_stop_count)      AS stopped_billing_count
     FROM bill_stop_summary
     WHERE batch_date::text = $1`,
    [latestDate]
  );

  const t = totalsResult.rows[0];

  return {
    total_customers:       parseInt(t.total_customers)       || 0,
    active_billing_count:  parseInt(t.active_billing_count)  || 0,
    stopped_billing_count: parseInt(t.stopped_billing_count) || 0,
    analysis_month:        latestDate,   // clean YYYY-MM-DD string
    created_at:            latestDate,
    performed_by:          'Nightly Batch Job'
  };
};

/**
 * Run Bill Stop Analysis
 * Reads pre-computed data from the bill_stop_summary PostgreSQL table.
 * The actual Oracle query runs nightly via the batch job (billStopBatchJob.js).
 * Calling this from an HTTP request used to cause 504 timeouts because
 * the Oracle scan takes several minutes - this approach is instant.
 */
const runBillStopAnalysis = async (username = 'system') => {
  try {
    logger.info('[Bill Stop Service] Loading analysis from batch data');

    const data = await readSummaryFromBatch();

    if (!data) {
      return {
        success: false,
        message: 'No batch data available yet. The nightly batch job has not run.',
        data: null
      };
    }

    logger.info(`[Bill Stop Service] Analysis loaded - Total: ${data.total_customers}, Active: ${data.active_billing_count}, Stopped: ${data.stopped_billing_count}`);

    return { success: true, data };
  } catch (error) {
    logger.error('[Bill Stop Service] Error loading analysis:', error);
    throw error;
  }
};

/**
 * Get latest bill stop analysis (reads from batch data in PostgreSQL)
 */
const getLatestAnalysis = async () => {
  try {
    const data = await readSummaryFromBatch();

    if (!data) {
      return {
        success: false,
        message: 'No batch data available yet. The nightly batch job has not run.',
        data: null
      };
    }

    // Calculate data age
    const ageMs = Date.now() - new Date(data.analysis_month).getTime();
    const age = {
      last_updated:  data.analysis_month,
      age_hours:     Math.floor(ageMs / 3600000),
      age_days:      Math.floor(ageMs / 86400000)
    };

    return { success: true, data, age };
  } catch (error) {
    logger.error('[Bill Stop Service] Error getting latest analysis:', error);
    throw error;
  }
};

/**
 * Get analysis history (last N batch dates with aggregated totals)
 */
const getAnalysisHistory = async (limit = 10) => {
  try {
    const result = await pgPool.query(
      `SELECT
         batch_date,
         SUM(total_cpc_count)      AS total_customers,
         SUM(active_billing_count) AS active_billing_count,
         SUM(bill_stop_count)      AS stopped_billing_count
       FROM bill_stop_summary
       GROUP BY batch_date
       ORDER BY batch_date DESC
       LIMIT $1`,
      [limit]
    );

    return {
      success: true,
      data: result.rows,
      count: result.rows.length
    };
  } catch (error) {
    logger.error('[Bill Stop Service] Error getting analysis history:', error);
    throw error;
  }
};

/**
 * Search customer by ID or Meter Number with billing status
 */
const searchCustomerWithBillingStatus = async (searchValue) => {
  let connection;

  try {
    logger.info(`[Bill Stop Service] Searching for customer: ${searchValue}`);

    // Read SQL query from file
    const sqlFilePath = path.join(__dirname, '../../reports/customer_search_with_billing_status.sql');
    let sqlQuery = await fs.readFile(sqlFilePath, 'utf8');

    // Clean SQL: remove comments and extra whitespace
    sqlQuery = sqlQuery
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/;$/, '');

    // Connect to Oracle
    connection = await getOracleConnection();

    const result = await connection.execute(
      sqlQuery,
      { search_value: searchValue },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    if (result.rows.length === 0) {
      logger.info(`[Bill Stop Service] No customer found for: ${searchValue}`);
      return {
        success: false,
        message: 'Customer not found',
        data: null
      };
    }

    const customer = result.rows[0];
    logger.info(`[Bill Stop Service] Found customer: ${customer.CUSTOMER_ID}, Billing Status: ${customer.BILLING_STATUS}`);

    return {
      success: true,
      data: {
        CUSTOMER_ID: customer.CUSTOMER_ID,
        CUSTOMER_NAME: customer.CUSTOMER_NAME,
        METER_NO: customer.METER_NO,
        NOCS_NAME: customer.NOCS_NAME,
        ADDRESS: customer.ADDRESS,
        PHONE_NO: customer.PHONE_NO,
        SA_STATUS: customer.SA_STATUS,
        LAST_BILL_DATE: customer.LAST_BILL_DATE,
        BILLING_STATUS: customer.BILLING_STATUS,
        BILLED_THIS_MONTH: customer.BILLED_THIS_MONTH,
        CURRENT_BALANCE: customer.CURRENT_BALANCE,
        CURRENT_BILLING_MONTH: customer.CURRENT_BILLING_MONTH,
        MATCH_TYPE: customer.MATCH_TYPE
      }
    };
  } catch (error) {
    logger.error('[Bill Stop Service] Error searching customer:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        logger.error('[Bill Stop Service] Error closing connection:', err);
      }
    }
  }
};

/**
 * Get meter reading audit for a customer
 * Auto-detects meter type (Residential/Commercial), generates expected monthly
 * reads from install date to today, and compares against actual AMI readings.
 */
const getCustomerReadingAudit = async (searchValue) => {
  let connection;

  try {
    logger.info(`[Bill Stop Service] Reading audit for: ${searchValue}`);

    const sqlFilePath = path.join(__dirname, '../../reports/customer_reading_audit.sql');
    let sqlQuery = await fs.readFile(sqlFilePath, 'utf8');

    sqlQuery = sqlQuery
      .split('\n')
      .filter(line => !line.trim().startsWith('--'))
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim()
      .replace(/;$/, '');

    connection = await getOracleConnection();
    connection.callTimeout = 90000; // 90 seconds

    const result = await connection.execute(
      sqlQuery,
      { search_value: searchValue },
      { outFormat: oracledb.OUT_FORMAT_OBJECT, maxRows: 0 }
    );

    if (result.rows.length === 0) {
      return {
        success: false,
        message: 'No meter data found. Customer may not have an active AMI meter.',
        data: null
      };
    }

    const rows = result.rows;
    const first = rows[0];

    // Group rows by expected_date
    const byDate = {};
    rows.forEach(row => {
      const date = row.EXPECTED_DATE;
      if (!byDate[date]) {
        byDate[date] = {
          expected_date: date,
          date_type: row.DATE_TYPE,
          readings: []
        };
      }
      byDate[date].readings.push({
        reading_type: row.READING_TYPE,
        reading_val:  row.READING_VAL,
        last_updated: row.LAST_UPDATED,
        status:       row.STATUS
      });
    });

    const months = Object.values(byDate);
    const totalMonths   = months.length;
    const missingMonths = months.filter(m => m.readings.every(r => r.status === 'Missing')).length;
    const okMonths      = months.filter(m => m.readings.every(r => r.status === 'OK')).length;
    const partialMonths = totalMonths - missingMonths - okMonths;

    return {
      success: true,
      data: {
        customer_id:  first.CUSTOMER_ID,
        meter_no:     first.METER_NO,
        tariff_code:  first.TARIFF_CODE,
        meter_type:   first.METER_TYPE,
        install_date: first.INSTALL_DATE,
        last_bill_dt: first.LAST_BILL_DT,
        bill_status:  first.BILL_STATUS,
        summary: {
          total_months:       totalMonths,
          missing_months:     missingMonths,
          ok_months:          okMonths,
          partial_months:     partialMonths,
          missing_percentage: totalMonths > 0
            ? ((missingMonths / totalMonths) * 100).toFixed(1)
            : '0.0'
        },
        months
      }
    };
  } catch (error) {
    logger.error('[Bill Stop Service] Error getting reading audit:', error);
    throw error;
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) {}
    }
  }
};

/**
 * Run reading audit for multiple customers in parallel (max 10)
 */
const getBatchReadingAudit = async (searchValues) => {
  const values = searchValues.slice(0, 10); // safety cap
  const results = await Promise.allSettled(
    values.map(v => getCustomerReadingAudit(v.trim()))
  );

  return results.map((r, i) => ({
    searchValue: values[i],
    success: r.status === 'fulfilled' && r.value.success,
    data:    r.status === 'fulfilled' ? r.value.data : null,
    message: r.status === 'rejected'  ? r.reason?.message : (r.value.message || null)
  }));
};

/**
 * Export reading audit to Excel (one sheet per customer)
 */
const exportReadingAuditExcel = async (auditResults, res) => {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'DPDC AMI';
  workbook.created = new Date();

  const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
  const headerFont = { bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
  const missingFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8D7DA' } };
  const okFill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD4EDDA' } };
  const partialFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };

  for (const item of auditResults) {
    if (!item.success || !item.data) continue;
    const d = item.data;

    // Safe sheet name (max 31 chars, no special chars)
    const sheetName = `${d.customer_id || item.searchValue}`.replace(/[\\/?*[\]:]/g, '').substring(0, 31);
    const ws = workbook.addWorksheet(sheetName);

    // ── Info header rows ─────────────────────────────────
    const infoStyle = { font: { bold: true, size: 10 } };
    ws.addRow(['Customer ID',  d.customer_id,  '', 'Meter No',     d.meter_no]).font = { size: 10 };
    ws.addRow(['Tariff',       d.tariff_code,  '', 'Meter Type',   d.meter_type]).font = { size: 10 };
    ws.addRow(['Install Date', d.install_date, '', 'Last Bill',    d.bill_status === 'Never Billed' ? 'Never Billed' : d.last_bill_dt]).font = { size: 10 };
    ws.addRow([]);
    // Summary
    ws.addRow(['Total Months', d.summary.total_months, '', 'OK', d.summary.ok_months, '', 'Missing', d.summary.missing_months, '', 'Missing %', d.summary.missing_percentage + '%']);
    ws.addRow([]);

    // ── Column headers ────────────────────────────────────
    const readingTypes = [];
    if (d.months?.length) {
      d.months[0].readings.forEach(r => readingTypes.push(r.reading_type));
    }
    const headerRow = ws.addRow(['Date', 'Type', ...readingTypes, 'Month Status']);
    headerRow.eachCell(cell => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { horizontal: 'center' };
    });

    // ── Data rows ─────────────────────────────────────────
    for (const month of (d.months || [])) {
      const readingVals = readingTypes.map(rt => {
        const r = month.readings.find(x => x.reading_type === rt);
        return r ? r.status : 'N/A';
      });
      const overall = month.readings.every(r => r.status === 'OK')      ? 'OK'
                    : month.readings.every(r => r.status === 'Missing') ? 'Missing'
                    : 'Partial';

      const row = ws.addRow([month.expected_date, month.date_type, ...readingVals, overall]);

      const rowFill = overall === 'OK' ? okFill : overall === 'Missing' ? missingFill : partialFill;
      row.eachCell(cell => { cell.fill = rowFill; cell.alignment = { horizontal: 'center' }; });
    }

    // Column widths
    ws.getColumn(1).width = 16;
    ws.getColumn(2).width = 14;
    readingTypes.forEach((_, i) => { ws.getColumn(3 + i).width = 18; });
    ws.getColumn(3 + readingTypes.length).width = 14;
    ws.autoFilter = { from: { row: 7, column: 1 }, to: { row: 7, column: 3 + readingTypes.length } };
  }

  const timestamp = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="Reading_Audit_${timestamp}.xlsx"`);
  await workbook.xlsx.write(res);
  res.end();
};

/**
 * Export reading audit to PDF
 */
const exportReadingAuditPDF = (auditResults, res) => {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument({ size: 'A4', margin: 30, layout: 'landscape' });

  const timestamp = new Date().toISOString().split('T')[0];
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="Reading_Audit_${timestamp}.pdf"`);
  doc.pipe(res);

  const pageW = doc.page.width;
  const blue  = '#1E3A8A';
  const green = '#155724';
  const red   = '#721C24';
  const amber = '#856404';

  auditResults.forEach((item, idx) => {
    if (!item.success || !item.data) return;
    const d = item.data;

    if (idx > 0) doc.addPage();

    // ── Header bar ───────────────────────────────────────
    doc.rect(0, 0, pageW, 50).fill(blue);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(14)
       .text('DPDC AMI — Meter Reading Audit', 30, 14);
    doc.fontSize(9).font('Helvetica')
       .text(`Generated: ${new Date().toLocaleString()}`, pageW - 230, 18, { width: 200, align: 'right' });

    // ── Customer info ─────────────────────────────────────
    let y = 62;
    doc.fillColor('#2c3e50').font('Helvetica-Bold').fontSize(10);
    doc.text(`Customer: ${d.customer_id}   Meter: ${d.meter_no}   Tariff: ${d.tariff_code} (${d.meter_type})`, 30, y);
    y += 14;
    doc.font('Helvetica').fontSize(9).fillColor('#555');
    doc.text(`Install Date: ${d.install_date}   Last Bill: ${d.bill_status === 'Never Billed' ? 'Never Billed' : d.last_bill_dt}`, 30, y);
    y += 16;

    // ── Summary boxes ─────────────────────────────────────
    const boxes = [
      { label: 'Total Months', val: d.summary.total_months,   bg: '#E8F4FD', tc: '#2c3e50' },
      { label: 'OK',           val: d.summary.ok_months,      bg: '#D4EDDA', tc: green },
      { label: 'Partial',      val: d.summary.partial_months, bg: '#FFF3CD', tc: amber },
      { label: 'Missing',      val: `${d.summary.missing_months} (${d.summary.missing_percentage}%)`, bg: '#F8D7DA', tc: red }
    ];
    const bw = 120, bh = 36, gap = 12;
    boxes.forEach((b, i) => {
      const bx = 30 + i * (bw + gap);
      doc.rect(bx, y, bw, bh).fill(b.bg);
      doc.fillColor(b.tc).font('Helvetica-Bold').fontSize(13)
         .text(String(b.val), bx, y + 4, { width: bw, align: 'center' });
      doc.font('Helvetica').fontSize(8)
         .text(b.label, bx, y + 20, { width: bw, align: 'center' });
    });
    y += bh + 14;

    // ── Reading table ─────────────────────────────────────
    const readingTypes = d.months?.length ? d.months[0].readings.map(r => r.reading_type) : [];
    const cols = ['Date', 'Type', ...readingTypes, 'Status'];
    const colW = [70, 60, ...readingTypes.map(() => 70), 55];
    const tableW = colW.reduce((a, b) => a + b, 0);
    const startX = 30;

    // Header
    doc.rect(startX, y, tableW, 16).fill(blue);
    doc.fillColor('white').font('Helvetica-Bold').fontSize(7.5);
    let cx = startX;
    cols.forEach((c, i) => {
      doc.text(c, cx + 2, y + 4, { width: colW[i] - 4, align: 'center' });
      cx += colW[i];
    });
    y += 16;

    // Rows
    doc.font('Helvetica').fontSize(7.5);
    for (const month of (d.months || [])) {
      if (y > doc.page.height - 40) { doc.addPage(); y = 30; }

      const overall = month.readings.every(r => r.status === 'OK')      ? 'OK'
                    : month.readings.every(r => r.status === 'Missing') ? 'Missing'
                    : 'Partial';

      const rowBg = overall === 'OK' ? '#F0FFF4' : overall === 'Missing' ? '#FFF5F5' : '#FFFBF0';
      doc.rect(startX, y, tableW, 14).fill(rowBg);

      cx = startX;
      const cells = [month.expected_date, month.date_type,
                     ...readingTypes.map(rt => month.readings.find(r => r.reading_type === rt)?.status || 'N/A'),
                     overall];
      cells.forEach((cell, i) => {
        const color = cell === 'Missing' ? red : cell === 'OK' ? green : cell === 'Partial' ? amber : '#2c3e50';
        doc.fillColor(color).text(cell, cx + 2, y + 3, { width: colW[i] - 4, align: 'center' });
        cx += colW[i];
      });

      // Row border
      doc.rect(startX, y, tableW, 14).stroke('#dee2e6');
      y += 14;
    }
  });

  doc.end();
};

module.exports = {
  runBillStopAnalysis,
  getLatestAnalysis,
  getAnalysisHistory,
  searchCustomerWithBillingStatus,
  getCustomerReadingAudit,
  getBatchReadingAudit,
  exportReadingAuditExcel,
  exportReadingAuditPDF
};
