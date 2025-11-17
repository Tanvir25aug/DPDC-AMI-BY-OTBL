# 🔍 Database Check & Fix Guide

I've created several tools to check and fix your database setup. Choose the easiest method:

## 🎯 Method 1: PowerShell Script (RECOMMENDED - Easiest!)

This script will automatically:
- ✅ Find PostgreSQL
- ✅ Check if database exists
- ✅ Check if user exists
- ✅ Create missing database/user
- ✅ Set all permissions
- ✅ Test connection

### How to run:

1. **Open PowerShell** (search in Windows Start Menu)
2. **Navigate to project:**
   ```powershell
   cd "D:\DPDC AMI By OTBL"
   ```
3. **Run the check script:**
   ```powershell
   .\check-database.ps1
   ```

**If you get an error about execution policy:**
```powershell
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process
.\check-database.ps1
```

**Password when prompted:** `admin`

The script will tell you exactly what's missing and fix it automatically!

---

## 🎯 Method 2: Batch Script

Similar to PowerShell but using Command Prompt:

1. **Open Command Prompt**
2. **Navigate to project:**
   ```cmd
   cd "D:\DPDC AMI By OTBL"
   ```
3. **Run:**
   ```cmd
   verify-and-fix-database.bat
   ```

**Password when prompted:** `admin`

---

## 🎯 Method 3: Using pgAdmin (GUI - No Password Issues!)

If scripts don't work, use the graphical interface:

1. **Open pgAdmin 4**
2. **Connect to PostgreSQL** (password: `admin`)
3. **Open Query Tool** (Tools → Query Tool)
4. **Run this to check status:**
   - Copy entire content of `check-database-status.sql`
   - Paste in Query Tool
   - Click Execute (▶️)

5. **If database or user is missing, run:**
   - Copy entire content of `setup-database.sql`
   - Paste in Query Tool
   - Click Execute (▶️)

---

## 🎯 Method 4: Manual Check via psql

If you want to check manually:

### Find psql location:
```cmd
cd "D:\DPDC AMI By OTBL"
find-postgresql.bat
```

### Connect and check:
```cmd
"C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres
```

**Password:** `admin`

**Then run:**
```sql
-- Check database
\l dpdc_ami_dev

-- Check user
\du dev_user

-- If missing, run:
\i setup-database.sql

-- Exit
\q
```

---

## ✅ What Should Exist

After running any method above, you should have:

| Item | Value | Status |
|------|-------|--------|
| **Database** | dpdc_ami_dev | Should exist |
| **User** | dev_user | Should exist |
| **Password** | admin | Should be set |
| **Permissions** | ALL on dpdc_ami_dev | Should be granted |

---

## 🧪 Test Connection

To verify everything works:

### Using PowerShell:
```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U dev_user -d dpdc_ami_dev -h localhost -c "SELECT 'Connection works!' as test;"
```

**Password:** `admin`

**Expected output:** `Connection works!`

### Using pgAdmin:
1. Right-click **Servers**
2. Create → Server
3. General tab:
   - Name: DPDC AMI Dev
4. Connection tab:
   - Host: localhost
   - Port: 5432
   - Database: dpdc_ami_dev
   - Username: dev_user
   - Password: admin
5. Click Save

If it connects, database is ready!

---

## 📊 Common Issues & Solutions

### Issue 1: "psql not found"
**Solution:** Use PowerShell script or pgAdmin instead

### Issue 2: "password authentication failed"
**Solutions:**
- Try password: `admin`
- Try password: `postgres`
- Try password: (whatever you set during PostgreSQL installation)
- Use pgAdmin which remembers passwords

### Issue 3: "database already exists"
**Solution:** This is good! It means database is already set up
- Just verify the user exists
- Verify permissions are set

### Issue 4: "user already exists"
**Solution:** This is good! It means user is already created
- Just verify permissions are set
- Test connection

### Issue 5: "permission denied"
**Solution:** Run the permissions part:
```sql
GRANT ALL PRIVILEGES ON DATABASE dpdc_ami_dev TO dev_user;
\c dpdc_ami_dev
GRANT ALL ON SCHEMA public TO dev_user;
```

---

## 🎯 After Database is Confirmed Working

Once database check passes, proceed with backend setup:

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Create Environment File
```bash
copy .env.example .env.development
```

**Verify these settings in `.env.development`:**
```env
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dpdc_ami_dev
POSTGRES_USER=dev_user
POSTGRES_PASSWORD=admin
```

### 3. Run Migrations (Creates Tables)
```bash
npm run migrate
```

**Expected output:**
```
== 20240101000001-create-initial-schema: migrating =======
== 20240101000001-create-initial-schema: migrated (0.XXXs)
```

### 4. Seed Data (Creates Admin User)
```bash
npm run seed
```

**Expected output:**
```
✅ Admin user created successfully
   Username: admin
   Password: Admin@123
```

### 5. Start Backend
```bash
npm run dev
```

**Expected output:**
```
✅ PostgreSQL connected successfully [development]
   Database: dpdc_ami_dev
   User: dev_user

🚀 Server running on port 3000
```

### 6. Setup Frontend (New Terminal)
```bash
cd frontend
npm install
copy .env.example .env.development
npm run dev
```

### 7. Access Application
**Browser:** http://localhost:5173

**Login:**
- Username: `admin`
- Password: `Admin@123`

---

## 🆘 Still Having Issues?

Run the PowerShell check script and send me the output:

```powershell
cd "D:\DPDC AMI By OTBL"
.\check-database.ps1 > database-check-results.txt
```

Then check the `database-check-results.txt` file and let me know what it says!
