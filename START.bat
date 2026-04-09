@echo off
color 0B
title Inventory Management System - Running

echo.
echo ========================================
echo   INVENTORY MANAGEMENT SYSTEM
echo ========================================
echo.
echo Starting servers...
echo.
echo Backend will run on: http://localhost:5000
echo Frontend will run on: http://localhost:3000
echo.
echo Press Ctrl+C to stop the application
echo.
echo ========================================
echo.

cd /d "%~dp0"
npm run dev

pause
