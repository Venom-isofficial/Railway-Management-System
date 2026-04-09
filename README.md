# Department Inventory & Issue-Return Management System

A comprehensive web-based inventory management system for tracking departmental items, managing issue/return workflows, role-based access control, and generating reports.

## 🚀 Features

### 1. 🧍‍♂️ User Management

- **Admin Login**: Full system control and management
- **Department/Staff Login**: Department-specific access and permissions
- **Password Authentication**: Secure bcrypt hashing
- **Role-Based Permissions**: Admin, Department Staff, Auditor roles
- **Password Reset**: Email-based OTP system

### 2. 🏠 Dashboard

- Total items and quantity KPIs
- Issued vs Available items visualization
- Low-stock alerts with configurable thresholds
- Department-wise charts (Chart.js)
- Recently added and issued items lists
- Quick search functionality

### 3. 📦 Item Management

- Add items with comprehensive fields:
  - Item Name, SKU, Category, Department
  - Quantity, Price, Purchase Date
  - Supplier, Location, Condition
  - Image upload support
- Edit/Delete with soft-delete and audit trail
- Bulk CSV import/export
- Advanced search and filtering
- Pagination and sorting

### 4. 🔄 Issue & Return System

- Issue items to departments/faculty/students
- Automatic quantity updates
- Return entry with condition tracking
- Partial returns support
- Complete history tracking
- Printable receipts
- Overdue alerts

### 5. 🏫 Department Management

- Create and manage departments
- Assign staff to departments
- Department-level inventory tracking
- Isolated department views for staff

### 6. 📊 Reporting & Analytics

- Pre-built reports (inventory, low-stock, issued items)
- CSV and PDF export
- Department-wise analysis
- Custom date range filtering
- Printable reports

### 7. 🔍 Audit & History

- Complete audit trail for all actions
- Immutable logs with old/new values
- User activity tracking
- IP logging and timestamps
- Filter by entity, action, date

## 🛠️ Tech Stack

### Backend

- **Node.js** with Express.js
- **PostgreSQL** database
- **JWT** authentication
- **bcryptjs** for password hashing
- **Multer** for file uploads
- **PDFKit** for PDF generation

### Frontend

- **React 18** with React Router
- **Tailwind CSS** for styling
- **Chart.js** for visualizations
- **Axios** for API calls
- **React Toastify** for notifications

### DevOps

- **Docker** & Docker Compose
- **GitHub Actions** for CI/CD
- Environment-based configuration

## 📋 Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm or yarn

## 🚀 Quick Start

### 1. Clone and Install

```bash
# Clone the repository
git clone <repository-url>
cd Railway Management System

# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 2. Database Setup

```bash
# Create PostgreSQL database
psql -U postgres
CREATE DATABASE inventory_db;
\q

# Run database schema
psql -U postgres -d inventory_db -f server/database/schema.sql

# (Optional) Seed sample data
npm run seed
```

### 3. Environment Configuration

```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your configuration
# Update DB credentials, JWT secret, email config
```

### 4. Run the Application

```bash
# Development mode (runs both backend and frontend)
npm run dev

# Backend only
npm run server

# Frontend only
npm run client

# Production mode
npm run build
npm start
```

The application will be available at:

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 🔐 Default Credentials

After running the seed script:

**Admin Account:**

- Email: admin@inventory.com
- Password: Admin@123

**Department Staff (Computer Science):**

- Email: cs.staff@inventory.com
- Password: Staff@123

**Change these passwords immediately in production!**

## 📁 Project Structure

```
Railway Management System/
├── server/                 # Backend (Node.js + Express)
│   ├── config/            # Configuration files
│   ├── controllers/       # Route controllers
│   ├── middleware/        # Custom middleware (auth, RBAC)
│   ├── models/           # Database models
│   ├── routes/           # API routes
│   ├── utils/            # Helper functions
│   ├── database/         # DB schema and migrations
│   ├── seeds/            # Seed data scripts
│   └── index.js          # Server entry point
├── client/               # Frontend (React)
│   ├── public/          # Static files
│   └── src/
│       ├── components/  # React components
│       ├── pages/       # Page components
│       ├── context/     # Context API (auth, etc.)
│       ├── utils/       # Helper functions
│       ├── services/    # API service layer
│       └── App.js       # Main app component
├── uploads/             # File uploads directory
├── .env                 # Environment variables
├── package.json         # Backend dependencies
├── docker-compose.yml   # Docker configuration
└── README.md           # This file
```

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Users

- `GET /api/users` - List all users (Admin)
- `POST /api/users` - Create new user (Admin)
- `GET /api/users/:id` - Get user details
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user

### Departments

- `GET /api/departments` - List all departments
- `POST /api/departments` - Create department (Admin)
- `PUT /api/departments/:id` - Update department
- `DELETE /api/departments/:id` - Delete department

### Items

- `GET /api/items` - List items (with filters)
- `POST /api/items` - Add new item
- `GET /api/items/:id` - Get item details
- `PUT /api/items/:id` - Update item
- `DELETE /api/items/:id` - Soft delete item
- `POST /api/items/bulk-upload` - Bulk CSV upload

### Issues & Returns

- `POST /api/issues` - Create issue
- `GET /api/issues` - List issues (with filters)
- `GET /api/issues/:id` - Get issue details
- `POST /api/issues/:id/return` - Process return

### Reports

- `GET /api/reports/inventory` - Inventory report
- `GET /api/reports/low-stock` - Low stock items
- `GET /api/reports/issued` - Issued items report
- `GET /api/reports/export` - Export to CSV/PDF

### Audit

- `GET /api/audit` - Get audit logs (with filters)

## 🧪 Testing

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.js
```

## 🐳 Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop containers
docker-compose down
```

## 🔒 Security Features

- Password hashing with bcryptjs (12 rounds)
- JWT token-based authentication
- Role-based access control (RBAC)
- Rate limiting on authentication endpoints
- Helmet.js for security headers
- Input validation and sanitization
- SQL injection protection with parameterized queries
- File upload validation (type, size)
- HTTPS enforcement in production
- CSRF protection

## 📈 Performance Optimization

- Database indexing on frequently queried fields
- Connection pooling for PostgreSQL
- Response caching for reports
- Pagination for large datasets
- Lazy loading of images
- Optimized queries with joins

## 🌐 Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## 📝 License

MIT License - see LICENSE file for details

## 👥 Contributors

- Your Name - Ashish Ranjan

## 📞 Support

For issues and questions:

- Create an issue in the repository
- Email: support@inventory.com

## 🗺️ Roadmap

### Phase 2 (Planned)

- [ ] Barcode/QR code scanning
- [ ] Mobile app (React Native)
- [ ] SMS notifications
- [ ] Advanced analytics dashboard
- [ ] Multi-language support

### Phase 3 (Future)

- [ ] Procurement workflow
- [ ] Asset depreciation tracking
- [ ] LDAP/SSO integration
- [ ] Mobile PWA
- [ ] Offline mode

## 📚 Documentation

- [API Documentation](./docs/API.md)
- [Database Schema](./docs/DATABASE.md)
- [User Manual](./docs/USER_MANUAL.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)

---

**Built with ❤️ for efficient department inventory management**
