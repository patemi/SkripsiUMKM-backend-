@echo off
echo ========================================
echo   Meilisearch System Status Check
echo ========================================
echo.

REM Check Meilisearch Server
echo [1/4] Checking Meilisearch Server...
curl -s http://localhost:7700/health >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Meilisearch is running on port 7700
) else (
    echo [ERROR] Meilisearch is NOT running!
    echo Please run: start-meilisearch.bat
)
echo.

REM Check Backend Server
echo [2/4] Checking Backend Server...
curl -s http://localhost:5000 >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Backend server is running on port 5000
) else (
    echo [ERROR] Backend server is NOT running!
    echo Please run: npm start
)
echo.

REM Check Search API
echo [3/4] Checking Search API...
curl -s http://localhost:5000/api/search >nul 2>&1
if %errorlevel% equ 0 (
    echo [OK] Search API is accessible
) else (
    echo [ERROR] Search API is not responding
)
echo.

REM Get Search Statistics
echo [4/4] Getting Search Statistics...
echo Run this command with admin token:
echo curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:5000/api/search/stats
echo.

echo ========================================
echo   Status Check Complete
echo ========================================
pause
