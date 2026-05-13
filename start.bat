@echo off
title RwandAir - Starting Servers...
color 0A

echo ========================================
echo        RwandAir Ticketing System
echo ========================================
echo.

:: Kill any existing processes on ports 3000 and 5000
echo Stopping any existing servers...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000 2^>nul') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000 2^>nul') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul

:: Set Node.js path
set PATH=C:\Program Files\nodejs;%PATH%
set PGPASSWORD=postgres

echo Starting Backend...
start "RwandAir Backend" cmd /k "cd C:\rwandair\backend && set PGPASSWORD=postgres && set PATH=C:\Program Files\nodejs;%%PATH%% && "C:\Program Files\nodejs\node.exe" src/server.js"

echo Waiting for backend to start...
timeout /t 3 /nobreak >nul

echo Starting Frontend...
start "RwandAir Frontend" cmd /k "cd C:\rwandair\frontend && set PATH=C:\Program Files\nodejs;%%PATH%% && "C:\Program Files\nodejs\node.exe" node_modules\react-scripts\bin\react-scripts.js start"

echo.
echo ========================================
echo  Both servers are starting...
echo  Backend:  http://localhost:5000
echo  Frontend: http://localhost:3000
echo ========================================
echo.
echo Browser will open automatically in ~30 seconds
echo You can close this window now.
echo.
pause
