const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { checkDepartmentAccess } = require("../middleware/rbac");

router.use(authenticate);

// GET /api/dashboard - Get dashboard data (KPIs, charts, alerts)
router.get("/", checkDepartmentAccess, async (req, res) => {
  // Return: total items, issued vs available, low-stock alerts, recent activity
  res.json({
    success: true,
    data: {
      stats: {
        totalItems: 0,
        totalQuantity: 0,
        issuedQuantity: 0,
        availableQuantity: 0,
      },
      lowStockAlerts: [],
      recentItems: [],
      recentIssues: [],
    },
    message: "Dashboard - to be implemented",
  });
});

module.exports = router;
