const db = require("../config/database");

/**
 * Create audit log entry
 * @param {Object} params - Audit log parameters
 * @param {string} params.entity_type - Type of entity (user, item, issue, etc.)
 * @param {string} params.entity_id - ID of the entity
 * @param {string} params.action - Action performed (create, update, delete, issue, return, login, logout)
 * @param {Object} params.old_value - Old value (for updates)
 * @param {Object} params.new_value - New value (for updates/creates)
 * @param {number} params.performed_by - User ID who performed the action
 * @param {string} params.ip_address - IP address
 * @param {string} params.user_agent - User agent string
 */
async function createAuditLog({
  entity_type,
  entity_id,
  action,
  old_value = null,
  new_value = null,
  performed_by,
  ip_address = null,
  user_agent = null,
}) {
  try {
    await db.query(
      `INSERT INTO audit_logs 
       (entity_type, entity_id, action, old_value, new_value, performed_by, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        entity_type,
        entity_id,
        action,
        old_value ? JSON.stringify(old_value) : null,
        new_value ? JSON.stringify(new_value) : null,
        performed_by,
        ip_address,
        user_agent,
      ]
    );
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // Don't throw error - audit log failure shouldn't break main functionality
  }
}

/**
 * Get audit logs with filters
 */
async function getAuditLogs({
  entity_type,
  entity_id,
  action,
  performed_by,
  date_from,
  date_to,
  limit = 100,
  offset = 0,
}) {
  try {
    let query = `
      SELECT 
        al.*,
        u.name as performed_by_name,
        u.email as performed_by_email
      FROM audit_logs al
      LEFT JOIN users u ON al.performed_by = u.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (entity_type) {
      query += ` AND al.entity_type = $${paramCount}`;
      params.push(entity_type);
      paramCount++;
    }

    if (entity_id) {
      query += ` AND al.entity_id = $${paramCount}`;
      params.push(entity_id);
      paramCount++;
    }

    if (action) {
      query += ` AND al.action = $${paramCount}`;
      params.push(action);
      paramCount++;
    }

    if (performed_by) {
      query += ` AND al.performed_by = $${paramCount}`;
      params.push(performed_by);
      paramCount++;
    }

    if (date_from) {
      query += ` AND al.performed_at >= $${paramCount}`;
      params.push(date_from);
      paramCount++;
    }

    if (date_to) {
      query += ` AND al.performed_at <= $${paramCount}`;
      params.push(date_to);
      paramCount++;
    }

    query += ` ORDER BY al.performed_at DESC LIMIT $${paramCount} OFFSET $${
      paramCount + 1
    }`;
    params.push(limit, offset);

    const result = await db.query(query, params);
    return result.rows;
  } catch (error) {
    console.error("Failed to get audit logs:", error);
    throw error;
  }
}

module.exports = {
  createAuditLog,
  getAuditLogs,
};
