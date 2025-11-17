# DPDC AMI by OTBL

Oracle Database Reporting System with User Management

## Overview

This application allows users to execute queries against an Oracle database and generate reports with various export formats. It includes role-based access control and user management.

## Tech Stack

### Backend
- Node.js 20 LTS
- Express.js
- PostgreSQL (User Management)
- Oracle Database (Reporting Data)
- JWT Authentication
- Sequelize ORM

### Frontend
- Vue 3
- Vite
- Vue Router
- Pinia (State Management)
- Axios

## Project Structure

```
DPDC AMI By OTBL/
├── backend/           # Express API server
├── frontend/          # Vue.js application
├── deployment/        # Deployment configurations
└── docs/             # Documentation
```

## Getting Started

### Prerequisites

- Node.js 20 LTS or higher
- PostgreSQL 16
- Oracle Instant Client
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd "DPDC AMI By OTBL"
   ```

2. **Setup Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env.development
   # Edit .env.development with your database credentials
   npm run migrate
   npm run seed
   npm run dev
   ```

3. **Setup Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env.development
   npm run dev
   ```

4. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3000

### Default Admin Credentials

- Username: `admin`
- Password: `Admin@123`

**⚠️ Change this password immediately after first login!**

## Features

- 🔐 User authentication with JWT
- 👥 Role-based access control (Admin, Power User, User, Viewer)
- 📊 Dynamic query execution on Oracle database
- 📈 Report generation and visualization
- 📥 Export reports (CSV, Excel, PDF)
- 🔍 Query history and audit logs
- ⚙️ Admin panel for user management

## Environment Configuration

See `.env.example` files in backend and frontend directories.

## Deployment

See [Deployment Guide](docs/DEPLOYMENT.md) for production setup instructions.

## Documentation

- [Backend API Documentation](docs/API.md)
- [Frontend Guide](docs/FRONTEND.md)
- [Database Schema](docs/DATABASE.md)
- [Deployment Guide](docs/DEPLOYMENT.md)

## License

Proprietary - DPDC AMI by OTBL

## Support

For issues and questions, please contact the development team.
