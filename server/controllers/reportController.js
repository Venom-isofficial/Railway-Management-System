const db = require("../config/database");

/**
 * Get Complete Inventory Report
 * Shows all items with quantities, values, and department info
 */
const getInventoryReport = async (req, res) => {
  try {
    const { department_id, category_id, status } = req.query;
    const user = req.user;

    let query = `
      SELECT 
        i.id,
        i.item_code,
        i.name,
        i.sku,
        i.quantity_total,
        i.quantity_available,
        i.quantity_issued,
        i.unit_price,
        i.status,
        i.condition,
        i.date_of_purchase,
        c.name as category_name,
        d.name as department_name,
        d.code as department_code,
        s.name as supplier_name,
        (i.quantity_total * i.unit_price) as total_value,
        (i.quantity_available * i.unit_price) as available_value,
        (i.quantity_issued * i.unit_price) as issued_value
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.is_deleted = false
    `;

    const params = [];
    let paramIndex = 1;

    // Department access control
    if (user.role === "department_staff" && user.department_id) {
      query += ` AND i.department_id = $${paramIndex}`;
      params.push(user.department_id);
      paramIndex++;
    } else if (department_id) {
      query += ` AND i.department_id = $${paramIndex}`;
      params.push(department_id);
      paramIndex++;
    }

    if (category_id) {
      query += ` AND i.category_id = $${paramIndex}`;
      params.push(category_id);
      paramIndex++;
    }

    if (status) {
      query += ` AND i.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY d.name, i.name`;

    const result = await db.query(query, params);

    // Calculate summary statistics
    const summary = {
      total_items: result.rows.length,
      total_quantity: result.rows.reduce(
        (sum, item) => sum + parseInt(item.quantity_total),
        0
      ),
      available_quantity: result.rows.reduce(
        (sum, item) => sum + parseInt(item.quantity_available),
        0
      ),
      issued_quantity: result.rows.reduce(
        (sum, item) => sum + parseInt(item.quantity_issued),
        0
      ),
      total_value: result.rows.reduce(
        (sum, item) => sum + parseFloat(item.total_value || 0),
        0
      ),
      available_value: result.rows.reduce(
        (sum, item) => sum + parseFloat(item.available_value || 0),
        0
      ),
      issued_value: result.rows.reduce(
        (sum, item) => sum + parseFloat(item.issued_value || 0),
        0
      ),
    };

    res.json({
      success: true,
      data: {
        items: result.rows,
        summary,
      },
    });
  } catch (error) {
    console.error("Error generating inventory report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate inventory report",
      error: error.message,
    });
  }
};

/**
 * Get Low Stock Report
 * Shows items below their minimum threshold
 */
const getLowStockReport = async (req, res) => {
  try {
    const { department_id } = req.query;
    const user = req.user;

    let query = `
      SELECT 
        i.id,
        i.item_code,
        i.name,
        i.sku,
        i.quantity_available,
        i.min_threshold,
        (i.min_threshold - i.quantity_available) as shortage,
        i.unit_price,
        i.status,
        c.name as category_name,
        d.name as department_name,
        d.code as department_code,
        s.name as supplier_name,
        s.contact_person,
        s.email as supplier_email,
        s.phone as supplier_phone
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      WHERE i.is_deleted = false 
        AND i.quantity_available <= i.min_threshold
    `;

    const params = [];
    let paramIndex = 1;

    // Department access control
    if (user.role === "department_staff" && user.department_id) {
      query += ` AND i.department_id = $${paramIndex}`;
      params.push(user.department_id);
      paramIndex++;
    } else if (department_id) {
      query += ` AND i.department_id = $${paramIndex}`;
      params.push(department_id);
      paramIndex++;
    }

    query += ` ORDER BY (i.min_threshold - i.quantity_available) DESC, d.name, i.name`;

    const result = await db.query(query, params);

    // Calculate summary
    const summary = {
      critical_items: result.rows.filter(
        (item) => item.quantity_available === 0
      ).length,
      low_stock_items: result.rows.filter((item) => item.quantity_available > 0)
        .length,
      total_shortage: result.rows.reduce(
        (sum, item) => sum + parseInt(item.shortage),
        0
      ),
      estimated_reorder_cost: result.rows.reduce(
        (sum, item) =>
          sum + parseFloat(item.unit_price) * parseInt(item.shortage),
        0
      ),
    };

    res.json({
      success: true,
      data: {
        items: result.rows,
        summary,
      },
    });
  } catch (error) {
    console.error("Error generating low stock report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate low stock report",
      error: error.message,
    });
  }
};

/**
 * Get Issued Items Report
 * Shows all issued items with date filters
 */
