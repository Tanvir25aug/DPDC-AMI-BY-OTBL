# Pull and Deploy to Production - Simple Guide

## ✅ All Files Now in GitHub

All missing files have been pushed to GitHub. You can now pull and deploy on production.

**Latest Commit:** `bf6ae6e` - Fix PostgreSQL configuration and add missing files

---

## Quick Deploy Commands (Production Server)

Copy and paste these commands on your production server:

```bash
# 1. Go to application directory
cd ~/DPDC-AMI-BY-OTBL

# 2. Backup first (IMPORTANT!)
cd ..
cp -r DPDC-AMI-BY-OTBL DPDC-AMI-BY-OTBL-backup-$(date +%Y%m%d_%H%M%S)
cd DPDC-AMI-BY-OTBL

# 3. Force pull latest code (overwrites local changes)
git fetch origin
git reset --hard origin/main

# 4. Verify you have latest commit
git log --oneline -1
# Should show: bf6ae6e Fix PostgreSQL configuration

# 5. Check files exist
ls -la backend/src/config/postgresDB.js
ls -la backend/src/jobs/billStopBatchJob.js
# Both should show files exist

# 6. Setup PostgreSQL tables
cd backend
node setup_bill_stop_tables.js
# Should show: ✓ ALL TABLES SETUP COMPLETE!

# 7. Install backend dependencies
npm install

# 8. Run initial batch job (takes 5-10 minutes)
node RUN_BILL_STOP_BATCH.js
# Wait for completion...

# 9. Rebuild frontend
cd ../frontend
npm install
npm run build

# 10. Deploy frontend to nginx
sudo rm -rf /var/www/html/dpdc-ami/*
sudo cp -r dist/* /var/www/html/dpdc-ami/
sudo chown -R www-data:www-data /var/www/html/dpdc-ami/
sudo systemctl restart nginx

# 11. Restart backend
cd ../backend
pm2 restart dpdc-backend

# 12. Check status
pm2 status
# Should show "online"

pm2 logs dpdc-backend --lines 20
# Should show no errors

# 13. Verify PostgreSQL has data
psql -U dpdc_prod_user -d dpdc_ami_prod -c "SELECT COUNT(*) FROM bill_stop_summary;"
# Should show a number > 0

# 14. Setup cron job (daily 2 AM)
crontab -e
# Add this line:
# 0 2 * * * cd /home/oculin/DPDC-AMI-BY-OTBL/backend && /usr/bin/node RUN_BILL_STOP_BATCH.js >> /var/log/bill_stop_batch.log 2>&1
```

---

## Verify in Browser

1. Open: `http://your-server/crp-cpc`
2. Press **Ctrl+F5** (hard refresh)
3. You should see green **"Export to Excel"** button
4. Click it to test
5. Excel file should download with 13 columns:
   - CRP Account No
   - CPC Customer ID ✅
   - Meter Number
   - Customer Name
   - Address
   - NOCS Name
   - Phone Number
   - Feeder
   - Status
   - Start Date
   - Billed This Month
   - Last Bill Date
   - Current Balance

---

## Files Added/Updated in GitHub

### New Files:
- ✅ `backend/src/config/postgresDB.js` - PostgreSQL connection config
- ✅ `backend/src/jobs/billStopBatchJob.js` - Batch job logic
- ✅ `FIX_FRONTEND_NOT_UPDATING.md` - Troubleshooting guide

### Updated Files:
- ✅ `backend/setup_bill_stop_tables.js` - Fixed PostgreSQL credentials

### Environment Variables Used:
```
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dpdc_ami_prod
POSTGRES_USER=dpdc_prod_user
POSTGRES_PASSWORD=admin
```

---

## If You Get Errors

### Error: "password authentication failed"
**Check:** Your `.env` file has correct PostgreSQL credentials
```bash
cat ~/DPDC-AMI-BY-OTBL/backend/.env | grep POSTGRES
```

### Error: "Cannot find module"
**Fix:** Run `npm install` in backend directory
```bash
cd ~/DPDC-AMI-BY-OTBL/backend
npm install
```

### Error: Backend keeps restarting
**Check logs:**
```bash
pm2 logs dpdc-backend --lines 50
```

### Frontend not updating
**Hard refresh browser:**
- Windows: `Ctrl + F5`
- Mac: `Cmd + Shift + R`
- Or open Incognito window

---

## Rollback if Needed

If something goes wrong:

```bash
cd ~/DPDC-AMI-BY-OTBL
git reset --hard 2c954dc  # Previous working commit
pm2 restart dpdc-backend
```

---

## Summary of Changes

**What was fixed:**
1. ✅ Missing `postgresDB.js` config file created
2. ✅ Missing `billStopBatchJob.js` job file created
3. ✅ PostgreSQL environment variables corrected (PG_* → POSTGRES_*)
4. ✅ All files now use shared PostgreSQL config
5. ✅ Setup script uses correct credentials from .env

**What you get:**
1. ✅ Export to Excel with CPC customer details (13 columns)
2. ✅ Backend filtering that queries entire database
3. ✅ Search that works with filters
4. ✅ Bill stop batch system for performance
5. ✅ Daily automated batch job at 2 AM

---

**After deployment, the Export to Excel button will work correctly!** 🎉
