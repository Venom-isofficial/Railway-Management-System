const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const authenticate = require("../middleware/auth");
const { checkDepartmentAccess } = require("../middleware/rbac");
const {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getLowStockItems,
} = require("../controllers/itemController");

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "../../uploads/items");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, "item-" + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(
      path.extname(file.originalname).toLowerCase()
    );
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error("Only image files are allowed!"));
  },
});

router.use(authenticate);

// GET /api/items/low-stock - Get low stock items (before /:id route)
router.get("/low-stock", getLowStockItems);

// GET /api/items - Get all items with filters
router.get("/", getAllItems);

// POST /api/items - Create new item
router.post("/", upload.single("image"), createItem);

// GET /api/items/:id - Get item by ID
router.get("/:id", getItemById);

// PUT /api/items/:id - Update item
router.put("/:id", upload.single("image"), updateItem);

// DELETE /api/items/:id - Soft delete item
router.delete("/:id", deleteItem);

// POST /api/items/bulk-upload - Bulk CSV upload
router.post("/bulk-upload", upload.single("file"), async (req, res) => {
  res.json({ success: true, message: "Bulk upload - to be implemented" });
});

module.exports = router;
