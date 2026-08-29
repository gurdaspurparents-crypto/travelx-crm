@echo off
cd /d "c:\Users\admin\Documents\travelx-crm"
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5000 ^| findstr LISTENING') do taskkill /F /PID %%a >nul 2>&1
ping 127.0.0.1 -n 2 >nul

start /b node server/index.js > server.log 2>&1
ping 127.0.0.1 -n 4 >nul
start /b npx cloudflared tunnel --url http://localhost:5000 > tunnel.log 2>&1
