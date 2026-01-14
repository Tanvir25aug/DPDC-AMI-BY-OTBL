@echo off
REM ========================================
REM Production Deployment Script
REM Transfers updated files to production server
REM ========================================

echo.
echo ========================================
echo DPDC AMI - Production Deployment
echo ========================================
echo.

set SERVER_IP=172.18.42.200
set SERVER_USER=oculin
set SERVER_PATH=/home/oculin/DPDC-AMI-BY-OTBL

echo Creating deployment package...
echo.

REM Create temporary deployment directory
if exist deploy-temp rmdir /s /q deploy-temp
mkdir deploy-temp
mkdir deploy-temp\backend
mkdir deploy-temp\backend\src
mkdir deploy-temp\backend\src\services
mkdir deploy-temp\backend\src\schedulers
mkdir deploy-temp\backend\src\config
mkdir deploy-temp\backend\src\controllers
mkdir deploy-temp\backend\src\routes
mkdir deploy-temp\backend\migrations
mkdir deploy-temp\frontend
mkdir deploy-temp\frontend\src
mkdir deploy-temp\frontend\src\views
mkdir deploy-temp\frontend\src\services

REM Copy updated backend files
echo Copying backend files...
copy backend\src\services\batch-monitoring.service.js deploy-temp\backend\src\services\
copy backend\src\services\teams.service.js deploy-temp\backend\src\services\
copy backend\src\schedulers\batch-monitoring.scheduler.js deploy-temp\backend\src\schedulers\
copy backend\src\schedulers\teams-reports.scheduler.js deploy-temp\backend\src\schedulers\
copy backend\src\config\teams-webhooks.js deploy-temp\backend\src\config\
copy backend\src\controllers\ami-operational.controller.js deploy-temp\backend\src\controllers\
copy backend\src\routes\ami-operational.routes.js deploy-temp\backend\src\routes\
copy backend\migrations\create_batch_monitoring_history.sql deploy-temp\backend\migrations\
copy backend\src\server.js deploy-temp\backend\src\
copy backend\package.json deploy-temp\backend\
copy backend\package-lock.json deploy-temp\backend\
copy backend\TEST_TEAMS_REPORTS.js deploy-temp\backend\
copy backend\SETUP_MONITORING_TABLE.js deploy-temp\backend\
copy backend\CHECK_STATUS_VALUES.js deploy-temp\backend\
copy backend\CHECK_TABLE_STRUCTURE.js deploy-temp\backend\
copy backend\FIND_ORACLE_TABLES.js deploy-temp\backend\

REM Copy updated frontend files
echo Copying frontend files...
copy frontend\src\views\AMIOperationalView.vue deploy-temp\frontend\src\views\
copy frontend\src\services\ami-operational.api.js deploy-temp\frontend\src\services\

REM Copy documentation
echo Copying documentation...
copy PRODUCTION_DEPLOYMENT_GUIDE.md deploy-temp\

echo.
echo ========================================
echo Deployment package created in: deploy-temp\
echo ========================================
echo.
echo NEXT STEPS:
echo.
echo 1. Use WinSCP or SCP to upload the 'deploy-temp' folder to the server
echo    Server: %SERVER_IP%
echo    User: %SERVER_USER%
echo    Path: %SERVER_PATH%
echo.
echo 2. Or use this SCP command:
echo    scp -r deploy-temp/* %SERVER_USER%@%SERVER_IP%:%SERVER_PATH%/
echo.
echo 3. Then SSH into the server and run:
echo    cd %SERVER_PATH%/backend
echo    npm install
echo    node SETUP_MONITORING_TABLE.js
echo    pm2 restart dpdc-ami-backend
echo.
echo ========================================
pause
