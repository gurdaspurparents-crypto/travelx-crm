@echo off
title Travelx B2B Agent CRM Server
echo ========================================================
echo         Travelx B2B Agent Marketing CRM Server
echo ========================================================
echo.
echo Starting server on http://localhost:5000 ...
cd /d "c:\Users\admin\Documents\travelx-crm"
timeout /t 2 >nul
start http://localhost:5000
node server/index.js
pause
