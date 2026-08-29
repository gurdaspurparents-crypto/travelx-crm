@echo off
title Travelx B2B CRM Mobile Sharing Link
echo ========================================================
echo         Travelx B2B Agent CRM Online Mobile Sharing
echo ========================================================
echo.
echo 1. Clearing any old background process on port 5000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
timeout /t 1 >nul

echo.
echo 2. Starting local CRM Server on port 5000...
cd /d "c:\Users\admin\Documents\travelx-crm"

start "Travelx CRM Backend Server" cmd /k "cd /d c:\Users\admin\Documents\travelx-crm && node server/index.js"

echo.
echo 3. Waiting 3 seconds for server to initialize...
timeout /t 3 >nul

echo.
echo ========================================================
echo  HOW TO SHARE LINKS WITH YOUR TEAM:
echo ========================================================
echo  Once the URL (https://...trycloudflare.com) appears below:
echo.
echo  1. For Bikramjit Singh (Field Marketing):
echo     Add "?role=field" at the end of the URL
echo.
echo  2. For Simranjit Kaur (Telecaller):
echo     Add "?role=telephonic" at the end of the URL
echo.
echo  3. For Owner Admin (Full Control):
echo     Use main URL as is (PIN: 1234)
echo ========================================================
echo.

npx cloudflared tunnel --url http://localhost:5000
pause
