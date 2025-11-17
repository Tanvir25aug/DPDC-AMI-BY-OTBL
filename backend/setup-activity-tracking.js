const { Sequelize } = require('sequelize');
const config = require('./src/config/config.json');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  {
    host: dbConfig.host,
    port: dbConfig.port,
    dialect: dbConfig.dialect,
    logging: false
  }
);

async function setupActivityTracking() {
  console.log('🚀 Setting up activity tracking tables...\n');

  try {
    // Test database connection
    await sequelize.authenticate();
    console.log('✓ Database connection established\n');

    // Create login_history table
    console.log('Creating login_history table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        login_method VARCHAR(20) DEFAULT 'password' CHECK (login_method IN ('password', 'token', 'refresh')),
        status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'blocked')),
        failure_reason VARCHAR(255),
        device_type VARCHAR(50),
        browser VARCHAR(50),
        os VARCHAR(50),
        location VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ login_history table ready\n');

    // Create indexes for login_history
    console.log('Creating indexes for login_history...');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_login_history_status ON login_history(status)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at)');
    console.log('✓ Indexes created for login_history\n');

    // Create user_sessions table
    console.log('Creating user_sessions table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        session_token VARCHAR(255) NOT NULL UNIQUE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        device_type VARCHAR(50),
        browser VARCHAR(50),
        os VARCHAR(50),
        location VARCHAR(100),
        is_active BOOLEAN DEFAULT true,
        last_activity TIMESTAMP,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ user_sessions table ready\n');

    // Create indexes for user_sessions
    console.log('Creating indexes for user_sessions...');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at)');
    console.log('✓ Indexes created for user_sessions\n');

    // Create user_activities table
    console.log('Creating user_activities table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_activities (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE ON UPDATE CASCADE,
        activity_type VARCHAR(50) NOT NULL CHECK (activity_type IN (
          'login', 'logout', 'query_executed', 'report_generated', 'data_exported',
          'profile_updated', 'password_changed', 'user_created', 'user_updated',
          'user_deleted', 'settings_changed', 'permission_changed'
        )),
        activity_description TEXT,
        metadata JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        resource_type VARCHAR(50),
        resource_id INTEGER,
        status VARCHAR(20) DEFAULT 'success' CHECK (status IN ('success', 'failed', 'warning')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✓ user_activities table ready\n');

    // Create indexes for user_activities
    console.log('Creating indexes for user_activities...');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON user_activities(created_at)');
    await sequelize.query('CREATE INDEX IF NOT EXISTS idx_user_activities_status ON user_activities(status)');
    console.log('✓ Indexes created for user_activities\n');

    // Mark migration as complete
    console.log('Marking migration as complete...');
    await sequelize.query(`
      INSERT INTO "SequelizeMeta" (name)
      VALUES ('20250117000002-add-activity-tracking-safe.js')
      ON CONFLICT DO NOTHING
    `);
    console.log('✓ Migration marked as complete\n');

    console.log('✅ Activity tracking setup completed successfully!\n');
    console.log('You can now:');
    console.log('  - Start the backend server: npm run dev');
    console.log('  - View activity logs in the Profile page');
    console.log('  - Use the /api/activity endpoints\n');

  } catch (error) {
    console.error('❌ Error setting up activity tracking:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

setupActivityTracking();
