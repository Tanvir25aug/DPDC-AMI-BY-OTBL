require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'dpdc_ami_dev',
  user: process.env.PG_USER || 'dev_user',
  password: process.env.PG_PASSWORD || 'admin',
});

(async () => {
  try {
    const result = await pool.query(`
      SELECT
        id,
        batch_date,
        start_time,
        end_time,
        status,
        summary_count,
        details_count,
        duration_seconds,
        error_message
      FROM bill_stop_batch_log
      ORDER BY id DESC
      LIMIT 3
    `);

    console.log('\n=== BATCH JOB STATUS ===\n');

    if (result.rows.length === 0) {
      console.log('No batch jobs found.');
    } else {
      result.rows.forEach((row, i) => {
        console.log(`Job #${row.id}:`);
        console.log(`  Date: ${row.batch_date}`);
        console.log(`  Status: ${row.status}`);
        console.log(`  Started: ${row.start_time}`);
        console.log(`  Ended: ${row.end_time || 'Still running...'}`);
        console.log(`  Summary Count: ${row.summary_count || 'N/A'}`);
        console.log(`  Details Count: ${row.details_count || 'N/A'}`);
        console.log(`  Duration: ${row.duration_seconds ? `${row.duration_seconds}s (${(row.duration_seconds/60).toFixed(2)} min)` : 'N/A'}`);
        if (row.error_message) {
          console.log(`  Error: ${row.error_message}`);
        }
        console.log('');
      });
    }

    // Check if we have data
    const summaryCount = await pool.query('SELECT COUNT(*) FROM bill_stop_summary');
    const detailsCount = await pool.query('SELECT COUNT(*) FROM bill_stop_details');

    console.log('=== DATA IN DATABASE ===\n');
    console.log(`Summary records: ${summaryCount.rows[0].count}`);
    console.log(`Details records: ${detailsCount.rows[0].count}`);
    console.log('');

    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
})();
