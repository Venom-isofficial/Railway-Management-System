const express = require("express");
const router = express.Router();
const authenticate = require("../middleware/auth");
const db = require("../config/database");

router.use(authenticate);

router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM categories ORDER BY name ASC");
    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
});

module.exports = router;
