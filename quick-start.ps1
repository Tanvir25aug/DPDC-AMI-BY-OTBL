# DPDC AMI Quick Start Script (PowerShell)
# This script starts both backend and frontend servers

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  DPDC AMI Quick Start" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version
    Write-Host "[OK] Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] Node.js is not installed!" -ForegroundColor Red
    exit 1
}

# Check if dependencies are installed
if (!(Test-Path "backend\node_modules")) {
    Write-Host "[WARNING] Backend dependencies not installed. Running npm install..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

if (!(Test-Path "frontend\node_modules")) {
    Write-Host "[WARNING] Frontend dependencies not installed. Running npm install..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Yellow
Write-Host ""

# Start backend in new window
Write-Host "Starting Backend on http://localhost:3000" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\backend'; npm run dev"

# Wait a moment for backend to start
Start-Sleep -Seconds 3

# Start frontend in new window
Write-Host "Starting Frontend on http://localhost:5173" -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$PWD\frontend'; npm run dev"

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "  Servers Starting..." -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Backend:  http://localhost:3000" -ForegroundColor White
Write-Host "  Frontend: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "  Default Login:" -ForegroundColor White
Write-Host "    Username: admin" -ForegroundColor Yellow
Write-Host "    Password: Admin@123" -ForegroundColor Yellow
Write-Host ""
Write-Host "  Press any key to open the browser..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

# Open browser
Start-Process "http://localhost:5173"
