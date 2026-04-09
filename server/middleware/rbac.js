const db = require("../config/database");

// Check if user has required role
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }

    next();
  };
};

// Check if user can access specific department data
const checkDepartmentAccess = async (req, res, next) => {
  try {
    const { user } = req;
    const departmentId =
      req.params.departmentId ||
      req.query.department_id ||
      req.body.department_id;

    // Admin can access all departments
    if (user.role === "admin" || user.role === "auditor") {
      return next();
    }

    // Department staff can only access their own department
    if (user.role === "department_staff") {
      if (!user.department_id) {
        return res.status(403).json({
          success: false,
          message: "You are not assigned to any department",
        });
      }

      if (departmentId && parseInt(departmentId) !== user.department_id) {
        return res.status(403).json({
          success: false,
          message: "You can only access your own department data",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Department access check error:", error);
    return res.status(500).json({
      success: false,
      message: "Authorization check failed",
    });
  }
};

// Check if user can modify specific item
const checkItemAccess = async (req, res, next) => {
  try {
    const { user } = req;
    const itemId = req.params.id || req.body.item_id;

    // Admin can modify all items
    if (user.role === "admin") {
      return next();
    }

    // Get item's department
    const result = await db.query(
      "SELECT department_id FROM items WHERE id = $1 AND is_deleted = false",
      [itemId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const itemDepartmentId = result.rows[0].department_id;

    // Department staff can only modify items in their department
    if (user.role === "department_staff") {
      if (itemDepartmentId !== user.department_id) {
        return res.status(403).json({
          success: false,
          message: "You can only modify items in your department",
        });
      }
    }

    next();
  } catch (error) {
    console.error("Item access check error:", error);
    return res.status(500).json({
      success: false,
      message: "Authorization check failed",
    });
  }
};

module.exports = {
  authorize,
  checkDepartmentAccess,
  checkItemAccess,
};
