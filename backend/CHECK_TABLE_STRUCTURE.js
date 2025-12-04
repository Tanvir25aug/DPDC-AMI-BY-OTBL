/**
 * Check Oracle Table Structure
 */

require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const { initializeOraclePool, executeQuery, closeOraclePool } = require('./src/config/oracle');

async function checkTables() {
  console.log('🔍 Checking table structures...\n');

  try {
    await initializeOraclePool();

    // Check D1_IMD_CTRL structure
    console.log('📊 D1_IMD_CTRL columns:');
    const imdColumns = await executeQuery(`
      SELECT column_name, data_type
      FROM all_tab_columns
      WHERE table_name = 'D1_IMD_CTRL'
      AND owner = 'CISADM'
      ORDER BY column_id
    `);
    imdColumns.rows.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    // Check sample data
    console.log('\n📊 Sample D1_IMD_CTRL data:');
    const imdData = await executeQuery(`
      SELECT * FROM CISADM.D1_IMD_CTRL WHERE ROWNUM <= 5
    `);
    console.log(`  Found ${imdData.rows.length} rows\n`);

    // Check CI_BATCH_RUN structure
    console.log('📊 CI_BATCH_RUN columns:');
    const batchColumns = await executeQuery(`
      SELECT column_name, data_type
      FROM all_tab_columns
      WHERE table_name = 'CI_BATCH_RUN'
      AND owner = 'CISADM'
      ORDER BY column_id
    `);
    batchColumns.rows.forEach(col => {
      console.log(`  - ${col.COLUMN_NAME} (${col.DATA_TYPE})`);
    });

    console.log('\n📊 Sample CI_BATCH_RUN data:');
    const batchData = await executeQuery(`
      SELECT * FROM CISADM.CI_BATCH_RUN WHERE ROWNUM <= 5
    `);
    console.log(`  Found ${batchData.rows.length} rows\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await closeOraclePool();
    process.exit(0);
  }
}

checkTables();
