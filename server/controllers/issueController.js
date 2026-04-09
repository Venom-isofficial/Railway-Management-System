const db = require("../config/database");
const { createAuditLog } = require("../utils/auditLogger");

// Create new issue
const createIssue = async (req, res) => {
  try {
    const {
      item_id,
      quantity,
      recipient_type,
      recipient_name,
      recipient_id,
      recipient_department,
      expected_return_date,
      purpose,
      notes,
    } = req.body;

    const user = req.user;

    // Validate required fields
    if (!item_id || !quantity || !recipient_type || !recipient_name) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: item, quantity, recipient type, recipient name",
      });
    }

    // Get item details and check availability
    const itemResult = await db.query(
      "SELECT * FROM items WHERE id = $1 AND is_deleted = false",
      [item_id]
    );

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const item = itemResult.rows[0];

    // Check if staff is issuing from their own department
    if (
      user.role === "department_staff" &&
      item.department_id !== user.department_id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only issue items from your own department",
      });
    }

    // Check if sufficient quantity is available
    if (item.quantity_available < quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient quantity. Available: ${item.quantity_available}, Requested: ${quantity}`,
      });
    }

    // Generate unique issue number
    const issueCountResult = await db.query(
      "SELECT COUNT(*) as count FROM issues"
    );
    const issueCount = parseInt(issueCountResult.rows[0].count) + 1;
    const issue_no = `ISS-${new Date().getFullYear()}-${String(
      issueCount
    ).padStart(4, "0")}`;

    // Start transaction
    await db.query("BEGIN");

    try {
      // Create issue record
      const insertIssueQuery = `
        INSERT INTO issues (
          issue_no, item_id, quantity, recipient_type, recipient_name,
          recipient_id, recipient_department, issued_by, issue_date,
          expected_return_date, status, purpose, notes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, CURRENT_DATE, $9, $10, $11, $12
        ) RETURNING *
      `;

      const issueValues = [
        issue_no,
        item_id,
        quantity,
        recipient_type,
        recipient_name,
        recipient_id || null,
        recipient_department || null,
        user.id,
        expected_return_date || null,
        "issued",
        purpose || null,
        notes || null,
      ];

      const issueResult = await db.query(insertIssueQuery, issueValues);
      const newIssue = issueResult.rows[0];

      // Update item quantities
      await db.query(
        `UPDATE items 
         SET quantity_available = quantity_available - $1,
             quantity_issued = quantity_issued + $1,
             updated_at = NOW()
         WHERE id = $2`,
        [quantity, item_id]
      );

      // Commit transaction
      await db.query("COMMIT");

      // Create audit log
      await createAuditLog({
        entity_type: "issue",
        entity_id: newIssue.id,
        action: "create",
        old_value: null,
        new_value: newIssue,
        performed_by: user.id,
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
      });

      // Fetch complete issue details with item and user info
      const completeIssueQuery = `
        SELECT 
          iss.*,
          i.name as item_name,
          i.item_code,
          i.category_id,
          c.name as category_name,
          d.name as department_name,
          u.name as issued_by_name
        FROM issues iss
        LEFT JOIN items i ON iss.item_id = i.id
        LEFT JOIN categories c ON i.category_id = c.id
        LEFT JOIN departments d ON i.department_id = d.id
        LEFT JOIN users u ON iss.issued_by = u.id
        WHERE iss.id = $1
      `;

      const completeResult = await db.query(completeIssueQuery, [newIssue.id]);

      res.status(201).json({
        success: true,
        message: "Issue created successfully",
        data: completeResult.rows[0],
      });
    } catch (error) {
      // Rollback transaction on error
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error creating issue:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create issue",
      error: error.message,
    });
  }
};

// Get all issues with filters
const getAllIssues = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      item_id,
      recipient_type,
      date_from,
      date_to,
    } = req.query;

    const offset = (page - 1) * limit;
    const user = req.user;

    // Build WHERE clause
    let whereConditions = ["1=1"];
    let queryParams = [];
    let paramIndex = 1;

    // Department staff can only see their department's issues
    if (user.role === "department_staff") {
      whereConditions.push(`i.department_id = $${paramIndex}`);
      queryParams.push(user.department_id);
      paramIndex++;
    }

    // Status filter
    if (status) {
      whereConditions.push(`iss.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Item filter
    if (item_id) {
      whereConditions.push(`iss.item_id = $${paramIndex}`);
      queryParams.push(item_id);
      paramIndex++;
    }

    // Recipient type filter
    if (recipient_type) {
      whereConditions.push(`iss.recipient_type = $${paramIndex}`);
      queryParams.push(recipient_type);
      paramIndex++;
    }

    // Date range filter
    if (date_from) {
      whereConditions.push(`iss.issue_date >= $${paramIndex}`);
      queryParams.push(date_from);
      paramIndex++;
    }

    if (date_to) {
      whereConditions.push(`iss.issue_date <= $${paramIndex}`);
      queryParams.push(date_to);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM issues iss
      LEFT JOIN items i ON iss.item_id = i.id
      WHERE ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get issues
    const issuesQuery = `
      SELECT 
        iss.*,
        i.name as item_name,
        i.item_code,
        i.image_url as item_image,
        c.name as category_name,
        d.name as department_name,
        u.name as issued_by_name,
        CASE 
          WHEN iss.expected_return_date IS NOT NULL 
               AND iss.expected_return_date < CURRENT_DATE 
               AND iss.status = 'issued'
          THEN true 
          ELSE false 
        END as is_overdue
      FROM issues iss
      LEFT JOIN items i ON iss.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN users u ON iss.issued_by = u.id
      WHERE ${whereClause}
      ORDER BY iss.issue_date DESC, iss.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const issuesResult = await db.query(issuesQuery, queryParams);

    res.json({
      success: true,
      data: issuesResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching issues:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch issues",
      error: error.message,
    });
  }
};

// Get single issue by ID
const getIssueById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const query = `
      SELECT 
        iss.*,
        i.name as item_name,
        i.item_code,
        i.image_url as item_image,
        c.name as category_name,
        d.id as department_id,
        d.name as department_name,
        u.name as issued_by_name,
        u.email as issued_by_email,
        CASE 
          WHEN iss.expected_return_date IS NOT NULL 
               AND iss.expected_return_date < CURRENT_DATE 
               AND iss.status = 'issued'
          THEN true 
          ELSE false 
        END as is_overdue
      FROM issues iss
      LEFT JOIN items i ON iss.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN users u ON iss.issued_by = u.id
      WHERE iss.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    const issue = result.rows[0];

    // Check department access for staff
    if (
      user.role === "department_staff" &&
      issue.department_id !== user.department_id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this issue",
      });
    }

    // Get return history if any
    const returnsQuery = `
      SELECT 
        r.*,
        u.name as returned_by_name
      FROM returns r
      LEFT JOIN users u ON r.returned_by = u.id
      WHERE r.issue_id = $1
      ORDER BY r.return_date DESC
    `;
    const returnsResult = await db.query(returnsQuery, [id]);

    res.json({
      success: true,
      data: {
        ...issue,
        returns: returnsResult.rows,
      },
    });
  } catch (error) {
    console.error("Error fetching issue:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch issue",
      error: error.message,
    });
  }
};

