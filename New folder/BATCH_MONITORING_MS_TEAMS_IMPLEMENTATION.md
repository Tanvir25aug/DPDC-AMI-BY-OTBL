# Batch Monitoring & MS Teams Integration - Implementation Guide

## Overview

This implementation adds comprehensive batch monitoring with MS Teams reporting, RPS/Records statistics tracking, and stuck batch detection.

## Features Implemented

### 1. Auto-Refresh Change ✅
- **Changed from**: 10 minutes
- **Changed to**: 30 minutes
- **File Updated**: `frontend/src/views/AMIOperationalView.vue`
- **Lines**: 648, 891, 1133

### 2. Database Schema ✅
**Table Created**: `batch_monitoring_history`

**Location**: `backend/migrations/create_batch_monitoring_history.sql`

**Columns**:
- `id` - Primary key
- `batch_code` - Batch job code (e.g., D1-IMD)
- `check_time` - Timestamp of the check
- `records_processed` - Number of records at check time
- `rps` - Records per second
- `duration_seconds` - Duration since batch started
- `status` - Batch status
- `is_stuck` - Boolean flag for stuck detection
- `alert_sent` - Boolean flag if alert was sent
- `notes` - Additional notes or alert messages

**Indexes Created**:
- `idx_batch_monitoring_batch_code`
- `idx_batch_monitoring_check_time`
- `idx_batch_monitoring_is_stuck`
- `idx_batch_monitoring_alert_sent`
- `idx_batch_monitoring_batch_time` (composite)

### 3. Batch Monitoring Service ✅
**File**: `backend/src/services/batch-monitoring.service.js`

**Key Functions**:

#### Monitoring Functions
- `getRunningBatchesDetails()` - Get currently running batches with RPS calculations
- `getPendingIMDCount()` - Get pending IMD record count
- `monitorAndSaveBatchStatus()` - Main monitoring function that checks all running batches

#### Stuck Detection
- `detectStuckBatch(currentBatch)` - Detects if a batch is stuck
  - **Criteria**:
    - Records not increasing + running > 10 minutes
    - RPS < 1 + running > 10 minutes
  - **Returns**: `{ isStuck, reason, statistics }`

#### Statistics Functions
- `getBatchStatistics(batchCode, hoursAgo)` - Get statistics for specific batch
- `getAllBatchStatistics(hoursAgo)` - Get statistics for all batches
- `calculateRpsTrend(history, currentBatch)` - Calculate RPS trend (improving/stable/degrading)

#### History Management
- `saveBatchHistory(batchData)` - Save batch check to PostgreSQL
- `getPreviousBatchHistory(batchCode, minutesAgo)` - Get previous checks for comparison
- `getRecentMonitoringHistory(batchCode, limit)` - Get recent history for display
- `markAlertAsSent(batchCode, checkTime)` - Mark alert as sent in database

### 4. MS Teams Integration ✅
**Files Updated**:
- `backend/src/services/teams.service.js` - Added new card formatters
- `backend/src/config/teams-webhooks.js` - Added webhook URLs

**New Teams Methods**:

#### `sendBatchMonitoringReport(data)`
Sends comprehensive 30-minute batch report with:
- Pending IMD count and last update time
- Currently running batches with:
  - Batch Code
  - Start Time
  - Duration
  - Records Processed
  - RPS (Live)
  - Status
  - Color-coded RPS indicators (🟢 🟡 🔴)
- 24-hour batch statistics:
  - Average RPS
  - Max RPS
  - Max Records
  - Number of checks

#### `sendBatchStuckAlert(batchData, stuckInfo)`
Sends critical alert when batch is stuck:
- Batch identification
- Stuck reason
- Current status (records, RPS, duration)
- Comparison with previous check:
  - Previous vs Current Records
  - Records Difference
  - Previous vs Current RPS
  - RPS Trend

**Card Format**: Adaptive Cards with color-coded sections
- Emphasis style for headers
- Good style for pending IMD
- Attention style for stuck alerts
- Color-coded RPS indicators

### 5. Batch Monitoring Scheduler ✅
**File**: `backend/src/schedulers/batch-monitoring.scheduler.js`

**Schedule**: Every 30 minutes (`*/30 * * * *`)
**Timezone**: Asia/Dhaka

**Workflow**:
1. Get Pending IMD count
2. Monitor all running batches (get current RPS/Records)
3. Detect stuck batches by comparing with previous checks
4. Save all batch data to PostgreSQL history table
5. Send stuck alerts to MS Teams (if any)
6. Send regular monitoring report to MS Teams
7. Mark alerts as sent in database

