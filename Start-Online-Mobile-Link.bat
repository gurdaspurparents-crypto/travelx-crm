@echo off
cd /d c:\Users\admin\Documents\travelx-crm
start /b node server/index.js
npx cloudflared tunnel --url http://localhost:5000
