# DPDC AMI Dashboard

A full-stack web application for **Dhaka Power Distribution Company (DPDC)** Advanced Metering Infrastructure (AMI) management, built by **OTBL**.

## Overview

This system provides operational dashboards, reporting, and management tools for DPDC's AMI network — covering meter monitoring, billing, customer data, batch job tracking, and real-time notifications.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js + Express 4 |
| Frontend | Vue 3 + Vite + Tailwind CSS + Pinia |
| App Database | PostgreSQL (via Sequelize ORM) |
| Data Source | Oracle (CISADM schema via oracledb v6) |
| Real-time | Socket.IO |
| Notifications | Microsoft Teams webhooks + Telegram Bot |
| Deployment | PM2 + Nginx |

## Features

- **RC/DC Monitoring** — Track reading cycle and disconnect/connect progress
- **AMI Operational Dashboard** — Device status, command analytics, meter-wise data
- **CRP/CPC Customer List** — Search, filter, paginate, export to Excel
- **Bill Stop Management** — Stop/resume billing, reading audit, batch analysis
- **NOCS Reports** — Balance summary, collection summary, payoff, meter installation
- **Customer Details** — Billing history, reading audit, monthly billing breakdown
- **Bank-wise Collection & Reconciliation** — Collection data by bank
- **Batch Job Monitoring** — Real-time batch execution tracking and alerts
- **Oracle Query Executor** — Run custom SELECT queries against CISADM
- **User Management** — Role-based access control with dynamic page permissions
- **Scheduled Reports** — Auto-send to Microsoft Teams (hourly) + Telegram Bot
- **Audit Trail** — Full login history, query logs, user activity tracking

## Project Structure

```
dpdc-dashboard/
├── backend/                    # Node.js Express API (port 3000)
│   ├── src/
│   │   ├── config/             # Database, Oracle pool, Passport, logging
│   │   ├── controllers/        # Request handlers
│   │   ├── middleware/         # Auth, rate limiting, error handling
│   │   ├── models/             # Sequelize PostgreSQL models
│   │   ├── routes/             # API route definitions
│   │   ├── schedulers/         # Cron schedulers (Teams, batch monitoring)
│   │   ├── services/           # Business logic layer
│   │   ├── jobs/               # Batch job runners
│   │   ├── utils/              # Shared utilities
│   │   └── server.js           # Application entry point
│   ├── reports/                # Oracle SQL query files (60+)
│   └── package.json
├── frontend/                   # Vue 3 SPA
│   ├── src/
│   │   ├── assets/             # Logos, global CSS
│   │   ├── components/         # Reusable UI components
│   │   ├── views/              # Page-level components (24 routes)
│   │   ├── router/             # Vue Router config
│   │   ├── stores/             # Pinia state stores
│   │   ├── services/           # Axios API client
│   │   └── main.js             # App entry point
│   └── package.json
├── deployment/                 # PM2, Nginx, and setup scripts
├── docs/                       # API docs, DB reference, operations manual
├── database_setup.sql          # PostgreSQL schema + seed data
├── create_database.sql         # Initial DB creation
├── DEV_SETUP_GUIDE.md          # Developer setup guide
└── quick-start.ps1             # Windows quick-start script
```

## Getting Started

### Prerequisites

- Node.js >= 20.0.0
- PostgreSQL >= 14
- Oracle Client (for oracledb v6)
- npm or yarn

### 1. Clone & Install

```bash
git clone https://github.com/oculin/dpdc-dashboard.git
cd dpdc-dashboard

# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment

```bash
# Backend — copy and fill in values
cp backend/.env.example backend/.env
```

**Required `.env` variables:**

```env
# App
NODE_ENV=development
PORT=3000
JWT_SECRET=your_jwt_secret_here

# PostgreSQL
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dpdc_ami
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_password

# Oracle
DB_USER=cisadm
DB_PASSWORD=your_oracle_password
DB_CONNECT_STRING=host:1521/service_name

# CORS (comma-separated origins)
ALLOWED_ORIGINS=http://localhost:5173

# Notifications (optional)
ENABLE_TELEGRAM=false
TELEGRAM_BOT_TOKEN=
TELEGRAM_CHAT_ID=
```

### 3. Set Up Database

```bash
# Create PostgreSQL database
psql -U postgres -f create_database.sql

# Run schema + seed data
psql -U postgres -d dpdc_ami -f database_setup.sql
```

### 4. Run Development Servers

```bash
# Backend (from /backend)
npm run dev

# Frontend (from /frontend)
npm run dev
```

Frontend available at `http://localhost:5173`, API at `http://localhost:3000`.

### Windows Quick Start

```powershell
.\quick-start.ps1
```

## API Endpoints

| Route Group | Base Path | Description |
|------------|-----------|-------------|
| Auth | `/api/auth` | Login, logout, token refresh, profile |
| Users | `/api/users` | User CRUD, role assignment |
| Queries | `/api/queries` | Oracle query execution + history |
| Reports | `/api/reports` | RC/DC, NOCS, meter-wise, customer billing |
| RC Progress | `/api/rc-progress` | RC in-progress summary and detail |
| AMI Operational | `/api/ami-operational` | Device status, command analytics |
| CRP/CPC | `/api/crp-cpc` | Customer list, search, export |
| Bill Stop | `/api/bill-stop` | Stop/resume billing, audit, analysis |
| Page Access | `/api/page-access` | Dynamic role-based page config |
| Activity | `/api/activity` | User activity logs |
| Health | `/api/health` | API + Oracle pool health status |

See [`docs/API.md`](docs/API.md) for full documentation.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for production deployment with PM2 + Nginx.

Key deployment files in `/deployment/`:
- `nginx.conf` — Nginx reverse proxy config
- `ecosystem.config.js` — PM2 process config
- `setup-vm.sh` — VM provisioning script
- `backup-database.sh` — PostgreSQL backup script

## Security

- JWT authentication with role-based access control (RBAC)
- Dynamic page-level permissions per role
- Helmet with strict CSP + iframe embedding blocked
- Oracle query validation (SELECT/WITH only, DML blocked)
- Rate limiting: 100 req/15min (API), 5 req/15min (auth)
- CORS restricted to `ALLOWED_ORIGINS`

## License

Private — OTBL. All rights reserved.
