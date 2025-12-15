# Oracle Connection Pool Timeout Fix

## Problem

The application was experiencing Oracle connection pool exhaustion with error:
```
Error: NJS-040: connection request timeout. Request exceeded "queueTimeout" of 60000
```

This error occurred when:
- Multiple users were querying the database simultaneously
- Long-running queries blocked connections
- The connection pool was too small (max 10 connections)
- New requests waited in the queue and timed out after 60 seconds

## Root Cause

The Oracle connection pool configuration was too conservative:
- **poolMin**: 2 (too few idle connections)
- **poolMax**: 10 (too small for concurrent users)
- **poolIncrement**: 1 (slow growth)
- **queueTimeout**: 60000ms (60 seconds - not enough for busy periods)
- **No query timeout**: Queries could run indefinitely and block connections

## Solution

### 1. Increased Connection Pool Size

**File**: `backend/src/config/oracle.js`

```javascript
const oracleConfig = {
  poolMin: 5,                    // Increased from 2 to 5 (more idle connections ready)
  poolMax: 30,                   // Increased from 10 to 30 (handle more concurrent users)
  poolIncrement: 2,              // Increased from 1 to 2 (grow pool faster)
  poolTimeout: 120,              // Increased from 60 to 120 seconds (idle connection timeout)
  queueTimeout: 120000,          // Increased from 60000 to 120000 (2 minutes wait time)
  enableStatistics: true,
  stmtCacheSize: 30,             // Cache 30 SQL statements for reuse
  _enableStats: true             // Enable detailed pool statistics
};
```

### 2. Added Query Timeout

**File**: `backend/src/config/oracle.js`

```javascript
// Add query timeout (60 seconds) to prevent long-running queries from blocking connections
connection.callTimeout = 60000; // 60 seconds timeout for each query
```

This prevents individual queries from running indefinitely and blocking connections.

### 3. Added Pool Health Monitoring

**File**: `backend/src/config/oracle.js`

Created `getPoolHealth()` function to monitor:
- Connection pool usage percentage
- Connections in use vs available
- Queue length
- Pool status (healthy/warning/critical)

**File**: `backend/src/routes/index.js`

Enhanced `/api/health` endpoint to include Oracle pool status:
```bash
GET http://localhost:5000/api/health
```

Response includes:
```json
{
  "success": true,
  "message": "DPDC AMI API is running",
  "database": {
    "oracle": {
      "status": "healthy",
      "usage": "23.3%",
      "connectionsInUse": 7,
      "connectionsOpen": 10,
      "poolMax": 30,
      "poolMin": 5,
      "queueLength": 0
    }
  }
}
```

## Pool Capacity Planning

### Before Fix
- **poolMax**: 10 connections
- **Concurrent users**: ~10 users max before queue timeout
- **Queue timeout**: 60 seconds

### After Fix
- **poolMax**: 30 connections
- **Concurrent users**: ~25-30 users (with some queries running in parallel)
- **Queue timeout**: 120 seconds
- **Query timeout**: 60 seconds per query

## Performance Improvements

1. **Faster Response Under Load**
   - More connections available immediately (poolMin: 5)
   - Pool grows faster (poolIncrement: 2)
   - More headroom (poolMax: 30)

2. **Better Query Performance**
   - Statement cache (30 statements)
   - Fetch array size optimization (100 rows at a time)
   - Automatic timeout for runaway queries

3. **Better Monitoring**
   - Health endpoint shows real-time pool status
   - Pool statistics for debugging
   - Early warning when usage > 80%

## Health Status Levels

- **Healthy**: < 80% pool usage (green)
- **Warning**: 80-95% pool usage (yellow)
- **Critical**: > 95% pool usage (red)

## Monitoring the Pool

### Check Pool Health
```bash
curl http://localhost:5000/api/health
```

### Interpret Results

**Healthy System:**
```json
{
  "status": "healthy",
  "usage": "23.3%",
  "connectionsInUse": 7,
  "poolMax": 30,
  "queueLength": 0
}
```

**Warning - Pool Getting Full:**
```json
{
  "status": "warning",
  "usage": "86.7%",
  "connectionsInUse": 26,
  "poolMax": 30,
  "queueLength": 3
}
```
**Action**: Monitor closely. Consider optimizing slow queries.

**Critical - Pool Exhausted:**
```json
{
  "status": "critical",
  "usage": "100%",
  "connectionsInUse": 30,
  "poolMax": 30,
  "queueLength": 15
}
```
**Action**: Increase poolMax or optimize queries immediately.

## Deployment Instructions

### 1. Stop Backend
```bash
pm2 stop dpdc-backend
```

### 2. Pull Latest Changes
```bash
cd ~/DPDC-AMI-BY-OTBL
git pull origin main
```

### 3. Restart Backend
```bash
pm2 restart dpdc-backend
```

### 4. Verify Pool Status
```bash
curl http://localhost:5000/api/health
```

## Testing

After deployment, verify:

1. **Pool Initialization**
   ```bash
   pm2 logs dpdc-backend | grep "Oracle connection pool created"
   ```
   Should see: `✅ Oracle connection pool created`

2. **Health Endpoint**
   ```bash
   curl http://localhost:5000/api/health
   ```
   Should show oracle pool status with `"status": "healthy"`

3. **NOCS Customer Payoff Query**
   - Navigate to NOCS Balance Summary
   - Click on any NOCS
   - Page should load within 15-20 seconds (no timeout)

4. **Monitor Under Load**
   ```bash
   # Check pool usage while users are active
   watch -n 2 'curl -s http://localhost:5000/api/health | jq .database.oracle'
   ```

## Rollback (if needed)

If issues occur:
```bash
cd ~/DPDC-AMI-BY-OTBL
git log --oneline -3
git checkout <previous-commit-hash>
pm2 restart dpdc-backend
```

## Future Optimizations

If you continue to see connection pool exhaustion:

1. **Increase Pool Size Further**
   - Increase `poolMax` to 50 or 100
   - Ensure Oracle database can handle more connections

2. **Implement Connection Queuing**
   - Add request queuing at application level
   - Show "Please wait" message to users

3. **Query Optimization**
   - Review slow queries in logs
   - Add more indexes to Oracle tables
   - Optimize complex joins

4. **Implement Caching**
   - Cache frequently accessed data (already done for some reports)
   - Use Redis for distributed caching

5. **Load Balancing**
   - Deploy multiple backend instances
   - Use Nginx for load balancing

## Files Modified

- `backend/src/config/oracle.js` - Pool configuration and health monitoring
- `backend/src/routes/index.js` - Enhanced health endpoint

## Related Issues Fixed

- Oracle connection timeout (NJS-040)
- Slow NOCS Customer Payoff query
- Connection pool exhaustion under load
