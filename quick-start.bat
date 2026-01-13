@echo off
title RTS Digital Signage - Quick Start

echo =========================================
echo    RTS Digital Signage Quick Start
echo =========================================
echo.

echo Starting Backend Server...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "npm start"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak > nul

echo Starting Frontend Display...
cd /d "%~dp0frontend-display"
start "Frontend Display" cmd /k "npm run dev"

echo.
echo =========================================
echo Services are starting up!
echo =========================================
echo Backend: http://localhost:3000
echo Frontend Display: Check terminal for port
echo.
echo Press any key to exit...
pause > nul
