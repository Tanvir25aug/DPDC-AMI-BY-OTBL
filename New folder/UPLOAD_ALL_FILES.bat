@echo off
echo ========================================
echo Uploading ALL files to production server
echo ========================================
echo.
echo Server: 172.18.42.200
echo User: oculin
echo.

cd /d "D:\DPDC AMI By OTBL"

echo Uploading backend services...
scp backend\src\services\batch-monitoring.service.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/services/
scp backend\src\services\teams.service.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/services/

echo Uploading schedulers...
scp backend\src\schedulers\batch-monitoring.scheduler.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/schedulers/
scp backend\src\schedulers\teams-reports.scheduler.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/schedulers/

echo Uploading config...
scp backend\src\config\teams-webhooks.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/config/

echo Uploading controllers and routes...
scp backend\src\controllers\ami-operational.controller.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/controllers/
scp backend\src\routes\ami-operational.routes.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/routes/

echo Uploading migrations...
scp backend\migrations\create_batch_monitoring_history.sql oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/migrations/

echo Uploading server.js...
scp backend\src\server.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/src/

echo Uploading package files...
scp backend\package.json oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/
scp backend\package-lock.json oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/

echo Uploading test and setup scripts...
scp backend\TEST_TEAMS_REPORTS.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/
scp backend\SETUP_MONITORING_TABLE.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/backend/

echo Uploading frontend files...
scp frontend\src\views\AMIOperationalView.vue oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/frontend/src/views/
scp frontend\src\services\ami-operational.api.js oculin@172.18.42.200:~/DPDC-AMI-BY-OTBL/frontend/src/services/

echo Uploading deployment script...
scp deploy_on_server.sh oculin@172.18.42.200:~/

echo.
echo ========================================
echo Upload complete!
echo ========================================
echo.
echo Next steps:
echo 1. SSH into server: ssh oculin@172.18.42.200
echo 2. Run deployment: chmod +x ~/deploy_on_server.sh ^&^& ~/deploy_on_server.sh
echo.
pause
