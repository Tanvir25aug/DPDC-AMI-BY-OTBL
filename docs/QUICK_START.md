# Quick Start Guide - DPDC AMI by OTBL

Get the application running on your local machine for development.

## Prerequisites

- Node.js 20 LTS or higher
- PostgreSQL 16 or higher
- Oracle Instant Client (for Oracle database connection)
- Git

## Step 1: Clone Repository

```bash
git clone <repository-url>
cd "DPDC AMI By OTBL"
```

## Step 2: Setup PostgreSQL

### Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt install postgresql postgresql-contrib
```

**macOS:**
```bash
brew install postgresql@16
brew services start postgresql@16
```

**Windows:**
Download installer from: https://www.postgresql.org/download/windows/

### Create Database

```bash
# Access PostgreSQL
sudo -u postgres psql  # Linux/macOS
psql -U postgres       # Windows

# Create database and user
CREATE DATABASE dpdc_ami_dev;
CREATE USER dev_user WITH PASSWORD 'dev_password_123';
GRANT ALL PRIVILEGES ON DATABASE dpdc_ami_dev TO dev_user;
\c dpdc_ami_dev
GRANT ALL ON SCHEMA public TO dev_user;
\q
```

## Step 3: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.development

# Edit .env.development with your credentials
nano .env.development  # or use your preferred editor
```

**Minimal `.env.development` configuration:**

```env
NODE_ENV=development
PORT=3000

POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=dpdc_ami_dev
POSTGRES_USER=dev_user
POSTGRES_PASSWORD=dev_password_123

DB_USER=your_oracle_user
DB_PASSWORD="your_oracle_password"
DB_HOST=oracle_host
DB_PORT=1521
DB_SERVICE_NAME=your_service_name
DB_CONNECT_STRING=oracle_host:1521/your_service_name

JWT_SECRET=dev_secret_key_for_testing
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=dev_refresh_secret
REFRESH_TOKEN_EXPIRES_IN=7d

ALLOWED_ORIGINS=http://localhost:5173

LOG_LEVEL=debug
```

### Run Migrations and Seeds

```bash
# Run database migrations
npm run migrate

# Seed initial data (creates admin user)
npm run seed
```

### Start Backend Server

```bash
npm run dev
```

Backend will run on: http://localhost:3000

## Step 4: Setup Frontend

Open a new terminal:

```bash
cd frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.development

# Edit .env.development
nano .env.development
```

**`.env.development` configuration:**

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_APP_NAME=DPDC AMI by OTBL
```

### Start Frontend Development Server

```bash
npm run dev
```

Frontend will run on: http://localhost:5173

## Step 5: Access the Application

1. Open browser: http://localhost:5173
2. Login with default credentials:
   - **Username:** `admin`
   - **Password:** `Admin@123`

## Project Structure

```
DPDC AMI By OTBL/
├── backend/               # Express.js API
│   ├── src/
│   │   ├── config/       # Database and app configuration
│   │   ├── controllers/  # Route controllers
│   │   ├── middleware/   # Auth, validation, error handling
│   │   ├── models/       # Sequelize models
│   │   ├── routes/       # API routes
│   │   ├── services/     # Business logic
│   │   └── server.js     # Entry point
│   └── database/
│       ├── migrations/   # Database migrations
│       └── seeders/      # Seed data
│
├── frontend/             # Vue.js SPA
│   ├── src/
│   │   ├── components/   # Reusable components
│   │   ├── views/        # Page components
│   │   ├── stores/       # Pinia stores
│   │   ├── router/       # Vue Router
│   │   ├── services/     # API service
│   │   └── App.vue       # Root component
│   └── public/
│
├── deployment/           # Deployment configs
└── docs/                # Documentation
```

## Available Scripts

### Backend

```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run migrate      # Run database migrations
npm run migrate:undo # Undo last migration
npm run seed         # Run database seeders
```

### Frontend

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token
- `GET /api/auth/profile` - Get current user
- `POST /api/auth/change-password` - Change password

### Users (Admin only)
- `GET /api/users` - List all users
- `POST /api/users` - Create new user
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user
- `GET /api/users/roles` - Get all roles

### Queries
- `POST /api/queries/execute` - Execute Oracle query
- `POST /api/queries/execute-export` - Execute and export
- `POST /api/queries/export` - Export data
- `GET /api/queries/history` - Query history
- `GET /api/queries/statistics` - Query statistics

## Development Tips

### Hot Reload

Both frontend and backend support hot reload:
- Backend: Uses nodemon (auto-restarts on file changes)
- Frontend: Uses Vite HMR (instant updates)

### Database Changes

After modifying models:

```bash
# Create new migration
cd backend
npx sequelize-cli migration:generate --name description-of-change

# Edit the migration file in database/migrations/

# Run migration
npm run migrate
```

### Testing API with curl

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Admin@123"}'

# Use token in requests
TOKEN="your_jwt_token_here"
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### Environment Variables

Development uses:
- Backend: `.env.development`
- Frontend: `.env.development`

Production uses:
- Backend: `.env.production`
- Frontend: `.env.production`

**Never commit these files to Git!** (Already in .gitignore)

## Troubleshooting

### Port already in use

```bash
# Find process using port 3000 (backend)
lsof -i :3000
kill -9 <PID>

# Find process using port 5173 (frontend)
lsof -i :5173
kill -9 <PID>
```

### Database connection error

```bash
# Verify PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list               # macOS

# Test connection
psql -U dev_user -d dpdc_ami_dev -h localhost
```

### Oracle connection error

```bash
# Verify Oracle Instant Client
sqlplus -version

# Test Oracle connection
sqlplus user/pass@host:1521/service
```

### Migration errors

```bash
# Check migration status
npx sequelize-cli db:migrate:status

# Undo last migration
npm run migrate:undo

# Undo all migrations
npx sequelize-cli db:migrate:undo:all
```

## Next Steps

1. **Explore the Code:** Start with `backend/src/server.js` and `frontend/src/main.js`
2. **Read the API Docs:** Check `docs/API.md` for detailed endpoint documentation
3. **Understand the Database:** Review `docs/DATABASE.md` for schema details
4. **Learn Deployment:** See `docs/DEPLOYMENT.md` for production setup

## Getting Help

- Check existing documentation in the `docs/` folder
- Review code comments
- Contact the development team

Happy coding!
