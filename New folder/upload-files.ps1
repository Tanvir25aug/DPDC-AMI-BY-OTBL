# PowerShell Upload Script
$server = "oculin@172.18.42.200"
$basePath = "D:\DPDC AMI By OTBL"
$remotePath = "/home/oculin/DPDC-AMI-BY-OTBL"

Write-Host "Uploading files to production server..." -ForegroundColor Green
Write-Host "You will be prompted for password multiple times" -ForegroundColor Yellow
Write-Host ""

# Backend files
Write-Host "Uploading backend files..." -ForegroundColor Cyan
scp "$basePath\backend\src\services\batch-monitoring.service.js" "${server}:${remotePath}/backend/src/services/"
scp "$basePath\backend\src\services\teams.service.js" "${server}:${remotePath}/backend/src/services/"
scp "$basePath\backend\src\schedulers\batch-monitoring.scheduler.js" "${server}:${remotePath}/backend/src/schedulers/"
scp "$basePath\backend\src\schedulers\teams-reports.scheduler.js" "${server}:${remotePath}/backend/src/schedulers/"
scp "$basePath\backend\src\config\teams-webhooks.js" "${server}:${remotePath}/backend/src/config/"
scp "$basePath\backend\src\controllers\ami-operational.controller.js" "${server}:${remotePath}/backend/src/controllers/"
scp "$basePath\backend\src\routes\ami-operational.routes.js" "${server}:${remotePath}/backend/src/routes/"
scp "$basePath\backend\migrations\create_batch_monitoring_history.sql" "${server}:${remotePath}/backend/migrations/"
scp "$basePath\backend\src\server.js" "${server}:${remotePath}/backend/src/"
scp "$basePath\backend\package.json" "${server}:${remotePath}/backend/"
scp "$basePath\backend\package-lock.json" "${server}:${remotePath}/backend/"
scp "$basePath\backend\TEST_TEAMS_REPORTS.js" "${server}:${remotePath}/backend/"
scp "$basePath\backend\SETUP_MONITORING_TABLE.js" "${server}:${remotePath}/backend/"

# Frontend files
Write-Host "Uploading frontend files..." -ForegroundColor Cyan
scp "$basePath\frontend\src\views\AMIOperationalView.vue" "${server}:${remotePath}/frontend/src/views/"
scp "$basePath\frontend\src\services\ami-operational.api.js" "${server}:${remotePath}/frontend/src/services/"

Write-Host ""
Write-Host "Upload complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. SSH into server: ssh $server" -ForegroundColor White
Write-Host "2. Run: cd ~/DPDC-AMI-BY-OTBL/backend && npm install && node SETUP_MONITORING_TABLE.js && pm2 restart dpdc-ami-backend" -ForegroundColor White