**Safety Features**:
- Prevents concurrent runs with `isRunning` flag
- Runs initial check 5 seconds after server start
- Comprehensive error handling and logging

### 6. API Endpoints ✅
**Files Updated**:
- `backend/src/controllers/ami-operational.controller.js`
- `backend/src/routes/ami-operational.routes.js`

**New Endpoints**:

#### `GET /api/ami-operational/batch-statistics`
Get batch performance statistics from monitoring history
- **Query Params**:
  - `batchCode` (optional) - Filter by batch code
  - `hours` (optional, default 24) - Hours to look back
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "statistics": [
        {
          "batch_code": "D1-IMD",
          "total_checks": 48,
          "avg_rps": 125.50,
          "max_rps": 180.25,
          "min_rps": 85.30,
          "max_records": 1500000,
          "stuck_count": 0,
          "last_check": "2025-12-03T10:30:00Z"
        }
      ]
    }
  }
  ```

#### `GET /api/ami-operational/batch-monitoring-history`
Get recent batch monitoring history (RPS and Records tracking)
- **Query Params**:
  - `batchCode` (optional) - Filter by batch code
  - `limit` (optional, default 50) - Number of records
- **Response**:
  ```json
  {
    "success": true,
    "data": {
      "history": [
        {
          "batch_code": "D1-IMD",
          "check_time": "2025-12-03T10:30:00Z",
          "records_processed": 1250000,
          "rps": 125.50,
          "duration_seconds": 9960,
          "status": "Running",
          "is_stuck": false,
          "alert_sent": false,
          "notes": null
        }
      ]
    }
  }
  ```

### 7. Frontend API Service ✅
**File**: `frontend/src/services/ami-operational.api.js`

**New Functions**:
- `getBatchStatistics(batchCode, hours)` - Fetch batch statistics
- `getBatchMonitoringHistory(batchCode, limit)` - Fetch monitoring history

## How It Works

### RPS Calculation
```javascript
RPS = Total Records Processed / Duration in Seconds
```

### Stuck Detection Logic
A batch is considered **STUCK** if:

```javascript
// Condition 1: Records not increasing
if (!recordsIncreased && durationSeconds > 600) {
  isStuck = true;
  reason = "Records not increasing (stuck at X records)";
}

// Condition 2: Very low RPS
if (rps < 1 && durationSeconds > 600) {
  isStuck = true;
  reason = "Very low RPS (X RPS) - potential performance issue";
}
```

### RPS Trend Calculation
```javascript
- If current RPS > average RPS * 1.2 → "improving"
- If current RPS < average RPS * 0.8 → "degrading"
- Otherwise → "stable"
```

## Setup Instructions

### 1. Database Setup
Run the migration to create the monitoring table:

```bash
# Connect to PostgreSQL
psql -U your_user -d your_database -f backend/migrations/create_batch_monitoring_history.sql
```

### 2. MS Teams Webhook Configuration
Update the webhook URLs in `backend/src/config/teams-webhooks.js`:

```javascript
module.exports = {
  DEFAULT: 'https://your-webhook-url',
  BATCH_MONITORING: 'https://your-monitoring-webhook-url',
  ALERTS: 'https://your-alerts-webhook-url'
};
```

### 3. Server Configuration
The scheduler is already integrated in `backend/src/server.js`:

```javascript
const batchMonitoringScheduler = require('./schedulers/batch-monitoring.scheduler');

// In startServer()
await batchMonitoringScheduler.startScheduler();
logger.info('✅ Batch Monitoring Scheduler started (runs every 30 minutes)');
```

### 4. Start the Server
```bash
cd backend
npm install  # If new dependencies
npm start
```

The scheduler will:
- Start automatically when server starts
- Run initial check after 5 seconds
- Then run every 30 minutes

## Testing

### 1. Manual Test
Run the monitoring job manually:

```javascript
// In Node.js console or create a test script
const batchMonitoringScheduler = require('./src/schedulers/batch-monitoring.scheduler');
await batchMonitoringScheduler.runManually();
```

### 2. Check Database
```sql
-- View recent monitoring history
SELECT * FROM batch_monitoring_history
ORDER BY check_time DESC
LIMIT 20;

-- Check for stuck batches
SELECT * FROM batch_monitoring_history
WHERE is_stuck = true
ORDER BY check_time DESC;

-- View batch statistics
SELECT
  batch_code,
  COUNT(*) as checks,
  AVG(rps) as avg_rps,
  MAX(rps) as max_rps,
  MAX(records_processed) as max_records
