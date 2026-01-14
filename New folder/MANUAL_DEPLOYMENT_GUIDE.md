# 📦 Manual Deployment Guide (No GitHub Access)

## ⚠️ Server Status
- ❌ GitHub HTTPS (port 443): Blocked
- ❌ GitHub SSH (port 22): Blocked
- ✅ SSH Access: Working (oculin@172.18.42.200)

## 🚀 Deployment Method: Manual File Transfer

---

## **Option 1: Using Windows Batch Script (Easiest)**

### **Step 1: Run the deployment package creator**

On your **local Windows machine**:

```cmd
cd "D:\DPDC AMI By OTBL"
DEPLOY_TO_PRODUCTION.bat
```

This will create a `deploy-temp` folder with all updated files.

### **Step 2: Upload using WinSCP**

1. Open **WinSCP**
2. Connect to:
   - **Host**: `172.18.42.200`
   - **User**: `oculin`
   - **Password**: [your password]
3. Navigate to: `/home/oculin/DPDC-AMI-BY-OTBL`
4. **Backup first**: Right-click → Duplicate → Rename to `DPDC-AMI-BY-OTBL-backup-[date]`
5. Upload all files from `deploy-temp` folder to corresponding locations

### **Step 3: Deploy on server**

SSH into the server and run:

```bash
ssh oculin@172.18.42.200
cd ~/DPDC-AMI-BY-OTBL/backend

# Install new dependencies
npm install

# Setup database table
node SETUP_MONITORING_TABLE.js

# Configure MS Teams webhooks (IMPORTANT!)
nano src/config/teams-webhooks.js
# Update the webhook URLs with your production URLs

# Test the connection (optional)
node TEST_TEAMS_REPORTS.js

# Restart the server
pm2 restart dpdc-ami-backend

# Check logs
pm2 logs dpdc-ami-backend --lines 50
```

---

## **Option 2: Using SCP Command (Linux/Git Bash)**

### **Step 1: Upload files using SCP**

On your **local machine** (using Git Bash or WSL):

```bash
cd "D:\DPDC AMI By OTBL"

# Make script executable
chmod +x UPLOAD_TO_PRODUCTION.sh

# Run upload script
./UPLOAD_TO_PRODUCTION.sh
```

Or manually run SCP commands:

```bash
# Backend services
scp backend/src/services/batch-monitoring.service.js oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/src/services/
scp backend/src/services/teams.service.js oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/src/services/

# Schedulers
scp backend/src/schedulers/batch-monitoring.scheduler.js oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/src/schedulers/
scp backend/src/schedulers/teams-reports.scheduler.js oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/src/schedulers/

# Config
scp backend/src/config/teams-webhooks.js oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/src/config/

# Controllers and routes
scp backend/src/controllers/ami-operational.controller.js oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/src/controllers/
scp backend/src/routes/ami-operational.routes.js oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/src/routes/

# Migration
scp backend/migrations/create_batch_monitoring_history.sql oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/migrations/

# Server
scp backend/src/server.js oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/src/

# Package files
scp backend/package.json oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/
scp backend/package-lock.json oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/

# Scripts
scp backend/TEST_TEAMS_REPORTS.js oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/
scp backend/SETUP_MONITORING_TABLE.js oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/backend/

# Frontend
scp frontend/src/views/AMIOperationalView.vue oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/frontend/src/views/
scp frontend/src/services/ami-operational.api.js oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/frontend/src/services/

# Documentation
scp PRODUCTION_DEPLOYMENT_GUIDE.md oculin@172.18.42.200:/home/oculin/DPDC-AMI-BY-OTBL/
```

### **Step 2: Deploy on server**

Same as Option 1 Step 3 above.

---

## **Option 3: Create ZIP and Upload via SFTP**

### **Step 1: Create ZIP file**

On your **local machine**:

```cmd
cd "D:\DPDC AMI By OTBL"

# Run the batch script to create deploy-temp folder
DEPLOY_TO_PRODUCTION.bat

# Then manually create a ZIP file of deploy-temp folder
# Right-click deploy-temp → Send to → Compressed (zipped) folder
```

### **Step 2: Upload ZIP using FileZilla/WinSCP**

