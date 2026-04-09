require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("../config/database");

async function seed() {
  console.log("🌱 Starting database seeding...");

  try {
    // 1. Create Departments
    console.log("📂 Creating departments...");
    const departments = [
      {
        name: "Computer Science",
        code: "CS",
        description: "Computer Science and IT Department",
      },
      {
        name: "Mechanical Engineering",
        code: "MECH",
        description: "Mechanical Engineering Department",
      },
      {
        name: "Electrical Engineering",
        code: "EE",
        description: "Electrical and Electronics Department",
      },
      {
        name: "Civil Engineering",
        code: "CIVIL",
        description: "Civil Engineering Department",
      },
      {
        name: "Administration",
        code: "ADMIN",
        description: "Administrative Department",
      },
    ];

    const deptIds = {};
    for (const dept of departments) {
      const result = await db.query(
        "INSERT INTO departments (name, code, description) VALUES ($1, $2, $3) RETURNING id",
        [dept.name, dept.code, dept.description]
      );
      deptIds[dept.code] = result.rows[0].id;
      console.log(`  ✓ Created department: ${dept.name}`);
    }

    // 2. Create Users
    console.log("👥 Creating users...");
    const salt = await bcrypt.genSalt(12);
    const defaultPassword = await bcrypt.hash("Admin@123", salt);
    const staffPassword = await bcrypt.hash("Staff@123", salt);

    const users = [
      {
        name: "System Admin",
        email: "admin@inventory.com",
        password_hash: defaultPassword,
        role: "admin",
        department_id: null,
      },
      {
        name: "CS Department Head",
        email: "cs.staff@inventory.com",
        password_hash: staffPassword,
        role: "department_staff",
        department_id: deptIds.CS,
      },
      {
        name: "Mech Department Staff",
        email: "mech.staff@inventory.com",
        password_hash: staffPassword,
        role: "department_staff",
        department_id: deptIds.MECH,
      },
      {
        name: "EE Department Staff",
        email: "ee.staff@inventory.com",
        password_hash: staffPassword,
        role: "department_staff",
        department_id: deptIds.EE,
      },
      {
        name: "System Auditor",
        email: "auditor@inventory.com",
        password_hash: staffPassword,
        role: "auditor",
        department_id: null,
      },
    ];

    const userIds = {};
    for (const user of users) {
      const result = await db.query(
        "INSERT INTO users (name, email, password_hash, role, department_id, phone) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id",
        [
          user.name,
          user.email,
          user.password_hash,
          user.role,
          user.department_id,
          "1234567890",
        ]
      );
      userIds[user.email] = result.rows[0].id;
      console.log(`  ✓ Created user: ${user.name} (${user.email})`);
    }

    // 3. Create Categories
    console.log("📑 Creating categories...");
    const categories = [
      { name: "Lab Equipment" },
      { name: "Electronics" },
      { name: "Stationery" },
      { name: "Furniture" },
      { name: "Software" },
      { name: "Tools" },
    ];

    const categoryIds = {};
    for (const category of categories) {
      const result = await db.query(
        "INSERT INTO categories (name) VALUES ($1) RETURNING id",
        [category.name]
      );
      categoryIds[category.name] = result.rows[0].id;
      console.log(`  ✓ Created category: ${category.name}`);
    }

    // 4. Create Suppliers
    console.log("🏢 Creating suppliers...");
    const suppliers = [
      {
        name: "TechMart Solutions",
        contact_person: "John Doe",
        email: "john@techmart.com",
        phone: "9876543210",
        address: "Tech Park, City",
      },
      {
        name: "OfficeSupply Co.",
        contact_person: "Jane Smith",
        email: "jane@officesupply.com",
        phone: "9876543211",
        address: "Business District",
      },
      {
        name: "ElectroShop",
        contact_person: "Bob Wilson",
        email: "bob@electroshop.com",
        phone: "9876543212",
        address: "Electronics Plaza",
      },
    ];

    const supplierIds = {};
    for (const supplier of suppliers) {
      const result = await db.query(
        "INSERT INTO suppliers (name, contact_person, email, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING id",
        [
          supplier.name,
          supplier.contact_person,
          supplier.email,
          supplier.phone,
          supplier.address,
        ]
      );
      supplierIds[supplier.name] = result.rows[0].id;
      console.log(`  ✓ Created supplier: ${supplier.name}`);
    }

    // 5. Create Items
    console.log("📦 Creating items...");
    const items = [
      {
        item_code: "CS-001",
        name: "Dell Laptop i7",
        sku: "DELL-I7-16GB",
        category_id: categoryIds["Electronics"],
        department_id: deptIds.CS,
        quantity_total: 10,
        quantity_available: 10,
        unit_price: 75000,
        date_of_purchase: "2024-01-15",
        supplier_id: supplierIds["TechMart Solutions"],
        location: "Lab 101",
        min_threshold: 2,
        condition: "new",
      },
      {
        item_code: "CS-002",
        name: "Arduino Uno Kit",
        sku: "ARD-UNO-R3",
        category_id: categoryIds["Lab Equipment"],
        department_id: deptIds.CS,
        quantity_total: 25,
        quantity_available: 20,
        unit_price: 2500,
        date_of_purchase: "2024-02-10",
        supplier_id: supplierIds["TechMart Solutions"],
        location: "Lab 101",
        min_threshold: 5,
        condition: "new",
      },
      {
        item_code: "CS-003",
        name: "Multimeter Digital",
        sku: "MM-DT830B",
        category_id: categoryIds["Lab Equipment"],
        department_id: deptIds.CS,
        quantity_total: 15,
        quantity_available: 12,
        unit_price: 1200,
        date_of_purchase: "2024-03-05",
        supplier_id: supplierIds["ElectroShop"],
        location: "Lab 102",
        min_threshold: 3,
        condition: "good",
      },
      {
        item_code: "MECH-001",
        name: "Vernier Caliper",
        sku: "VC-150MM",
        category_id: categoryIds["Tools"],
        department_id: deptIds.MECH,
        quantity_total: 20,
        quantity_available: 18,
        unit_price: 800,
        date_of_purchase: "2024-01-20",
        supplier_id: supplierIds["TechMart Solutions"],
        location: "Workshop A",
        min_threshold: 4,
        condition: "new",
      },
      {
        item_code: "MECH-002",
        name: "Lathe Machine Parts",
        sku: "LMP-SET-01",
        category_id: categoryIds["Tools"],
        department_id: deptIds.MECH,
        quantity_total: 50,
        quantity_available: 45,
        unit_price: 500,
        date_of_purchase: "2024-02-15",
        supplier_id: supplierIds["TechMart Solutions"],
        location: "Workshop B",
        min_threshold: 10,
        condition: "new",
      },
      {
        item_code: "EE-001",
        name: "Oscilloscope",
        sku: "OSC-100MHZ",
        category_id: categoryIds["Lab Equipment"],
        department_id: deptIds.EE,
        quantity_total: 5,
        quantity_available: 4,
        unit_price: 45000,
        date_of_purchase: "2024-01-10",
        supplier_id: supplierIds["ElectroShop"],
        location: "EE Lab 1",
        min_threshold: 1,
        condition: "new",
      },
      {
        item_code: "EE-002",
        name: "Resistor Kit",
        sku: "RES-KIT-1000",
        category_id: categoryIds["Electronics"],
        department_id: deptIds.EE,
        quantity_total: 100,
        quantity_available: 85,
        unit_price: 150,
        date_of_purchase: "2024-03-01",
        supplier_id: supplierIds["ElectroShop"],
        location: "EE Lab 2",
        min_threshold: 20,
        condition: "new",
      },
      {
        item_code: "CIVIL-001",
        name: "Total Station",
        sku: "TS-SURVEY-01",
        category_id: categoryIds["Lab Equipment"],
        department_id: deptIds.CIVIL,
        quantity_total: 3,
        quantity_available: 2,
        unit_price: 250000,
        date_of_purchase: "2023-12-15",
        supplier_id: supplierIds["TechMart Solutions"],
        location: "Survey Lab",
        min_threshold: 1,
        condition: "good",
      },
      {
        item_code: "ADMIN-001",
        name: "Office Chair",
        sku: "CHAIR-ERG-01",
        category_id: categoryIds["Furniture"],
        department_id: deptIds.ADMIN,
        quantity_total: 30,
        quantity_available: 25,
        unit_price: 8000,
        date_of_purchase: "2024-01-05",
        supplier_id: supplierIds["OfficeSupply Co."],
        location: "Admin Block",
        min_threshold: 5,
        condition: "new",
      },
      {
        item_code: "ADMIN-002",
        name: "Printer Paper A4",
        sku: "PAPER-A4-500",
        category_id: categoryIds["Stationery"],
        department_id: deptIds.ADMIN,
        quantity_total: 100,
        quantity_available: 8,
        unit_price: 300,
        date_of_purchase: "2024-10-01",
        supplier_id: supplierIds["OfficeSupply Co."],
        location: "Store Room",
        min_threshold: 10,
        condition: "new",
      },
    ];

    for (const item of items) {
      await db.query(
        `INSERT INTO items (item_code, name, sku, category_id, department_id, quantity_total, quantity_available, 
         unit_price, date_of_purchase, supplier_id, location, min_threshold, condition, created_by, quantity_issued)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)`,
        [
          item.item_code,
          item.name,
          item.sku,
          item.category_id,
          item.department_id,
          item.quantity_total,
          item.quantity_available,
          item.unit_price,
          item.date_of_purchase,
          item.supplier_id,
          item.location,
          item.min_threshold,
          item.condition,
          userIds["admin@inventory.com"],
          item.quantity_total - item.quantity_available,
        ]
      );
      console.log(`  ✓ Created item: ${item.name}`);
    }

    // 6. Create some sample issues
    console.log("📋 Creating sample issues...");
    await db.query(
      `INSERT INTO issues (issue_no, item_id, quantity, recipient_type, recipient_name, recipient_id, 
       issued_by, issue_date, expected_return_date, status, purpose)
       VALUES 
       ('ISS-2024-001', (SELECT id FROM items WHERE item_code = 'CS-002'), 5, 'student', 'Rahul Kumar', 'CS2021001', 
        $1, CURRENT_TIMESTAMP - INTERVAL '10 days', CURRENT_DATE + INTERVAL '5 days', 'issued', 'IoT Project'),
       ('ISS-2024-002', (SELECT id FROM items WHERE item_code = 'MECH-001'), 2, 'faculty', 'Prof. Sharma', 'FAC-MECH-01', 
        $2, CURRENT_TIMESTAMP - INTERVAL '5 days', CURRENT_DATE + INTERVAL '10 days', 'issued', 'Lab Session')`,
      [userIds["cs.staff@inventory.com"], userIds["mech.staff@inventory.com"]]
    );
    console.log("  ✓ Created sample issues");

    console.log("\n✅ Database seeding completed successfully!");
    console.log("\n📋 Default Credentials:");
    console.log("  Admin: admin@inventory.com / Admin@123");
    console.log("  CS Staff: cs.staff@inventory.com / Staff@123");
    console.log("  Auditor: auditor@inventory.com / Staff@123");
    console.log("\n⚠️  Please change these passwords in production!\n");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    throw error;
  } finally {
    await db.pool.end();
  }
}

// Run seed
seed();