const getIssuedItemsReport = async (req, res) => {
  try {
    const { department_id, start_date, end_date, status } = req.query;
    const user = req.user;

    let query = `
      SELECT 
        iss.id,
        iss.issue_no,
        iss.quantity,
        iss.recipient_type,
        iss.recipient_name,
        iss.recipient_id,
        iss.recipient_department,
        iss.status,
        iss.purpose,
        iss.issue_date,
        iss.expected_return_date,
        CASE 
          WHEN iss.status = 'issued' AND iss.expected_return_date < CURRENT_DATE 
          THEN true 
          ELSE false 
        END as is_overdue,
        CASE 
          WHEN iss.status = 'issued' AND iss.expected_return_date < CURRENT_DATE 
          THEN CURRENT_DATE - iss.expected_return_date 
          ELSE 0 
        END as days_overdue,
        i.item_code,
        i.name as item_name,
        i.unit_price,
        (iss.quantity * i.unit_price) as issued_value,
        d.name as department_name,
        d.code as department_code,
        u.name as issued_by_name
      FROM issues iss
      JOIN items i ON iss.item_id = i.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN users u ON iss.issued_by = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    // Department access control
    if (user.role === "department_staff" && user.department_id) {
      query += ` AND i.department_id = $${paramIndex}`;
      params.push(user.department_id);
      paramIndex++;
    } else if (department_id) {
      query += ` AND i.department_id = $${paramIndex}`;
      params.push(department_id);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND iss.issue_date >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND iss.issue_date <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (status) {
      query += ` AND iss.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` ORDER BY iss.issue_date DESC`;

    const result = await db.query(query, params);

    // Calculate summary
    const summary = {
      total_issues: result.rows.length,
      active_issues: result.rows.filter((item) => item.status === "issued")
        .length,
      overdue_issues: result.rows.filter((item) => item.is_overdue).length,
      partial_returns: result.rows.filter(
        (item) => item.status === "partial_return"
      ).length,
      completed_returns: result.rows.filter(
        (item) => item.status === "returned"
      ).length,
      total_issued_value: result.rows
        .filter((item) => item.status === "issued")
        .reduce((sum, item) => sum + parseFloat(item.issued_value || 0), 0),
      total_quantity_issued: result.rows
        .filter((item) => item.status === "issued")
        .reduce((sum, item) => sum + parseInt(item.quantity), 0),
    };

    res.json({
      success: true,
      data: {
        items: result.rows,
        summary,
      },
    });
  } catch (error) {
    console.error("Error generating issued items report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate issued items report",
      error: error.message,
    });
  }
};

/**
 * Get Department-wise Report
 * Shows inventory breakdown by department
 */
const getDepartmentReport = async (req, res) => {
  try {
    const user = req.user;

    let query = `
      SELECT 
        d.id,
        d.name,
        d.code,
        d.description,
        COUNT(DISTINCT i.id) as total_items,
        COALESCE(SUM(i.quantity_total), 0) as total_quantity,
        COALESCE(SUM(i.quantity_available), 0) as available_quantity,
        COALESCE(SUM(i.quantity_issued), 0) as issued_quantity,
        COALESCE(SUM(i.quantity_total * i.unit_price), 0) as total_value,
        COALESCE(SUM(i.quantity_available * i.unit_price), 0) as available_value,
        COUNT(DISTINCT CASE WHEN i.quantity_available <= i.min_threshold THEN i.id END) as low_stock_count,
        COUNT(DISTINCT iss.id) FILTER (WHERE iss.status = 'issued') as active_issues
      FROM departments d
      LEFT JOIN items i ON d.id = i.department_id AND i.is_deleted = false
      LEFT JOIN issues iss ON i.id = iss.item_id
    `;

    const params = [];

    // Department access control
    if (user.role === "department_staff" && user.department_id) {
      query += ` WHERE d.id = $1`;
      params.push(user.department_id);
    }

    query += ` GROUP BY d.id, d.name, d.code, d.description ORDER BY d.name`;

    const result = await db.query(query, params);

    // Calculate totals
    const totals = {
      total_departments: result.rows.length,
      total_items: result.rows.reduce(
        (sum, dept) => sum + parseInt(dept.total_items),
        0
      ),
      total_quantity: result.rows.reduce(
        (sum, dept) => sum + parseInt(dept.total_quantity),
        0
      ),
      total_value: result.rows.reduce(
        (sum, dept) => sum + parseFloat(dept.total_value),
        0
      ),
      total_low_stock: result.rows.reduce(
        (sum, dept) => sum + parseInt(dept.low_stock_count),
        0
      ),
      total_active_issues: result.rows.reduce(
        (sum, dept) => sum + parseInt(dept.active_issues),
        0
      ),
    };

    res.json({
      success: true,
      data: {
        departments: result.rows,
        totals,
      },
    });
  } catch (error) {
    console.error("Error generating department report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate department report",
      error: error.message,
    });
  }
};

/**
 * Get Audit Trail Report
 * Shows all audit logs with filters
 */
const getAuditReport = async (req, res) => {
  try {
    const { entity_type, start_date, end_date, performed_by } = req.query;
    const { page = 1, limit = 50 } = req.query;

    let query = `
      SELECT 
        al.id,
        al.entity_type,
        al.entity_id,
        al.action,
        al.old_value,
        al.new_value,
        al.ip_address,
        al.performed_at,
        u.name as performed_by_name,
        u.email as performed_by_email,
        u.role as performed_by_role
      FROM audit_logs al
      LEFT JOIN users u ON al.performed_by = u.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (entity_type) {
      query += ` AND al.entity_type = $${paramIndex}`;
      params.push(entity_type);
      paramIndex++;
    }

    if (start_date) {
      query += ` AND al.performed_at >= $${paramIndex}`;
      params.push(start_date);
      paramIndex++;
    }

    if (end_date) {
      query += ` AND al.performed_at <= $${paramIndex}`;
      params.push(end_date);
      paramIndex++;
    }

    if (performed_by) {
      query += ` AND al.performed_by = $${paramIndex}`;
      params.push(performed_by);
      paramIndex++;
    }

    // Count total
    const countQuery = query.replace(
      /SELECT[\s\S]*FROM/,
      "SELECT COUNT(*) as total FROM"
    );
    const countResult = await db.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Add pagination
    const offset = (page - 1) * limit;
    query += ` ORDER BY al.performed_at DESC LIMIT $${paramIndex} OFFSET ${
      paramIndex + 1
    }`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      success: true,
      data: {
        logs: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error("Error generating audit report:", error);
    res.status(500).json({
      success: false,
      message: "Failed to generate audit report",
      error: error.message,
    });
  }
};

module.exports = {
  getInventoryReport,
  getLowStockReport,
  getIssuedItemsReport,
  getDepartmentReport,
  getAuditReport,
};
