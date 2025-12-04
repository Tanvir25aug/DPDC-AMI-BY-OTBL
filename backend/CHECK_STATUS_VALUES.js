/**
 * Check Status Values
 */

require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const { initializeOraclePool, executeQuery, closeOraclePool } = require('./src/config/oracle');

async function checkStatuses() {
  console.log('🔍 Checking status values...\n');

  try {
    await initializeOraclePool();

    // Check D1_IMD_CTRL statuses
    console.log('📊 D1_IMD_CTRL - BO_STATUS_CD values:');
    const imdStatuses = await executeQuery(`
      SELECT DISTINCT BO_STATUS_CD, COUNT(*) as count
      FROM CISADM.D1_IMD_CTRL
      GROUP BY BO_STATUS_CD
      ORDER BY count DESC
    `);
    imdStatuses.rows.forEach(row => {
      console.log(`  - '${row.BO_STATUS_CD.trim()}': ${row.COUNT} records`);
    });

    console.log('\n📊 CI_BATCH_RUN - RUN_STATUS values:');
    const batchStatuses = await executeQuery(`
      SELECT DISTINCT RUN_STATUS, COUNT(*) as count
      FROM CISADM.CI_BATCH_RUN
      GROUP BY RUN_STATUS
      ORDER BY count DESC
    `);
    batchStatuses.rows.forEach(row => {
      console.log(`  - '${row.RUN_STATUS.trim()}': ${row.COUNT} records`);
    });

    console.log('\n📊 Recent running batches:');
    const running = await executeQuery(`
      SELECT BATCH_CD, BATCH_NBR, RUN_STATUS, START_DTTM, END_DTTM
      FROM CISADM.CI_BATCH_RUN
      WHERE ROWNUM <= 10
      ORDER BY START_DTTM DESC
    `);
    running.rows.forEach(row => {
      console.log(`  - ${row.BATCH_CD?.trim()}: ${row.RUN_STATUS?.trim()} (Started: ${row.START_DTTM})`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await closeOraclePool();
    process.exit(0);
  }
}

checkStatuses();
