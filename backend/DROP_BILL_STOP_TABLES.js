#!/usr/bin/env node

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'dpdc_ami_prod',
  user: process.env.POSTGRES_USER || 'dpdc_prod_user',
  password: process.env.POSTGRES_PASSWORD || 'admin',
});

async function dropTables() {
  console.log('\n========================================');
  console.log('DROPPING BILL STOP TABLES');
  console.log('========================================\n');

  try {
    console.log('Dropping bill_stop_details...');
    await pool.query('DROP TABLE IF EXISTS bill_stop_details CASCADE');
    console.log('✓ bill_stop_details dropped');

    console.log('Dropping bill_stop_summary...');
    await pool.query('DROP TABLE IF EXISTS bill_stop_summary CASCADE');
    console.log('✓ bill_stop_summary dropped');

    console.log('Dropping bill_stop_batch_log...');
    await pool.query('DROP TABLE IF EXISTS bill_stop_batch_log CASCADE');
    console.log('✓ bill_stop_batch_log dropped');

    console.log('\n✓ All tables dropped successfully\n');
    process.exit(0);
  } catch (error) {
    console.error('\n✗ Error:', error.message, '\n');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

dropTables();
