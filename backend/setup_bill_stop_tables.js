#!/usr/bin/env node

/**
 * Setup Bill Stop PostgreSQL Tables
 * Run this once to create the required tables
 */

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: process.env.PG_PORT || 5432,
  database: process.env.PG_DATABASE || 'dpdc_ami_dev',
  user: process.env.PG_USER || 'dev_user',
  password: process.env.PG_PASSWORD || 'admin',
});

async function setupTables() {
  console.log('='.repeat(60));
  console.log('BILL STOP TABLES SETUP');
  console.log('='.repeat(60));
  console.log('');

  try {
    // Test connection
    console.log('Testing PostgreSQL connection...');
    await pool.query('SELECT NOW()');
    console.log('✅ Connected to PostgreSQL successfully');
    console.log('');

    // Read migration file
    const migrationFile = path.join(__dirname, 'migrations', 'create_bill_stop_tables.sql');
    console.log('Reading migration file...');
    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log('✅ Migration file loaded');
    console.log('');

    // Execute migration
    console.log('Creating tables...');
    await pool.query(sql);
    console.log('✅ Tables created successfully');
    console.log('');

    // Verify tables
    console.log('Verifying tables...');
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'bill_stop%'
      ORDER BY table_name
    `);

    console.log('Tables found:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('');
    console.log('='.repeat(60));
    console.log('✅ SUCCESS! Bill Stop tables are ready.');
    console.log('='.repeat(60));
    console.log('');
    console.log('Next steps:');
    console.log('1. Run: node RUN_BILL_STOP_BATCH.js');
    console.log('2. Wait 10-30 minutes for data to load');
    console.log('3. Restart backend: npm run dev');
    console.log('');

    process.exit(0);

  } catch (error) {
    console.error('');
    console.error('='.repeat(60));
    console.error('❌ ERROR!');
    console.error('='.repeat(60));
    console.error('');
    console.error('Error:', error.message);
    console.error('');

    if (error.code === 'ECONNREFUSED') {
      console.error('PostgreSQL is not running or cannot be reached.');
      console.error('Please check:');
      console.error('1. PostgreSQL service is running');
      console.error('2. Connection details in .env are correct');
    } else if (error.code === '42P07') {
      console.error('Tables already exist. This is OK!');
      console.error('You can proceed to run the batch job.');
      process.exit(0);
    }

    console.error('');
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupTables();
