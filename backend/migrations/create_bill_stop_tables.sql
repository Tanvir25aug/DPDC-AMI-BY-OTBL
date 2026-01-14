-- PostgreSQL Migration: Bill Stop Analysis Tables
-- This stores daily batch data from Oracle for fast reporting

-- Summary table (by CRP)
CREATE TABLE IF NOT EXISTS bill_stop_summary (
    id SERIAL PRIMARY KEY,
    crp_account_no VARCHAR(50) NOT NULL,
    total_cpc_count INTEGER NOT NULL DEFAULT 0,
    bill_stop_count INTEGER NOT NULL DEFAULT 0,
    active_billing_count INTEGER NOT NULL DEFAULT 0,
    bill_stop_percentage DECIMAL(5, 2) DEFAULT 0,
    batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(crp_account_no, batch_date)
);

-- Details table (individual CPC customers)
CREATE TABLE IF NOT EXISTS bill_stop_details (
    id SERIAL PRIMARY KEY,
    crp_account_no VARCHAR(50) NOT NULL,
    cpc_customer_no VARCHAR(50) NOT NULL,
    meter_no VARCHAR(50),
    customer_name VARCHAR(255),
    address TEXT,
    nocs_name VARCHAR(100),
    phone_no VARCHAR(50),
    sa_status_desc VARCHAR(50),
    last_bill_date DATE,
    billing_status VARCHAR(50) NOT NULL,
    current_balance DECIMAL(15, 2) DEFAULT 0,
    batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(cpc_customer_no, batch_date)
);

-- Batch job log table
CREATE TABLE IF NOT EXISTS bill_stop_batch_log (
    id SERIAL PRIMARY KEY,
    batch_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP,
    status VARCHAR(20) NOT NULL, -- 'running', 'completed', 'failed'
    summary_count INTEGER DEFAULT 0,
    details_count INTEGER DEFAULT 0,
    error_message TEXT,
    duration_seconds INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bill_stop_summary_batch_date ON bill_stop_summary(batch_date);
CREATE INDEX IF NOT EXISTS idx_bill_stop_summary_crp ON bill_stop_summary(crp_account_no);
CREATE INDEX IF NOT EXISTS idx_bill_stop_summary_count ON bill_stop_summary(bill_stop_count DESC);

CREATE INDEX IF NOT EXISTS idx_bill_stop_details_batch_date ON bill_stop_details(batch_date);
CREATE INDEX IF NOT EXISTS idx_bill_stop_details_crp ON bill_stop_details(crp_account_no);
CREATE INDEX IF NOT EXISTS idx_bill_stop_details_cpc ON bill_stop_details(cpc_customer_no);
CREATE INDEX IF NOT EXISTS idx_bill_stop_details_status ON bill_stop_details(billing_status);

CREATE INDEX IF NOT EXISTS idx_batch_log_date ON bill_stop_batch_log(batch_date);
CREATE INDEX IF NOT EXISTS idx_batch_log_status ON bill_stop_batch_log(status);

-- Add comments
COMMENT ON TABLE bill_stop_summary IS 'Daily batch summary of CRP customers with bill stop issues';
COMMENT ON TABLE bill_stop_details IS 'Daily batch details of CPC customers with bill stop issues';
COMMENT ON TABLE bill_stop_batch_log IS 'Log of batch job executions';

COMMENT ON COLUMN bill_stop_summary.batch_date IS 'Date when batch was run';
COMMENT ON COLUMN bill_stop_details.batch_date IS 'Date when batch was run';
COMMENT ON COLUMN bill_stop_details.billing_status IS 'Bill Stop Issue or Active Billing';
