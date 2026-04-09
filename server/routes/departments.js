const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authenticate = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const {
  getAllDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} = require("../controllers/departmentController");

router.use(authenticate);

// GET /api/departments - Get all departments
router.get("/", getAllDepartments);

// GET /api/departments/:id - Get department by ID
router.get("/:id", getDepartmentById);

// POST /api/departments - Create new department
router.post(
  "/",
  authorize("admin"),
  [
    body("name").trim().notEmpty().withMessage("Department name is required"),
    body("code").trim().notEmpty().withMessage("Department code is required"),
    body("description").optional(),
    body("head_name").optional(),
    body("location").optional(),
    body("budget")
      .optional()
      .isNumeric()
      .withMessage("Budget must be a number"),
  ],
  createDepartment
);

// PUT /api/departments/:id - Update department
router.put(
  "/:id",
  authorize("admin"),
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
    body("code")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Code cannot be empty"),
    body("description").optional(),
    body("head_name").optional(),
    body("location").optional(),
    body("budget")
      .optional()
      .isNumeric()
      .withMessage("Budget must be a number"),
  ],
  updateDepartment
);

// DELETE /api/departments/:id - Delete department
router.delete("/:id", authorize("admin"), deleteDepartment);

module.exports = router;
