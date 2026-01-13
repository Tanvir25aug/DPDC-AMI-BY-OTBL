# Quick Deployment Guide - CRP-CPC Export

## Essential Commands Only

### 1. Backup
```bash
# Backup database
pg_dump -U dpdc_user -d dpdc_ami > backup_$(date +%Y%m%d).sql

# Backup code
cd /path/to/DPDC-AMI-BY-OTBL
cp -r . ../backup-$(date +%Y%m%d)
```

### 2. Pull Code
```bash
cd /path/to/DPDC-AMI-BY-OTBL
git pull origin main
git log --oneline -3  # Verify commit 8db8085
```

### 3. Setup Database (PostgreSQL)
```bash
cd backend
node setup_bill_stop_tables.js
```

**Expected Output:**
```
✓ Table bill_stop_summary created successfully
✓ Table bill_stop_details created successfully
✓ Table bill_stop_batch_log created successfully
✓ All indexes created successfully
```

### 4. Install Dependencies
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
npm run build
```

### 5. Run Initial Batch Job
```bash
cd backend
node RUN_BILL_STOP_BATCH.js
```

**Wait for:** `✓ Batch completed successfully!`

### 6. Setup Cron Job (Daily 2 AM)
```bash
crontab -e
```

Add this line:
```
0 2 * * * cd /path/to/DPDC-AMI-BY-OTBL/backend && /usr/bin/node RUN_BILL_STOP_BATCH.js >> /var/log/bill_stop_batch.log 2>&1
```

### 7. Restart Services
```bash
# If using PM2:
pm2 restart all
pm2 status

# If using systemd:
sudo systemctl restart dpdc-ami-backend
```

### 8. Verify
```bash
# Check PostgreSQL data
psql -U dpdc_user -d dpdc_ami -c "SELECT COUNT(*) FROM bill_stop_summary;"
# Should return ~18000

# Check API
curl http://localhost:5000/api/health
```

### 9. Test in Browser
1. Open: http://your-server/crp-cpc
2. Click "Export to Excel"
3. Check file has 13 columns
4. Verify data includes CPC customer ID, name, address

## Done! ✅

---

## If Something Fails

### Database Connection Error
```bash
# Edit setup_bill_stop_tables.js
nano backend/setup_bill_stop_tables.js

# Update lines 7-12:
user: 'YOUR_PG_USER',
password: 'YOUR_PG_PASSWORD',
database: 'YOUR_DB_NAME',
```

### Batch Job Fails
```bash
# Check PostgreSQL running
sudo systemctl status postgresql

# Test connection
psql -U dpdc_user -d dpdc_ami -c "SELECT 1;"
```

### Export Shows "No Data"
```bash
# Run batch job again
cd backend
node RUN_BILL_STOP_BATCH.js

# Check data exists
psql -U dpdc_user -d dpdc_ami -c "SELECT * FROM bill_stop_summary LIMIT 5;"
```

### Rollback
```bash
git reset --hard 69cb46d
pm2 restart all
```

## Key Files Changed
- ✅ `backend/src/controllers/crp-cpc.controller.js` - Export endpoint
- ✅ `frontend/src/views/CRPCPCView.vue` - Export button
- ✅ `backend/setup_bill_stop_tables.js` - Database migration
- ✅ `backend/RUN_BILL_STOP_BATCH.js` - Batch job

## Support
Check logs: `pm2 logs` or `tail -f backend/server.log`
