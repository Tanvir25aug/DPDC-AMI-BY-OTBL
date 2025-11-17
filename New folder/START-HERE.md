# 🚀 START HERE - Quick Setup Guide

## Step 1: Check & Setup Database

**Run this PowerShell script to automatically check and fix your database:**

```powershell
# Open PowerShell and run:
cd "D:\DPDC AMI By OTBL"
.\check-database.ps1
```

**Password when prompted:** `admin`

This will automatically:
- ✅ Find PostgreSQL
- ✅ Check database exists (create if missing)
- ✅ Check user exists (create if missing)
- ✅ Set all permissions
- ✅ Test connection

**If PowerShell doesn't work:** See `DATABASE-CHECK-GUIDE.md` for alternative methods

---

## Step 2: Setup Backend

```bash
cd backend
npm install
copy .env.example .env.development
npm run migrate
npm run seed
npm run dev
```

**Expected output:**
```
✅ PostgreSQL connected successfully
🚀 Server running on port 3000
```

---

## Step 3: Setup Frontend (New Terminal)

```bash
cd frontend
npm install
copy .env.example .env.development
npm run dev
```

**Expected output:**
```
➜  Local: http://localhost:5173/
```

---

## Step 4: Access Application

**Browser:** http://localhost:5173

**Login:**
- Username: `admin`
- Password: `Admin@123`

---

## 📚 Documentation Files

- **`DATABASE-CHECK-GUIDE.md`** - Detailed database setup & troubleshooting
- **`SETUP-USING-PGADMIN.md`** - GUI setup using pgAdmin
- **`README.md`** - Full project documentation
- **`docs/QUICK_START.md`** - Detailed development guide
- **`docs/API.md`** - API documentation

---

## 🆘 Need Help?

### Database Issues
1. Read `DATABASE-CHECK-GUIDE.md`
2. Try different methods (PowerShell, pgAdmin, etc.)
3. Check PostgreSQL service is running

### Backend Issues
1. Make sure database is set up first
2. Check `.env.development` has correct settings
3. Look at error messages

### Frontend Issues
1. Make sure backend is running first
2. Check browser console for errors

---

## ✅ Quick Checklist

- [ ] PostgreSQL installed and running
- [ ] Database `dpdc_ami_dev` exists
- [ ] User `dev_user` exists with password `admin`
- [ ] Backend dependencies installed (`npm install`)
- [ ] Backend migrations run (`npm run migrate`)
- [ ] Backend seeded (`npm run seed`)
- [ ] Backend running (`npm run dev`)
- [ ] Frontend dependencies installed
- [ ] Frontend running (`npm run dev`)
- [ ] Can access http://localhost:5173
- [ ] Can login with admin/Admin@123

---

Good luck! 🚀
