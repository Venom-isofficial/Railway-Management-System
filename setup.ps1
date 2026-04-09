# Quick Start Script for Windows PowerShell

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Department Inventory System Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check Node.js
Write-Host "Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✓ Node.js found: $nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ Node.js not found. Please install Node.js from https://nodejs.org/" -ForegroundColor Red
    exit 1
}

# Check PostgreSQL
Write-Host "Checking PostgreSQL..." -ForegroundColor Yellow
try {
    $pgVersion = psql --version
    Write-Host "✓ PostgreSQL found: $pgVersion" -ForegroundColor Green
}
catch {
    Write-Host "✗ PostgreSQL not found. Please install PostgreSQL from https://www.postgresql.org/" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Step 1: Installing Dependencies" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Backend installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Backend dependencies installed" -ForegroundColor Green

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location client
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Frontend installation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Frontend dependencies installed" -ForegroundColor Green
Set-Location ..

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Step 2: Environment Configuration" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

# Check if .env exists
if (Test-Path .env) {
    Write-Host "✓ .env file already exists" -ForegroundColor Green
}
else {
    Write-Host "Creating .env file from example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "✓ .env file created" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT: Please edit .env file and update:" -ForegroundColor Yellow
    Write-Host "   - DB_PASSWORD (your PostgreSQL password)" -ForegroundColor Yellow
    Write-Host "   - JWT_SECRET (generate a random secret)" -ForegroundColor Yellow
    Write-Host ""
    $continue = Read-Host "Have you configured .env? (y/n)"
    if ($continue -ne "y") {
        Write-Host "Please configure .env file and run this script again" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Step 3: Database Setup" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$dbPassword = Read-Host "Enter PostgreSQL password for user 'postgres'" -AsSecureString
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($dbPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Set environment variable for psql
$env:PGPASSWORD = $plainPassword

Write-Host "Creating database..." -ForegroundColor Yellow
psql -U postgres -c "CREATE DATABASE inventory_db;" 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✓ Database created" -ForegroundColor Green
}
else {
    Write-Host "Database may already exist, continuing..." -ForegroundColor Yellow
}

Write-Host "Running database schema..." -ForegroundColor Yellow
psql -U postgres -d inventory_db -f server/database/schema.sql
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Schema creation failed" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Database schema created" -ForegroundColor Green

# Clear password
$env:PGPASSWORD = $null

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Step 4: Seed Sample Data" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

$seedData = Read-Host "Do you want to seed sample data? (y/n)"
if ($seedData -eq "y") {
    Write-Host "Seeding database..." -ForegroundColor Yellow
    npm run seed
    if ($LASTEXITCODE -ne 0) {
        Write-Host "✗ Seeding failed" -ForegroundColor Red
        exit 1
    }
    Write-Host "✓ Sample data seeded" -ForegroundColor Green
}

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Step 5: Create Directories" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

Write-Host "Creating upload directories..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path uploads/items | Out-Null
New-Item -ItemType Directory -Force -Path logs | Out-Null
Write-Host "✓ Directories created" -ForegroundColor Green

Write-Host ""
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✓ Setup Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Default Login Credentials:" -ForegroundColor Yellow
Write-Host "  Admin: admin@inventory.com / Admin@123" -ForegroundColor White
Write-Host "  Staff: cs.staff@inventory.com / Staff@123" -ForegroundColor White
Write-Host ""
Write-Host "To start the application:" -ForegroundColor Yellow
Write-Host "  npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "The application will be available at:" -ForegroundColor Yellow
Write-Host "  Frontend: http://localhost:3000" -ForegroundColor White
Write-Host "  Backend:  http://localhost:5000" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  Remember to change default passwords in production!" -ForegroundColor Red
Write-Host ""

$startNow = Read-Host "Do you want to start the application now? (y/n)"
if ($startNow -eq "y") {
    Write-Host ""
    Write-Host "Starting application..." -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
    Write-Host ""
    npm run dev
}
