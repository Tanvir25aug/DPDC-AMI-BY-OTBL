# DPDC AMI System - Team Setup Guide

Complete guide for team members to clone and set up the project on their local machines.

---

## Prerequisites

Before starting, ensure you have the following installed:

1. **Node.js** (v16 or higher)
   - Download from: https://nodejs.org/
   - Verify: `node --version`

2. **Git**
   - Download from: https://git-scm.com/
   - Verify: `git --version`

3. **PostgreSQL** (v12 or higher)
   - Download from: https://www.postgresql.org/download/
   - Note: Required for user management database

4. **Oracle Database Access**
   - Ensure you have access credentials to the Oracle AMI database
   - Oracle Instant Client may be required

---

## Step 1: Clone the Repository

Open Command Prompt or Git Bash and run:

```bash
# Clone the repository
git clone https://github.com/Tanvir25aug/DPDC-AMI-BY-OTBL.git

# Navigate to project directory
cd DPDC-AMI-BY-OTBL
```

---

## Step 2: Backend Setup

### 2.1 Navigate to Backend Directory

```bash
cd backend
```

### 2.2 Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js (server framework)
- Sequelize (PostgreSQL ORM)
- oracledb (Oracle database connector)
- PDFKit (PDF generation)
- Socket.IO (real-time updates)
- Passport.js (authentication)

### 2.3 Configure Environment Variables

Create a `.env` file in the `backend` folder:

```bash
# Copy the example file
copy .env.example .env
```

Edit the `.env` file with your actual credentials:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# PostgreSQL Database (for user management)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=dpdc_ami
DB_USER=postgres
DB_PASSWORD=your_postgres_password

# Oracle Database (for AMI data)
ORACLE_USER=your_oracle_username
ORACLE_PASSWORD=your_oracle_password
ORACLE_CONNECT_STRING=your_oracle_host:1521/your_service_name

# JWT Secret (for authentication)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# CORS Configuration
FRONTEND_URL=http://localhost:5173
```

### 2.4 Set Up PostgreSQL Database

#### Option A: Using pgAdmin
1. Open pgAdmin
2. Create a new database named `dpdc_ami`
3. Run migrations:

```bash
npm run migrate
```

4. Seed initial admin user:

```bash
npm run seed
```

#### Option B: Using Command Line

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE dpdc_ami;

# Exit psql
\q

# Run migrations
npm run migrate

# Seed initial data
npm run seed
```

### 2.5 Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

The backend will start on: **http://localhost:5000**

---

## Step 3: Frontend Setup

### 3.1 Open New Terminal and Navigate to Frontend

```bash
# From project root
cd frontend
```

### 3.2 Install Dependencies

```bash
npm install
```

This will install:
- Vue 3 (frontend framework)
- Vite (build tool)
- Tailwind CSS (styling)
- Pinia (state management)
- Vue Router (routing)
- Axios (HTTP client)
- XLSX (Excel export)
- Heroicons (icons)

### 3.3 Configure Environment Variables

Create a `.env` file in the `frontend` folder:

```bash
# Copy the example file
copy .env.example .env
```

Edit the `.env` file:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api
```

### 3.4 Start Frontend Development Server

```bash
npm run dev
```

The frontend will start on: **http://localhost:5173**

---

## Step 4: Access the Application

### 4.1 Open Browser

Navigate to: **http://localhost:5173**

### 4.2 Default Admin Credentials

```
Username: admin
Password: admin123
```

**⚠️ Important:** Change the default password immediately after first login!

---

## Step 5: Verify Everything is Working

### 5.1 Check Backend Health

Open browser and navigate to:
```
http://localhost:5000/api/health
```

You should see:
```json
{
  "status": "ok",
  "timestamp": "2025-11-17T..."
}
```

### 5.2 Test Login

1. Go to http://localhost:5173
2. Login with admin credentials
3. You should see the Dashboard

### 5.3 Test Database Connections

- **PostgreSQL:** If login works, PostgreSQL is connected
- **Oracle:** Navigate to "RC/DC Monitor" page
  - If data loads, Oracle connection is working
  - If you see errors, check Oracle credentials in `.env`

---

## Common Issues and Solutions

### Issue 1: "Cannot find module 'oracledb'"

**Solution:**
```bash
cd backend
npm install oracledb
```

If still fails, you may need Oracle Instant Client:
- Download from: https://www.oracle.com/database/technologies/instant-client/downloads.html
- Install and set PATH environment variable

### Issue 2: "Port 5000 is already in use"

**Solution:**
```bash
# Option 1: Kill the process using port 5000
# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Option 2: Change port in backend/.env
PORT=5001
```

### Issue 3: "Port 5173 is already in use"

**Solution:**
```bash
# Vite will automatically use next available port (5174, 5175, etc.)
# Or specify custom port:
npm run dev -- --port 3000
```

### Issue 4: PostgreSQL Connection Refused

**Solution:**
1. Verify PostgreSQL is running:
   - Windows: Check Services → PostgreSQL should be "Running"
2. Check credentials in `backend/.env`
3. Verify database exists:
   ```bash
   psql -U postgres -l
   ```

### Issue 5: Oracle Connection Errors

**Solution:**
1. Verify Oracle credentials in `backend/.env`
2. Check Oracle service name/SID
3. Test connection using SQL*Plus or SQL Developer
4. Ensure firewall allows Oracle port (default: 1521)

### Issue 6: "ECONNREFUSED" when frontend calls backend

**Solution:**
1. Verify backend is running on port 5000
2. Check `VITE_API_URL` in `frontend/.env`
3. Check CORS settings in `backend/.env`

---

## Project Structure

```
DPDC-AMI-BY-OTBL/
├── backend/                    # Backend API server
│   ├── src/
│   │   ├── config/            # Database and app configuration
│   │   ├── controllers/       # Request handlers
│   │   ├── middleware/        # Authentication, validation
│   │   ├── models/            # Database models
│   │   ├── routes/            # API routes
│   │   └── services/          # Business logic
│   ├── database/
│   │   ├── migrations/        # Database migrations
│   │   └── seeders/           # Initial data
│   ├── reports/               # SQL query files
│   ├── .env                   # Environment variables (create this)
│   └── package.json
│
├── frontend/                   # Vue 3 frontend
│   ├── src/
│   │   ├── components/        # Reusable components
│   │   ├── views/             # Page components
│   │   ├── stores/            # Pinia state management
│   │   ├── services/          # API services
│   │   └── router/            # Vue Router
│   ├── .env                   # Environment variables (create this)
│   └── package.json
│
└── logo/                       # Company logos for PDFs
```

---

## Available Scripts

### Backend Scripts

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start

# Run migrations
npm run migrate

# Undo last migration
npm run migrate:undo

# Seed database
npm run seed

# Undo seeding
npm run seed:undo
```

