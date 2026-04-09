-- Department Inventory Management System - Database Schema
-- PostgreSQL Database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS returns CASCADE;
DROP TABLE IF EXISTS issues CASCADE;
DROP TABLE IF EXISTS items CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS settings CASCADE;

-- Departments Table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    code VARCHAR(20) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'department_staff', 'auditor')),
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories Table
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Suppliers Table
CREATE TABLE suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(150),
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Items Table
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    item_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    sku VARCHAR(50),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    quantity_total INTEGER NOT NULL DEFAULT 0 CHECK (quantity_total >= 0),
    quantity_available INTEGER NOT NULL DEFAULT 0 CHECK (quantity_available >= 0),
    quantity_issued INTEGER NOT NULL DEFAULT 0 CHECK (quantity_issued >= 0),
    unit_price DECIMAL(10, 2),
    date_of_purchase DATE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    location VARCHAR(150),
    min_threshold INTEGER DEFAULT 10,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'damaged', 'repair', 'retired')),
    condition VARCHAR(50) DEFAULT 'new' CHECK (condition IN ('new', 'good', 'fair', 'damaged')),
    image_url TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Issues Table
CREATE TABLE issues (
    id SERIAL PRIMARY KEY,
    issue_no VARCHAR(50) UNIQUE NOT NULL,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    recipient_type VARCHAR(50) NOT NULL CHECK (recipient_type IN ('student', 'faculty', 'department', 'staff')),
    recipient_name VARCHAR(150) NOT NULL,
    recipient_id VARCHAR(50),
    recipient_department VARCHAR(100),
    issued_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    issue_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expected_return_date DATE,
    status VARCHAR(50) DEFAULT 'issued' CHECK (status IN ('issued', 'returned', 'partial_return', 'overdue', 'damaged')),
    purpose TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Returns Table
CREATE TABLE returns (
    id SERIAL PRIMARY KEY,
    issue_id INTEGER NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    item_id INTEGER NOT NULL REFERENCES items(id) ON DELETE RESTRICT,
    quantity_returned INTEGER NOT NULL CHECK (quantity_returned > 0),
    returned_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    return_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    condition VARCHAR(50) NOT NULL CHECK (condition IN ('good', 'fair', 'damaged', 'lost')),
    remarks TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Logs Table
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('create', 'update', 'delete', 'issue', 'return', 'login', 'logout')),
    old_value JSONB,
    new_value JSONB,
    performed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address VARCHAR(50),
    user_agent TEXT,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Settings Table
CREATE TABLE settings (
    id SERIAL PRIMARY KEY,
    key VARCHAR(100) NOT NULL UNIQUE,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for Performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_items_code ON items(item_code);
CREATE INDEX idx_items_name ON items(name);
CREATE INDEX idx_items_department ON items(department_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_items_status ON items(status);
CREATE INDEX idx_items_deleted ON items(is_deleted);
CREATE INDEX idx_issues_item ON issues(item_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_date ON issues(issue_date);
CREATE INDEX idx_issues_no ON issues(issue_no);
CREATE INDEX idx_returns_issue ON returns(issue_id);
CREATE INDEX idx_returns_date ON returns(return_date);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_performed_at ON audit_logs(performed_at);
CREATE INDEX idx_audit_performed_by ON audit_logs(performed_by);

-- Create Functions for Updated Timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create Triggers for Updated Timestamp
CREATE TRIGGER update_departments_updated_at BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_items_updated_at BEFORE UPDATE ON items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_issues_updated_at BEFORE UPDATE ON issues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert Default Settings
INSERT INTO settings (key, value, description) VALUES
('default_low_stock_threshold', '10', 'Default minimum quantity threshold for low stock alerts'),
('max_issue_duration_days', '30', 'Maximum number of days an item can be issued'),
('enable_email_notifications', 'true', 'Enable email notifications for issues and returns'),
('system_name', 'Department Inventory Management System', 'System name displayed in UI'),
('auto_generate_issue_no', 'true', 'Automatically generate issue numbers');

-- Comments for Documentation
COMMENT ON TABLE departments IS 'Stores department information';
COMMENT ON TABLE users IS 'Stores user accounts with role-based access';
COMMENT ON TABLE categories IS 'Item categories for classification';
COMMENT ON TABLE suppliers IS 'Supplier information for purchased items';
COMMENT ON TABLE items IS 'Main inventory items table';
COMMENT ON TABLE issues IS 'Tracks item issues to users/departments';
COMMENT ON TABLE returns IS 'Tracks item returns';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for all actions';
COMMENT ON TABLE settings IS 'System-wide configuration settings';

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO inventory_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO inventory_user;
