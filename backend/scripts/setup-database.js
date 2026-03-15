/**
 * DPDC AMI - Database Setup Script
 *
 * This script sets up the PostgreSQL database with all required tables and seed data.
 * Run this script to initialize a new development environment.
 *
 * Usage:
 *   node scripts/setup-database.js
 *
 * Prerequisites:
 *   - PostgreSQL must be running
 *   - Database and user must exist (create using database_setup.sql first)
 *   - Or set CREATE_DATABASE=true to auto-create
 */

require('dotenv').config({ path: '.env.development' });

const { Sequelize } = require('sequelize');
const bcrypt = require('bcrypt');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

// Database configuration
const config = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || 'dpdc_ami_dev',
  username: process.env.POSTGRES_USER || 'dev_user',
  password: process.env.POSTGRES_PASSWORD || 'admin',
  dialect: 'postgres',
  logging: false
};

// Default roles
const defaultRoles = [
  {
    name: 'admin',
    description: 'Full system access including user management',
    permissions: {
      can_manage_users: true,
      can_execute_any_query: true,
      can_export_reports: true,
      can_view_audit_logs: true,
      can_manage_roles: true
    }
  },
  {
    name: 'power_user',
    description: 'Can execute custom queries and export reports',
    permissions: {
      can_manage_users: false,
      can_execute_custom_query: true,
      can_execute_predefined_query: true,
      can_export_reports: true,
      can_view_audit_logs: false
    }
  },
  {
    name: 'user',
    description: 'Can execute predefined queries and export reports',
    permissions: {
      can_manage_users: false,
      can_execute_predefined_query: true,
      can_export_reports: true,
      can_view_audit_logs: false
    }
  },
  {
    name: 'viewer',
    description: 'Read-only access to view reports',
    permissions: {
      can_manage_users: false,
      can_view_reports: true,
      can_export_reports: false,
      can_view_audit_logs: false
    }
  }
];

// Default users
const defaultUsers = [
  { username: 'admin', email: 'admin@dpdc.org.bd', password: 'Admin@123', role_id: 1 },
  { username: 'power_user', email: 'poweruser@dpdc.org.bd', password: 'Power@123', role_id: 2 },
  { username: 'user', email: 'user@dpdc.org.bd', password: 'User@123', role_id: 3 },
  { username: 'viewer', email: 'viewer@dpdc.org.bd', password: 'View@123', role_id: 4 }
];

// Batch workflow configuration
const batchWorkflowConfig = [
  { batch_code: 'CM-DMRU', batch_name: 'First Reads Batch', sequence_order: 1, expected_start_time: '05:00:00', expected_duration_minutes: 120, max_duration_minutes: 180, min_rps_threshold: 50.00, is_critical: true, depends_on_batch: null, can_run_multiple: false, description: 'First reads batch - starts at 5 AM daily', enabled: true },
  { batch_code: 'MD-MONITOR', batch_name: 'MD Monitor - Physical Device', sequence_order: 2, expected_start_time: null, expected_duration_minutes: 30, max_duration_minutes: 60, min_rps_threshold: 20.00, is_critical: true, depends_on_batch: 'CM-DMRU', can_run_multiple: true, description: 'Run multiple times until IMD count is 0', enabled: true },
  { batch_code: 'C1-PPBTR', batch_name: 'Prepay Biller Task - Error', sequence_order: 3, expected_start_time: null, expected_duration_minutes: 45, max_duration_minutes: 90, min_rps_threshold: 30.00, is_critical: true, depends_on_batch: 'MD-MONITOR', can_run_multiple: false, description: 'Prepay biller task processing', enabled: true },
  { batch_code: 'F1-FLUSH', batch_name: 'Flush Batch', sequence_order: 4, expected_start_time: null, expected_duration_minutes: 15, max_duration_minutes: 30, min_rps_threshold: 10.00, is_critical: false, depends_on_batch: 'C1-PPBTR', can_run_multiple: true, description: 'Flush batch - runs multiple times', enabled: true },
  { batch_code: 'CM_BSGGN', batch_name: 'Bill Segment Creation NEW', sequence_order: 5, expected_start_time: null, expected_duration_minutes: 90, max_duration_minutes: 150, min_rps_threshold: 40.00, is_critical: true, depends_on_batch: 'F1-FLUSH', can_run_multiple: false, description: 'Bill segment creation with IMD', enabled: true },
  { batch_code: 'BILLRESTSMS', batch_name: 'BILLRE START SMS', sequence_order: 6, expected_start_time: null, expected_duration_minutes: 30, max_duration_minutes: 60, min_rps_threshold: 20.00, is_critical: true, depends_on_batch: 'CM_BSGGN', can_run_multiple: false, description: 'Final SMS batch', enabled: true }
];

// Batch monitoring configuration
const batchMonitoringConfig = [
  { setting_key: 'SCHEDULER_INTERVAL_MINUTES', setting_value: '15', description: 'How often the scheduler checks for batch updates (in minutes)' },
  { setting_key: 'DATA_RETENTION_DAYS', setting_value: '60', description: 'Number of days to keep batch logs' },
  { setting_key: 'STUCK_BATCH_THRESHOLD_MINUTES', setting_value: '60', description: 'Alert if batch has no progress for this many minutes' },
  { setting_key: 'EMAIL_ALERTS_ENABLED', setting_value: 'true', description: 'Enable email alerts for critical batch failures' },
  { setting_key: 'EMAIL_RECIPIENTS', setting_value: 'admin@dpdc.com', description: 'Comma-separated email addresses for alerts' },
  { setting_key: 'BUSINESS_DAY_START_HOUR', setting_value: '5', description: 'Business day starts at this hour (24-hour format)' }
];

