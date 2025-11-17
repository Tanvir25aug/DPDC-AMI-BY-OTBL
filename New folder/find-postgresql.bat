@echo off
echo ========================================
echo Finding PostgreSQL Installation
echo ========================================
echo.

SET FOUND=0

echo Searching for PostgreSQL...
echo.

if exist "C:\Program Files\PostgreSQL\16" (
    echo [FOUND] PostgreSQL 16: C:\Program Files\PostgreSQL\16
    SET FOUND=1
)
if exist "C:\Program Files\PostgreSQL\15" (
    echo [FOUND] PostgreSQL 15: C:\Program Files\PostgreSQL\15
    SET FOUND=1
)
if exist "C:\Program Files\PostgreSQL\14" (
    echo [FOUND] PostgreSQL 14: C:\Program Files\PostgreSQL\14
    SET FOUND=1
)
if exist "C:\Program Files\PostgreSQL\13" (
    echo [FOUND] PostgreSQL 13: C:\Program Files\PostgreSQL\13
    SET FOUND=1
)
if exist "C:\Program Files\PostgreSQL\12" (
    echo [FOUND] PostgreSQL 12: C:\Program Files\PostgreSQL\12
    SET FOUND=1
)

if exist "C:\Program Files (x86)\PostgreSQL\16" (
    echo [FOUND] PostgreSQL 16 (x86): C:\Program Files (x86)\PostgreSQL\16
    SET FOUND=1
)
if exist "C:\Program Files (x86)\PostgreSQL\15" (
    echo [FOUND] PostgreSQL 15 (x86): C:\Program Files (x86)\PostgreSQL\15
    SET FOUND=1
)

echo.

if %FOUND%==0 (
    echo PostgreSQL not found!
    echo.
    echo PostgreSQL might not be installed.
    echo Download from: https://www.postgresql.org/download/windows/
) else (
    echo.
    echo ========================================
    echo How to Add PostgreSQL to PATH
    echo ========================================
    echo.
    echo 1. Press Windows + R
    echo 2. Type: sysdm.cpl
    echo 3. Click "Advanced" tab
    echo 4. Click "Environment Variables"
    echo 5. Under "System variables", find "Path"
    echo 6. Click "Edit"
    echo 7. Click "New"
    echo 8. Add the bin path from above, for example:
    echo    C:\Program Files\PostgreSQL\16\bin
    echo 9. Click OK on all windows
    echo 10. Restart Command Prompt
    echo.
)

echo.
pause
