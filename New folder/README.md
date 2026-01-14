# DPDC AMI RC/DC Dashboard

Advanced Metering Infrastructure (AMI) Remote Connect/Disconnect monitoring system for Dhaka Power Distribution Company Limited (DPDC).

![DPDC AMI Dashboard](https://img.shields.io/badge/Status-Active-success)
![Vue.js](https://img.shields.io/badge/Vue.js-3.x-brightgreen)
![Node.js](https://img.shields.io/badge/Node.js-16+-blue)
![License](https://img.shields.io/badge/License-Proprietary-red)

---

## Overview

The DPDC AMI RC/DC Dashboard is a comprehensive web-based monitoring system that provides real-time insights into remote connect and disconnect operations across the DPDC network. It features advanced reporting, filtering, and export capabilities to streamline operational efficiency.

### Key Features

- **Real-time Monitoring** - Live dashboard with 5-minute auto-refresh
- **Progressive Loading** - Fast initial load with background data fetching
- **NOCS-wise Breakdown** - Detailed analytics per network operation control station
- **Advanced Filtering** - 6 comprehensive filter options for meter data
- **PDF Reports** - Professional reports with company branding
- **Excel Export** - Export filtered data to Excel spreadsheets
- **Role-based Access** - Multi-level user permissions (Admin, Manager, Operator)
- **Dual Database** - PostgreSQL for user management, Oracle for AMI data

---

## Screenshots

### Dashboard View
- Daily connect/disconnect statistics
- Success rate metrics
- Trending indicators

### RC/DC Monitor
- NOCS-wise command breakdown
- Real-time status updates
- Quick actions (View/Download)

### Meter-wise Report
- Comprehensive filtering
- Calculated meter status
- Pagination and exports

---

## Technology Stack

### Frontend
- **Vue 3** - Progressive JavaScript framework
- **Vite** - Next-generation frontend tooling
- **Tailwind CSS** - Utility-first CSS framework
- **Pinia** - State management
- **Vue Router** - Client-side routing
- **Axios** - HTTP client
- **XLSX** - Excel export functionality
- **Heroicons** - Beautiful SVG icons

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **Sequelize** - PostgreSQL ORM
- **Oracle DB** - Database driver
- **PDFKit** - PDF generation
- **Socket.IO** - Real-time communication
- **Passport.js** - Authentication middleware
- **JWT** - Secure token-based auth

### Databases
- **PostgreSQL** - User management and authentication
- **Oracle Database** - AMI data (read-only)

---

## Quick Start

### Prerequisites

- Node.js v16+
- PostgreSQL v12+
- Oracle Database access
- Git

### Clone Repository

```bash
git clone https://github.com/Tanvir25aug/DPDC-AMI-BY-OTBL.git
cd DPDC-AMI-BY-OTBL
```

### Backend Setup

```bash
cd backend
npm install
copy .env.example .env
# Edit .env with your database credentials
npm run migrate
npm run seed
npm run dev
```

Backend runs on: **http://localhost:5000**

### Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
# Edit .env with API URL
npm run dev
```

Frontend runs on: **http://localhost:5173**

### Default Login

```
Username: admin
Password: admin123
```

**⚠️ Change password after first login!**

---

## Complete Setup Guide

For detailed setup instructions for team members, see:

**[TEAM_SETUP_GUIDE.md](./TEAM_SETUP_GUIDE.md)**

This guide includes:
- Step-by-step installation
- Database configuration
- Common troubleshooting
- Environment setup
- Production deployment

---

## Project Structure

```
DPDC-AMI-BY-OTBL/
├── backend/              # Node.js Express API
│   ├── src/
│   │   ├── config/      # Configuration files
│   │   ├── controllers/ # Route controllers
│   │   ├── middleware/  # Express middleware
│   │   ├── models/      # Sequelize models
│   │   ├── routes/      # API routes
│   │   └── services/    # Business logic
│   ├── database/        # Migrations and seeders
│   └── reports/         # SQL query files
│
├── frontend/             # Vue 3 application
│   ├── src/
│   │   ├── components/  # Vue components
│   │   ├── views/       # Page views
│   │   ├── stores/      # Pinia stores
│   │   ├── services/    # API services
│   │   └── router/      # Vue Router
│   └── public/          # Static assets
│
├── logo/                 # Company logos
├── docs/                 # Documentation
└── deployment/           # Deployment scripts
```

---

## Features in Detail

### 1. Dashboard
- **Daily Statistics**: Total RC/DC commands executed
- **Success Rates**: RC, DC, and overall success percentages
- **Status Breakdown**: Completed, In Progress, Discarded counts
- **Auto-refresh**: Updates every 5 minutes via Socket.IO

### 2. RC/DC Monitor
- **Progressive Loading**: Stats load immediately, NOCS data loads in background
- **NOCS Breakdown**: Command statistics per network station
- **Modal Details**: Click "View" to see meter-wise data
- **PDF Export**: Download professional reports with logos

### 3. Meter-wise Report
- **Advanced Filters**:
  - NOCS Name
  - Meter Number (MSN)
  - Customer ID
  - Command Type (RC/DC)
  - Command Status
  - Calculated Meter Status
- **Excel Export**: Export filtered results
- **Pagination**: 25 rows per page
- **Summary Stats**: Dynamic cards showing filtered totals

### 4. Query History
- Track all executed queries
- View query results
- User activity logging

### 5. Admin Panel
- User management (CRUD operations)
- Role assignment
- Permission control
- Password management

---

## API Documentation

### Authentication Endpoints

```
POST   /api/auth/login      - User login
POST   /api/auth/logout     - User logout
GET    /api/auth/me         - Get current user
```

### Report Endpoints

```
GET    /api/reports/daily_connect_disconnect_count      - Dashboard stats
GET    /api/reports/rc_dc_nocs_aggregated               - NOCS breakdown
GET    /api/reports/meter_wise_commands_by_nocs         - Meter details
GET    /api/reports/download_nocs_report_pdf            - PDF download
```

### User Management (Admin only)

```
GET    /api/users           - List all users
POST   /api/users           - Create user
PUT    /api/users/:id       - Update user
DELETE /api/users/:id       - Delete user
```

For complete API documentation, see [docs/API.md](./docs/API.md)

---

## User Roles

| Role | Permissions |
|------|------------|
| **Admin** | Full system access, user management, all reports |
| **Manager** | View all reports, export data, no user management |
| **Operator** | View dashboards, limited report access, no exports |

---

## Deployment

### Production Build

**Frontend:**
```bash
cd frontend
npm run build
# Deploy 'dist' folder to web server
```

**Backend:**
```bash
cd backend
# Set NODE_ENV=production in .env
# Use PM2 or similar process manager
pm2 start src/server.js --name dpdc-ami-backend
```

For complete deployment guide, see [docs/DEPLOYMENT.md](./docs/DEPLOYMENT.md)

---

## Security

- **Authentication**: JWT-based token authentication
- **Password Hashing**: bcrypt with salt rounds
- **Role-based Access Control**: Permission-based route protection
- **CORS Protection**: Configured allowed origins
- **Rate Limiting**: API request throttling
- **SQL Injection Prevention**: Parameterized queries
- **XSS Protection**: Input sanitization

---

## Performance Optimizations

- **Progressive Loading**: Fast perceived load times
- **Database Indexing**: Optimized Oracle queries with partition pruning
- **Connection Pooling**: Reusable database connections
- **Lazy Loading**: Vue component code splitting
- **Caching**: 15-minute cache for repeated queries
- **Socket.IO**: Efficient real-time updates

---

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Edge (latest)
- Safari (latest)

---

## Contributing

This is a proprietary project for DPDC. Internal team contributions should follow:

1. Create feature branch from `main`
2. Make changes with clear commit messages
3. Test thoroughly
4. Create pull request for review
5. Get approval before merging

---

## Troubleshooting

### Common Issues

**Backend won't start:**
- Check PostgreSQL is running
- Verify `.env` credentials
- Run `npm install` again

**Frontend shows errors:**
- Verify backend is running on port 5000
- Check `VITE_API_URL` in `.env`
- Clear browser cache

**Oracle connection fails:**
- Verify Oracle credentials
- Check Oracle Instant Client installation
- Test connection with SQL*Plus

**PDF generation fails:**
- Check logo files exist in `/logo` folder
- Verify PDFKit installation
- Check file permissions

For more troubleshooting, see [TEAM_SETUP_GUIDE.md](./TEAM_SETUP_GUIDE.md)

---

## License

Proprietary - Dhaka Power Distribution Company Limited (DPDC)

All rights reserved. This software is the property of DPDC and may not be distributed, modified, or used outside of authorized DPDC operations.

---

## Contact

**Developed By:** OTBL (Optimization Technologies Bangladesh Limited)

**For Support:**
- Technical Issues: Contact your system administrator
- Feature Requests: Submit through proper channels
- Security Concerns: Report immediately to IT security team

---

## Acknowledgments

- **DPDC** - Dhaka Power Distribution Company Limited
- **OTBL** - Optimization Technologies Bangladesh Limited
- Built with Vue.js and Express.js
- Powered by Oracle Database

---

**Version:** 1.0.0
**Last Updated:** November 17, 2025
**Status:** Production Ready