// Process return
const processReturn = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity_returned, condition, remarks } = req.body;
    const user = req.user;

    // Validate required fields
    if (!quantity_returned || !condition) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: quantity, condition",
      });
    }

    // Get issue details
    const issueResult = await db.query(
      `SELECT iss.*, i.department_id 
       FROM issues iss
       LEFT JOIN items i ON iss.item_id = i.id
       WHERE iss.id = $1`,
      [id]
    );

    if (issueResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Issue not found",
      });
    }

    const issue = issueResult.rows[0];

    // Check department access
    if (
      user.role === "department_staff" &&
      issue.department_id !== user.department_id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied to process this return",
      });
    }

    // Check if issue is already returned
    if (issue.status === "returned") {
      return res.status(400).json({
        success: false,
        message: "This issue has already been fully returned",
      });
    }

    // Get total already returned
    const returnedResult = await db.query(
      "SELECT COALESCE(SUM(quantity_returned), 0) as total_returned FROM returns WHERE issue_id = $1",
      [id]
    );
    const totalReturned = parseInt(returnedResult.rows[0].total_returned);
    const remainingQuantity = issue.quantity - totalReturned;

    // Validate return quantity
    if (quantity_returned > remainingQuantity) {
      return res.status(400).json({
        success: false,
        message: `Cannot return ${quantity_returned}. Only ${remainingQuantity} items are pending return.`,
      });
    }

    // Start transaction
    await db.query("BEGIN");

    try {
      // Create return record
      const insertReturnQuery = `
        INSERT INTO returns (
          issue_id, item_id, quantity_returned, returned_by,
          return_date, condition, remarks
        ) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, $6)
        RETURNING *
      `;

      const returnValues = [
        id,
        issue.item_id,
        quantity_returned,
        user.id,
        condition,
        remarks || null,
      ];

      const returnResult = await db.query(insertReturnQuery, returnValues);
      const newReturn = returnResult.rows[0];

      // Update item quantities
      await db.query(
        `UPDATE items 
         SET quantity_available = quantity_available + $1,
             quantity_issued = quantity_issued - $1,
             updated_at = NOW()
         WHERE id = $2`,
        [quantity_returned, issue.item_id]
      );

      // Update issue status
      const newTotalReturned = totalReturned + quantity_returned;
      const newStatus =
        newTotalReturned >= issue.quantity ? "returned" : "partial_return";

      await db.query(
        "UPDATE issues SET status = $1, updated_at = NOW() WHERE id = $2",
        [newStatus, id]
      );

      // Commit transaction
      await db.query("COMMIT");

      // Create audit log
      await createAuditLog({
        entity_type: "return",
        entity_id: newReturn.id,
        action: "create",
        old_value: null,
        new_value: newReturn,
        performed_by: user.id,
        ip_address: req.ip,
        user_agent: req.get("user-agent"),
      });

      res.json({
        success: true,
        message: "Return processed successfully",
        data: {
          return: newReturn,
          issue_status: newStatus,
          remaining_quantity: issue.quantity - newTotalReturned,
        },
      });
    } catch (error) {
      // Rollback transaction on error
      await db.query("ROLLBACK");
      throw error;
    }
  } catch (error) {
    console.error("Error processing return:", error);
    res.status(500).json({
      success: false,
      message: "Failed to process return",
      error: error.message,
    });
  }
};

// Get overdue issues
const getOverdueIssues = async (req, res) => {
  try {
    const user = req.user;

    let whereConditions = [
      "iss.status = 'issued'",
      "iss.expected_return_date IS NOT NULL",
      "iss.expected_return_date < CURRENT_DATE",
    ];
    let queryParams = [];
    let paramIndex = 1;

    // Department staff can only see their department's issues
    if (user.role === "department_staff") {
      whereConditions.push(`i.department_id = $${paramIndex}`);
      queryParams.push(user.department_id);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    const query = `
      SELECT 
        iss.*,
        i.name as item_name,
        i.item_code,
        d.name as department_name,
        u.name as issued_by_name,
        CURRENT_DATE - iss.expected_return_date as days_overdue
      FROM issues iss
      LEFT JOIN items i ON iss.item_id = i.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN users u ON iss.issued_by = u.id
      WHERE ${whereClause}
      ORDER BY days_overdue DESC
    `;

    const result = await db.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching overdue issues:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch overdue issues",
      error: error.message,
    });
  }
};

module.exports = {
  createIssue,
  getAllIssues,
  getIssueById,
  processReturn,
  getOverdueIssues,
};
