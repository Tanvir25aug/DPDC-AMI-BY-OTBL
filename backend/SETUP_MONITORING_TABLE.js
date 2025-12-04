/**
 * Setup Batch Monitoring History Table
 */

require('dotenv').config({ path: `.env.${process.env.NODE_ENV || 'development'}` });
const { sequelize } = require('./src/models');

async function setupTable() {
  console.log('🔧 Setting up batch monitoring history table...\n');

  try {
    // Check if table exists
    const [results] = await sequelize.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'batch_monitoring_history'
      );
    `);

    if (results[0].exists) {
      console.log('✅ Table already exists!');
    } else {
      console.log('📝 Creating table...');

      // Create the table
      await sequelize.query(`
        CREATE TABLE IF NOT EXISTS batch_monitoring_history (
            id SERIAL PRIMARY KEY,
            batch_code VARCHAR(50) NOT NULL,
            check_time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
            records_processed BIGINT,
            rps DECIMAL(10, 2),
            duration_seconds INTEGER,
            status VARCHAR(20),
            is_stuck BOOLEAN DEFAULT FALSE,
            alert_sent BOOLEAN DEFAULT FALSE,
            notes TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);

      console.log('✅ Table created!');

      // Create indexes
      console.log('📝 Creating indexes...');

      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_batch_monitoring_batch_code ON batch_monitoring_history(batch_code);
      `);
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_batch_monitoring_check_time ON batch_monitoring_history(check_time);
      `);
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_batch_monitoring_is_stuck ON batch_monitoring_history(is_stuck);
      `);
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_batch_monitoring_alert_sent ON batch_monitoring_history(alert_sent);
      `);
      await sequelize.query(`
        CREATE INDEX IF NOT EXISTS idx_batch_monitoring_batch_time ON batch_monitoring_history(batch_code, check_time DESC);
      `);

      console.log('✅ Indexes created!');
    }

    console.log('\n🎉 Setup complete!\n');
  } catch (error) {
    console.error('❌ Error setting up table:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
}

setupTable();
