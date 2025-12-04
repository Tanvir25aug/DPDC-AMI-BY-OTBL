/**
 * Setup All Batch Monitoring Tables
 * Run this script to create all batch monitoring tables in the database
 *
 * Usage: node setup-all-batch-tables.js
 */

require('dotenv').config();
const { sequelize } = require('./src/models');

async function setupAllTables() {
  console.log('🔧 Setting up all batch monitoring tables...\n');

  try {
    // 1. Batch Execution Logs
    console.log('📝 Creating batch_execution_logs table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS batch_execution_logs (
        id SERIAL PRIMARY KEY,
        batch_code VARCHAR(50) NOT NULL,
        batch_nbr BIGINT,
        status VARCHAR(20) NOT NULL,
        start_time TIMESTAMP NOT NULL,
        end_time TIMESTAMP,
        duration_seconds INTEGER,
        thread_count INTEGER,
        records_processed BIGINT DEFAULT 0,
        rps DECIMAL(10, 2) DEFAULT 0,
        business_date DATE,
        error_message TEXT,
        snapshot_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_batch_logs_code ON batch_execution_logs(batch_code);
      CREATE INDEX IF NOT EXISTS idx_batch_logs_date ON batch_execution_logs(business_date);
      CREATE INDEX IF NOT EXISTS idx_batch_logs_status ON batch_execution_logs(status);
      CREATE INDEX IF NOT EXISTS idx_batch_logs_start_time ON batch_execution_logs(start_time);
    `);
    console.log('✅ batch_execution_logs created!\n');

    // 2. Batch Monitoring Alerts
    console.log('📝 Creating batch_monitoring_alerts table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS batch_monitoring_alerts (
        id SERIAL PRIMARY KEY,
        batch_code VARCHAR(50) NOT NULL,
        alert_type VARCHAR(50) NOT NULL,
        alert_severity VARCHAR(20) NOT NULL,
        alert_message TEXT NOT NULL,
        batch_execution_log_id INTEGER REFERENCES batch_execution_logs(id) ON DELETE SET NULL,
        business_date DATE,
        acknowledged BOOLEAN DEFAULT FALSE,
        acknowledged_by VARCHAR(100),
        acknowledged_at TIMESTAMP,
        email_sent BOOLEAN DEFAULT FALSE,
        email_sent_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_batch_alerts_code ON batch_monitoring_alerts(batch_code);
      CREATE INDEX IF NOT EXISTS idx_batch_alerts_acknowledged ON batch_monitoring_alerts(acknowledged);
      CREATE INDEX IF NOT EXISTS idx_batch_alerts_severity ON batch_monitoring_alerts(alert_severity);
      CREATE INDEX IF NOT EXISTS idx_batch_alerts_date ON batch_monitoring_alerts(business_date);
    `);
    console.log('✅ batch_monitoring_alerts created!\n');

    // 3. Batch Performance Summary
    console.log('📝 Creating batch_performance_summary table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS batch_performance_summary (
        id SERIAL PRIMARY KEY,
        batch_code VARCHAR(50) NOT NULL,
        business_date DATE NOT NULL,
        total_runs INTEGER DEFAULT 0,
        successful_runs INTEGER DEFAULT 0,
        failed_runs INTEGER DEFAULT 0,
        success_rate DECIMAL(5, 2) DEFAULT 0,
        avg_duration_seconds INTEGER,
        avg_rps DECIMAL(10, 2),
        total_records BIGINT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(batch_code, business_date)
      );
      CREATE INDEX IF NOT EXISTS idx_batch_summary_date ON batch_performance_summary(business_date);
    `);
    console.log('✅ batch_performance_summary created!\n');

    // 4. Batch Workflow Config
    console.log('📝 Creating batch_workflow_config table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS batch_workflow_config (
        id SERIAL PRIMARY KEY,
        batch_code VARCHAR(50) NOT NULL UNIQUE,
        batch_name VARCHAR(200) NOT NULL,
        sequence_order INTEGER NOT NULL,
        expected_start_time TIME,
        expected_duration_minutes INTEGER,
        max_duration_minutes INTEGER,
        min_rps_threshold DECIMAL(10, 2),
        is_critical BOOLEAN DEFAULT TRUE,
        depends_on_batch VARCHAR(50),
        can_run_multiple BOOLEAN DEFAULT FALSE,
        description TEXT,
        enabled BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_workflow_sequence ON batch_workflow_config(sequence_order);
    `);
    console.log('✅ batch_workflow_config created!\n');

    // 5. Batch Monitoring Config
    console.log('📝 Creating batch_monitoring_config table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS batch_monitoring_config (
        id SERIAL PRIMARY KEY,
        setting_key VARCHAR(100) NOT NULL UNIQUE,
        setting_value TEXT NOT NULL,
        description TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ batch_monitoring_config created!\n');

    console.log('🎉 All batch monitoring tables created successfully!\n');
    console.log('💡 You can now restart your backend service.');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

setupAllTables();
