'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Batch Execution Logs Table
    await queryInterface.createTable('batch_execution_logs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      batch_code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      batch_nbr: {
        type: Sequelize.BIGINT,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'ST=Running, CM=Complete, ED=Ended, ER=Error, PD=Pending'
      },
      start_time: {
        type: Sequelize.DATE,
        allowNull: false
      },
      end_time: {
        type: Sequelize.DATE,
        allowNull: true
      },
      duration_seconds: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      thread_count: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      records_processed: {
        type: Sequelize.BIGINT,
        allowNull: true,
        defaultValue: 0
      },
      rps: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: 0
      },
      business_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      error_message: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      snapshot_time: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        comment: 'When this record was captured from Oracle'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indexes for batch_execution_logs
    await queryInterface.addIndex('batch_execution_logs', ['batch_code'], {
      name: 'idx_batch_logs_code'
    });
    await queryInterface.addIndex('batch_execution_logs', ['business_date'], {
      name: 'idx_batch_logs_date'
    });
    await queryInterface.addIndex('batch_execution_logs', ['status'], {
      name: 'idx_batch_logs_status'
    });
    await queryInterface.addIndex('batch_execution_logs', ['start_time'], {
      name: 'idx_batch_logs_start_time'
    });

    // 2. Batch Monitoring Alerts Table
    await queryInterface.createTable('batch_monitoring_alerts', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      batch_code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      alert_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'FAILED, LONG_RUNNING, LOW_RPS, STUCK, MISSING'
      },
      alert_severity: {
        type: Sequelize.STRING(20),
        allowNull: false,
        comment: 'INFO, WARNING, CRITICAL'
      },
      alert_message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      batch_execution_log_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'batch_execution_logs',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL'
      },
      business_date: {
        type: Sequelize.DATEONLY,
        allowNull: true
      },
      acknowledged: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      acknowledged_by: {
        type: Sequelize.STRING(100),
        allowNull: true
      },
      acknowledged_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      email_sent: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      email_sent_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indexes for batch_monitoring_alerts
    await queryInterface.addIndex('batch_monitoring_alerts', ['batch_code'], {
      name: 'idx_batch_alerts_code'
    });
    await queryInterface.addIndex('batch_monitoring_alerts', ['acknowledged'], {
      name: 'idx_batch_alerts_acknowledged'
    });
    await queryInterface.addIndex('batch_monitoring_alerts', ['alert_severity'], {
      name: 'idx_batch_alerts_severity'
    });
    await queryInterface.addIndex('batch_monitoring_alerts', ['business_date'], {
      name: 'idx_batch_alerts_date'
    });

    // 3. Batch Performance Summary Table (Daily aggregates)
    await queryInterface.createTable('batch_performance_summary', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      batch_code: {
        type: Sequelize.STRING(50),
        allowNull: false
      },
      business_date: {
        type: Sequelize.DATEONLY,
        allowNull: false
      },
      total_runs: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      successful_runs: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      failed_runs: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      success_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: false,
        defaultValue: 0,
        comment: 'Percentage (0-100)'
      },
      avg_duration_seconds: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      avg_rps: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true
      },
      total_records: {
        type: Sequelize.BIGINT,
        allowNull: false,
        defaultValue: 0
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Unique constraint and indexes for batch_performance_summary
    await queryInterface.addConstraint('batch_performance_summary', {
      fields: ['batch_code', 'business_date'],
      type: 'unique',
      name: 'unique_batch_date'
    });
    await queryInterface.addIndex('batch_performance_summary', ['business_date'], {
      name: 'idx_batch_summary_date'
    });

    // 4. Batch Workflow Configuration (Daily Operation Timeline)
    await queryInterface.createTable('batch_workflow_config', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      batch_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true
      },
      batch_name: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      sequence_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Order in daily workflow (1=first, 2=second, etc)'
      },
      expected_start_time: {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Expected start time (e.g., 05:00:00 for 5 AM)'
      },
      expected_duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Expected duration in minutes'
      },
      max_duration_minutes: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Alert if exceeds this duration'
      },
      min_rps_threshold: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        comment: 'Alert if RPS falls below this'
      },
      is_critical: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'If true, send email alert on failure'
      },
      depends_on_batch: {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Batch code that must complete before this'
      },
      can_run_multiple: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'If true, batch can run multiple times in a day'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    await queryInterface.addIndex('batch_workflow_config', ['sequence_order'], {
      name: 'idx_workflow_sequence'
    });

    // 5. Batch Monitoring Configuration (System Settings)
    await queryInterface.createTable('batch_monitoring_config', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      setting_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true
      },
      setting_value: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Insert initial workflow configuration
    await queryInterface.bulkInsert('batch_workflow_config', [
      {
        batch_code: 'CM-DMRU',
        batch_name: 'First Reads Batch',
        sequence_order: 1,
        expected_start_time: '05:00:00',
        expected_duration_minutes: 120,
        max_duration_minutes: 180,
        min_rps_threshold: 50.00,
        is_critical: true,
        depends_on_batch: null,
        can_run_multiple: false,
        description: 'First reads batch - starts at 5 AM daily',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        batch_code: 'MD-MONITOR',
        batch_name: 'MD Monitor - Physical Device',
        sequence_order: 2,
        expected_start_time: null,
        expected_duration_minutes: 30,
        max_duration_minutes: 60,
        min_rps_threshold: 20.00,
        is_critical: true,
        depends_on_batch: 'CM-DMRU',
        can_run_multiple: true,
        description: 'Run multiple times until IMD count is 0',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        batch_code: 'C1-PPBTR',
        batch_name: 'Prepay Biller Task - Error',
        sequence_order: 3,
        expected_start_time: null,
        expected_duration_minutes: 45,
        max_duration_minutes: 90,
        min_rps_threshold: 30.00,
        is_critical: true,
        depends_on_batch: 'MD-MONITOR',
        can_run_multiple: false,
        description: 'Prepay biller task processing',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        batch_code: 'F1-FLUSH',
        batch_name: 'Flush Batch',
        sequence_order: 4,
        expected_start_time: null,
        expected_duration_minutes: 15,
        max_duration_minutes: 30,
        min_rps_threshold: 10.00,
        is_critical: false,
        depends_on_batch: 'C1-PPBTR',
        can_run_multiple: true,
        description: 'Flush batch - runs multiple times',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        batch_code: 'CM_BSGGN',
        batch_name: 'Bill Segment Creation NEW',
        sequence_order: 5,
        expected_start_time: null,
        expected_duration_minutes: 90,
        max_duration_minutes: 150,
        min_rps_threshold: 40.00,
        is_critical: true,
        depends_on_batch: 'F1-FLUSH',
        can_run_multiple: false,
        description: 'Bill segment creation with IMD',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        batch_code: 'BILLRESTSMS',
        batch_name: 'BILLRE START SMS',
        sequence_order: 6,
        expected_start_time: null,
        expected_duration_minutes: 30,
        max_duration_minutes: 60,
        min_rps_threshold: 20.00,
        is_critical: true,
        depends_on_batch: 'CM_BSGGN',
        can_run_multiple: false,
        description: 'Final SMS batch',
        enabled: true,
        created_at: new Date(),
        updated_at: new Date()
      }
    ]);

    // Insert initial monitoring configuration
    await queryInterface.bulkInsert('batch_monitoring_config', [
      {
        setting_key: 'SCHEDULER_INTERVAL_MINUTES',
        setting_value: '15',
        description: 'How often the scheduler checks for batch updates (in minutes)',
        updated_at: new Date()
      },
      {
        setting_key: 'DATA_RETENTION_DAYS',
        setting_value: '60',
        description: 'Number of days to keep batch logs',
        updated_at: new Date()
      },
      {
        setting_key: 'STUCK_BATCH_THRESHOLD_MINUTES',
        setting_value: '60',
        description: 'Alert if batch has no progress for this many minutes',
        updated_at: new Date()
      },
      {
        setting_key: 'EMAIL_ALERTS_ENABLED',
        setting_value: 'true',
        description: 'Enable email alerts for critical batch failures',
        updated_at: new Date()
      },
      {
        setting_key: 'EMAIL_RECIPIENTS',
        setting_value: 'admin@dpdc.com',
        description: 'Comma-separated email addresses for alerts',
        updated_at: new Date()
      },
      {
        setting_key: 'BUSINESS_DAY_START_HOUR',
        setting_value: '5',
        description: 'Business day starts at this hour (24-hour format)',
        updated_at: new Date()
      }
    ]);

    console.log('✅ Batch monitoring tables created successfully');
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('batch_monitoring_config');
    await queryInterface.dropTable('batch_workflow_config');
    await queryInterface.dropTable('batch_performance_summary');
    await queryInterface.dropTable('batch_monitoring_alerts');
    await queryInterface.dropTable('batch_execution_logs');
    console.log('✅ Batch monitoring tables dropped successfully');
  }
};
