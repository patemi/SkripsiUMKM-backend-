@echo off
echo ============================================
echo   GENERATE 100 UMKM DATA SOLO RAYA
echo ============================================
echo.
echo Akan membuat 100 data UMKM di wilayah:
echo - Surakarta
echo - Boyolali
echo - Karanganyar
echo - Klaten
echo - Sukoharjo
echo - Wonogiri
echo - Sragen
echo.
echo Press any key to continue...
pause >nul

node seederSoloRaya100.js

echo.
echo ============================================
echo   SELESAI
echo ============================================
pause