1. Upload `deploy-temp.zip` to server home directory: `/home/oculin/`
2. SSH into server
3. Extract and deploy:

```bash
ssh oculin@172.18.42.200

# Backup current installation
cp -r ~/DPDC-AMI-BY-OTBL ~/DPDC-AMI-BY-OTBL-backup-$(date +%Y%m%d)

# Extract deployment package
cd ~
unzip deploy-temp.zip

# Copy files to production
cp -r deploy-temp/backend/* ~/DPDC-AMI-BY-OTBL/backend/
cp -r deploy-temp/frontend/* ~/DPDC-AMI-BY-OTBL/frontend/
cp deploy-temp/PRODUCTION_DEPLOYMENT_GUIDE.md ~/DPDC-AMI-BY-OTBL/

# Continue with deployment
cd ~/DPDC-AMI-BY-OTBL/backend
npm install
node SETUP_MONITORING_TABLE.js

# Configure webhooks
nano src/config/teams-webhooks.js

# Restart server
pm2 restart dpdc-ami-backend
pm2 logs dpdc-ami-backend
```

---

## 🔧 **Post-Upload Deployment Steps**

After uploading files by any method, run these commands on the **production server**:

### **1. Backup Current Installation**
```bash
cd ~
cp -r DPDC-AMI-BY-OTBL DPDC-AMI-BY-OTBL-backup-$(date +%Y%m%d-%H%M%S)
```

### **2. Install Dependencies**
```bash
cd ~/DPDC-AMI-BY-OTBL/backend
npm install
```

Expected output:
```
added 1 package (node-cron@4.2.1)
```

### **3. Setup PostgreSQL Table**
```bash
node SETUP_MONITORING_TABLE.js
```

Expected output:
```
✅ Table created!
✅ Indexes created!
🎉 Setup complete!
```

### **4. Configure MS Teams Webhooks** ⚠️ **IMPORTANT**
```bash
nano src/config/teams-webhooks.js
```

Update with your **production** webhook URLs:
```javascript
module.exports = {
  DEFAULT: 'https://YOUR-PRODUCTION-WEBHOOK-URL',
  BATCH_MONITORING: 'https://YOUR-BATCH-MONITORING-WEBHOOK-URL',
  ALERTS: 'https://YOUR-ALERTS-WEBHOOK-URL',
};
```

Save: `Ctrl+X`, then `Y`, then `Enter`

### **5. Test MS Teams Connection (Optional but Recommended)**
```bash
node TEST_TEAMS_REPORTS.js
```

Check your MS Teams channel - you should receive 2 test messages.

### **6. Restart Backend Server**
```bash
# Using PM2
pm2 restart dpdc-ami-backend

# Check status
pm2 status

# View logs
pm2 logs dpdc-ami-backend --lines 50
```

### **7. Verify Deployment**

Look for these log messages:
```
✅ PostgreSQL connected successfully
✅ Oracle connection pool initialized
✅ Batch Monitoring Scheduler started (runs every 30 minutes)
✅ NOCS Balance Summary Scheduler started (runs every 60 minutes / 1 hour)
🚀 Server running on port 3000
```

### **8. Build Frontend (If Needed)**
```bash
cd ~/DPDC-AMI-BY-OTBL/frontend
npm run build

# Copy to nginx
sudo cp -r dist/* /var/www/html/dpdc-ami/

# Restart nginx
sudo systemctl restart nginx
```

---

## ✅ **Verification Checklist**

After deployment, verify:

- [ ] Server started without errors
- [ ] Both schedulers running (check logs)
- [ ] PostgreSQL table created:
  ```bash
  psql -U postgres -d dpdc_ami_users -c "\dt batch_monitoring_history"
  ```
- [ ] Wait 30 minutes → Check Teams for Batch Monitoring Report
- [ ] Wait 1 hour → Check Teams for NOCS Balance Summary
- [ ] Frontend auto-refreshes every 30 minutes

---

## 📊 **Expected Results**

### **Every 30 Minutes in MS Teams:**
```
🔄 BATCH MONITORING REPORT

📋 Pending IMD
66,548 records pending
Last Update: [timestamp]

⚡ Currently Running Batches (1)
D1-IMD | Started: [time] | Duration: 6h 41m | Records: 79,857 | RPS: 3.30 🟢 | Running
```

