# ⚡ Quick Reference Card

## 🚀 Quick Start Commands

```powershell
# Setup (first time)
.\setup.ps1

# OR manually:
npm install && cd client && npm install && cd ..
psql -U postgres -d inventory_db -f server/database/schema.sql
npm run seed

# Start development
npm run dev

# Access
# Frontend: http://localhost:3000
# Backend:  http://localhost:5000/api
# Login:    admin@inventory.com / Admin@123
```

## 📁 File Structure

```
✅ COMPLETE FILES:
├── server/
│   ├── index.js                    ✅ Server setup
│   ├── config/database.js          ✅ DB connection
│   ├── middleware/
│   │   ├── auth.js                 ✅ JWT auth
│   │   └── rbac.js                 ✅ Permissions
│   ├── controllers/
│   │   ├── authController.js       ✅ Login/logout
│   │   └── userController.js       ✅ User CRUD
│   ├── routes/                     ✅ All routes
│   ├── utils/
│   │   ├── auditLogger.js         ✅ Audit system
│   │   └── emailService.js        ✅ Email service
│   ├── database/schema.sql        ✅ DB schema
│   └── seeds/seed.js              ✅ Sample data
│
├── client/src/
│   ├── App.js                     ✅ Main app
│   ├── context/AuthContext.js     ✅ Auth state
│   ├── components/
│   │   ├── Layout.js              ✅ Layout
│   │   └── PrivateRoute.js        ✅ Route guard
│   ├── pages/                     ✅ All pages (UI only)
│   └── utils/api.js               ✅ API client

⏳ TO IMPLEMENT:
├── server/controllers/
│   ├── itemController.js          ⏳ Items CRUD
│   ├── issueController.js         ⏳ Issue/Return
│   ├── dashboardController.js     ⏳ Stats
│   ├── reportController.js        ⏳ Reports
│   ├── departmentController.js    ⏳ Departments
│   ├── categoryController.js      ⏳ Categories
│   └── supplierController.js      ⏳ Suppliers
│
└── client/src/components/
    ├── items/                     ⏳ Items UI
    ├── issues/                    ⏳ Issues UI
    ├── dashboard/                 ⏳ Charts
    └── shared/                    ⏳ Reusable
```

## 🎯 API Endpoints

### ✅ WORKING NOW:

```
POST   /api/auth/login              Login
POST   /api/auth/logout             Logout
POST   /api/auth/forgot-password    Reset request
POST   /api/auth/reset-password     Reset password
GET    /api/auth/me                 Current user
PUT    /api/auth/change-password    Change password

GET    /api/users                   List users
POST   /api/users                   Create user
GET    /api/users/:id               Get user
PUT    /api/users/:id               Update user
DELETE /api/users/:id               Delete user
```

### ⏳ TO IMPLEMENT:

```
GET    /api/items                   List items
POST   /api/items                   Create item
GET    /api/items/:id               Get item
PUT    /api/items/:id               Update item
DELETE /api/items/:id               Delete item
POST   /api/items/bulk-upload       CSV import

POST   /api/issues                  Create issue
GET    /api/issues                  List issues
POST   /api/issues/:id/return       Process return

GET    /api/dashboard               Dashboard data
GET    /api/reports/inventory       Inventory report
GET    /api/departments             Departments
```

## 🔐 Roles & Permissions

| Feature        | Admin  | Dept Staff  | Auditor |
| -------------- | ------ | ----------- | ------- |
| Login          | ✅     | ✅          | ✅      |
| View Dashboard | ✅ All | ✅ Own Dept | ✅ All  |
| Manage Items   | ✅ All | ✅ Own Dept | ❌      |
| Issue Items    | ✅ All | ✅ Own Dept | ❌      |
| Manage Users   | ✅     | ❌          | ❌      |
| View Reports   | ✅ All | ✅ Own Dept | ✅ All  |
| View Audit     | ✅     | ❌          | ✅      |

## 📊 Database Tables

```
users           → id, email, password_hash, role, department_id
departments     → id, name, code
categories      → id, name
suppliers       → id, name, contact_person
items           → id, item_code, name, quantity_*, department_id
issues          → id, issue_no, item_id, recipient_*, status
returns         → id, issue_id, quantity_returned, condition
audit_logs      → id, entity_type, action, old_value, new_value
```

## 🔧 Key Functions

### Backend Utilities:

```javascript
// Authentication
authenticate(req, res, next)        // Verify JWT token
authorize(...roles)                 // Check user role
checkDepartmentAccess()            // Verify dept access

// Audit
createAuditLog({...})              // Log action

// Email
sendEmail({to, subject, html})     // Send email
sendLowStockAlert(item)            // Stock alert
```

### Frontend Hooks:

```javascript
// Auth
const { user, login, logout, isAdmin } = useAuth();

// API
import api from "./utils/api";
const response = await api.get("/items");
```

## 📝 Sample Code

### Create a New Controller:

```javascript
// server/controllers/itemController.js
const db = require("../config/database");
const { createAuditLog } = require("../utils/auditLogger");

exports.getAllItems = async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM items");
    res.json({ success: true, data: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
```

### Create a Frontend Component:

```javascript
// client/src/components/items/ItemsList.js
import { useState, useEffect } from "react";
import api from "../../utils/api";

const ItemsList = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    api.get("/items").then((res) => setItems(res.data.data));
  }, []);

  return (
    <div>
      {items.map((item) => (
        <div key={item.id}>{item.name}</div>
      ))}
    </div>
  );
};
```

## 🐛 Common Issues

### Port in use:

```powershell
# Change in .env
PORT=5001
```

### DB connection failed:

```powershell
# Check PostgreSQL
Get-Service postgresql*
# Update .env credentials
```

### Module not found:

```powershell
rm -rf node_modules
npm install
```

## 📞 Documentation

- **README.md** → Project overview
- **INSTALLATION.md** → Setup guide
- **IMPLEMENTATION_STATUS.md** → Roadmap
- **PROJECT_SUMMARY.md** → This document

## ✅ Pre-flight Checklist

Before starting:

- [ ] Node.js installed (v18+)
- [ ] PostgreSQL installed (v14+)
- [ ] Dependencies installed (`npm install`)
- [ ] Database created
- [ ] Schema applied
- [ ] .env configured
- [ ] Seed data loaded

## 🎯 Priority Implementation Order

1. **Items Controller** → Full CRUD for inventory
2. **Issues Controller** → Issue/return logic
3. **Dashboard Controller** → Stats and alerts
4. **Frontend Items** → UI for items
5. **Frontend Issues** → UI for issues
6. **Chart.js** → Visualizations
7. **Reports** → Export functionality

## 💡 Tips

- Use `userController.js` as a template
- All routes already have placeholder responses
- Multer is configured for image uploads
- Audit logging is automatic (just call `createAuditLog`)
- Email service is ready (configure SMTP in .env)
- Always use `req.user` for current user info
- Use `authorize()` middleware for role checks

---

**Start here:** Implement `itemController.js` → Test in Postman → Build frontend → Connect to API

**Time estimate:**

- Items module: 1-2 days
- Issues module: 1-2 days
- Dashboard: 1 day
- Polish: 2-3 days

**Total MVP:** ~1 week of focused development
