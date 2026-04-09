const db = require("../config/database");
const { createAuditLog } = require("../utils/auditLogger");

// Get all items with filters, search, and pagination
const getAllItems = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      department_id,
      category_id,
      status,
      sort_by = "created_at",
      sort_order = "DESC",
    } = req.query;

    const offset = (page - 1) * limit;
    const user = req.user;

    // Build WHERE clause based on role
    let whereConditions = ["i.is_deleted = false"];
    let queryParams = [];
    let paramIndex = 1;

    // Department staff can only see their department's items
    if (user.role === "department_staff") {
      whereConditions.push(`i.department_id = $${paramIndex}`);
      queryParams.push(user.department_id);
      paramIndex++;
    } else if (department_id) {
      // Admin/Auditor can filter by department
      whereConditions.push(`i.department_id = $${paramIndex}`);
      queryParams.push(department_id);
      paramIndex++;
    }

    // Search filter
    if (search) {
      whereConditions.push(
        `(i.name ILIKE $${paramIndex} OR i.item_code ILIKE $${paramIndex} OR i.sku ILIKE $${paramIndex})`
      );
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Category filter
    if (category_id) {
      whereConditions.push(`i.category_id = $${paramIndex}`);
      queryParams.push(category_id);
      paramIndex++;
    }

    // Status filter
    if (status) {
      whereConditions.push(`i.status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    const whereClause = whereConditions.join(" AND ");

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM items i
      WHERE ${whereClause}
    `;
    const countResult = await db.query(countQuery, queryParams);
    const total = parseInt(countResult.rows[0].total);

    // Get items with related data
    const itemsQuery = `
      SELECT 
        i.*,
        c.name as category_name,
        d.name as department_name,
        d.code as department_code,
        s.name as supplier_name,
        u.name as created_by_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE ${whereClause}
      ORDER BY i.${sort_by} ${sort_order}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);
    const itemsResult = await db.query(itemsQuery, queryParams);

    res.json({
      success: true,
      data: itemsResult.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch items",
      error: error.message,
    });
  }
};

// Get single item by ID
const getItemById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    const query = `
      SELECT 
        i.*,
        c.name as category_name,
        d.name as department_name,
        d.code as department_code,
        s.name as supplier_name,
        s.contact_person as supplier_contact,
        u.name as created_by_name
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      LEFT JOIN suppliers s ON i.supplier_id = s.id
      LEFT JOIN users u ON i.created_by = u.id
      WHERE i.id = $1 AND i.is_deleted = false
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const item = result.rows[0];

    // Check department access for staff
    if (
      user.role === "department_staff" &&
      item.department_id !== user.department_id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this item",
      });
    }

    res.json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error("Error fetching item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch item",
      error: error.message,
    });
  }
};

// Create new item
const createItem = async (req, res) => {
  try {
    const {
      name,
      sku,
      category_id,
      department_id,
      quantity_total,
      unit_price,
      date_of_purchase,
      supplier_id,
      location,
      min_threshold,
      condition,
      notes,
    } = req.body;

    const user = req.user;

    // Validate required fields
    if (!name || !category_id || !department_id || !quantity_total) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: name, category, department, quantity",
      });
    }

    // Check if staff is adding item to their own department
    if (
      user.role === "department_staff" &&
      parseInt(department_id) !== user.department_id
    ) {
      return res.status(403).json({
        success: false,
        message: "You can only add items to your own department",
      });
    }

    // Generate unique item code
    const deptResult = await db.query(
      "SELECT code FROM departments WHERE id = $1",
      [department_id]
    );
    if (deptResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid department",
      });
    }

    const deptCode = deptResult.rows[0].code;

    // Get next item number for this department
    const countResult = await db.query(
      "SELECT COUNT(*) as count FROM items WHERE department_id = $1",
      [department_id]
    );
    const itemNumber = parseInt(countResult.rows[0].count) + 1;
    const item_code = `${deptCode}-${String(itemNumber).padStart(3, "0")}`;

    // Handle image upload
    const image_url = req.file ? `/uploads/items/${req.file.filename}` : null;

    // Insert item
    const insertQuery = `
      INSERT INTO items (
        item_code, name, sku, category_id, department_id,
        quantity_total, quantity_available, quantity_issued,
        unit_price, date_of_purchase, supplier_id, location,
        min_threshold, status, condition, image_url, notes, created_by
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18
      ) RETURNING *
    `;

    const values = [
      item_code,
      name,
      sku || null,
      category_id,
      department_id,
      quantity_total,
      quantity_total, // quantity_available = quantity_total initially
      0, // quantity_issued = 0 initially
      unit_price || null,
      date_of_purchase || null,
      supplier_id || null,
      location || null,
      min_threshold || 10,
      "active",
      condition || "good",
      image_url,
      notes || null,
      user.id,
    ];

    const result = await db.query(insertQuery, values);
    const newItem = result.rows[0];

    // Log audit
    await createAuditLog({
      entity_type: "item",
      entity_id: newItem.id,
      action: "create",
      old_value: null,
      new_value: newItem,
      performed_by: user.id,
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
    });

    res.status(201).json({
      success: true,
      message: "Item created successfully",
      data: newItem,
    });
  } catch (error) {
    console.error("Error creating item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create item",
      error: error.message,
    });
  }
};

