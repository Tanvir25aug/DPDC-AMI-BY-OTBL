@echo off
echo ========================================
echo DPDC AMI - Database Verification
echo ========================================
echo.

REM Find PostgreSQL
SET PSQL_PATH=""

if exist "C:\Program Files\PostgreSQL\16\bin\psql.exe" SET PSQL_PATH="C:\Program Files\PostgreSQL\16\bin\psql.exe"
if exist "C:\Program Files\PostgreSQL\15\bin\psql.exe" SET PSQL_PATH="C:\Program Files\PostgreSQL\15\bin\psql.exe"
if exist "C:\Program Files\PostgreSQL\14\bin\psql.exe" SET PSQL_PATH="C:\Program Files\PostgreSQL\14\bin\psql.exe"
if exist "C:\Program Files\PostgreSQL\13\bin\psql.exe" SET PSQL_PATH="C:\Program Files\PostgreSQL\13\bin\psql.exe"
if exist "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe" SET PSQL_PATH="C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe"
if exist "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe" SET PSQL_PATH="C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"

if %PSQL_PATH%=="" (
    echo [ERROR] PostgreSQL not found!
    echo.
    echo Please install PostgreSQL or use pgAdmin to set up the database.
    echo.
    pause
    exit /b 1
)

echo [OK] PostgreSQL found: %PSQL_PATH%
echo.
echo Checking database setup...
echo Please enter your PostgreSQL password when prompted.
echo.
pause

echo.
echo ========================================
echo Running verification...
echo ========================================
echo.

%PSQL_PATH% -U postgres -c "SELECT version();" > nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Cannot connect to PostgreSQL!
    echo.
    echo Possible issues:
    echo - Wrong password
    echo - PostgreSQL service not running
    echo.
    echo Please check:
    echo 1. PostgreSQL service is running
    echo 2. Your postgres user password
    echo.
    pause
    exit /b 1
)

echo [OK] PostgreSQL connection successful
echo.

REM Create verification SQL script
echo SELECT 'Checking database...' as status; > verify-temp.sql
echo SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_database WHERE datname = 'dpdc_ami_dev') THEN '[OK] Database dpdc_ami_dev exists' ELSE '[MISSING] Database dpdc_ami_dev not found' END as result; >> verify-temp.sql
echo SELECT 'Checking user...' as status; >> verify-temp.sql
echo SELECT CASE WHEN EXISTS (SELECT 1 FROM pg_user WHERE usename = 'dev_user') THEN '[OK] User dev_user exists' ELSE '[MISSING] User dev_user not found' END as result; >> verify-temp.sql

echo Running checks...
%PSQL_PATH% -U postgres -f verify-temp.sql

echo.
echo ========================================
echo Attempting to fix/create setup...
echo ========================================
echo.

%PSQL_PATH% -U postgres -f setup-database.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Database Setup Complete!
    echo ========================================
    echo.
    echo Connection details:
    echo - Database: dpdc_ami_dev
    echo - User: dev_user
    echo - Password: admin
    echo - Host: localhost
    echo - Port: 5432
    echo.

    REM Test connection with dev_user
    echo Testing connection with dev_user...
    echo.

    echo \q > test-conn.sql
    %PSQL_PATH% -U dev_user -d dpdc_ami_dev -h localhost -w -f test-conn.sql > nul 2>&1

    if %ERRORLEVEL% EQU 0 (
        echo [OK] Successfully connected as dev_user!
        echo.
        echo Database is ready to use!
    ) else (
        echo [WARNING] Could not auto-test connection.
        echo This might be due to password prompt requirements.
        echo.
        echo To manually test, run:
        echo psql -U dev_user -d dpdc_ami_dev -h localhost
        echo Password: admin
    )

    del test-conn.sql > nul 2>&1
) else (
    echo.
    echo [ERROR] Setup failed!
    echo.
    echo Please try using pgAdmin instead:
    echo 1. Open pgAdmin 4
    echo 2. Create database: dpdc_ami_dev
    echo 3. Create user: dev_user with password: admin
    echo.
)

del verify-temp.sql > nul 2>&1

echo.
echo ========================================
echo Next Steps
echo ========================================
echo.
echo If database setup was successful, run:
echo.
echo 1. cd backend
echo 2. npm install
echo 3. copy .env.example .env.development
echo 4. npm run migrate
echo 5. npm run seed
echo 6. npm run dev
echo.
pause