### **Every 1 Hour in MS Teams:**
```
💰 NOCS Balance - Overall Summary

🏢 Total NOCS Areas: 17
👥 Total Customers: 2,31,435
💚 Credit Balance: ৳22,47,03,188.91 (1,69,070 customers)
🔴 Due Balance: -৳25,08,39,233.46 (61,324 customers)
💰 Net Balance: -৳2,61,36,044.55
```

---

## 🆘 **Troubleshooting**

### **Issue: npm install fails**
```bash
# Check Node.js version
node --version  # Should be v14 or higher

# Try cleaning cache
npm cache clean --force
npm install
```

### **Issue: PostgreSQL table creation fails**
```bash
# Check PostgreSQL connection
psql -U postgres -d dpdc_ami_users -c "SELECT 1"

# Manually run migration
psql -U postgres -d dpdc_ami_users -f backend/migrations/create_batch_monitoring_history.sql
```

### **Issue: Server won't start**
```bash
# Check for errors
pm2 logs dpdc-ami-backend --err

# Check if port is in use
netstat -tulpn | grep 3000

# Kill old process if needed
pkill -f "node.*server.js"
pm2 restart dpdc-ami-backend
```

### **Issue: Teams not receiving messages**
```bash
# Test webhook manually
curl -X POST "YOUR_WEBHOOK_URL" \
  -H "Content-Type: application/json" \
  -d '{"text":"Test message from production"}'

# Check server logs
pm2 logs | grep "Teams"
```

---

## 🔄 **Rollback Procedure**

If something goes wrong:

```bash
# Stop server
pm2 stop dpdc-ami-backend

# Restore backup
cd ~
rm -rf DPDC-AMI-BY-OTBL
mv DPDC-AMI-BY-OTBL-backup-[timestamp] DPDC-AMI-BY-OTBL

# Restart
cd DPDC-AMI-BY-OTBL/backend
pm2 restart dpdc-ami-backend
```

---

## 📝 **Files Being Deployed**

### **Backend Files (15 files):**
- `backend/src/services/batch-monitoring.service.js` ⭐ NEW
- `backend/src/services/teams.service.js` ✏️ MODIFIED
- `backend/src/schedulers/batch-monitoring.scheduler.js` ⭐ NEW
- `backend/src/schedulers/teams-reports.scheduler.js` ✏️ MODIFIED
- `backend/src/config/teams-webhooks.js` ✏️ MODIFIED
- `backend/src/controllers/ami-operational.controller.js` ✏️ MODIFIED
- `backend/src/routes/ami-operational.routes.js` ✏️ MODIFIED
- `backend/migrations/create_batch_monitoring_history.sql` ⭐ NEW
- `backend/src/server.js` ✏️ MODIFIED
- `backend/package.json` ✏️ MODIFIED
- `backend/package-lock.json` ✏️ MODIFIED
- `backend/TEST_TEAMS_REPORTS.js` ⭐ NEW
- `backend/SETUP_MONITORING_TABLE.js` ⭐ NEW
- `backend/CHECK_STATUS_VALUES.js` ⭐ NEW
- `backend/CHECK_TABLE_STRUCTURE.js` ⭐ NEW

### **Frontend Files (2 files):**
- `frontend/src/views/AMIOperationalView.vue` ✏️ MODIFIED
- `frontend/src/services/ami-operational.api.js` ✏️ MODIFIED

### **Documentation (1 file):**
- `PRODUCTION_DEPLOYMENT_GUIDE.md` ⭐ NEW

---

## 🎯 **Success Criteria**

Deployment is successful when:

✅ Server starts without errors
✅ Logs show schedulers running
✅ PostgreSQL table exists
✅ Teams receives batch report (30 mins)
✅ Teams receives NOCS summary (1 hour)
✅ Frontend auto-refreshes (30 mins)

---

**Deployment Date**: __________
**Deployed By**: __________
**Status**: [ ] Success [ ] Failed [ ] Rolled Back

---

🎉 **You're ready to deploy!**
