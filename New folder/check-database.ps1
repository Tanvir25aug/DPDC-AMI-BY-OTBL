# DPDC AMI - Database Status Check (PowerShell)
# Run this to check if database is set up correctly

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "DPDC AMI - Database Verification" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Find PostgreSQL installation
$psqlPaths = @(
    "C:\Program Files\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files\PostgreSQL\15\bin\psql.exe",
    "C:\Program Files\PostgreSQL\14\bin\psql.exe",
    "C:\Program Files\PostgreSQL\13\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\16\bin\psql.exe",
    "C:\Program Files (x86)\PostgreSQL\15\bin\psql.exe"
)

$psqlPath = $null
foreach ($path in $psqlPaths) {
    if (Test-Path $path) {
        $psqlPath = $path
        Write-Host "[OK] PostgreSQL found: $path" -ForegroundColor Green
        break
    }
}

if (-not $psqlPath) {
    Write-Host "[ERROR] PostgreSQL not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "PostgreSQL is not installed or not in common locations." -ForegroundColor Yellow
    Write-Host "Please use pgAdmin to set up the database instead." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "Checking PostgreSQL connection..." -ForegroundColor Yellow
Write-Host "You will be prompted for the postgres user password." -ForegroundColor Yellow
Write-Host ""

# Test PostgreSQL connection
$testQuery = "SELECT 'Connection successful!' as status;"
$env:PGPASSWORD = "admin"  # Try default password
$result = & $psqlPath -U postgres -c $testQuery 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] PostgreSQL connection successful!" -ForegroundColor Green
} else {
    Write-Host "[ERROR] Cannot connect to PostgreSQL!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Error: $result" -ForegroundColor Red
    Write-Host ""
    Write-Host "Possible issues:" -ForegroundColor Yellow
    Write-Host "- Wrong password (default is 'admin' or 'postgres')" -ForegroundColor Yellow
    Write-Host "- PostgreSQL service not running" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Press any key to exit..."
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host ""
Write-Host "Checking database 'dpdc_ami_dev'..." -ForegroundColor Yellow

$checkDbQuery = "SELECT EXISTS (SELECT 1 FROM pg_database WHERE datname = 'dpdc_ami_dev') as exists;"
$dbExists = & $psqlPath -U postgres -t -c $checkDbQuery 2>&1

if ($dbExists -match "t") {
    Write-Host "[OK] Database 'dpdc_ami_dev' exists!" -ForegroundColor Green
} else {
    Write-Host "[MISSING] Database 'dpdc_ami_dev' not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Creating database..." -ForegroundColor Yellow

    $createDb = & $psqlPath -U postgres -c "CREATE DATABASE dpdc_ami_dev;" 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Database created successfully!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create database!" -ForegroundColor Red
        Write-Host "Error: $createDb" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Checking user 'dev_user'..." -ForegroundColor Yellow

$checkUserQuery = "SELECT EXISTS (SELECT 1 FROM pg_user WHERE usename = 'dev_user') as exists;"
$userExists = & $psqlPath -U postgres -t -c $checkUserQuery 2>&1

if ($userExists -match "t") {
    Write-Host "[OK] User 'dev_user' exists!" -ForegroundColor Green
} else {
    Write-Host "[MISSING] User 'dev_user' not found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Creating user..." -ForegroundColor Yellow

    $createUser = & $psqlPath -U postgres -c "CREATE USER dev_user WITH PASSWORD 'admin';" 2>&1

    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] User created successfully!" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Failed to create user!" -ForegroundColor Red
        Write-Host "Error: $createUser" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Setting up permissions..." -ForegroundColor Yellow

$permissions = @"
GRANT ALL PRIVILEGES ON DATABASE dpdc_ami_dev TO dev_user;
"@

& $psqlPath -U postgres -c $permissions 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Database permissions granted!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Could not set all permissions" -ForegroundColor Yellow
}

# Set schema permissions
$schemaPerms = @"
\c dpdc_ami_dev
GRANT ALL ON SCHEMA public TO dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO dev_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO dev_user;
"@

$schemaPerms | & $psqlPath -U postgres 2>&1 | Out-Null

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Schema permissions granted!" -ForegroundColor Green
} else {
    Write-Host "[WARNING] Could not set schema permissions" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Testing connection as dev_user..." -ForegroundColor Yellow

$env:PGPASSWORD = "admin"
$testConnection = & $psqlPath -U dev_user -d dpdc_ami_dev -h localhost -c "SELECT 'Test successful!' as result;" 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "[OK] Connection test successful!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Result: $testConnection" -ForegroundColor Cyan
} else {
    Write-Host "[WARNING] Could not test connection" -ForegroundColor Yellow
    Write-Host "This is normal - password might need to be entered manually" -ForegroundColor Gray
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Database Setup Summary" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Connection Details:" -ForegroundColor White
Write-Host "  Database: dpdc_ami_dev" -ForegroundColor Gray
Write-Host "  User: dev_user" -ForegroundColor Gray
Write-Host "  Password: admin" -ForegroundColor Gray
Write-Host "  Host: localhost" -ForegroundColor Gray
Write-Host "  Port: 5432" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next Steps" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. cd backend" -ForegroundColor White
Write-Host "2. npm install" -ForegroundColor White
Write-Host "3. copy .env.example .env.development" -ForegroundColor White
Write-Host "4. npm run migrate" -ForegroundColor White
Write-Host "5. npm run seed" -ForegroundColor White
Write-Host "6. npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