### Frontend Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Features Overview

### 1. Dashboard
- Daily connect/disconnect statistics
- Real-time updates every 5 minutes
- Summary cards with trends

### 2. RC/DC Monitor
- NOCS-wise breakdown
- View meter-wise details (modal)
- Download PDF reports per NOCS

### 3. Meter-wise Report
- Advanced filtering (6 filter types)
- Excel export
- Pagination
- Calculated meter status

### 4. Reports
- Historical data analysis
- Custom date ranges

### 5. Query History
- Track all executed queries
- View query results
- User activity logs

### 6. Admin Panel (Admin only)
- User management
- Role assignment
- Permission control

---

## User Roles and Permissions

### Admin
- Full system access
- User management
- All reports and dashboards

### Manager
- View all reports
- Export data
- No user management

### Operator
- View dashboards
- Limited report access
- No exports

---

## Database Information

### PostgreSQL Tables

1. **Users** - System users
2. **Roles** - User roles (Admin, Manager, Operator)
3. **QueryLogs** - Query execution history

### Oracle Database

- Read-only access to AMI data
- Tables used:
  - `ci_acct` - Customer accounts
  - `ci_sa` - Service agreements
  - `ci_sp` - Service points
  - `ci_sp_l` - Service point locations
  - `d1_install_event` - Installation events
  - `d1_device` - Meter devices
  - And more...

---

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Reports
- `GET /api/reports/daily_connect_disconnect_count` - Dashboard stats
- `GET /api/reports/rc_dc_nocs_aggregated` - NOCS breakdown
- `GET /api/reports/meter_wise_commands_by_nocs` - Meter details
- `GET /api/reports/download_nocs_report_pdf` - Download PDF

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

---

## Real-time Updates

The system uses Socket.IO for real-time data updates:

- **Auto-refresh interval:** 5 minutes
- **Endpoint:** `ws://localhost:5000`
- **Events:**
  - `dashboard:update` - Dashboard data updated
  - `nocs:update` - NOCS data updated

---

## Building for Production

### Backend

```bash
cd backend

# The backend runs directly with Node.js
# Just set NODE_ENV=production in .env
```

### Frontend

```bash
cd frontend

# Build for production
npm run build

# This creates a 'dist' folder with optimized files
# Deploy the 'dist' folder to your web server
```

---

## Support and Documentation

- **API Documentation:** See `docs/API.md`
- **Deployment Guide:** See `docs/DEPLOYMENT.md`
- **Quick Start:** See `docs/QUICK_START.md`

---

## Security Notes

1. **Change Default Credentials**
   - Default admin password: `admin123`
   - Change immediately after setup

2. **JWT Secret**
   - Generate a strong random secret
   - Never commit `.env` to git

3. **Database Passwords**
   - Use strong passwords
   - Keep `.env` files secure

4. **CORS Configuration**
   - Update `FRONTEND_URL` in production
   - Restrict to your domain only

---

## Quick Setup Checklist

- [ ] Install Node.js
- [ ] Install Git
- [ ] Install PostgreSQL
- [ ] Clone repository
- [ ] Backend: `npm install`
- [ ] Backend: Create `.env` file
- [ ] Backend: Create PostgreSQL database
- [ ] Backend: Run migrations
- [ ] Backend: Seed database
- [ ] Backend: Start server (`npm run dev`)
- [ ] Frontend: `npm install`
- [ ] Frontend: Create `.env` file
- [ ] Frontend: Start dev server (`npm run dev`)
- [ ] Open browser: http://localhost:5173
- [ ] Login with admin credentials
- [ ] Change default password

---

## Need Help?

If you encounter issues:

1. Check the "Common Issues" section above
2. Verify all prerequisites are installed
3. Check console logs for error messages
4. Verify `.env` configuration
5. Ensure all services (PostgreSQL, Oracle) are running

---

**Last Updated:** November 17, 2025
**Version:** 1.0.0
