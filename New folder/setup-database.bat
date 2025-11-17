@echo off
echo ========================================
echo DPDC AMI - PostgreSQL Database Setup
echo ========================================
echo.
echo This will create:
echo - Database: dpdc_ami_dev
echo - User: dev_user
echo - Password: admin
echo.
echo Please enter your PostgreSQL superuser password when prompted.
echo (Your PostgreSQL superuser password is: admin)
echo.
pause

echo.
echo Running database setup...
echo.

psql -U postgres -f setup-database.sql

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. cd backend
echo 2. npm install
echo 3. copy .env.example .env.development
echo 4. npm run migrate
echo 5. npm run seed
echo.
pause
