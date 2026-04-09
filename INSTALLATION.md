# Department Inventory Management System - Installation Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Git** (optional) - [Download](https://git-scm.com/)

## Step-by-Step Installation

### 1. Database Setup

#### Windows (PowerShell)

```powershell
# Open PostgreSQL shell
psql -U postgres

# In PostgreSQL shell, run:
CREATE DATABASE inventory_db;
\q

# Run schema
psql -U postgres -d inventory_db -f server/database/schema.sql
```

### 2. Backend Setup

```powershell
# Install backend dependencies
npm install

# Create .env file
Copy-Item .env.example .env

# Edit .env file with your database credentials
notepad .env
```

**Update these values in `.env`:**

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=inventory_db
DB_USER=postgres
DB_PASSWORD=your_postgres_password
JWT_SECRET=your_random_secret_key_here
```

### 3. Frontend Setup

```powershell
# Navigate to client folder
cd client

# Install frontend dependencies
npm install

# Go back to root
cd ..
```

### 4. Seed Database (Optional but Recommended)

```powershell
# This will create sample departments, users, items, etc.
npm run seed
```

**Default Credentials Created:**

- Admin: `admin@inventory.com` / `Admin@123`
- CS Staff: `cs.staff@inventory.com` / `Staff@123`
- Auditor: `auditor@inventory.com` / `Staff@123`

### 5. Create Upload Directories

```powershell
# Create upload directories
New-Item -ItemType Directory -Force -Path uploads/items
New-Item -ItemType Directory -Force -Path logs
```

### 6. Start the Application

#### Option A: Run Both (Recommended for Development)

```powershell
# Start both backend and frontend concurrently
npm run dev
```

#### Option B: Run Separately

**Terminal 1 (Backend):**

```powershell
npm run server
```

**Terminal 2 (Frontend):**

```powershell
npm run client
```

### 7. Access the Application

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000/api
- **Health Check:** http://localhost:5000/api/health

## Docker Installation (Alternative)

If you prefer using Docker:

```powershell
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Troubleshooting

### Port Already in Use

If port 5000 or 3000 is already in use:

**Change Backend Port:**
Edit `.env`:

```
PORT=5001
```

**Change Frontend Port:**
Edit `client/package.json`:

```json
"scripts": {
  "start": "set PORT=3001 && react-scripts start"
}
```

### Database Connection Failed

1. Verify PostgreSQL is running:

```powershell
Get-Service -Name postgresql*
```

2. Check credentials in `.env`
3. Ensure database exists:

```powershell
psql -U postgres -c "\l"
```

### Module Not Found Errors

```powershell
# Clear and reinstall dependencies
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install

# Same for client
cd client
Remove-Item -Recurse -Force node_modules
Remove-Item -Force package-lock.json
npm install
```

### Permission Errors

Run PowerShell as Administrator if you encounter permission issues.

## Production Deployment

### Environment Variables

Update `.env` for production:

```
NODE_ENV=production
JWT_SECRET=use_a_very_long_random_secret_key
DB_PASSWORD=strong_password_here
```

### Build Frontend

```powershell
cd client
npm run build
cd ..
```

### Start Production Server

```powershell
npm start
```

## Next Steps

After installation:

1. **Login** with admin credentials
2. **Change default passwords** immediately
3. **Create departments** for your organization
4. **Add users** and assign roles
5. **Add items** to inventory
6. **Configure settings** (email, thresholds, etc.)

## Useful Commands

```powershell
# Run tests
npm test

# Check for errors
npm run lint

# Database backup
pg_dump -U postgres inventory_db > backup.sql

# Database restore
psql -U postgres -d inventory_db < backup.sql

# View logs
Get-Content -Path logs/app.log -Wait
```

## Support

For issues or questions:

- Check the README.md file
- Review the docs/ folder
- Check server logs in the terminal

---

**Security Reminder:** Always change default passwords in production!
