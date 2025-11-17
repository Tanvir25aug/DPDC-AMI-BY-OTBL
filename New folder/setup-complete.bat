@echo off
echo ========================================
echo DPDC AMI - Complete Setup
echo ========================================
echo.
echo This script will:
echo 1. Install backend dependencies
echo 2. Setup environment files
echo 3. Run database migrations
echo 4. Create admin user
echo.
echo Make sure PostgreSQL database is created first!
echo (Run check-database.ps1 if you haven't)
echo.
pause

echo.
echo ========================================
echo Step 1: Installing Backend
echo ========================================
echo.

cd backend

if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo Installing dependencies...
npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Backend installation failed!
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 2: Creating Environment Files
echo ========================================
echo.

if not exist .env.development (
    copy .env.example .env.development
    echo [OK] Created .env.development
) else (
    echo [OK] .env.development already exists
)

echo.
echo ========================================
echo Step 3: Running Database Migrations
echo ========================================
echo.

call npm run migrate

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Database migrations failed!
    echo.
    echo Make sure PostgreSQL database is set up:
    echo - Database: dpdc_ami_dev
    echo - User: dev_user
    echo - Password: admin
    echo.
    pause
    exit /b 1
)

echo.
echo ========================================
echo Step 4: Creating Admin User
echo ========================================
echo.

call npm run seed

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [WARNING] Seeding may have failed or already completed.
    echo This is okay if admin user already exists.
    echo.
)

cd ..

echo.
echo ========================================
echo Backend Setup Complete!
echo ========================================
echo.
echo Now setting up frontend...
echo.
pause

echo.
echo ========================================
echo Step 5: Installing Frontend
echo ========================================
echo.

cd frontend

if exist node_modules rmdir /s /q node_modules
if exist package-lock.json del package-lock.json

echo Installing dependencies...
npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo [ERROR] Frontend installation failed!
    pause
    exit /b 1
)

if not exist .env.development (
    copy .env.example .env.development
    echo [OK] Created .env.development
) else (
    echo [OK] .env.development already exists
)

cd ..

echo.
echo ========================================
echo Complete Setup Finished!
echo ========================================
echo.
echo Your application is ready!
echo.
echo To start the application:
echo.
echo Terminal 1 (Backend):
echo   cd backend
echo   npm run dev
echo.
echo Terminal 2 (Frontend):
echo   cd frontend
echo   npm run dev
echo.
echo Then open: http://localhost:5173
echo.
echo Login with:
echo   Username: admin
echo   Password: Admin@123
echo.
echo NOTE: Oracle features are optional.
echo You will see a warning - this is normal.
echo.
pause
