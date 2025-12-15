@echo off
REM Quick Fix Script for Telegram Bot in Production
REM Upload this to production server and run it

echo =========================================
echo DPDC AMI - Telegram Bot Quick Fix
echo =========================================
echo.

REM This script should be uploaded to production server
echo This script needs to be run on the production server (172.18.42.200)
echo.
echo To use this script:
echo 1. Upload this file to the production server
echo 2. Connect via SSH: ssh username@172.18.42.200
echo 3. Run: bash fix_telegram_prod.sh
echo.
echo =========================================
echo.
echo Alternative: Manual Fix Commands
echo =========================================
echo.
echo Copy and paste these commands on the production server:
echo.
echo cd /opt/dpdc-ami/backend
echo sed -i 's/NODE_ENV=.*/NODE_ENV=production/' .env
echo sed -i 's/ENABLE_TELEGRAM=.*/ENABLE_TELEGRAM=true/' .env
echo cat .env ^| grep -E 'NODE_ENV^|ENABLE_TELEGRAM'
echo pm2 restart all
echo pm2 logs --lines 30
echo.
echo =========================================

pause
