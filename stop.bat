@echo off
title RwandAir - Stopping Servers...
color 0C

echo Stopping RwandAir servers...

for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 2^>nul') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 2^>nul') do taskkill /PID %%a /F >nul 2>&1

echo All servers stopped!
timeout /t 2 /nobreak >nul
