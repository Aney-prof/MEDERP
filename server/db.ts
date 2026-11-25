import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

// Ensure data folder exists
const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'pharmacy.db');
export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and WAL mode for reliability
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    -- Core System Settings
    CREATE TABLE IF NOT EXISTS settings (
      section TEXT PRIMARY KEY,
      data_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by TEXT
    );

    -- Users and Authentication
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL, -- 'owner_admin' | 'pharmacist' | 'cashier' | 'inventory_staff' | 'auditor'
      avatar_initials TEXT,
      pharmacist_reg_no TEXT,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Audit Logs
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      user_id TEXT NOT NULL,
      user_name TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      details_json TEXT
    );

    -- Branches / Stores
    CREATE TABLE IF NOT EXISTS branches (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      address TEXT NOT NULL,
      is_primary INTEGER DEFAULT 0
    );

    -- Suppliers / C&F Distributors
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_person TEXT,
      phone TEXT NOT NULL,
      email TEXT,
      address TEXT,
      gstin TEXT,
      dl_number TEXT,
      payment_terms_days INTEGER DEFAULT 21,
      outstanding_balance REAL DEFAULT 0.0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Medicine Catalogue
    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      code TEXT UNIQUE NOT NULL,
      barcode TEXT,
      brand_name TEXT NOT NULL,
      generic_composition TEXT NOT NULL,
      strength TEXT,
      dosage_form TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      hsn_code TEXT NOT NULL,
      gst_percent REAL NOT NULL,
      pack_unit TEXT NOT NULL,       -- e.g. 'Strip', 'Box', 'Bottle', 'Vial'
      base_unit TEXT NOT NULL,       -- e.g. 'Tablet', 'Capsule', 'ml', 'Piece'
      units_per_pack INTEGER NOT NULL DEFAULT 1, -- e.g. 10 tablets per strip
      mrp REAL NOT NULL,
      purchase_rate REAL NOT NULL,
      schedule TEXT NOT NULL DEFAULT 'OTC', -- 'OTC' | 'Schedule H' | 'Schedule H1' | 'Narcotic' | 'Schedule X'
      category TEXT NOT NULL DEFAULT 'Allopathic',
      temperature_requirement TEXT,
      min_stock_alert INTEGER DEFAULT 20,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL
    );

    -- Batches (Batch-Level Inventory)
    CREATE TABLE IF NOT EXISTS batches (
      id TEXT PRIMARY KEY,
      medicine_id TEXT NOT NULL,
      batch_number TEXT NOT NULL,
      mfg_date TEXT NOT NULL,         -- YYYY-MM
      expiry_date TEXT NOT NULL,      -- YYYY-MM
      supplier_id TEXT,
      purchase_invoice_id TEXT,
      branch_id TEXT NOT NULL,
      location_rack TEXT NOT NULL,    -- e.g. 'Rack A-01', 'Fridge-1'
      purchase_rate REAL NOT NULL,
      mrp REAL NOT NULL,
      sale_rate REAL NOT NULL,
      wholesale_rate REAL NOT NULL,
      quantity_base_units INTEGER NOT NULL DEFAULT 0,
      reorder_level_base_units INTEGER NOT NULL DEFAULT 50,
      status TEXT NOT NULL DEFAULT 'AVAILABLE', -- 'AVAILABLE' | 'HELD' | 'DAMAGED' | 'EXPIRED' | 'QUARANTINE'
      is_damaged INTEGER DEFAULT 0,
      received_date TEXT NOT NULL,
      FOREIGN KEY (medicine_id) REFERENCES medicines(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- Stock Movement Ledger
    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      medicine_id TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      movement_type TEXT NOT NULL, -- 'PURCHASE_RECEIPT' | 'SALE' | 'SALE_RETURN' | 'SUPPLIER_RETURN' | 'STOCK_ADJUSTMENT' | 'TRANSFER' | 'QUARANTINE'
      quantity_base_units INTEGER NOT NULL, -- can be positive (inward) or negative (outward)
      balance_after_base_units INTEGER NOT NULL,
      reference_type TEXT,        -- 'INVOICE' | 'PURCHASE_ORDER' | 'CUSTOMER_RETURN' | 'SUPPLIER_RETURN' | 'PHYSICAL_AUDIT'
      reference_id TEXT,
      user_id TEXT,
      user_name TEXT,
      notes TEXT
    );

    -- Purchases & Invoices
    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      purchase_number TEXT UNIQUE NOT NULL,
      invoice_number TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      invoice_date TEXT NOT NULL,
      received_date TEXT NOT NULL,
      branch_id TEXT NOT NULL,
      subtotal REAL NOT NULL,
      tax_amount REAL NOT NULL,
      total_amount REAL NOT NULL,
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      notes TEXT,
      items_json TEXT NOT NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    );

    -- Supplier Returns & Credit Notes
    CREATE TABLE IF NOT EXISTS supplier_returns (
      id TEXT PRIMARY KEY,
      return_number TEXT UNIQUE NOT NULL,
      return_date TEXT NOT NULL,
      supplier_id TEXT NOT NULL,
      batch_id TEXT NOT NULL,
      medicine_id TEXT NOT NULL,
      quantity_base_units INTEGER NOT NULL,
      amount REAL NOT NULL,
      reason TEXT NOT NULL,
      return_type TEXT NOT NULL DEFAULT 'CREDIT_NOTE', -- 'CREDIT_NOTE' | 'REPLACEMENT' | 'REFUND'
      status TEXT NOT NULL DEFAULT 'PENDING',           -- 'PENDING' | 'SETTLED' | 'REJECTED'
      credit_note_number TEXT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (batch_id) REFERENCES batches(id)
    );

    -- Patients / Customers
    CREATE TABLE IF NOT EXISTS patients (
      id TEXT PRIMARY KEY,
      uhid TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT,
      age INTEGER NOT NULL,
      gender TEXT NOT NULL,
      blood_group TEXT NOT NULL,
      address TEXT NOT NULL,
      known_allergies_json TEXT NOT NULL,
      chronic_conditions_json TEXT NOT NULL,
      family_group_id TEXT,
      credit_balance REAL DEFAULT 0.0,
      credit_limit REAL DEFAULT 5000.0,
      total_purchases REAL DEFAULT 0.0,
      last_visit TEXT,
      created_at TEXT NOT NULL
    );

    -- Prescriptions
    CREATE TABLE IF NOT EXISTS prescriptions (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      date TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      clinic_hospital TEXT,
      doctor_reg_no TEXT,
      diagnosis TEXT,
      medicines_json TEXT NOT NULL,
      next_refill_date TEXT,
      attachment_name TEXT,
      attachment_type TEXT,
      attachment_data_base64 TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (patient_id) REFERENCES patients(id)
    );

    -- Sales Invoices
    CREATE TABLE IF NOT EXISTS sales_invoices (
      id TEXT PRIMARY KEY,
      invoice_number TEXT UNIQUE NOT NULL,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      patient_id TEXT,
      patient_name TEXT NOT NULL,
      patient_phone TEXT,
      doctor_name TEXT,
      doctor_reg_no TEXT,
      subtotal REAL NOT NULL,
      total_discount REAL NOT NULL,
      cgst_total REAL NOT NULL,
      sgst_total REAL NOT NULL,
      grand_total REAL NOT NULL,
      round_off REAL NOT NULL,
      payment_mode TEXT NOT NULL,
      payment_status TEXT NOT NULL,
      cash_received REAL,
      change_returned REAL,
      billed_by TEXT NOT NULL,
      user_id TEXT,
      items_json TEXT NOT NULL
    );

    -- Customer Returns (Sales Returns)
    CREATE TABLE IF NOT EXISTS sales_returns (
      id TEXT PRIMARY KEY,
      return_number TEXT UNIQUE NOT NULL,
      sale_id TEXT NOT NULL,
      return_date TEXT NOT NULL,
      patient_id TEXT,
      patient_name TEXT NOT NULL,
      total_refund REAL NOT NULL,
      refund_mode TEXT NOT NULL, -- 'CASH' | 'CREDIT_BALANCE' | 'ORIGINAL_MODE'
      items_json TEXT NOT NULL,
      notes TEXT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (sale_id) REFERENCES sales_invoices(id)
    );

    -- Statutory Schedule H1 Register
    CREATE TABLE IF NOT EXISTS schedule_h1_register (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      invoice_number TEXT NOT NULL,
      patient_name TEXT NOT NULL,
      patient_address TEXT NOT NULL,
      doctor_name TEXT NOT NULL,
      doctor_reg_no TEXT NOT NULL,
      medicine_name TEXT NOT NULL,
      batch_number TEXT NOT NULL,
      quantity_sold INTEGER NOT NULL
    );
  `);

  seedInitialData();
}

function seedInitialData() {
  // Check if already seeded
  const checkSettings = db.prepare('SELECT count(*) as count FROM settings').get() as { count: number };
  if (checkSettings.count > 0) return;

  const now = new Date().toISOString();

  // 1. Initial Configurable Settings (Comprehensive 9 Sections)
  const defaultSettings = {
    business: {
      storeName: 'Shakti MediStore & Healthcare ERP',
      legalEntityName: 'Shakti Healthcare Services LLP',
      address: 'Shop 12-14, Ground Floor, Shaktikunj Healthcare Complex, Near Civil Hospital Road, Mumbai - 400069',
      phone: '+91 22 2841 9900',
      email: 'admin@shaktimedi.in',
      currency: 'INR',
      currencySymbol: '₹',
      timezone: 'Asia/Kolkata',
      dateFormat: 'DD/MM/YYYY',
      financialYear: '2026 - 2027',
      invoicePrefix: 'INV-2026-',
      purchasePrefix: 'PO-2026-',
      returnPrefix: 'RET-2026-',
      supplierReturnPrefix: 'DN-2026-'
    },
    pharmacy: {
      drugLicenseNo20B: 'MH-MZ4-204918',
      drugLicenseNo21B: 'MH-MZ4-205919',
      licenseExpiryDate: '2028-12-31',
      renewalReminderDays: 90,
      pharmacistName: 'Dr. Kailash Pandey, B.Pharm',
      pharmacistRegNo: 'MH-PC-44192',
      councilState: 'Maharashtra State Pharmacy Council',
      scheduleH1VerificationRequired: true,
      narcoticsSaleLock: true
    },
    inventory: {
      defaultPackUnit: 'Strip',
      defaultBaseUnit: 'Tablet',
      fefoPriorityEnabled: true,
      allowManualBatchSelection: true,
      nearExpiryDaysThreshold: 60,
      criticalExpiryDaysThreshold: 30,
      lowStockThresholdUnits: 30,
      allowNegativeStock: false,
      negativeStockPermittedRoles: ['owner_admin'],
      blockExpiredStockSale: true,
      blockHeldStockSale: true,
      requireRackLocation: true
    },
    tax: {
      gstin: '27AABCS1429B1Z2',
      panNumber: 'AABCS1429B',
      defaultGstRate: 12,
      availableGstRates: [0, 5, 12, 18],
      roundOffMethod: 'NEAREST_RUPEE',
      autoFocusBarcode: true,
      receiptFormat: 'A4_TAX_INVOICE', // 'A4_TAX_INVOICE' | 'THERMAL_3_INCH'
      invoiceTerms: 'Goods once sold are returnable within 7 days against original bill. Scheduled drugs are dispensed exclusively against valid RMP prescription.'
    },
    sales: {
      enableDiscounts: true,
      maxCashierDiscountPercent: 10,
      enableQuantityOffers: true, // e.g. 10+1 free
      salesReturnValidityDays: 7,
      allowCustomerCreditKhata: true,
      mandatoryPatientMobileAboveAmount: 1000
    },
    purchasing: {
      reorderCalculationMethod: 'MIN_STOCK_LEVEL', // 'MIN_STOCK_LEVEL' | 'SALES_VELOCITY'
      defaultCreditPeriodDays: 21,
      defaultCsvDelimiter: ',',
      autoCreateNewBatchOnReceipt: true
    },
    security: {
      sessionTimeoutMinutes: 60,
      requirePasswordForDiscountAbove: 15,
      auditLogRetentionDays: 365,
      restrictPriceEditingToRoles: ['owner_admin', 'pharmacist']
    },
    integrations: {
      emailService: { configured: false, provider: 'SMTP', host: '', port: 587, user: '' },
      smsWhatsappGateway: { configured: false, provider: 'Karix/Gupshup', apiKeyMasked: '' },
      upiMerchant: { configured: true, upiId: 'shaktipharma@icici', merchantName: 'Shakti MediStore', dynamicQrEnabled: true },
      eInvoicePortal: { configured: false, nicEndpoint: 'https://einvoice1.gst.gov.in', status: 'NOT_CONFIGURED' },
      distributorEdi: { configured: false, status: 'NOT_CONFIGURED' }
    }
  };

  const insertSetting = db.prepare('INSERT INTO settings (section, data_json, updated_at, updated_by) VALUES (?, ?, ?, ?)');
  for (const [section, data] of Object.entries(defaultSettings)) {
    insertSetting.run(section, JSON.stringify(data), now, 'system');
  }

  // 2. Users
  const insertUser = db.prepare(`
    INSERT INTO users (id, username, password_hash, name, role, avatar_initials, pharmacist_reg_no, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run('usr-1', 'admin', 'admin123', 'Vikram Singhania (Store Director)', 'owner_admin', 'VS', null, 1, now);
  insertUser.run('usr-2', 'pharmacist', 'pharma123', 'Dr. Kailash Pandey (Chief Pharmacist)', 'pharmacist', 'KP', 'MH-PC-44192', 1, now);
  insertUser.run('usr-3', 'cashier', 'pos123', 'Sunil Jadhav (Billing Clerk)', 'cashier', 'SJ', null, 1, now);
  insertUser.run('usr-4', 'inventory', 'stock123', 'Rohan Mehta (Store Incharge)', 'inventory_staff', 'RM', null, 1, now);
  insertUser.run('usr-5', 'auditor', 'audit123', 'Meera Rao (Statutory Auditor)', 'auditor', 'MR', null, 1, now);

  // 3. Branches
  const insertBranch = db.prepare('INSERT INTO branches (id, code, name, address, is_primary) VALUES (?, ?, ?, ?, ?)');
  insertBranch.run('br-1', 'MAIN', 'Branch 01 - Main Dispensary (24x7 OPD)', 'Shaktikunj Healthcare Complex, Mumbai - 400069', 1);
  insertBranch.run('br-2', 'HOSP', 'Branch 02 - In-Hospital Chemist Wing', 'Apex Superspeciality Hospital, Andheri East, Mumbai', 0);
  insertBranch.run('br-3', 'WHSE', 'Depot 03 - Wholesale Pharma Warehouse', 'Plot 44, MIDC Industrial Area, Mumbai', 0);

  // 4. Suppliers
  const insertSupplier = db.prepare(`
    INSERT INTO suppliers (id, name, contact_person, phone, email, address, gstin, dl_number, payment_terms_days, outstanding_balance, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSupplier.run('sup-1', 'Sun Pharma Distribution Hub', 'Rajesh Varma', '+91 98201 44521', 'orders@sunpharma-hub.com', 'Gala 14, Apex Pharma Estate, Andheri East, Mumbai - 400069', '27AABCS1429B1Z2', 'MH-MZ4-204918 / 205919', 21, 14250.00, 1, now);
  insertSupplier.run('sup-2', 'Cipla Meditech Agencies', 'Kunal Singhania', '+91 94120 77812', 'kunal@ciplameditech.in', 'Plot 88, Okhla Phase 3, New Delhi - 110020', '07AAACC2211C1ZX', 'DL-SW1-102947 / 102948', 30, 8400.00, 1, now);
  insertSupplier.run('sup-3', 'Abbott Healthcare Depot', 'Priyanka Sen', '+91 97410 88923', 'depot.blr@abbott-supply.com', 'Peenya Industrial Area, Bengaluru - 560058', '29AAACA4480P1ZT', 'KA-B1-330192 / 330193', 15, 0.00, 1, now);
  insertSupplier.run('sup-4', 'Micro Labs & Generic Consortium', 'Nitin Deshmukh', '+91 98860 33119', 'distributors@microlabs.co.in', 'Survey 22, Bommasandra, Bengaluru - 560099', '29AAACM6721K1ZW', 'KA-B2-441092 / 441093', 21, 21800.00, 1, now);

  // 5. Medicines & Separate Batches (Includes acceptance test item: Fictional-Cure 500)
  const insertMedicine = db.prepare(`
    INSERT INTO medicines (id, code, barcode, brand_name, generic_composition, strength, dosage_form, manufacturer, hsn_code, gst_percent, pack_unit, base_unit, units_per_pack, mrp, purchase_rate, schedule, category, temperature_requirement, min_stock_alert, is_active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBatch = db.prepare(`
    INSERT INTO batches (id, medicine_id, batch_number, mfg_date, expiry_date, supplier_id, purchase_invoice_id, branch_id, location_rack, purchase_rate, mrp, sale_rate, wholesale_rate, quantity_base_units, reorder_level_base_units, status, is_damaged, received_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMovement = db.prepare(`
    INSERT INTO stock_movements (id, timestamp, medicine_id, batch_id, movement_type, quantity_base_units, balance_after_base_units, reference_type, reference_id, user_id, user_name, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // ACCEPTANCE TEST ITEM: Fictional-Cure 500
  // Received in TWO separate batches from different suppliers with different expiry dates and quantities!
  insertMedicine.run(
    'med-fc',
    'MED-FC-001',
    '8901234567890',
    'Fictional-Cure 500',
    'Fictionalin Sodium 500mg',
    '500 mg',
    'Tablet',
    'Apex Fictional Labs',
    '30049099',
    12.0,
    'Strip',
    'Tablet',
    10, // 1 strip = 10 tablets
    150.00,
    100.00,
    'OTC',
    'Allopathic',
    null,
    30,
    1,
    now
  );

  // Batch 1 from Supplier 1 (Sun Pharma)
  insertBatch.run(
    'b-fc-01',
    'med-fc',
    'FC-BATCH-001',
    '2026-01',
    '2027-06', // Expiry June 2027
    'sup-1',
    'PO-2026-001',
    'br-1',
    'Rack A-03',
    100.00,
    150.00,
    135.00,
    115.00,
    100, // 100 Tablets = 10 Strips
    30,
    'AVAILABLE',
    0,
    '2026-02-01'
  );
  insertMovement.run('sm-fc-01', '2026-02-01 10:00:00', 'med-fc', 'b-fc-01', 'PURCHASE_RECEIPT', 100, 100, 'PURCHASE_ORDER', 'PO-2026-001', 'usr-1', 'System Init', 'Initial inward delivery from Sun Pharma');

  // Batch 2 from Supplier 2 (Cipla)
  insertBatch.run(
    'b-fc-02',
    'med-fc',
    'FC-BATCH-002',
    '2026-03',
    '2028-02', // Expiry Feb 2028
    'sup-2',
    'PO-2026-002',
    'br-1',
    'Rack A-04',
    105.00,
    150.00,
    135.00,
    118.00,
    150, // 150 Tablets = 15 Strips
    30,
    'AVAILABLE',
    0,
    '2026-04-10'
  );
  insertMovement.run('sm-fc-02', '2026-04-10 11:30:00', 'med-fc', 'b-fc-02', 'PURCHASE_RECEIPT', 150, 150, 'PURCHASE_ORDER', 'PO-2026-002', 'usr-1', 'System Init', 'Inward delivery from Cipla Meditech');

  // Additional batch: HELD batch for acceptance testing
  insertBatch.run(
    'b-fc-held',
    'med-fc',
    'FC-HELD-003',
    '2025-05',
    '2027-04',
    'sup-1',
    'PO-2026-001',
    'br-1',
    'Quarantine Bay',
    95.00,
    150.00,
    130.00,
    110.00,
    20,
    10,
    'HELD',
    0,
    '2025-06-01'
  );

  // Additional batch: EXPIRED batch for acceptance testing
  insertBatch.run(
    'b-fc-exp',
    'med-fc',
    'FC-EXP-004',
    '2024-01',
    '2026-01', // Expired
    'sup-1',
    'PO-2025-099',
    'br-1',
    'Quarantine / Return Dump',
    90.00,
    140.00,
    125.00,
    105.00,
    15,
    10,
    'EXPIRED',
    1,
    '2024-02-15'
  );

  // Other Standard Indian Medicines
  // Med 1: Dolo 650 (Paracetamol 650mg, Strip of 15 Tablets)
  insertMedicine.run('med-1', 'MED-DOLO-650', '8901117001010', 'Dolo 650', 'Paracetamol 650 mg', '650 mg', 'Tablet', 'Micro Labs Ltd', '30049060', 12.0, 'Strip', 'Tablet', 15, 34.00, 23.50, 'OTC', 'Allopathic', null, 50, 1, now);
  insertBatch.run('b-101', 'med-1', 'DL65-24J12', '2025-10', '2027-09', 'sup-4', 'PO-2025-010', 'br-1', 'Rack A-01', 23.50, 34.00, 30.50, 26.00, 2700, 100, 'AVAILABLE', 0, '2025-11-01'); // 180 strips * 15 = 2700 tablets
  insertBatch.run('b-102', 'med-1', 'DL65-23F08', '2024-06', '2026-11', 'sup-4', 'PO-2024-080', 'br-1', 'Rack A-01 (Front)', 22.00, 32.50, 29.00, 25.00, 360, 50, 'AVAILABLE', 0, '2024-07-01'); // Near expiry

  // Med 2: Augmentin 625 Duo (Amoxicillin 500mg + Clavulanic Acid 125mg, Strip of 10 Tablets) - Schedule H1!
  insertMedicine.run('med-4', 'MED-AUG-625', '8901117002020', 'Augmentin 625 Duo', 'Amoxicillin 500 mg + Clavulanic Acid 125 mg', '625 mg', 'Tablet', 'GlaxoSmithKline (GSK)', '30041010', 12.0, 'Strip', 'Tablet', 10, 224.50, 165.00, 'Schedule H1', 'Allopathic', null, 30, 1, now);
  insertBatch.run('b-105', 'med-4', 'AUG-24K09', '2025-09', '2027-02', 'sup-2', 'PO-2025-045', 'br-1', 'Cabinet H1-01', 165.00, 224.50, 202.00, 180.00, 850, 50, 'AVAILABLE', 0, '2025-10-01');

  // Med 3: Pan-D Capsule (Capsule, Strip of 15)
  insertMedicine.run('med-6', 'MED-PAND-001', '8901117003030', 'Pan-D Capsule', 'Pantoprazole 40 mg + Domperidone 30 mg SR', '40mg + 30mg', 'Capsule', 'Alkem Laboratories', '30049099', 12.0, 'Strip', 'Capsule', 15, 235.00, 160.00, 'Schedule H', 'Allopathic', null, 40, 1, now);
  insertBatch.run('b-108', 'med-6', 'PAND-8831', '2025-11', '2027-10', 'sup-1', 'PO-2025-090', 'br-1', 'Rack B-04', 160.00, 235.00, 210.00, 185.00, 2100, 100, 'AVAILABLE', 0, '2025-12-01');

  // Med 4: Telma 40 (Telmisartan 40mg, Strip of 30 Tablets)
  insertMedicine.run('med-7', 'MED-TELMA-40', '8901117004040', 'Telma 40', 'Telmisartan 40 mg', '40 mg', 'Tablet', 'Glenmark Pharmaceuticals', '30049082', 12.0, 'Strip', 'Tablet', 30, 260.00, 182.00, 'Schedule H', 'Allopathic', null, 30, 1, now);
  insertBatch.run('b-109', 'med-7', 'TEL40-552', '2025-06', '2027-05', 'sup-1', 'PO-2025-060', 'br-1', 'Rack C-01 (Cardio)', 182.00, 260.00, 234.00, 205.00, 2700, 100, 'AVAILABLE', 0, '2025-07-01');

  // Med 5: Lantus SoloStar Pen (Cold Chain, 1 Pen)
  insertMedicine.run('med-10', 'MED-LANTUS-100', '8901117005050', 'Lantus SoloStar Pen (100 IU/ml)', 'Insulin Glargine 100 units/ml', '100 IU/ml', 'Injection', 'Sanofi India Ltd', '30043110', 5.0, 'Pen', 'Pen', 1, 985.00, 780.00, 'Schedule H', 'Cold Chain', '2°C - 8°C (Do Not Freeze)', 10, 1, now);
  insertBatch.run('b-112', 'med-10', 'LNT-87701', '2025-05', '2026-12', 'sup-3', 'PO-2025-050', 'br-1', 'Cold Storage Fridge-A', 780.00, 985.00, 890.00, 830.00, 12, 5, 'AVAILABLE', 0, '2025-06-01');

  // 6. Patients
  const insertPatient = db.prepare(`
    INSERT INTO patients (id, uhid, name, phone, email, age, gender, blood_group, address, known_allergies_json, chronic_conditions_json, family_group_id, credit_balance, credit_limit, total_purchases, last_visit, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPatient.run('pat-1', 'SH-2026-0104', 'Suresh Chandra Sharma', '+91 98112 34567', 'scsharma49@gmail.com', 62, 'Male', 'B+', 'B-402, Shivalik Residency, Sector 14, Noida, UP', JSON.stringify(['Sulfa drugs', 'Aspirin']), JSON.stringify(['Type 2 Diabetes', 'Hypertension']), 'fam-sharma', 1240.00, 5000.00, 18450.00, '2026-10-14', now);
  insertPatient.run('pat-2', 'SH-2026-0188', 'Meenakshi Iyer', '+91 98451 90812', 'meenakshi.iyer@outlook.com', 48, 'Female', 'O+', 'Flat 12, Green Glen Layout, Bellandur, Bengaluru', JSON.stringify(['Penicillin (Severe Urticaria)']), JSON.stringify(['Bronchial Asthma', 'Osteopenia']), 'fam-iyer', 0.00, 10000.00, 12900.00, '2026-10-22', now);
  insertPatient.run('pat-3', 'SH-2026-0245', 'Rameshwar Lal Patel', '+91 97230 44589', null, 71, 'Male', 'A+', 'Shop 4, GIDC Colony, Makarpura, Vadodara, Gujarat', JSON.stringify([]), JSON.stringify(['Type 1 Diabetes', 'Ischemic Heart Disease']), 'fam-patel', 3200.00, 7500.00, 34200.00, '2026-10-18', now);
  insertPatient.run('pat-4', 'SH-2026-0312', 'Ananya Deshpande', '+91 98220 11984', 'ananya.d@techcorp.in', 29, 'Female', 'AB+', 'C-7, Mayur Nagari, Pimple Saudagar, Pune', JSON.stringify([]), JSON.stringify([]), null, 0.00, 3000.00, 2450.00, '2026-10-26', now);

  // 7. Initial Prescriptions
  const insertPrescription = db.prepare(`
    INSERT INTO prescriptions (id, patient_id, date, doctor_name, clinic_hospital, doctor_reg_no, diagnosis, medicines_json, next_refill_date, attachment_name, attachment_type, attachment_data_base64, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertPrescription.run(
    'rx-201',
    'pat-1',
    '2026-10-01',
    'Dr. V. K. Aggarwal, MD (Med)',
    'Fortis Heart & Endocrine Institute',
    'DMC-24891',
    'Essential Hypertension, Glycated HbA1c 7.8%',
    JSON.stringify([
      { medicineName: 'Telma 40', dosage: '1 Tab - Morning after breakfast', durationDays: 30, refillRemaining: 3 },
      { medicineName: 'Pan-D Capsule', dosage: '1 Cap - Morning empty stomach', durationDays: 15, refillRemaining: 1 }
    ]),
    '2026-10-31',
    null,
    null,
    null,
    now
  );

  // 8. Schedule H1 Register Entry
  const insertH1 = db.prepare(`
    INSERT INTO schedule_h1_register (id, date, invoice_number, patient_name, patient_address, doctor_name, doctor_reg_no, medicine_name, batch_number, quantity_sold)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertH1.run('h1-1', '2026-10-26', 'INV-2026-0038', 'Ananya Deshpande', 'C-7, Mayur Nagari, Pune', 'Dr. Amit Joshi, MBBS', 'MMC-66231', 'Augmentin 625 Duo (Amoxicillin + Clav)', 'AUG-24K09', 10);
  insertH1.run('h1-2', '2026-10-25', 'INV-2026-0032', 'Vikramjit Roy', 'Flat 304, Green Palms, Kolkata', 'Dr. Subhash Bose, MD', 'WBMC-19820', 'Augmentin 625 Duo', 'AUG-24K09', 10);

  // 9. Initial Sales Invoices
  const insertSale = db.prepare(`
    INSERT INTO sales_invoices (id, invoice_number, date, time, patient_id, patient_name, patient_phone, doctor_name, doctor_reg_no, subtotal, total_discount, cgst_total, sgst_total, grand_total, round_off, payment_mode, payment_status, cash_received, change_returned, billed_by, user_id, items_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSale.run(
    'inv-1',
    'INV-2026-0038',
    '2026-10-26',
    '18:42',
    'pat-4',
    'Ananya Deshpande',
    '+91 98220 11984',
    'Dr. Amit Joshi',
    'MMC-66231',
    232.50,
    11.62,
    13.25,
    13.25,
    247.00,
    0.12,
    'UPI',
    'Paid',
    null,
    null,
    'Kailash Pandey (Reg. No. 44192)',
    'usr-2',
    JSON.stringify([
      { medicineId: 'med-1', brandName: 'Dolo 650', batchNumber: 'DL65-24J12', unitSold: 'PACK', quantity: 1, baseUnitsDeducted: 15, mrp: 34.00, rate: 30.50, discountPercent: 5, gstPercent: 12, amount: 28.98, schedule: 'OTC' },
      { medicineId: 'med-4', brandName: 'Augmentin 625 Duo', batchNumber: 'AUG-24K09', unitSold: 'PACK', quantity: 1, baseUnitsDeducted: 10, mrp: 224.50, rate: 202.00, discountPercent: 5, gstPercent: 12, amount: 191.90, schedule: 'Schedule H1' }
    ])
  );

  // 10. Initial Supplier Return
  const insertSupReturn = db.prepare(`
    INSERT INTO supplier_returns (id, return_number, return_date, supplier_id, batch_id, medicine_id, quantity_base_units, amount, reason, return_type, status, credit_note_number, user_id, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertSupReturn.run(
    'sr-1',
    'DN-2026-0012',
    '2026-10-20',
    'sup-1',
    'b-fc-exp',
    'med-fc',
    15,
    150.00,
    'Expired Stock Return to Distributor',
    'CREDIT_NOTE',
    'PENDING',
    'CN-SUN-9921',
    'usr-1',
    now
  );
}

// Initialize on module load
initDatabase();
