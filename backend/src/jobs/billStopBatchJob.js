const reportsService = require('../services/reports.service');
const logger = require('../config/logger');
const pgPool = require('../config/postgresDB');

/**
 * Bill Stop Batch Job
 * Fetches ALL bill stop data from Oracle and saves to PostgreSQL
 * Runs once per day (or on demand)
 */

/**
 * Run the bill stop batch job
 */
async function runBillStopBatch() {
  const startTime = new Date();
  const batchDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  let batchLogId = null;

  logger.info('[Bill Stop Batch] Starting batch job...');
  console.log('\n========================================');
  console.log('BILL STOP BATCH JOB STARTED');
  console.log(`Start Time: ${startTime.toISOString()}`);
  console.log('========================================\n');

  try {
    // Create batch log entry
    const logResult = await pgPool.query(
      `INSERT INTO bill_stop_batch_log (batch_date, start_time, status)
       VALUES ($1, $2, 'running')
       RETURNING id`,
      [batchDate, startTime]
    );
    batchLogId = logResult.rows[0].id;
    logger.info(`[Bill Stop Batch] Batch log created: ${batchLogId}`);

    // Step 1: Fetch ALL details from Oracle
    logger.info('[Bill Stop Batch] Fetching bill stop details from Oracle...');
    console.log('Step 1: Fetching bill stop details from Oracle...');
    const detailsStartTime = Date.now();

    const details = await reportsService.executeReport('crp_cpc_bill_stop_full', {}, { maxRows: 0 });

    const detailsElapsed = ((Date.now() - detailsStartTime) / 1000).toFixed(2);
    logger.info(`[Bill Stop Batch] Fetched ${details.length} bill stop records in ${detailsElapsed}s`);
    console.log(`✓ Fetched ${details.length} bill stop records in ${detailsElapsed}s`);

    if (details.length === 0) {
      logger.warn('[Bill Stop Batch] No bill stop issues found');
      console.log('⚠ Warning: No bill stop issues found');
    }

    // Step 2: Calculate summary data
    logger.info('[Bill Stop Batch] Calculating summary data...');
    console.log('\nStep 2: Calculating summary data...');
    const summaryStartTime = Date.now();

    const summaryMap = new Map();

    details.forEach(row => {
      const crp = row.CRP_ACCOUNT_NO;
      if (!summaryMap.has(crp)) {
        summaryMap.set(crp, {
          crp_account_no: crp,
          total_cpc_count: 0,
          bill_stop_count: 0,
          active_billing_count: 0
        });
      }

      const summary = summaryMap.get(crp);
      summary.total_cpc_count++;

      if (row.BILLING_STATUS === 'Bill Stop Issue') {
        summary.bill_stop_count++;
      } else {
        summary.active_billing_count++;
      }
    });

    const summary = Array.from(summaryMap.values()).map(s => ({
      ...s,
      bill_stop_percentage: s.total_cpc_count > 0
        ? ((s.bill_stop_count / s.total_cpc_count) * 100).toFixed(2)
        : 0
    }));

    const summaryElapsed = ((Date.now() - summaryStartTime) / 1000).toFixed(2);
    logger.info(`[Bill Stop Batch] Calculated summary for ${summary.length} CRPs in ${summaryElapsed}s`);
    console.log(`✓ Calculated summary for ${summary.length} CRPs in ${summaryElapsed}s`);

    // Step 3: Clear old data from PostgreSQL
    logger.info('[Bill Stop Batch] Clearing old data from PostgreSQL...');
    console.log('\nStep 3: Clearing old data from PostgreSQL...');

    await pgPool.query('DELETE FROM bill_stop_details WHERE batch_date = $1', [batchDate]);
    await pgPool.query('DELETE FROM bill_stop_summary WHERE batch_date = $1', [batchDate]);

    console.log('✓ Old data cleared');

    // Step 4: Insert summary data
    logger.info('[Bill Stop Batch] Inserting summary data into PostgreSQL...');
    console.log('\nStep 4: Inserting summary data into PostgreSQL...');
    const summaryInsertStart = Date.now();

    for (const row of summary) {
      await pgPool.query(
        `INSERT INTO bill_stop_summary
         (crp_account_no, total_cpc_count, bill_stop_count, active_billing_count, bill_stop_percentage, batch_date)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (crp_account_no, batch_date)
         DO UPDATE SET
           total_cpc_count = EXCLUDED.total_cpc_count,
           bill_stop_count = EXCLUDED.bill_stop_count,
           active_billing_count = EXCLUDED.active_billing_count,
           bill_stop_percentage = EXCLUDED.bill_stop_percentage`,
        [
          row.crp_account_no,
          row.total_cpc_count,
          row.bill_stop_count,
          row.active_billing_count,
          row.bill_stop_percentage,
          batchDate
        ]
      );
    }

    const summaryInsertElapsed = ((Date.now() - summaryInsertStart) / 1000).toFixed(2);
    console.log(`✓ Inserted ${summary.length} summary records in ${summaryInsertElapsed}s`);

    // Step 5: Insert details data (in batches for performance)
    logger.info('[Bill Stop Batch] Inserting details data into PostgreSQL...');
    console.log('\nStep 5: Inserting details data into PostgreSQL...');
    const detailsInsertStart = Date.now();

    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < details.length; i += batchSize) {
      const batch = details.slice(i, i + batchSize);

      for (const row of batch) {
        await pgPool.query(
          `INSERT INTO bill_stop_details
           (crp_account_no, cpc_customer_no, meter_no, customer_name, address, nocs_name, phone_no,
            sa_status_desc, last_bill_date, billing_status, current_balance, batch_date)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           ON CONFLICT (cpc_customer_no, batch_date)
           DO UPDATE SET
             crp_account_no = EXCLUDED.crp_account_no,
             meter_no = EXCLUDED.meter_no,
             customer_name = EXCLUDED.customer_name,
             address = EXCLUDED.address,
             nocs_name = EXCLUDED.nocs_name,
             phone_no = EXCLUDED.phone_no,
             sa_status_desc = EXCLUDED.sa_status_desc,
             last_bill_date = EXCLUDED.last_bill_date,
             billing_status = EXCLUDED.billing_status,
             current_balance = EXCLUDED.current_balance`,
          [
            row.CRP_ACCOUNT_NO,
            row.CPC_CUSTOMER_NO,
            row.METER_NO,
            row.CUSTOMER_NAME,
            row.ADDRESS,
            row.NOCS_NAME,
            row.PHONE_NO,
            row.SA_STATUS_DESC,
            row.LAST_BILL_DATE,
            row.BILLING_STATUS,
            row.CURRENT_BALANCE,
            batchDate
          ]
        );
      }

      inserted += batch.length;
      if (inserted % 1000 === 0) {
        console.log(`  Progress: ${inserted}/${details.length} records inserted...`);
      }
    }

    const detailsInsertElapsed = ((Date.now() - detailsInsertStart) / 1000).toFixed(2);
    console.log(`✓ Inserted ${details.length} detail records in ${detailsInsertElapsed}s`);

    // Update batch log as completed
    const endTime = new Date();
    const durationSeconds = Math.round((endTime - startTime) / 1000);

    await pgPool.query(
      `UPDATE bill_stop_batch_log
       SET end_time = $1, status = 'completed', summary_count = $2, details_count = $3, duration_seconds = $4
       WHERE id = $5`,
      [endTime, summary.length, details.length, durationSeconds, batchLogId]
    );

    logger.info(`[Bill Stop Batch] Batch job completed successfully in ${durationSeconds}s`);
    console.log('\n========================================');
    console.log('BILL STOP BATCH JOB COMPLETED');
    console.log(`End Time: ${endTime.toISOString()}`);
    console.log(`Duration: ${durationSeconds} seconds (${(durationSeconds / 60).toFixed(2)} minutes)`);
    console.log(`Summary Records: ${summary.length}`);
    console.log(`Detail Records: ${details.length}`);
    console.log('========================================\n');

    return {
      success: true,
      summary_count: summary.length,
      details_count: details.length,
      duration_seconds: durationSeconds
    };

  } catch (error) {
    const endTime = new Date();
    const durationSeconds = Math.round((endTime - startTime) / 1000);

    logger.error('[Bill Stop Batch] Batch job failed:', error);
    console.error('\n========================================');
    console.error('BILL STOP BATCH JOB FAILED');
    console.error(`Error: ${error.message}`);
    console.error('========================================\n');

    // Update batch log as failed
    if (batchLogId) {
      await pgPool.query(
        `UPDATE bill_stop_batch_log
         SET end_time = $1, status = 'failed', error_message = $2, duration_seconds = $3
         WHERE id = $4`,
        [endTime, error.message, durationSeconds, batchLogId]
      );
    }

    throw error;
  }
}

/**
 * Get latest batch info
 */
async function getLatestBatchInfo() {
  const result = await pgPool.query(
    `SELECT * FROM bill_stop_batch_log
     ORDER BY batch_date DESC, start_time DESC
     LIMIT 1`
  );

  return result.rows[0] || null;
}

/**
 * Check if batch is running
 */
async function isBatchRunning() {
  const result = await pgPool.query(
    `SELECT COUNT(*) as count FROM bill_stop_batch_log
     WHERE status = 'running'`
  );

  return parseInt(result.rows[0].count) > 0;
}

module.exports = {
  runBillStopBatch,
  getLatestBatchInfo,
  isBatchRunning
};
