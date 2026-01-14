# 🚀 Production Deployment Guide - MS Teams Reports

## ✅ Code Pushed to GitHub

**Repository**: https://github.com/Tanvir25aug/DPDC-AMI-BY-OTBL.git
**Commit**: `3773e67` - Add MS Teams batch monitoring and NOCS balance reports
**Branch**: `main`

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure you have:

- ✅ Access to production server
- ✅ PostgreSQL database access (for creating table)
- ✅ MS Teams webhook URLs configured
- ✅ Backup of current production code
- ✅ Production `.env` file configured

---

## 🔧 Step-by-Step Deployment Process

### **Step 1: Backup Current Production**

```bash
# SSH into production server
ssh user@your-production-server

# Navigate to application directory
cd /path/to/dpdc-ami

# Create backup
sudo cp -r . ../dpdc-ami-backup-$(date +%Y%m%d-%H%M%S)

# Verify backup
ls -la ../dpdc-ami-backup-*
```

---

### **Step 2: Pull Latest Code from GitHub**

```bash
# Navigate to application directory
cd /path/to/dpdc-ami

# Check current branch
git branch

# Stash any local changes (if any)
git stash

# Pull latest code
git pull origin main

# Verify the commit
git log -1
# Should show: "Add MS Teams batch monitoring and NOCS balance reports"
```

---

### **Step 3: Install New Dependencies**

```bash
# Navigate to backend directory
cd backend

# Install node-cron (new dependency)
npm install

# Verify installation
npm list node-cron
# Should show: node-cron@4.2.1
```

---

### **Step 4: Create PostgreSQL Database Table**

#### **Option A: Using Node Script (Recommended)**

```bash
# Navigate to backend directory
cd backend

# Run the setup script
node SETUP_MONITORING_TABLE.js

# Expected output:
# ✅ Table created!
# ✅ Indexes created!
# 🎉 Setup complete!
```

#### **Option B: Using psql Command**

```bash
# Run migration directly
psql -U postgres -d dpdc_ami_users -f backend/migrations/create_batch_monitoring_history.sql

# Or with password
PGPASSWORD=your_password psql -U postgres -d dpdc_ami_users -f backend/migrations/create_batch_monitoring_history.sql
```

#### **Verify Table Creation**

```bash
# Connect to PostgreSQL
psql -U postgres -d dpdc_ami_users

# Check if table exists
\dt batch_monitoring_history

# Check table structure
\d batch_monitoring_history

# Exit psql
\q
```

---

### **Step 5: Configure MS Teams Webhooks**

Edit the webhook configuration file:

```bash
# Edit webhook config
nano backend/src/config/teams-webhooks.js
# or
vim backend/src/config/teams-webhooks.js
```

**Update the webhook URLs** with your production Teams channel webhooks:

```javascript
module.exports = {
  // Main webhook for all reports
  DEFAULT: 'https://YOUR-PRODUCTION-WEBHOOK-URL',

  // Batch Monitoring Reports (every 30 minutes)
  BATCH_MONITORING: 'https://YOUR-BATCH-MONITORING-WEBHOOK-URL',

  // Critical Alerts (stuck batches, performance issues)
  ALERTS: 'https://YOUR-ALERTS-WEBHOOK-URL',
};
```

**Save and exit** (Ctrl+X, Y, Enter for nano)

---

### **Step 6: Test MS Teams Connection (Optional but Recommended)**

Before restarting, test the Teams integration:

```bash
# Navigate to backend directory
cd backend

# Run test script
node TEST_TEAMS_REPORTS.js

# Expected output:
# ✅ Teams service initialized
# ✅ Batch Monitoring Report sent!
# ✅ NOCS Balance Summary sent!
# 🎉 All test reports sent successfully!
```

**Check your MS Teams channel** - you should receive 2 test messages.

---

### **Step 7: Restart Backend Server**

#### **Option A: Using PM2 (Recommended)**

```bash
# Navigate to backend directory
cd backend

# Restart the application
pm2 restart dpdc-ami-backend
# or
pm2 restart all

# Check status
pm2 status

# View logs
pm2 logs dpdc-ami-backend --lines 50
```

#### **Option B: Using systemd**

```bash
# Restart service
sudo systemctl restart dpdc-ami-backend

# Check status
sudo systemctl status dpdc-ami-backend

# View logs
sudo journalctl -u dpdc-ami-backend -f
```

