# Quick Clone and Run Guide

**For team members who want to quickly get the project running.**

---

## Step 1: Clone Repository

```bash
git clone https://github.com/Tanvir25aug/DPDC-AMI-BY-OTBL.git
cd DPDC-AMI-BY-OTBL
```

---

## Step 2: Backend Setup (Terminal 1)

```bash
cd backend
npm install
copy .env.example .env
```

**Edit `backend/.env` file with your credentials:**
- PostgreSQL password
- Oracle database credentials
- JWT secret

**Then run:**
```bash
npm run migrate
npm run seed
npm run dev
```

✅ Backend running on: http://localhost:5000

---

## Step 3: Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
copy .env.example .env
```

**Edit `frontend/.env` file:**
```
VITE_API_URL=http://localhost:5000/api
```

**Then run:**
```bash
npm run dev
```

✅ Frontend running on: http://localhost:5173

---

## Prerequisites Required

- Node.js v16+ → https://nodejs.org/
- PostgreSQL v12+ → https://www.postgresql.org/
- Git → https://git-scm.com/

---

## Need More Help?

See **TEAM_SETUP_GUIDE.md** for:
- Detailed setup instructions
- Troubleshooting common issues
- Database configuration
- Environment setup
- Production deployment

---

## Quick Commands Reference

### Backend Commands
```bash
npm run dev          # Start development server
npm run migrate      # Run database migrations
npm run seed         # Seed initial data
npm start            # Start production server
```

### Frontend Commands
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

---

**That's it! You're ready to go!** 🚀
