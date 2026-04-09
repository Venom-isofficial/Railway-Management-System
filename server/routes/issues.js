const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const {
  createIssue,
  getAllIssues,
  getIssueById,
  processReturn,
  getOverdueIssues,
} = require("../controllers/issueController");

router.use(authenticate);

// GET /api/issues/overdue - Get overdue issues (before /:id route)
router.get("/overdue", getOverdueIssues);

// GET /api/issues - Get all issues
router.get("/", getAllIssues);

// POST /api/issues - Create new issue
router.post("/", createIssue);

// GET /api/issues/:id - Get issue by ID
router.get("/:id", getIssueById);

// POST /api/issues/:id/return - Process return
router.post("/:id/return", processReturn);

module.exports = router;