#### **Option C: Manual Restart**

```bash
# Kill current process
pkill -f "node.*server.js"

# Start server
cd backend
npm start &

# Or with nohup
nohup npm start > server.log 2>&1 &
```

---

### **Step 8: Verify Deployment**

#### **8.1: Check Server Logs**

Look for these log messages:

```bash
# Using PM2
pm2 logs dpdc-ami-backend --lines 100

# Or tail the log file
tail -f /path/to/backend/logs/combined.log
```

**Expected logs**:
```
✅ PostgreSQL connected successfully
✅ Oracle connection pool initialized
✅ Batch Monitoring Scheduler started (runs every 30 minutes)
✅ NOCS Balance Summary Scheduler started (runs every 60 minutes / 1 hour)
🚀 Server running on port 3000
```

#### **8.2: Check Database Table**

```bash
# Connect to PostgreSQL
psql -U postgres -d dpdc_ami_users

# Check table exists
SELECT COUNT(*) FROM batch_monitoring_history;

# Check recent entries (after 30 minutes)
SELECT * FROM batch_monitoring_history
ORDER BY check_time DESC
LIMIT 5;

# Exit
\q
```

#### **8.3: Verify MS Teams Reports**

**Wait for scheduled reports**:
- **Batch Monitoring**: Will send at :00 and :30 of every hour
- **NOCS Balance Summary**: Will send at the top of every hour

**Or test immediately**:
```bash
cd backend
node TEST_TEAMS_REPORTS.js
```

---

### **Step 9: Frontend Deployment (If Needed)**

If you made frontend changes:

```bash
# Navigate to frontend directory
cd frontend

# Build production bundle
npm run build

# Copy to web server (example with nginx)
sudo cp -r dist/* /var/www/html/dpdc-ami/

# Or if using a different location
sudo cp -r dist/* /usr/share/nginx/html/dpdc-ami/

# Restart nginx (if needed)
sudo systemctl restart nginx
```

---

## 📊 Monitoring & Verification

### **Check Scheduler Status**

After deployment, verify schedulers are working:

```bash
# Check logs for scheduler messages (every 30 mins)
tail -f backend/logs/combined.log | grep "Batch Monitoring Scheduler"

# Expected output every 30 minutes:
# [Batch Monitoring Scheduler] Starting batch monitoring job...
# [Batch Monitoring Scheduler] Pending IMD: 69895
# [Batch Monitoring Scheduler] Monitored 1 batches
# [Batch Monitoring Scheduler] Monitoring report sent to Teams successfully
```

### **Check MS Teams Channel**

You should receive:
- **Every 30 minutes**: Batch Monitoring Report
- **Every 1 hour**: NOCS Balance Summary

---

## 🔍 Troubleshooting

### **Issue 1: "node-cron not found"**

```bash
cd backend
npm install node-cron
pm2 restart dpdc-ami-backend
```

### **Issue 2: "Table does not exist"**

```bash
cd backend
node SETUP_MONITORING_TABLE.js
pm2 restart dpdc-ami-backend
```

### **Issue 3: "Oracle tables not found"**

Check Oracle connection and table access:
```bash
cd backend
node FIND_ORACLE_TABLES.js
```

Ensure CISREAD user has access to:
- `CISADM.D1_IMD_CTRL`
- `CISADM.CI_BATCH_RUN`
- `CISADM.CI_BATCH_JOB`
- `CISADM.CI_BATCH_INST`

### **Issue 4: MS Teams Not Receiving Messages**

```bash
# Test webhook manually
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test message from production"}'
```

Check logs:
```bash
pm2 logs | grep "Teams"
```

### **Issue 5: Scheduler Not Running**

Check if process is running:
```bash
pm2 status
ps aux | grep node
```

Check for errors:
```bash
pm2 logs dpdc-ami-backend --err
```

---

## 📝 Post-Deployment Tasks

### **1. Monitor First Reports**

- Wait 30 minutes for first batch monitoring report
- Wait 1 hour for first NOCS balance summary
- Verify data accuracy in Teams messages

### **2. Check Database Growth**

```bash
# After 24 hours, check history table size
psql -U postgres -d dpdc_ami_users -c "SELECT COUNT(*) FROM batch_monitoring_history;"

# Expected: ~48 records per batch per day (every 30 mins)
```