FROM batch_monitoring_history
WHERE check_time >= NOW() - INTERVAL '24 hours'
GROUP BY batch_code;
```

### 3. Test API Endpoints

#### Test Batch Statistics
```bash
curl -X GET "http://localhost:3000/api/ami-operational/batch-statistics?hours=24" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Test Monitoring History
```bash
curl -X GET "http://localhost:3000/api/ami-operational/batch-monitoring-history?limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Test MS Teams Integration
Send a test message:

```javascript
const teamsService = require('./src/services/teams.service');
const teamsWebhooks = require('./src/config/teams-webhooks');

teamsService.initialize(teamsWebhooks.DEFAULT);
await teamsService.testConnection();
```

## MS Teams Report Format

### Regular Monitoring Report (Every 30 mins)
```
🔄 BATCH MONITORING REPORT

📋 Pending IMD
1,250,000 records pending
Last Update: Dec 3, 2025, 10:30 AM

⚡ Currently Running Batches (3)

🟢 D1-IMD                           RPS: 125.50
⏰ Start Time: Dec 3, 2025, 8:00 AM
⏱️ Duration: 2h 30m
📊 Records: 1,250,000
📈 Status: Running

🟡 D1-BILL                          RPS: 75.25
⏰ Start Time: Dec 3, 2025, 9:00 AM
⏱️ Duration: 1h 30m
📊 Records: 450,000
📈 Status: Running

📈 Batch Statistics (Last 24 Hours)
D1-IMD
Avg RPS: 118.50
Max RPS: 180.25
Max Records: 1,500,000
Checks: 48
```

### Stuck Alert
```
🚨 BATCH STUCK ALERT

⚠️ Batch: D1-IMD
Records not increasing (stuck at 1,250,000 records)

📊 Current Status
⏰ Start Time: Dec 3, 2025, 8:00 AM
⏱️ Duration: 3h 15m
📊 Records: 1,250,000
📈 RPS: 0.25

📉 Comparison with Previous Check
Previous Records: 1,250,000
Current Records: 1,250,000
Records Diff: +0
Previous RPS: 125.50
Current RPS: 0.25
Trend: DEGRADING
```

## Monitoring Dashboard

### Frontend Display
The frontend automatically displays:
- Auto-refresh countdown (30 minutes)
- Currently running batches with live RPS
- Batch performance charts
- Success rates and health metrics

### Statistics Available via API
You can now query:
- Historical RPS trends
- Records processing patterns
- Stuck batch incidents
- Performance comparisons

## Troubleshooting

### Scheduler Not Running
1. Check server logs: `logger.info('[Batch Monitoring Scheduler]...')`
2. Verify cron expression: `*/30 * * * *`
3. Check timezone: `Asia/Dhaka`

### No Data in Database
1. Verify table exists: `\dt batch_monitoring_history`
2. Check for running batches in Oracle
3. Review service logs for errors

### MS Teams Not Receiving Reports
1. Verify webhook URLs in `teams-webhooks.js`
2. Test webhook with curl:
   ```bash
   curl -X POST YOUR_WEBHOOK_URL \
     -H "Content-Type: application/json" \
     -d '{"text": "Test message"}'
   ```
3. Check Teams service logs

### Stuck Detection Not Working
1. Ensure there's historical data (need at least one previous check)
2. Verify batch has been running > 10 minutes
3. Check comparison logic in logs

## Files Created/Modified

### New Files
- `backend/migrations/create_batch_monitoring_history.sql`
- `backend/src/services/batch-monitoring.service.js`
- `backend/src/schedulers/batch-monitoring.scheduler.js`

### Modified Files
- `frontend/src/views/AMIOperationalView.vue` (auto-refresh 30 mins)
- `backend/src/services/teams.service.js` (new card formatters)
- `backend/src/config/teams-webhooks.js` (new webhook URLs)
- `backend/src/controllers/ami-operational.controller.js` (new endpoints)
- `backend/src/routes/ami-operational.routes.js` (new routes)
- `frontend/src/services/ami-operational.api.js` (new API functions)
- `backend/src/server.js` (updated comment)

## Next Steps

1. **Run the migration** to create the database table
2. **Configure MS Teams webhooks** with your actual URLs
3. **Restart the backend server** to start the scheduler
4. **Monitor the logs** to ensure reports are being sent
5. **Check MS Teams** for incoming reports (every 30 minutes)
6. **Query the API endpoints** to verify data collection

## Support

For issues or questions:
1. Check server logs: `backend/logs/`
2. Query database for monitoring history
3. Test MS Teams webhook manually
4. Review this documentation

---

**Implementation Date**: December 3, 2025
**Status**: ✅ Complete and Ready for Testing
