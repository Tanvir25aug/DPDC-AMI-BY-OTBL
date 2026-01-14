# 🚀 Quick Deployment Commands

## Step-by-Step: Copy and paste these commands

### **Step 1: Upload files to server**

On your **Windows PC**, open **PowerShell** and run:

```powershell
cd "D:\DPDC AMI By OTBL"

# Upload deployment script
scp deploy_on_server.sh oculin@172.18.42.200:~/

# Upload backend files
scp backend/src/services/batch-monitoring.service.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/services/
scp backend/src/services/teams.service.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/services/
scp backend/src/schedulers/batch-monitoring.scheduler.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/schedulers/
scp backend/src/schedulers/teams-reports.scheduler.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/schedulers/
scp backend/src/config/teams-webhooks.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/config/
scp backend/src/controllers/ami-operational.controller.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/controllers/
scp backend/src/routes/ami-operational.routes.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/routes/
scp backend/migrations/create_batch_monitoring_history.sql oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/migrations/
scp backend/src/server.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/
scp backend/package.json oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/
scp backend/package-lock.json oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/
scp backend/TEST_TEAMS_REPORTS.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/
scp backend/SETUP_MONITORING_TABLE.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/
scp backend/CHECK_STATUS_VALUES.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/
scp backend/CHECK_TABLE_STRUCTURE.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/
scp backend/FIND_ORACLE_TABLES.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/

# Upload frontend files
scp frontend/src/views/AMIOperationalView.vue oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/frontend/src/views/
scp frontend/src/services/ami-operational.api.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/frontend/src/services/
```

---

### **Step 2: SSH into server and deploy**

```bash
ssh oculin@172.18.42.200
```

Then run:

```bash
# Make deployment script executable
chmod +x ~/deploy_on_server.sh

# Run deployment script
~/deploy_on_server.sh
```

The script will:
- ✅ Create backup
- ✅ Install dependencies
- ✅ Setup database table
- ✅ Ask you to configure webhooks
- ✅ Test MS Teams connection
- ✅ Restart server
- ✅ Verify deployment

---

### **OR: Manual Deployment (Without Script)**

If the script doesn't work, run these commands manually:

```bash
ssh oculin@172.18.42.200

# 1. Backup
cp -r ~/DPDC-AMI-BY-OTBL ~/DPDC-AMI-BY-OTBL-backup-$(date +%Y%m%d-%H%M%S)

# 2. Install dependencies
cd ~/DPDC-AMI-BY-OTBL/backend
npm install

# 3. Setup database table
node SETUP_MONITORING_TABLE.js

# 4. Configure MS Teams webhooks
nano src/config/teams-webhooks.js
# Update the URLs, then press Ctrl+X, Y, Enter to save

# 5. Test (optional)
node TEST_TEAMS_REPORTS.js

# 6. Restart server
pm2 restart dpdc-ami-backend

# 7. Check logs
pm2 logs dpdc-ami-backend --lines 50
```

---

### **Step 3: Verify deployment**

Look for these messages in the logs:

```
✅ PostgreSQL connected successfully
✅ Oracle connection pool initialized
✅ Batch Monitoring Scheduler started (runs every 30 minutes)
✅ NOCS Balance Summary Scheduler started (runs every 60 minutes / 1 hour)
🚀 Server running on port 3000
```

---

### **Step 4: Wait for MS Teams messages**

- **30 minutes**: Batch Monitoring Report
- **1 hour**: NOCS Balance Summary

---

## 🆘 Quick Troubleshooting

### **If npm install fails:**
```bash
cd ~/DPDC-AMI-BY-OTBL/backend
npm cache clean --force
npm install
```

### **If database setup fails:**
```bash
psql -U postgres -d dpdc_ami_users -f backend/migrations/create_batch_monitoring_history.sql
```

### **If server won't restart:**
```bash
pm2 stop all
pm2 start all
pm2 logs
```

### **Rollback:**
```bash
pm2 stop dpdc-ami-backend
rm -rf ~/DPDC-AMI-BY-OTBL
mv ~/DPDC-AMI-BY-OTBL-backup-[timestamp] ~/DPDC-AMI-BY-OTBL
pm2 restart dpdc-ami-backend
```

---

## ✅ Success Checklist

- [ ] Files uploaded via SCP
- [ ] npm install completed
- [ ] Database table created
- [ ] Webhooks configured
- [ ] Server restarted
- [ ] Logs show schedulers running
- [ ] Teams messages received

---

**Ready to start?** Run the Step 1 commands on your Windows PC!
