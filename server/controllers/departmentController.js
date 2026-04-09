const { validationResult } = require("express-validator");
const db = require("../config/database");
const { createAuditLog } = require("../utils/auditLogger");

/**
 * Get all departments
 */
exports.getAllDepartments = async (req, res) => {
  try {
    const query = `
      SELECT 
        d.*,
        COUNT(DISTINCT u.id) FILTER (WHERE u.is_active = true) as active_users,
        COUNT(DISTINCT i.id) FILTER (WHERE i.is_deleted = false) as total_items,
        COALESCE(SUM(i.quantity_available), 0) as available_quantity,
        COALESCE(SUM(i.quantity_issued), 0) as issued_quantity
      FROM departments d
      LEFT JOIN users u ON d.id = u.department_id
      LEFT JOIN items i ON d.id = i.department_id
      GROUP BY d.id
      ORDER BY d.name ASC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("Error fetching departments:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch departments",
      error: error.message,
    });
  }
};

/**
 * Get department by ID
 */
exports.getDepartmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        d.*,
        COUNT(DISTINCT u.id) FILTER (WHERE u.is_active = true) as active_users,
        COUNT(DISTINCT i.id) FILTER (WHERE i.is_deleted = false) as total_items,
        COALESCE(SUM(i.quantity_available), 0) as available_quantity,
        COALESCE(SUM(i.quantity_issued), 0) as issued_quantity,
        COALESCE(SUM(i.quantity_total * i.unit_price), 0) as total_value
      FROM departments d
      LEFT JOIN users u ON d.id = u.department_id
      LEFT JOIN items i ON d.id = i.department_id
      WHERE d.id = $1
      GROUP BY d.id
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Get users in this department
    const usersResult = await db.query(
      `SELECT id, name, email, role, phone, is_active 
       FROM users 
       WHERE department_id = $1 
       ORDER BY name ASC`,
      [id]
    );

    const department = {
      ...result.rows[0],
      users: usersResult.rows,
    };

    res.json({
      success: true,
      data: department,
    });
  } catch (error) {
    console.error("Error fetching department:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch department",
      error: error.message,
    });
  }
};

/**
 * Create new department
 */
exports.createDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, code, description, head_name, location, budget } = req.body;

    // Check if code already exists
    const existingDept = await db.query(
      "SELECT id FROM departments WHERE code = $1",
      [code.toUpperCase()]
    );

    if (existingDept.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Department code already exists",
      });
    }

    // Check if name already exists
    const existingName = await db.query(
      "SELECT id FROM departments WHERE name = $1",
      [name]
    );

    if (existingName.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Department name already exists",
      });
    }

    const result = await db.query(
      `INSERT INTO departments (name, code, description)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name, code.toUpperCase(), description || null]
    );

    const newDepartment = result.rows[0];

    // Create audit log
    await createAuditLog({
      entity_type: "department",
      entity_id: newDepartment.id.toString(),
      action: "create",
      new_value: newDepartment,
      performed_by: req.user.id,
      ip_address: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "Department created successfully",
      data: newDepartment,
    });
  } catch (error) {
    console.error("Error creating department:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create department",
      error: error.message,
    });
  }
};

/**
 * Update department
 */
exports.updateDepartment = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { name, code, description } = req.body;

    // Get current department data
    const currentResult = await db.query(
      "SELECT * FROM departments WHERE id = $1",
      [id]
    );

    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    const currentDept = currentResult.rows[0];

    // Check if code is being changed and if it already exists
    if (code && code.toUpperCase() !== currentDept.code) {
      const existingCode = await db.query(
        "SELECT id FROM departments WHERE code = $1 AND id != $2",
        [code.toUpperCase(), id]
      );

      if (existingCode.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Department code already exists",
        });
      }
    }

    // Check if name is being changed and if it already exists
    if (name && name !== currentDept.name) {
      const existingName = await db.query(
        "SELECT id FROM departments WHERE name = $1 AND id != $2",
        [name, id]
      );

      if (existingName.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Department name already exists",
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }

    if (code !== undefined) {
      updates.push(`code = $${paramCount}`);
      params.push(code.toUpperCase());
      paramCount++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramCount}`);
      params.push(description);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    params.push(id);
    const query = `UPDATE departments SET ${updates.join(
      ", "
    )}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, params);
    const updatedDept = result.rows[0];

    // Create audit log
    await createAuditLog({
      entity_type: "department",
      entity_id: id,
      action: "update",
      old_value: currentDept,
      new_value: updatedDept,
      performed_by: req.user.id,
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: "Department updated successfully",
      data: updatedDept,
    });
  } catch (error) {
    console.error("Error updating department:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update department",
      error: error.message,
    });
  }
};

/**
 * Delete department
 */
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if department exists
    const deptResult = await db.query(
      "SELECT * FROM departments WHERE id = $1",
      [id]
    );

    if (deptResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Department not found",
      });
    }

    // Check if department has users
    const usersResult = await db.query(
      "SELECT COUNT(*) as count FROM users WHERE department_id = $1",
      [id]
    );

    if (parseInt(usersResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete department with assigned users",
      });
    }

    // Check if department has items
    const itemsResult = await db.query(
      "SELECT COUNT(*) as count FROM items WHERE department_id = $1 AND is_deleted = false",
      [id]
    );

    if (parseInt(itemsResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: "Cannot delete department with items",
      });
    }

    // Delete department
    await db.query("DELETE FROM departments WHERE id = $1", [id]);

    // Create audit log
    await createAuditLog({
      entity_type: "department",
      entity_id: id,
      action: "delete",
      old_value: deptResult.rows[0],
      performed_by: req.user.id,
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: "Department deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting department:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete department",
      error: error.message,
    });
  }
};
