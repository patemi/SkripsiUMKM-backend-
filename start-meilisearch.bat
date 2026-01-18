@echo off
echo ========================================
echo   Meilisearch Server Starter
echo ========================================
echo.

REM Check if meilisearch.exe exists
if not exist "meilisearch.exe" (
    echo [ERROR] meilisearch.exe not found!
    echo.
    echo Please download Meilisearch from:
    echo https://github.com/meilisearch/meilisearch/releases/latest
    echo.
    echo Download: meilisearch-windows-amd64.exe
    echo Rename it to: meilisearch.exe
    echo Place it in the backend folder
    echo.
    pause
    exit /b 1
)

echo [INFO] Starting Meilisearch server...
echo [INFO] Dashboard: http://127.0.0.1:7700
echo [INFO] Master Key: SoraUMKM_MeiliSearch_2024_SecureKey
echo [INFO] Press Ctrl+C to stop
echo.

REM Start Meilisearch with secure master key
meilisearch.exe --master-key=ufPPY65vcHbt0S9jWCj5TCaUVNDZEXz_nmZB-0V9cJc --http-addr 127.0.0.1:7700

pause