async function setup() {
  console.log('');
  console.log('============================================');
  console.log('  DPDC AMI Database Setup');
  console.log('============================================');
  console.log('');
  console.log(`Host: ${config.host}:${config.port}`);
  console.log(`Database: ${config.database}`);
  console.log(`User: ${config.username}`);
  console.log('');

  const sequelize = new Sequelize(config.database, config.username, config.password, {
    host: config.host,
    port: config.port,
    dialect: config.dialect,
    logging: false
  });

  try {
    // Test connection
    await sequelize.authenticate();
    console.log('✅ Database connection successful');
    console.log('');

    // Run migrations (sync all models)
    console.log('📦 Running migrations...');
    const models = require('../src/models');
    await models.sequelize.sync({ force: false, alter: true });
    console.log('✅ Migrations completed');
    console.log('');

    // Seed roles
    console.log('👤 Seeding roles...');
    const Role = models.Role;
    for (const roleData of defaultRoles) {
      const [role, created] = await Role.findOrCreate({
        where: { name: roleData.name },
        defaults: roleData
      });
      if (created) {
        console.log(`   ✓ Created role: ${role.name}`);
      } else {
        console.log(`   - Role exists: ${role.name}`);
      }
    }
    console.log('');

    // Seed users
    console.log('👥 Seeding users...');
    const User = models.User;
    for (const userData of defaultUsers) {
      const existingUser = await User.findOne({ where: { username: userData.username } });
      if (!existingUser) {
        const passwordHash = await bcrypt.hash(userData.password, BCRYPT_ROUNDS);
        await User.create({
          username: userData.username,
          email: userData.email,
          password_hash: passwordHash,
          role_id: userData.role_id,
          is_active: true
        });
        console.log(`   ✓ Created user: ${userData.username} (password: ${userData.password})`);
      } else {
        console.log(`   - User exists: ${userData.username}`);
      }
    }
    console.log('');

    // Seed batch workflow config
    console.log('⚙️  Seeding batch workflow configuration...');
    const [BatchWorkflowConfig] = await sequelize.query(`
      SELECT COUNT(*) as count FROM batch_workflow_config
    `);

    if (parseInt(BatchWorkflowConfig[0].count) === 0) {
      for (const config of batchWorkflowConfig) {
        await sequelize.query(`
          INSERT INTO batch_workflow_config
          (batch_code, batch_name, sequence_order, expected_start_time, expected_duration_minutes,
           max_duration_minutes, min_rps_threshold, is_critical, depends_on_batch, can_run_multiple,
           description, enabled, created_at, updated_at)
          VALUES (:batch_code, :batch_name, :sequence_order, :expected_start_time, :expected_duration_minutes,
                  :max_duration_minutes, :min_rps_threshold, :is_critical, :depends_on_batch, :can_run_multiple,
                  :description, :enabled, NOW(), NOW())
        `, {
          replacements: config
        });
        console.log(`   ✓ Added batch: ${config.batch_code}`);
      }
    } else {
      console.log('   - Batch workflow config already exists');
    }
    console.log('');

    // Seed batch monitoring config
    console.log('⚙️  Seeding batch monitoring configuration...');
    const [BatchMonitoringConfig] = await sequelize.query(`
      SELECT COUNT(*) as count FROM batch_monitoring_config
    `);

    if (parseInt(BatchMonitoringConfig[0].count) === 0) {
      for (const config of batchMonitoringConfig) {
        await sequelize.query(`
          INSERT INTO batch_monitoring_config
          (setting_key, setting_value, description, updated_at)
          VALUES (:setting_key, :setting_value, :description, NOW())
        `, {
          replacements: config
        });
        console.log(`   ✓ Added setting: ${config.setting_key}`);
      }
    } else {
      console.log('   - Batch monitoring config already exists');
    }
    console.log('');

    // Display summary
    console.log('============================================');
    console.log('  Setup Complete!');
    console.log('============================================');
    console.log('');
    console.log('  Default Credentials:');
    console.log('  ---------------------');
    console.log('  admin / Admin@123 (Administrator)');
    console.log('  power_user / Power@123 (Power User)');
    console.log('  user / User@123 (Regular User)');
    console.log('  viewer / View@123 (Viewer)');
    console.log('');
    console.log('  Next Steps:');
    console.log('  ---------------------');
    console.log('  1. Start the backend: npm run dev');
    console.log('  2. Start the frontend: cd ../frontend && npm run dev');
    console.log('  3. Open http://localhost:5173 in your browser');
    console.log('  4. Login with admin / Admin@123');
    console.log('');
    console.log('============================================');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.error('');
    console.error('Make sure:');
    console.error('1. PostgreSQL is running');
    console.error('2. Database exists: ' + config.database);
    console.error('3. User exists: ' + config.username);
    console.error('4. Password is correct');
    console.error('');
    console.error('Run this SQL as postgres superuser first:');
    console.error('  CREATE USER dev_user WITH PASSWORD \'admin\';');
    console.error('  CREATE DATABASE dpdc_ami_dev OWNER dev_user;');
    console.error('');
    await sequelize.close();
    process.exit(1);
  }
}

setup();
