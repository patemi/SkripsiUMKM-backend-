@echo off
echo ========================================
echo   Indexing UMKM to Meilisearch
echo ========================================
echo.

echo [INFO] Make sure Meilisearch server is running!
echo [INFO] If not, run: start-meilisearch.bat
echo.
timeout /t 3

echo [INFO] Starting indexing process...
echo.

node indexToMeilisearch.js

echo.
echo ========================================
pause