### **3. Update Documentation**

Update your production documentation with:
- New webhook URLs
- Scheduler timings
- Database table information

---

## 🔄 Rollback Procedure (If Needed)

If something goes wrong:

```bash
# Stop current server
pm2 stop dpdc-ami-backend

# Restore from backup
cd /path/to
sudo rm -rf dpdc-ami
sudo cp -r dpdc-ami-backup-YYYYMMDD-HHMMSS dpdc-ami
cd dpdc-ami/backend

# Reinstall dependencies
npm install

# Restart server
pm2 restart dpdc-ami-backend

# Or revert git commit
cd dpdc-ami
git reset --hard HEAD~1
git push origin main --force
```

---

## 📊 What to Expect After Deployment

### **Immediate (After Server Restart)**
- ✅ Server starts with new schedulers
- ✅ Initial batch monitoring job runs after 5 seconds
- ✅ First report sent to MS Teams within 5 seconds

### **After 30 Minutes**
- ✅ Second batch monitoring report
- ✅ Database has 2+ records in `batch_monitoring_history`

### **After 1 Hour**
- ✅ First NOCS balance summary report
- ✅ Regular schedule established

### **After 24 Hours**
- ✅ ~48 batch monitoring reports sent
- ✅ ~24 NOCS balance summaries sent
- ✅ Historical statistics available

---

## 📞 Support & Monitoring

### **Key Metrics to Monitor**

1. **Server Health**
   ```bash
   pm2 monit
   ```

2. **Database Size**
   ```bash
   psql -U postgres -d dpdc_ami_users -c "
   SELECT
     pg_size_pretty(pg_total_relation_size('batch_monitoring_history')) as table_size,
     COUNT(*) as total_records
   FROM batch_monitoring_history;"
   ```

3. **Scheduler Logs**
   ```bash
   tail -f backend/logs/combined.log | grep -E "Batch Monitoring|Teams Reports"
   ```

4. **MS Teams Deliverability**
   - Check Teams channel regularly
   - Ensure no webhook failures in logs

---

## ✅ Deployment Checklist Summary

- [ ] Backup current production code
- [ ] Pull latest code from GitHub
- [ ] Install npm dependencies (`node-cron`)
- [ ] Create PostgreSQL table (`batch_monitoring_history`)
- [ ] Configure MS Teams webhook URLs
- [ ] Test MS Teams connection (optional)
- [ ] Restart backend server
- [ ] Verify server logs for successful startup
- [ ] Wait 30 minutes and check first batch report
- [ ] Wait 1 hour and check first NOCS summary
- [ ] Monitor logs for any errors
- [ ] Verify database records are being created
- [ ] Confirm MS Teams messages are arriving
- [ ] Update production documentation

---

## 🎯 Success Criteria

Deployment is successful when:

✅ **Server**:
- Server starts without errors
- Both schedulers show as running in logs
- No Oracle/PostgreSQL connection errors

✅ **Database**:
- `batch_monitoring_history` table exists
- Records are being inserted every 30 minutes
- Historical queries work

✅ **MS Teams**:
- Batch monitoring reports arrive every 30 minutes
- NOCS balance summaries arrive every hour
- Reports show accurate data (69K+ pending IMD, running batches with RPS)

✅ **Performance**:
- No memory leaks
- CPU usage normal
- Database not growing excessively

---

## 📚 Additional Resources

- **Implementation Guide**: `BATCH_MONITORING_MS_TEAMS_IMPLEMENTATION.md`
- **Technical Details**: `MS_TEAMS_REPORTS_READY.md`
- **Simplified Reports**: `TEAMS_REPORTS_SIMPLIFIED.md`
- **Test Script**: `backend/TEST_TEAMS_REPORTS.js`
- **Migration File**: `backend/migrations/create_batch_monitoring_history.sql`

---

## 🆘 Emergency Contacts

If deployment fails:
1. Check logs: `pm2 logs dpdc-ami-backend`
2. Review error messages
3. Rollback if critical issue
4. Contact development team with logs

---

**Deployment Date**: _____________
**Deployed By**: _____________
**Production Server**: _____________
**Status**: [ ] Success [ ] Failed [ ] Rolled Back

---

🎉 **Good luck with your deployment!**
