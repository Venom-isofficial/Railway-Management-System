const bcrypt = require("bcryptjs");
const { validationResult } = require("express-validator");
const db = require("../config/database");
const { createAuditLog } = require("../utils/auditLogger");

// @desc    Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const {
      role,
      department_id,
      is_active,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    let query = `
      SELECT 
        u.id, u.name, u.email, u.role, u.phone, u.avatar_url, 
        u.is_active, u.last_login, u.created_at,
        d.id as department_id, d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE 1=1
    `;

    const params = [];
    let paramCount = 1;

    if (role) {
      query += ` AND u.role = $${paramCount}`;
      params.push(role);
      paramCount++;
    }

    if (department_id) {
      query += ` AND u.department_id = $${paramCount}`;
      params.push(department_id);
      paramCount++;
    }

    if (is_active !== undefined) {
      query += ` AND u.is_active = $${paramCount}`;
      params.push(is_active === "true");
      paramCount++;
    }

    if (search) {
      query += ` AND (u.name ILIKE $${paramCount} OR u.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
      paramCount++;
    }

    // Get total count
    const countQuery = `SELECT COUNT(*) FROM (${query}) as count_query`;
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY u.created_at DESC LIMIT $${paramCount} OFFSET $${
      paramCount + 1
    }`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    // Format response
    const users = result.rows.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at,
      department: user.department_id
        ? {
            id: user.department_id,
            name: user.department_name,
            code: user.department_code,
          }
        : null,
    }));

    res.json({
      success: true,
      data: users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Get users error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch users",
    });
  }
};

// @desc    Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check permission: admin can view all, others only themselves
    if (req.user.role !== "admin" && req.user.id !== parseInt(id)) {
      return res.status(403).json({
        success: false,
        message: "You can only view your own profile",
      });
    }

    const result = await db.query(
      `SELECT 
        u.id, u.name, u.email, u.role, u.phone, u.avatar_url, 
        u.is_active, u.last_login, u.created_at, u.updated_at,
        d.id as department_id, d.name as department_name, d.code as department_code
       FROM users u
       LEFT JOIN departments d ON u.department_id = d.id
       WHERE u.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = result.rows[0];
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar_url: user.avatar_url,
      is_active: user.is_active,
      last_login: user.last_login,
      created_at: user.created_at,
      updated_at: user.updated_at,
      department: user.department_id
        ? {
            id: user.department_id,
            name: user.department_name,
            code: user.department_code,
          }
        : null,
    };

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch user",
    });
  }
};

// @desc    Create new user
exports.createUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { name, email, password, role, department_id, phone } = req.body;

    // Check if email already exists
    const existingUser = await db.query(
      "SELECT id FROM users WHERE email = $1",
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const password_hash = await bcrypt.hash(password, salt);

    // Create user
    const result = await db.query(
      `INSERT INTO users (name, email, password_hash, role, department_id, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, name, email, role, department_id, phone, created_at`,
      [
        name,
        email.toLowerCase(),
        password_hash,
        role,
        department_id || null,
        phone || null,
      ]
    );

    const newUser = result.rows[0];

    // Create audit log
    await createAuditLog({
      entity_type: "user",
      entity_id: newUser.id.toString(),
      action: "create",
      new_value: { name, email, role, department_id },
      performed_by: req.user.id,
      ip_address: req.ip,
    });

    res.status(201).json({
      success: true,
      message: "User created successfully",
      data: newUser,
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create user",
    });
  }
};

// @desc    Update user
exports.updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { id } = req.params;
    const { name, email, phone, role, department_id } = req.body;

    // Check permission
    const isAdmin = req.user.role === "admin";
    const isSelf = req.user.id === parseInt(id);

    if (!isAdmin && !isSelf) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own profile",
      });
    }

    // Non-admin users can only update limited fields
    if (!isAdmin && (role || department_id !== undefined)) {
      return res.status(403).json({
        success: false,
        message: "You cannot change role or department",
      });
    }

    // Get current user data
    const currentResult = await db.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (currentResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const currentUser = currentResult.rows[0];

    // Check if email is being changed and if it already exists
    if (email && email.toLowerCase() !== currentUser.email) {
      const existingUser = await db.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email.toLowerCase(), id]
      );

      if (existingUser.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
    }

    // Build update query
    const updates = [];
    const params = [];
    let paramCount = 1;

    if (name) {
      updates.push(`name = $${paramCount}`);
      params.push(name);
      paramCount++;
    }

    if (email) {
      updates.push(`email = $${paramCount}`);
      params.push(email.toLowerCase());
      paramCount++;
    }

    if (phone !== undefined) {
      updates.push(`phone = $${paramCount}`);
      params.push(phone);
      paramCount++;
    }

    if (isAdmin && role) {
      updates.push(`role = $${paramCount}`);
      params.push(role);
      paramCount++;
    }

    if (isAdmin && department_id !== undefined) {
      updates.push(`department_id = $${paramCount}`);
      params.push(department_id);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No fields to update",
      });
    }

    params.push(id);
    const query = `UPDATE users SET ${updates.join(
      ", "
    )} WHERE id = $${paramCount} RETURNING *`;

    const result = await db.query(query, params);
    const updatedUser = result.rows[0];

    // Create audit log
    await createAuditLog({
      entity_type: "user",
      entity_id: id,
      action: "update",
      old_value: currentUser,
      new_value: updatedUser,
      performed_by: req.user.id,
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: "User updated successfully",
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        phone: updatedUser.phone,
        department_id: updatedUser.department_id,
      },
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update user",
    });
  }
};

// @desc    Delete (deactivate) user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Cannot delete yourself
    if (req.user.id === parseInt(id)) {
      return res.status(400).json({
        success: false,
        message: "You cannot deactivate your own account",
      });
    }

    // Get user data before deletion
    const userResult = await db.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Soft delete
    await db.query("UPDATE users SET is_active = false WHERE id = $1", [id]);

    // Create audit log
    await createAuditLog({
      entity_type: "user",
      entity_id: id,
      action: "delete",
      old_value: userResult.rows[0],
      performed_by: req.user.id,
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: "User deactivated successfully",
    });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate user",
    });
  }
};

// @desc    Activate user
exports.activateUser = async (req, res) => {
  try {
    const { id } = req.params;

    await db.query("UPDATE users SET is_active = true WHERE id = $1", [id]);

    // Create audit log
    await createAuditLog({
      entity_type: "user",
      entity_id: id,
      action: "update",
      new_value: { is_active: true },
      performed_by: req.user.id,
      ip_address: req.ip,
    });

    res.json({
      success: true,
      message: "User activated successfully",
    });
  } catch (error) {
    console.error("Activate user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to activate user",
    });
  }
};
