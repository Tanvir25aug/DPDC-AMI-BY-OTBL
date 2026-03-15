@echo off
echo ============================================
echo   DPDC AMI Development Setup
echo ============================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed!
    echo Please install Node.js 20.x or higher from https://nodejs.org/
    pause
    exit /b 1
)

echo [OK] Node.js found:
node --version
echo.

REM Check if PostgreSQL is accessible
where psql >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARNING] PostgreSQL psql command not found in PATH
    echo Make sure PostgreSQL is installed and running
    echo.
)

echo ============================================
echo   Step 1: Setting up PostgreSQL Database
echo ============================================
echo.
echo Please run the following SQL as postgres superuser:
echo.
echo   CREATE USER dev_user WITH PASSWORD 'admin';
echo   CREATE DATABASE dpdc_ami_dev OWNER dev_user;
echo   GRANT ALL PRIVILEGES ON DATABASE dpdc_ami_dev TO dev_user;
echo.
echo OR run: psql -U postgres -f database_setup.sql
echo.
pause

echo.
echo ============================================
echo   Step 2: Installing Backend Dependencies
echo ============================================
echo.
cd backend
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Step 3: Creating Backend Environment File
echo ============================================
echo.
if not exist ".env.development" (
    copy .env.example .env.development
    echo [OK] Created .env.development
) else (
    echo [OK] .env.development already exists
)

echo.
echo Creating logs directory...
if not exist "logs" mkdir logs
echo [OK] Logs directory ready

echo.
echo ============================================
echo   Step 4: Setting Up Database Tables
echo ============================================
echo.
call npm run db:setup
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Database setup failed
    echo Make sure PostgreSQL is running and the database exists
    pause
    exit /b 1
)

cd ..

echo.
echo ============================================
echo   Step 5: Installing Frontend Dependencies
echo ============================================
echo.
cd frontend
call npm install
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Step 6: Creating Frontend Environment File
echo ============================================
echo.
if not exist ".env.development" (
    copy .env.example .env.development
    echo [OK] Created .env.development
) else (
    echo [OK] .env.development already exists
)

cd ..

echo.
echo ============================================
echo   Setup Complete!
echo ============================================
echo.
echo   To start the application:
echo.
echo   Terminal 1 (Backend):
echo     cd backend
echo     npm run dev
echo.
echo   Terminal 2 (Frontend):
echo     cd frontend
echo     npm run dev
echo.
echo   Then open http://localhost:5173
echo.
echo   Default Login:
echo     Username: admin
echo     Password: Admin@123
echo.
echo ============================================
echo.
pause
