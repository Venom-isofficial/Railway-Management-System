const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const authenticate = require("../middleware/auth");
const { authorize } = require("../middleware/rbac");
const userController = require("../controllers/userController");

// All routes require authentication
router.use(authenticate);

// @route   GET /api/users
// @desc    Get all users
// @access  Admin only
router.get("/", authorize("admin"), userController.getAllUsers);

// @route   GET /api/users/:id
// @desc    Get user by ID
// @access  Admin or self
router.get("/:id", userController.getUserById);

// @route   POST /api/users
// @desc    Create new user
// @access  Admin only
router.post(
  "/",
  authorize("admin"),
  [
    body("name").trim().notEmpty().withMessage("Name is required"),
    body("email")
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters")
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])/)
      .withMessage(
        "Password must contain uppercase, lowercase, number and special character"
      ),
    body("role")
      .isIn(["admin", "department_staff", "auditor"])
      .withMessage("Invalid role"),
    body("department_id")
      .optional()
      .isInt()
      .withMessage("Invalid department ID"),
  ],
  userController.createUser
);

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Admin or self (limited fields)
router.put(
  "/:id",
  [
    body("name")
      .optional()
      .trim()
      .notEmpty()
      .withMessage("Name cannot be empty"),
    body("email")
      .optional()
      .isEmail()
      .normalizeEmail()
      .withMessage("Valid email is required"),
    body("phone").optional(),
    body("role")
      .optional()
      .isIn(["admin", "department_staff", "auditor"])
      .withMessage("Invalid role"),
    body("department_id").optional(),
  ],
  userController.updateUser
);

// @route   DELETE /api/users/:id
// @desc    Delete (deactivate) user
// @access  Admin only
router.delete("/:id", authorize("admin"), userController.deleteUser);

// @route   PUT /api/users/:id/activate
// @desc    Activate user
// @access  Admin only
router.put("/:id/activate", authorize("admin"), userController.activateUser);

module.exports = router;
