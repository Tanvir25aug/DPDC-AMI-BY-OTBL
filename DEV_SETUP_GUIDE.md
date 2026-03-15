# DPDC AMI Development Environment Setup Guide

This guide will help you set up a complete development environment for the DPDC AMI application.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Clone the Repository](#clone-the-repository)
3. [PostgreSQL Database Setup](#postgresql-database-setup)
4. [Backend Setup](#backend-setup)
5. [Frontend Setup](#frontend-setup)
6. [Running the Application](#running-the-application)
7. [Default Credentials](#default-credentials)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Install the following software on your machine:

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| Node.js | 20.x LTS | https://nodejs.org/ |
| PostgreSQL | 16+ | https://www.postgresql.org/download/ |
| Git | Latest | https://git-scm.com/ |

### Optional (for Oracle Connectivity)
| Software | Version | Notes |
|----------|---------|-------|
| Oracle Instant Client | 21.x | Required only if connecting to Oracle DB |

### Verify Installation

```bash
# Check Node.js version (should be 20.x or higher)
node --version

# Check npm version (should be 9.x or higher)
npm --version

# Check PostgreSQL version
psql --version

# Check Git version
git --version
```

---

## Clone the Repository

```bash
# Clone the repository
git clone <repository-url> dpdc-ami
cd dpdc-ami
```

---

## PostgreSQL Database Setup

### Option 1: Run the SQL Setup Script (Recommended)

1. Open pgAdmin or connect to PostgreSQL via command line
2. Run the `database_setup.sql` script located in the project root

```bash
# Windows (PowerShell)
psql -U postgres -f database_setup.sql

# Or using pgAdmin:
# 1. Open pgAdmin
# 2. Connect to your PostgreSQL server
# 3. Open Query Tool
# 4. Open and run database_setup.sql
```

### Option 2: Manual Setup

```bash
# Connect to PostgreSQL as superuser
psql -U postgres

# Create database and user
CREATE USER dev_user WITH PASSWORD 'admin';
CREATE DATABASE dpdc_ami_dev OWNER dev_user;
GRANT ALL PRIVILEGES ON DATABASE dpdc_ami_dev TO dev_user;

# Exit psql
\q
```

Then run migrations from the backend:
```bash
cd backend
npm run db:migrate
```

---

## Backend Setup

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

```bash
# Windows
copy .env.example .env.development

# Linux/Mac
cp .env.example .env.development
```

### Step 4: Configure Environment Variables

Edit `.env.development` file with your settings:

```env
# Node Environment
NODE_ENV=development

# Server Configuration
PORT=3000
API_PREFIX=/api

# PostgreSQL (User Management Database)
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dpdc_ami_dev
POSTGRES_USER=dev_user
POSTGRES_PASSWORD=admin

# Oracle Database (Optional - for reporting)
# Comment out if not using Oracle
# DB_USER=cisread
# DB_PASSWORD="cisread#2022"
# DB_HOST=c2m-dr-scan
# DB_PORT=1521
# DB_SERVICE_NAME=c2mprddr2.dpdc.org.bd
# DB_CONNECT_STRING=c2m-dr-scan:1521/c2mprddr2.dpdc.org.bd

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_for_development
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_SECRET=your_refresh_token_secret_for_development
REFRESH_TOKEN_EXPIRES_IN=7d

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=debug
LOG_FILE=logs/app.log

# Security
BCRYPT_ROUNDS=10

# Pagination
DEFAULT_PAGE_SIZE=50
MAX_PAGE_SIZE=1000

# Query Execution
MAX_QUERY_EXECUTION_TIME=30000

# Telegram Bot (Optional - set to false to disable)
ENABLE_TELEGRAM=false
TELEGRAM_BOT_TOKEN=

# Microsoft Teams Webhooks (Optional)
MS_TEAMS_WEBHOOK_URL=
```

### Step 5: Create Logs Directory

```bash
# Windows
mkdir logs

# Linux/Mac
mkdir -p logs
```

### Step 6: Run Database Migrations

```bash
# Run migrations
npm run db:migrate

# (Optional) Seed default data
npm run db:seed
```

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory

```bash
cd frontend
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Create Environment File

```bash
# Windows
copy .env.example .env.development

# Linux/Mac
cp .env.example .env.development
```

### Step 4: Configure Environment Variables

Edit `.env.development` file:

```env
# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api

# Application
VITE_APP_NAME=DPDC AMI by OTBL
VITE_APP_VERSION=1.0.0
```

---

## Running the Application

### Start Backend Server

```bash
cd backend
npm run dev
```

Backend will start at: `http://localhost:3000`

### Start Frontend Development Server

Open a new terminal:

```bash
cd frontend
npm run dev
```

Frontend will start at: `http://localhost:5173`

### Verify Application is Running

1. Open browser and go to: `http://localhost:5173`
2. You should see the login page
3. Login with default credentials (see below)

---

## Default Credentials

After running the database setup script, use these credentials to login:

| Username | Password | Role |
|----------|----------|------|
| admin | Admin@123 | Administrator |
| power_user | Power@123 | Power User |
| user | User@123 | Regular User |
| viewer | View@123 | Viewer (Read-only) |

---

## Project Structure

```
dpdc-ami/
├── backend/                 # Express.js API Server
│   ├── src/
│   │   ├── config/         # Database & app configuration
│   │   ├── controllers/    # Route controllers
│   │   ├── middleware/     # Express middlewares
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── server.js       # Entry point
│   ├── database/
│   │   └── migrations/     # Database migrations
│   ├── logs/               # Application logs
│   └── package.json
│
├── frontend/               # Vue.js 3 SPA
│   ├── src/
│   │   ├── components/     # Vue components
│   │   ├── views/          # Page components
│   │   ├── router/         # Vue Router
│   │   ├── stores/         # Pinia state management
│   │   ├── services/       # API services
│   │   └── main.js         # Entry point
│   ├── public/             # Static assets
│   └── package.json
│
├── deployment/             # Deployment configurations
├── docs/                   # Documentation
├── database_setup.sql      # PostgreSQL setup script
└── DEV_SETUP_GUIDE.md      # This file
```

---

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

```bash
# Find process using port 3000 (Windows)
netstat -ano | findstr :3000

# Kill the process
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

#### 2. PostgreSQL Connection Failed

- Verify PostgreSQL service is running
- Check credentials in `.env.development`
- Ensure database exists: `psql -U postgres -c "\l"`

#### 3. npm Install Fails

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

#### 4. Oracle Connection Issues (Optional)

- Oracle Instant Client must be installed
- Ensure Oracle environment variables are set
- Check VPN/network connectivity to Oracle server

#### 5. Frontend Can't Connect to Backend

- Ensure backend is running on port 3000
- Check CORS settings in backend `.env`
- Verify `VITE_API_BASE_URL` in frontend `.env`

---

## Additional Commands

### Backend Commands

```bash
# Development mode with hot reload
npm run dev

# Production mode
npm start

# Run migrations
npm run db:migrate

# Undo last migration
npm run db:migrate:undo

# Run seeds
npm run db:seed

# Lint code
npm run lint
```

### Frontend Commands

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

---

## Need Help?

- Check the `/docs` folder for additional documentation
- Review API documentation at `/docs/API.md`
- Contact the development team for support
