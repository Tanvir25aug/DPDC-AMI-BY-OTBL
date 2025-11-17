@echo off
echo ========================================
echo DPDC AMI - Backend Installation
echo ========================================
echo.

cd backend

echo Step 1: Cleaning previous installation...
if exist node_modules (
    echo Removing old node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
)

echo.
echo Step 2: Installing dependencies...
echo This may take a few minutes...
echo.

npm install

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Installation Successful!
    echo ========================================
    echo.
    echo Step 3: Creating environment file...

    if not exist .env.development (
        copy .env.example .env.development
        echo Environment file created: .env.development
    ) else (
        echo Environment file already exists.
    )

    echo.
    echo ========================================
    echo Next Steps
    echo ========================================
    echo.
    echo Run these commands:
    echo.
    echo 1. npm run migrate       (Create database tables)
    echo 2. npm run seed          (Create admin user)
    echo 3. npm run dev           (Start server)
    echo.
    echo NOTE: You will see a warning about Oracle.
    echo This is normal - Oracle features are optional.
    echo.
) else (
    echo.
    echo ========================================
    echo Installation Failed!
    echo ========================================
    echo.
    echo Please check the error messages above.
    echo.
    echo Common solutions:
    echo 1. Make sure you have Node.js 20+ installed
    echo 2. Try running as Administrator
    echo 3. Check your internet connection
    echo.
)

echo.
pause
