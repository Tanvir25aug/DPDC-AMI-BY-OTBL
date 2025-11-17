@echo off
echo ========================================
echo DPDC AMI - PostgreSQL Auto Setup
echo ========================================
echo.

REM Try to find PostgreSQL installation
SET PSQL_PATH=""

echo Looking for PostgreSQL installation...
echo.

REM Check common installation paths
if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" (
    SET PSQL_PATH="C:\Program Files\PostgreSQL\16\bin\psql.exe"
    echo Found: PostgreSQL 16
)
if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" (
    SET PSQL_PATH="C:\Program Files\PostgreSQL\15\bin\psql.exe"
    echo Found: PostgreSQL 15
)
if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" (
    SET PSQL_PATH="C:\Program Files\PostgreSQL\14\bin\psql.exe"
    echo Found: PostgreSQL 14
)
if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" (
    SET PSQL_PATH="C:\Program Files\PostgreSQL\13\bin\psql.exe"
    echo Found: PostgreSQL 13
)
if exist "C:\Program Files\PostgreSQL\12\bin\psql.exe" (
    SET PSQL_PATH="C:\Program Files\PostgreSQL\12\bin\psql.exe"
    echo Found: PostgreSQL 12
)

REM Check 32-bit program files
if exist "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe" (
    SET PSQL_PATH="C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe"
    echo Found: PostgreSQL 16 (x86)
)
if exist "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe" (
    SET PSQL_PATH="C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
    echo Found: PostgreSQL 15 (x86)
)

if %PSQL_PATH%=="" (
    echo.
    echo ERROR: PostgreSQL not found in common locations!
    echo.
    echo Please install PostgreSQL from:
    echo https://www.postgresql.org/download/windows/
    echo.
    echo Or manually locate psql.exe and add to PATH.
    echo.
    pause
    exit /b 1
)

echo.
echo Using: %PSQL_PATH%
echo.
echo This will create:
echo - Database: dpdc_ami_dev
echo - User: dev_user
echo - Password: admin
echo.
echo Please enter your PostgreSQL superuser password when prompted.
echo (Default password is usually: admin or postgres)
echo.
pause

echo.
echo Running database setup...
echo.

%PSQL_PATH% -U postgres -f setup-database.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Database Setup Complete!
    echo ========================================
    echo.
    echo Database created successfully!
    echo.
    echo Connection details:
    echo - Database: dpdc_ami_dev
    echo - User: dev_user
    echo - Password: admin
    echo - Host: localhost
    echo - Port: 5432
    echo.
    echo Next steps:
    echo 1. cd backend
    echo 2. npm install
    echo 3. copy .env.example .env.development
    echo 4. npm run migrate
    echo 5. npm run seed
    echo 6. npm run dev
    echo.
) else (
    echo.
    echo ========================================
    echo Setup Failed!
    echo ========================================
    echo.
    echo Common issues:
    echo 1. Wrong PostgreSQL password
    echo 2. PostgreSQL service not running
    echo.
    echo Try:
    echo - Check PostgreSQL service is running
    echo - Verify your postgres user password
    echo.
)

pause
