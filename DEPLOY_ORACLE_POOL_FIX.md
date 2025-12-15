# Deploy Oracle Connection Pool Fix - Quick Guide

## What Was Fixed

**Problem**: Oracle connection pool timeout error (NJS-040)
```
Error: NJS-040: connection request timeout. Request exceeded "queueTimeout" of 60000
```

**Root Cause**:
- Pool too small (max 10 connections)
- Multiple concurrent queries exhausted connections
- No query timeout - queries could run forever

**Solution**:
- Increased pool from 10 to 30 connections
- Added 60-second query timeout
- Added pool health monitoring

## Quick Deployment Steps

### On Production Server

```bash
# 1. Connect to server
ssh oculin@dpdc-report-srv

# 2. Navigate to project
cd ~/DPDC-AMI-BY-OTBL

# 3. Pull latest changes
git pull origin main

# 4. Restart backend
pm2 restart dpdc-backend

# 5. Verify pool is working
curl http://localhost:5000/api/health
```

## Expected Output

After restart, you should see:
```bash
pm2 logs dpdc-backend --lines 20
```

Look for:
```
✅ Oracle connection pool created
   Connected as: <your_oracle_user>
```

## Verify Health Endpoint

```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{
  "success": true,
  "message": "DPDC AMI API is running",
  "database": {
    "oracle": {
      "status": "healthy",
      "usage": "16.7%",
      "connectionsInUse": 5,
      "connectionsOpen": 8,
      "poolMax": 30,
      "poolMin": 5,
      "queueLength": 0
    }
  }
}
```

## Test NOCS Customer Payoff Page

1. Open browser: `http://your-server-ip:8081`
2. Navigate to **NOCS Balance Summary**
3. Click on any NOCS (e.g., "E3")
4. Page should load in 10-20 seconds (no timeout)

## What Changed

### Pool Configuration (Before → After)

| Setting | Before | After | Impact |
|---------|--------|-------|--------|
| poolMin | 2 | 5 | More connections ready |
| poolMax | 10 | 30 | 3x more capacity |
| poolIncrement | 1 | 2 | Faster growth |
| queueTimeout | 60s | 120s | More wait time |
| Query Timeout | None | 60s | Prevent runaway queries |

### New Features

1. **Pool Health Monitoring**
   - Real-time connection usage via `/api/health`
   - Status levels: healthy (< 80%), warning (80-95%), critical (> 95%)

2. **Query Timeout**
   - Automatic 60-second timeout for all queries
   - Prevents queries from blocking connections indefinitely

3. **Statement Caching**
   - Cache 30 SQL statements for reuse
   - Better performance for repeated queries

## Monitoring Pool Health

### Check in Browser
```
http://your-server-ip:5000/api/health
```

### Check from Command Line
```bash
# One-time check
curl http://localhost:5000/api/health | jq .database.oracle

# Continuous monitoring (updates every 2 seconds)
watch -n 2 'curl -s http://localhost:5000/api/health | jq .database.oracle'
```

### Interpret Pool Status

**Healthy (Green) - Usage < 80%**
```json
{
  "status": "healthy",
  "usage": "23.3%",
  "connectionsInUse": 7,
  "poolMax": 30
}
```
✅ System running normally. No action needed.

**Warning (Yellow) - Usage 80-95%**
```json
{
  "status": "warning",
  "usage": "86.7%",
  "connectionsInUse": 26,
  "poolMax": 30,
  "queueLength": 3
}
```
⚠️ Pool getting full. Monitor closely. Consider optimizing slow queries.

**Critical (Red) - Usage > 95%**
```json
{
  "status": "critical",
  "usage": "100%",
  "connectionsInUse": 30,
  "poolMax": 30,
  "queueLength": 15
}
```
🚨 Pool exhausted. Immediate action required:
- Check for slow queries in logs
- Increase poolMax in oracle.js
- Restart backend

## Troubleshooting

### If pool still shows timeout errors

1. **Check pool status**
   ```bash
   curl http://localhost:5000/api/health | jq .database.oracle
   ```

2. **Check backend logs**
   ```bash
   pm2 logs dpdc-backend --lines 50
   ```
   Look for slow queries taking > 30 seconds

3. **Increase pool size further**
   Edit `backend/src/config/oracle.js`:
   ```javascript
   poolMax: 50,  // Increase from 30 to 50
   ```
   Then restart: `pm2 restart dpdc-backend`

### If queries still timeout

1. **Check query execution time**
   Look in logs for:
   ```
   [Reports Service] Report nocs_customer_payoff completed: 523 rows
   ```

2. **Verify query has FETCH FIRST limit**
   Check `backend/reports/nocs_customer_payoff.sql` has:
   ```sql
   FETCH FIRST 1000 ROWS ONLY
   ```

3. **Check Oracle database performance**
   ```bash
   # Connect to Oracle
   sqlplus your_user/your_pass@your_db

   # Check active sessions
   SELECT count(*) FROM v$session WHERE status='ACTIVE';
   ```

## Performance Expectations

### Before Fix
- ❌ Pool exhausted with 10+ concurrent users
- ❌ Frequent NJS-040 timeout errors
- ❌ Queries could run indefinitely

### After Fix
- ✅ Supports 25-30 concurrent users
- ✅ Rare timeouts (only if all 30 connections busy)
- ✅ Queries auto-timeout after 60 seconds
- ✅ Real-time monitoring available

## Rollback (if needed)

If issues occur:
```bash
cd ~/DPDC-AMI-BY-OTBL
git log --oneline -3
# Find the commit before "Fix Oracle connection pool exhaustion"
git checkout <previous-commit-hash>
pm2 restart dpdc-backend
```

## Files Changed

- ✅ `backend/src/config/oracle.js` - Pool configuration
- ✅ `backend/src/routes/index.js` - Health endpoint
- ✅ `ORACLE_CONNECTION_POOL_FIX.md` - Full documentation

## Summary

This fix resolves the Oracle connection pool timeout errors by:
1. **Tripling pool capacity** (10 → 30 connections)
2. **Adding query timeouts** to prevent runaway queries
3. **Enabling real-time monitoring** via health endpoint

The system can now handle 25-30 concurrent users instead of just 10.
