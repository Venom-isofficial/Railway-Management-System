const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");

router.use(authenticate);

// GET /api/audit - Get audit logs
router.get("/", authorize("admin", "auditor"), async (req, res) => {
  res.json({
    success: true,
    data: [],
    message: "Audit logs - to be implemented",
  });
});

module.exports = router;