// Update item
const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Get existing item
    const existingResult = await db.query(
      "SELECT * FROM items WHERE id = $1 AND is_deleted = false",
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const existingItem = existingResult.rows[0];

    // Check department access
    if (
      user.role === "department_staff" &&
      existingItem.department_id !== user.department_id
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied to update this item",
      });
    }

    const {
      name,
      sku,
      category_id,
      department_id,
      quantity_total,
      unit_price,
      date_of_purchase,
      supplier_id,
      location,
      min_threshold,
      status,
      condition,
      notes,
    } = req.body;

    // Handle image upload
    const image_url = req.file
      ? `/uploads/items/${req.file.filename}`
      : existingItem.image_url;

    // Update item
    const updateQuery = `
      UPDATE items SET
        name = COALESCE($1, name),
        sku = COALESCE($2, sku),
        category_id = COALESCE($3, category_id),
        department_id = COALESCE($4, department_id),
        quantity_total = COALESCE($5, quantity_total),
        unit_price = COALESCE($6, unit_price),
        date_of_purchase = COALESCE($7, date_of_purchase),
        supplier_id = COALESCE($8, supplier_id),
        location = COALESCE($9, location),
        min_threshold = COALESCE($10, min_threshold),
        status = COALESCE($11, status),
        condition = COALESCE($12, condition),
        image_url = COALESCE($13, image_url),
        notes = COALESCE($14, notes),
        updated_at = NOW()
      WHERE id = $15
      RETURNING *
    `;

    const values = [
      name,
      sku,
      category_id,
      department_id,
      quantity_total,
      unit_price,
      date_of_purchase,
      supplier_id,
      location,
      min_threshold,
      status,
      condition,
      image_url,
      notes,
      id,
    ];

    const result = await db.query(updateQuery, values);
    const updatedItem = result.rows[0];

    // Log audit
    await createAuditLog({
      entity_type: "item",
      entity_id: id,
      action: "update",
      old_value: existingItem,
      new_value: updatedItem,
      performed_by: user.id,
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Item updated successfully",
      data: updatedItem,
    });
  } catch (error) {
    console.error("Error updating item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update item",
      error: error.message,
    });
  }
};

// Soft delete item
const deleteItem = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Only admin can delete items
    if (user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Only administrators can delete items",
      });
    }

    // Get existing item
    const existingResult = await db.query(
      "SELECT * FROM items WHERE id = $1 AND is_deleted = false",
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Item not found",
      });
    }

    const existingItem = existingResult.rows[0];

    // Soft delete
    await db.query(
      "UPDATE items SET is_deleted = true, updated_at = NOW() WHERE id = $1",
      [id]
    );

    // Log audit
    await createAuditLog({
      entity_type: "item",
      entity_id: id,
      action: "delete",
      old_value: existingItem,
      new_value: { ...existingItem, is_deleted: true },
      performed_by: user.id,
      ip_address: req.ip,
      user_agent: req.get("user-agent"),
    });

    res.json({
      success: true,
      message: "Item deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting item:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete item",
      error: error.message,
    });
  }
};

// Get low stock items
const getLowStockItems = async (req, res) => {
  try {
    const user = req.user;

    let whereClause =
      "i.quantity_available <= i.min_threshold AND i.is_deleted = false";
    let queryParams = [];

    // Department staff can only see their department's items
    if (user.role === "department_staff") {
      whereClause += " AND i.department_id = $1";
      queryParams.push(user.department_id);
    }

    const query = `
      SELECT 
        i.*,
        c.name as category_name,
        d.name as department_name,
        d.code as department_code
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN departments d ON i.department_id = d.id
      WHERE ${whereClause}
      ORDER BY (i.quantity_available::float / NULLIF(i.min_threshold, 0)) ASC
    `;

    const result = await db.query(query, queryParams);

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("Error fetching low stock items:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch low stock items",
      error: error.message,
    });
  }
};

module.exports = {
  getAllItems,
  getItemById,
  createItem,
  updateItem,
  deleteItem,
  getLowStockItems,
};
