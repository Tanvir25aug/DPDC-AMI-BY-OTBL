-- Batch Monitoring History Table
-- Stores historical RPS and Records data for batch monitoring and stuck detection

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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_batch_monitoring_batch_code ON batch_monitoring_history(batch_code);
CREATE INDEX IF NOT EXISTS idx_batch_monitoring_check_time ON batch_monitoring_history(check_time);
CREATE INDEX IF NOT EXISTS idx_batch_monitoring_is_stuck ON batch_monitoring_history(is_stuck);
CREATE INDEX IF NOT EXISTS idx_batch_monitoring_alert_sent ON batch_monitoring_history(alert_sent);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_batch_monitoring_batch_time ON batch_monitoring_history(batch_code, check_time DESC);

COMMENT ON TABLE batch_monitoring_history IS 'Historical tracking of batch performance metrics for monitoring and stuck detection';
COMMENT ON COLUMN batch_monitoring_history.batch_code IS 'Batch job code (e.g., D1-IMD, D1-BILL)';
COMMENT ON COLUMN batch_monitoring_history.check_time IS 'Time when the check was performed';
COMMENT ON COLUMN batch_monitoring_history.records_processed IS 'Number of records processed at check time';
COMMENT ON COLUMN batch_monitoring_history.rps IS 'Records per second at check time';
COMMENT ON COLUMN batch_monitoring_history.duration_seconds IS 'Duration in seconds since batch started';
COMMENT ON COLUMN batch_monitoring_history.status IS 'Batch status (Running, Complete, etc.)';
COMMENT ON COLUMN batch_monitoring_history.is_stuck IS 'Whether the batch was detected as stuck';
COMMENT ON COLUMN batch_monitoring_history.alert_sent IS 'Whether an alert was sent for this check';
COMMENT ON COLUMN batch_monitoring_history.notes IS 'Additional notes or alert messages';
