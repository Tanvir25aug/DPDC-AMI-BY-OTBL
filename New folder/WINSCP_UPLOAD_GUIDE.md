# 📁 WinSCP Upload Guide

## 🔌 Step 1: Connect to Server

**In WinSCP:**
- **Host name**: `172.18.42.200`
- **User name**: `oculin`
- **Password**: [your password]
- **Port**: `22`
- Click **Login**

---

## 📂 Step 2: Navigate to Directories

**Left side (Your PC)**: Navigate to `D:\DPDC AMI By OTBL`

**Right side (Server)**: Navigate to `/home/oculin/DPDC-AMI-BY-OTBL`

---

## 📤 Step 3: Drag & Drop These Files

### **Backend Services** (2 files)
**From:** `D:\DPDC AMI By OTBL\backend\src\services\`
**To:** `/home/oculin/DPDC-AMI-BY-OTBL/backend/src/services/`

✅ `batch-monitoring.service.js`
✅ `teams.service.js`

---

### **Schedulers** (2 files)
**From:** `D:\DPDC AMI By OTBL\backend\src\schedulers\`
**To:** `/home/oculin/DPDC-AMI-BY-OTBL/backend/src/schedulers/`

✅ `batch-monitoring.scheduler.js`
✅ `teams-reports.scheduler.js`

---

### **Config** (1 file)
**From:** `D:\DPDC AMI By OTBL\backend\src\config\`
**To:** `/home/oculin/DPDC-AMI-BY-OTBL/backend/src/config/`

✅ `teams-webhooks.js`

---

### **Controllers** (1 file)
**From:** `D:\DPDC AMI By OTBL\backend\src\controllers\`
**To:** `/home/oculin/DPDC-AMI-BY-OTBL/backend/src/controllers/`

✅ `ami-operational.controller.js`

---

### **Routes** (1 file)
**From:** `D:\DPDC AMI By OTBL\backend\src\routes\`
**To:** `/home/oculin/DPDC-AMI-BY-OTBL/backend/src/routes/`

✅ `ami-operational.routes.js`

---

### **Migrations** (1 file)
**From:** `D:\DPDC AMI By OTBL\backend\migrations\`
**To:** `/home/oculin/DPDC-AMI-BY-OTBL/backend/migrations/`

✅ `create_batch_monitoring_history.sql`

---

### **Server** (1 file)
**From:** `D:\DPDC AMI By OTBL\backend\src\`
**To:** `/home/oculin/DPDC-AMI-BY-OTBL/backend/src/`

✅ `server.js`

---

### **Package Files** (2 files)
**From:** `D:\DPDC AMI By OTBL\backend\`
**To:** `/home/oculin/DPDC-AMI-BY-OTBL/backend/`

✅ `package.json`
✅ `package-lock.json`

---

### **Scripts** (3 files)
**From:** `D:\DPDC AMI By OTBL\backend\`
**To:** `/home/oculin/DPDC-AMI-BY-OTBL/backend/`

✅ `TEST_TEAMS_REPORTS.js`
✅ `SETUP_MONITORING_TABLE.js`
✅ `CHECK_STATUS_VALUES.js`

---

### **Frontend Views** (1 file)
**From:** `D:\DPDC AMI By OTBL\frontend\src\views\`
**To:** `/home/oculin/DPDC-AMI-BY-OTBL/frontend/src/views/`

✅ `AMIOperationalView.vue`

---

### **Frontend Services** (1 file)
**From:** `D:\DPDC AMI By OTBL\frontend\src\services\`
**To:** `/home/oculin/DPDC-AMI-BY-OTBL/frontend/src/services/`

✅ `ami-operational.api.js`

---

## ✅ Summary: Total 17 Files

**Backend:** 14 files
**Frontend:** 2 files
**Documentation:** (optional)

---

## ⚠️ IMPORTANT: After Upload

Once all files are uploaded, you need to run deployment commands on the server.

**SSH into server:**
```bash
ssh oculin@172.18.42.200
```

**Then run:**
```bash
cd ~/DPDC-AMI-BY-OTBL/backend
npm install
node SETUP_MONITORING_TABLE.js
nano src/config/teams-webhooks.js
```
*(Update webhook URLs, then Ctrl+X, Y, Enter)*

```bash
pm2 restart dpdc-ami-backend
pm2 logs dpdc-ami-backend --lines 30
```

---

## 🎯 Quick Tip

**In WinSCP**, you can:
- Select multiple files at once (Ctrl+Click)
- Drag them all together
- WinSCP will preserve the directory structure
