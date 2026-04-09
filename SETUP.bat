@echo off
SETLOCAL EnableDelayedExpansion
color 0A
title Inventory Management System - First Time Setup

echo.
echo ========================================
echo   INVENTORY MANAGEMENT SYSTEM SETUP
echo ========================================
echo.

REM Check if PostgreSQL is installed
where psql >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] PostgreSQL is not installed or not in PATH!
    echo Please install PostgreSQL from: https://www.postgresql.org/download/
    pause
    exit /b 1
)

REM Check if Node.js is installed
where node >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js from: https://nodejs.org/
    pause
    exit /b 1
)

echo [1/7] Checking prerequisites...
node --version
npm --version
psql --version
echo.

echo [2/7] Installing dependencies...
echo This will take a few minutes...
echo.

REM Remove old node_modules if they exist
if exist node_modules (
    echo Cleaning old backend node_modules...
    rmdir /s /q node_modules
)
if exist package-lock.json (
    del /f /q package-lock.json
)

echo Installing backend packages...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install backend dependencies
    pause
    exit /b 1
)
echo Backend packages installed successfully!
echo.

REM Remove old client node_modules if they exist
if exist client\node_modules (
    echo Cleaning old frontend node_modules...
    rmdir /s /q client\node_modules
)
if exist client\package-lock.json (
    del /f /q client\package-lock.json
)

echo Installing frontend packages...
cd client
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to install frontend dependencies
    pause
    exit /b 1
)
cd ..
echo Frontend packages installed successfully!
echo.

echo [3/7] Setting up environment file...
echo.
set /p DB_PASS="Enter your PostgreSQL password: "
echo.

if not exist .env (
    echo Creating .env file with your settings...
    (
        echo # Server Configuration
        echo PORT=5000
        echo NODE_ENV=development
        echo.
        echo # Database Configuration
        echo DB_HOST=localhost
        echo DB_PORT=5432
        echo DB_NAME=inventory_db
        echo DB_USER=postgres
        echo DB_PASSWORD=!DB_PASS!
        echo.
        echo # JWT Secret
        echo JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
        echo JWT_EXPIRE=7d
        echo.
        echo # Email Configuration ^(for password reset^)
        echo SMTP_HOST=smtp.gmail.com
        echo SMTP_PORT=587
        echo SMTP_USER=your-email@gmail.com
        echo SMTP_PASS=your-app-password
        echo EMAIL_FROM=noreply@inventory.com
        echo.
        echo # File Upload
        echo UPLOAD_PATH=./uploads
        echo MAX_FILE_SIZE=5242880
        echo.
        echo # Low Stock Threshold ^(global default^)
        echo DEFAULT_LOW_STOCK_THRESHOLD=10
        echo.
        echo # Frontend URL
        echo CLIENT_URL=http://localhost:3000
    ) > .env
    echo .env file created successfully!
) else (
    echo .env file already exists. Updating password...
    powershell -Command "(Get-Content .env) -replace 'DB_PASSWORD=.*', 'DB_PASSWORD=!DB_PASS!' | Set-Content .env"
    echo Password updated successfully!
)
echo.

echo [4/7] Creating database...
echo.
echo Creating database with the password you provided...
echo.
psql -U postgres -c "DROP DATABASE IF EXISTS inventory_db;" 2>nul
set PGPASSWORD=!DB_PASS!
psql -U postgres -c "CREATE DATABASE inventory_db;"
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to create database
    echo Please check your PostgreSQL password and try again
    pause
    exit /b 1
)
echo Database created successfully!
echo.

echo [5/7] Loading database schema...
set PGPASSWORD=!DB_PASS!
psql -U postgres -d inventory_db -f server\database\schema.sql
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Failed to load schema
    pause
    exit /b 1
)
echo Schema loaded successfully!
echo.

echo [6/7] Would you like to add sample data? (Y/N)
set /p SEED="Enter choice: "
if /i "!SEED!"=="Y" (
    echo Adding sample data...
    node server\seeds\seed.js
    if %ERRORLEVEL% NEQ 0 (
        echo [WARNING] Failed to seed data, but continuing...
    ) else (
        echo Sample data added successfully!
    )
)
echo.

echo [7/7] Setup Complete!
echo.
echo ========================================
echo   SETUP COMPLETED SUCCESSFULLY!
echo ========================================
echo.
echo Default Admin Login:
echo   Email: admin@inventory.com
echo   Password: Admin@123
echo.
echo To start the application:
echo   - Double-click START.bat
echo   OR
echo   - Run: npm run dev
echo.
echo Application will be available at:
echo   http://localhost:3000
echo.
echo ========================================
pause
