const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { checkDepartmentAccess } = require("../middleware/rbac");
const {
  getInventoryReport,
  getLowStockReport,
  getIssuedItemsReport,
  getDepartmentReport,
  getAuditReport,
} = require("../controllers/reportController");

router.use(authenticate);

// GET /api/reports/inventory - Inventory report
router.get("/inventory", checkDepartmentAccess, getInventoryReport);

// GET /api/reports/low-stock - Low stock items
router.get("/low-stock", getLowStockReport);

// GET /api/reports/issued - Issued items report
router.get("/issued", checkDepartmentAccess, getIssuedItemsReport);

// GET /api/reports/department - Department-wise report
router.get("/department", getDepartmentReport);

// GET /api/reports/audit - Audit trail report
router.get("/audit", getAuditReport);

module.exports = router;
