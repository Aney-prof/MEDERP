import { db } from './db.ts';

export interface UserContext {
  userId: string;
  userName: string;
  userRole: string; // 'owner_admin' | 'pharmacist' | 'cashier' | 'inventory_staff' | 'auditor'
}

export class ErpService {
  // ==========================================
  // SETTINGS
  // ==========================================
  static getSettings(): Record<string, any> {
    const rows = db.prepare('SELECT section, data_json FROM settings').all() as { section: string; data_json: string }[];
    const result: Record<string, any> = {};
    for (const row of rows) {
      try {
        result[row.section] = JSON.parse(row.data_json);
      } catch {
        result[row.section] = {};
      }
    }
    return result;
  }

  static getSettingSection(section: string): any {
    const row = db.prepare('SELECT data_json FROM settings WHERE section = ?').get(section) as { data_json: string } | undefined;
    if (!row) return null;
    try {
      return JSON.parse(row.data_json);
    } catch {
      return null;
    }
  }

  static updateSettingSection(section: string, data: any, user: UserContext): any {
    // Audit restriction: only owner_admin and pharmacist can change system settings
    if (!['owner_admin', 'pharmacist'].includes(user.userRole)) {
      throw new Error('Access denied: Unauthorized role for modifying system settings');
    }

    const now = new Date().toISOString();
    const dataJson = JSON.stringify(data);

    db.exec('BEGIN TRANSACTION;');
    try {
      const existing = db.prepare('SELECT section FROM settings WHERE section = ?').get(section);
      if (existing) {
        db.prepare('UPDATE settings SET data_json = ?, updated_at = ?, updated_by = ? WHERE section = ?')
          .run(dataJson, now, user.userName, section);
      } else {
        db.prepare('INSERT INTO settings (section, data_json, updated_at, updated_by) VALUES (?, ?, ?, ?)')
          .run(section, dataJson, now, user.userName);
      }

      this.recordAuditLog(user, 'UPDATE_SETTINGS', 'SETTINGS', section, { section });
      db.exec('COMMIT;');
      return data;
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  // ==========================================
  // MEDICINES CATALOGUE
  // ==========================================
  static getMedicines(search?: string): any[] {
    let query = `
      SELECT m.*, 
        COALESCE((
          SELECT SUM(b.quantity_base_units) 
          FROM batches b 
          WHERE b.medicine_id = m.id AND b.status = 'AVAILABLE' AND b.is_damaged = 0
        ), 0) AS total_available_base_units,
        (
          SELECT COUNT(*) 
          FROM batches b 
          WHERE b.medicine_id = m.id
        ) AS total_batches_count
      FROM medicines m
    `;
    const params: any[] = [];

    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      query += ` WHERE LOWER(m.brand_name) LIKE ? OR LOWER(m.generic_composition) LIKE ? OR LOWER(m.code) LIKE ? OR LOWER(m.barcode) LIKE ?`;
      params.push(q, q, q, q);
    }

    query += ` ORDER BY m.brand_name ASC`;
    return db.prepare(query).all(...params);
  }

  static getMedicineById(id: string): any {
    const med = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id) as any;
    if (!med) return null;

    const batches = db.prepare(`
      SELECT b.*, s.name as supplier_name, br.name as branch_name
      FROM batches b
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      LEFT JOIN branches br ON b.branch_id = br.id
      WHERE b.medicine_id = ?
      ORDER BY b.expiry_date ASC
    `).all(id);

    return { ...med, batches };
  }

  static getCompositionAlternatives(genericComposition: string, excludeMedicineId?: string): any[] {
    // Only for pharmacist review; never auto-substituted
    const q = `%${genericComposition.trim().toLowerCase().split('+')[0].trim()}%`;
    let query = `
      SELECT m.*, 
        COALESCE((
          SELECT SUM(b.quantity_base_units) 
          FROM batches b 
          WHERE b.medicine_id = m.id AND b.status = 'AVAILABLE' AND b.is_damaged = 0
        ), 0) AS total_available_base_units
      FROM medicines m
      WHERE LOWER(m.generic_composition) LIKE ?
    `;
    const params: any[] = [q];

    if (excludeMedicineId) {
      query += ` AND m.id != ?`;
      params.push(excludeMedicineId);
    }

    return db.prepare(query).all(...params);
  }

  static createMedicine(data: any, user: UserContext): any {
    if (!['owner_admin', 'pharmacist', 'inventory_staff'].includes(user.userRole)) {
      throw new Error('Access denied: Unauthorized role for creating medicines');
    }

    const id = data.id || 'med-' + Date.now();
    const code = data.code || 'MED-' + Math.floor(1000 + Math.random() * 9000);
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO medicines (
          id, code, barcode, brand_name, generic_composition, strength, dosage_form, manufacturer,
          hsn_code, gst_percent, pack_unit, base_unit, units_per_pack, mrp, purchase_rate,
          schedule, category, temperature_requirement, min_stock_alert, is_active, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id,
        code,
        data.barcode || null,
        data.brandName || data.brand_name,
        data.genericComposition || data.generic_composition,
        data.strength || null,
        data.dosageForm || data.dosage_form || 'Tablet',
        data.manufacturer || 'Generic Pharma',
        data.hsnCode || data.hsn_code || '30049099',
        Number(data.gstPercent ?? data.gst_percent ?? 12),
        data.packUnit || data.pack_unit || 'Strip',
        data.baseUnit || data.base_unit || 'Tablet',
        Number(data.unitsPerPack ?? data.units_per_pack ?? 1),
        Number(data.mrp ?? 100),
        Number(data.purchaseRate ?? data.purchase_rate ?? 70),
        data.schedule || 'OTC',
        data.category || 'Allopathic',
        data.temperatureRequirement || data.temperature_requirement || null,
        Number(data.minStockAlert ?? data.min_stock_alert ?? 20),
        1,
        now
      );

      // If initial batch provided
      if (data.initialBatch && data.initialBatch.batchNumber) {
        const batchId = 'b-' + Date.now();
        const b = data.initialBatch;
        const baseQty = Number(b.quantityBaseUnits ?? (Number(b.quantity || 0) * Number(data.unitsPerPack ?? 1)));

        db.prepare(`
          INSERT INTO batches (
            id, medicine_id, batch_number, mfg_date, expiry_date, supplier_id,
            purchase_invoice_id, branch_id, location_rack, purchase_rate, mrp,
            sale_rate, wholesale_rate, quantity_base_units, reorder_level_base_units,
            status, is_damaged, received_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          batchId,
          id,
          b.batchNumber,
          b.mfgDate || '2025-06',
          b.expiryDate || '2027-05',
          b.supplierId || null,
          b.purchaseInvoiceId || 'INIT-INWARD',
          b.branchId || 'br-1',
          b.locationRack || b.location || 'Rack A-01',
          Number(b.purchaseRate || data.purchaseRate || 70),
          Number(b.mrp || data.mrp || 100),
          Number(b.saleRate || 90),
          Number(b.wholesaleRate || 80),
          baseQty,
          Number(b.reorderLevel || 30),
          'AVAILABLE',
          0,
          now.split('T')[0]
        );

        db.prepare(`
          INSERT INTO stock_movements (
            id, timestamp, medicine_id, batch_id, movement_type, quantity_base_units,
            balance_after_base_units, reference_type, reference_id, user_id, user_name, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'sm-' + Date.now(),
          now,
          id,
          batchId,
          'PURCHASE_RECEIPT',
          baseQty,
          baseQty,
          'INWARD_ENTRY',
          'INITIAL_INWARD',
          user.userId,
          user.userName,
          'Initial medicine catalogue inward'
        );
      }

      this.recordAuditLog(user, 'CREATE_MEDICINE', 'MEDICINE', id, { brandName: data.brandName });
      db.exec('COMMIT;');
      return this.getMedicineById(id);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  // ==========================================
  // BATCH INVENTORY & FEFO ENGINE
  // ==========================================
  static getBatches(filters?: { medicineId?: string; status?: string; branchId?: string; search?: string }): any[] {
    let query = `
      SELECT b.*, m.brand_name, m.generic_composition, m.pack_unit, m.base_unit, m.units_per_pack, m.hsn_code, m.gst_percent, m.schedule,
        s.name as supplier_name, br.name as branch_name
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      LEFT JOIN branches br ON b.branch_id = br.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.medicineId) {
      query += ` AND b.medicine_id = ?`;
      params.push(filters.medicineId);
    }
    if (filters?.status) {
      query += ` AND b.status = ?`;
      params.push(filters.status);
    }
    if (filters?.branchId) {
      query += ` AND b.branch_id = ?`;
      params.push(filters.branchId);
    }
    if (filters?.search) {
      const q = `%${filters.search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(b.batch_number) LIKE ? OR LOWER(m.brand_name) LIKE ? OR LOWER(b.location_rack) LIKE ?)`;
      params.push(q, q, q);
    }

    // Default FEFO: earliest expiry first!
    query += ` ORDER BY b.expiry_date ASC, b.quantity_base_units DESC`;
    return db.prepare(query).all(...params);
  }

  static getBatchById(id: string): any {
    return db.prepare(`
      SELECT b.*, m.brand_name, m.generic_composition, m.pack_unit, m.base_unit, m.units_per_pack, m.hsn_code, m.gst_percent, m.schedule,
        s.name as supplier_name, br.name as branch_name
      FROM batches b
      JOIN medicines m ON b.medicine_id = m.id
      LEFT JOIN suppliers s ON b.supplier_id = s.id
      LEFT JOIN branches br ON b.branch_id = br.id
      WHERE b.id = ?
    `).get(id);
  }

  static updateBatchStatus(batchId: string, status: string, user: UserContext, reason?: string): any {
    if (!['owner_admin', 'pharmacist'].includes(user.userRole)) {
      throw new Error('Access denied: Unauthorized role for altering batch status');
    }

    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(batchId) as any;
    if (!batch) throw new Error('Batch not found');

    const now = new Date().toISOString();
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('UPDATE batches SET status = ?, is_damaged = ? WHERE id = ?')
        .run(status, status === 'DAMAGED' || status === 'EXPIRED' ? 1 : 0, batchId);

      this.recordAuditLog(user, 'UPDATE_BATCH_STATUS', 'BATCH', batchId, {
        previousStatus: batch.status,
        newStatus: status,
        reason: reason || 'Status modified by authorized operator'
      });

      db.exec('COMMIT;');
      return this.getBatchById(batchId);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  static adjustStock(batchId: string, newQuantityBaseUnits: number, reason: string, user: UserContext): any {
    if (!['owner_admin', 'pharmacist', 'inventory_staff'].includes(user.userRole)) {
      throw new Error('Access denied: Unauthorized role for manual stock adjustments');
    }

    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(batchId) as any;
    if (!batch) throw new Error('Batch not found');

    const difference = newQuantityBaseUnits - batch.quantity_base_units;
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare('UPDATE batches SET quantity_base_units = ? WHERE id = ?').run(newQuantityBaseUnits, batchId);

      db.prepare(`
        INSERT INTO stock_movements (
          id, timestamp, medicine_id, batch_id, movement_type, quantity_base_units,
          balance_after_base_units, reference_type, reference_id, user_id, user_name, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'sm-' + Date.now(),
        now,
        batch.medicine_id,
        batchId,
        'STOCK_ADJUSTMENT',
        difference,
        newQuantityBaseUnits,
        'PHYSICAL_AUDIT',
        'AUDIT-' + Date.now(),
        user.userId,
        user.userName,
        reason || 'Manual physical stock adjustment'
      );

      this.recordAuditLog(user, 'ADJUST_STOCK', 'BATCH', batchId, {
        previousBaseUnits: batch.quantity_base_units,
        newBaseUnits: newQuantityBaseUnits,
        difference,
        reason
      });

      db.exec('COMMIT;');
      return this.getBatchById(batchId);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  // ==========================================
  // ATOMIC BILLING & POS SALES
  // ==========================================
  static createSaleInvoice(data: any, user: UserContext): any {
    // Role check: cashier, pharmacist, owner_admin can bill
    if (!['owner_admin', 'pharmacist', 'cashier'].includes(user.userRole)) {
      throw new Error('Access denied: Unauthorized role for billing transactions');
    }

    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      throw new Error('Cannot create invoice without line items');
    }

    const invSettings = this.getSettingSection('inventory') || {};
    // const salesSettings = this.getSettingSection('sales') || {};
    const businessSettings = this.getSettingSection('business') || {};

    const allowNegativeStock = !!invSettings.allowNegativeStock;
    const blockExpired = invSettings.blockExpiredStockSale !== false;
    const blockHeld = invSettings.blockHeldStockSale !== false;

    // const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = now.toTimeString().slice(0, 5);

    const invoicePrefix = businessSettings.invoicePrefix || 'INV-2026-';
    const invoiceCount = (db.prepare('SELECT count(*) as count FROM sales_invoices').get() as { count: number }).count;
    const invoiceNumber = data.invoiceNumber || `${invoicePrefix}${(invoiceCount + 101).toString().padStart(4, '0')}`;
    const invoiceId = 'inv-' + Date.now();

    db.exec('BEGIN TRANSACTION;');
    try {
      const processedItems: any[] = [];

      for (const item of data.items) {
        const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(item.batchId) as any;
        if (!batch) {
          throw new Error(`Batch ID ${item.batchId} not found`);
        }

        const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(batch.medicine_id) as any;
        if (!medicine) {
          throw new Error(`Medicine ${batch.medicine_id} not found`);
        }

        // Calculate base units to deduct:
        // If selling 3 loose tablets from 10-tablet strip, unitSold === 'BASE', deducts 3!
        // If selling 1 pack (strip), unitSold === 'PACK', deducts 1 * 10 = 10!
        const isPack = item.unitSold === 'PACK';
        const unitsPerPack = medicine.units_per_pack || 1;
        const requestedQuantity = Number(item.quantity || 1);
        const freeQuantity = Number(item.freeQuantity || 0);
        const totalSalePacksOrBase = requestedQuantity + freeQuantity;

        const baseUnitsToDeduct = isPack
          ? Math.round(totalSalePacksOrBase * unitsPerPack)
          : Math.round(totalSalePacksOrBase);

        // 1. Eligibility Check: Block Expired
        if (blockExpired && batch.expiry_date) {
          const [by, bm] = batch.expiry_date.split('-').map(Number);
          const expDate = new Date(by, bm, 0); // Last day of month
          if (expDate < now && user.userRole !== 'owner_admin') {
            throw new Error(`Cannot sell expired medicine batch: ${medicine.brand_name} (Batch: ${batch.batch_number}, Expired: ${batch.expiry_date})`);
          }
        }

        // 2. Eligibility Check: Block Held
        if (blockHeld && batch.status === 'HELD' && user.userRole !== 'owner_admin') {
          throw new Error(`Batch ${batch.batch_number} of ${medicine.brand_name} is HELD and blocked from dispensing.`);
        }

        if (batch.status === 'DAMAGED' || batch.is_damaged === 1) {
          throw new Error(`Batch ${batch.batch_number} is tagged as DAMAGED and cannot be dispensed.`);
        }

        // 3. Stock Level Check: Block Negative Stock
        if (batch.quantity_base_units < baseUnitsToDeduct) {
          if (!allowNegativeStock && user.userRole !== 'owner_admin') {
            throw new Error(`Insufficient stock in Batch ${batch.batch_number}. Available: ${batch.quantity_base_units} base units, Requested: ${baseUnitsToDeduct} base units.`);
          }
        }

        // Deduct base units from batch
        const newBalance = batch.quantity_base_units - baseUnitsToDeduct;
        db.prepare('UPDATE batches SET quantity_base_units = ? WHERE id = ?').run(newBalance, batch.id);

        // Record stock movement
        db.prepare(`
          INSERT INTO stock_movements (
            id, timestamp, medicine_id, batch_id, movement_type, quantity_base_units,
            balance_after_base_units, reference_type, reference_id, user_id, user_name, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'sm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          now.toISOString(),
          medicine.id,
          batch.id,
          'SALE',
          -baseUnitsToDeduct,
          newBalance,
          'INVOICE',
          invoiceNumber,
          user.userId,
          user.userName,
          `Sale in ${isPack ? 'Pack' : 'Loose Unit'}: ${requestedQuantity} ${isPack ? medicine.pack_unit : medicine.base_unit} (deducted ${baseUnitsToDeduct} ${medicine.base_unit})`
        );

        // If Schedule H1 medicine, log to schedule_h1_register automatically
        if (medicine.schedule === 'Schedule H1') {
          db.prepare(`
            INSERT INTO schedule_h1_register (
              id, date, invoice_number, patient_name, patient_address,
              doctor_name, doctor_reg_no, medicine_name, batch_number, quantity_sold
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            'h1-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            dateStr,
            invoiceNumber,
            data.patientName || 'Counter Customer',
            data.patientAddress || data.patientPhone || 'Walk-in',
            data.doctorName || 'Dr. Registered Practitioner',
            data.doctorRegNo || 'REG-PENDING',
            `${medicine.brand_name} (${medicine.generic_composition})`,
            batch.batch_number,
            baseUnitsToDeduct
          );
        }

        processedItems.push({
          medicineId: medicine.id,
          batchId: batch.id,
          brandName: medicine.brand_name,
          genericComposition: medicine.generic_composition,
          batchNumber: batch.batch_number,
          expiryDate: batch.expiry_date,
          hsnCode: medicine.hsn_code,
          unitSold: isPack ? 'PACK' : 'BASE',
          unitLabel: isPack ? medicine.pack_unit : medicine.base_unit,
          quantity: requestedQuantity,
          freeQuantity,
          baseUnitsDeducted: baseUnitsToDeduct,
          mrp: Number(item.mrp || batch.mrp),
          rate: Number(item.rate || batch.sale_rate),
          discountPercent: Number(item.discountPercent || 0),
          gstPercent: Number(item.gstPercent ?? medicine.gst_percent),
          amount: Number(item.amount),
          schedule: medicine.schedule
        });
      }

      // If Customer Khata Credit Sale, update patient credit balance
      if (data.paymentMode === 'Credit (Khata)') {
        if (!data.patientId) {
          throw new Error('Patient record required for Khata Credit Billing');
        }
        const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(data.patientId) as any;
        if (!patient) throw new Error('Patient not found');

        const newCredit = patient.credit_balance + Number(data.grandTotal);
        if (newCredit > patient.credit_limit && user.userRole !== 'owner_admin') {
          throw new Error(`Customer credit limit of ₹${patient.credit_limit} exceeded! Current balance: ₹${patient.credit_balance}, Sale total: ₹${data.grandTotal}`);
        }

        db.prepare(`
          UPDATE patients 
          SET credit_balance = ?, total_purchases = total_purchases + ?, last_visit = ?
          WHERE id = ?
        `).run(newCredit, Number(data.grandTotal), dateStr, patient.id);
      } else if (data.patientId) {
        db.prepare(`
          UPDATE patients 
          SET total_purchases = total_purchases + ?, last_visit = ?
          WHERE id = ?
        `).run(Number(data.grandTotal), dateStr, data.patientId);
      }

      // Insert into sales_invoices
      db.prepare(`
        INSERT INTO sales_invoices (
          id, invoice_number, date, time, patient_id, patient_name, patient_phone,
          doctor_name, doctor_reg_no, subtotal, total_discount, cgst_total, sgst_total,
          grand_total, round_off, payment_mode, payment_status, cash_received, change_returned,
          billed_by, user_id, items_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        invoiceId,
        invoiceNumber,
        dateStr,
        timeStr,
        data.patientId || null,
        data.patientName || 'Walk-in Cash Customer',
        data.patientPhone || null,
        data.doctorName || 'Dr. Self / OTC',
        data.doctorRegNo || null,
        Number(data.subTotal),
        Number(data.totalDiscount),
        Number(data.cgstTotal),
        Number(data.sgstTotal),
        Number(data.grandTotal),
        Number(data.roundOff || 0),
        data.paymentMode || 'Cash',
        data.paymentMode === 'Credit (Khata)' ? 'DUE' : 'PAID',
        data.cashReceived ? Number(data.cashReceived) : null,
        data.changeReturned ? Number(data.changeReturned) : null,
        user.userName,
        user.userId,
        JSON.stringify(processedItems)
      );

      this.recordAuditLog(user, 'CREATE_SALE_INVOICE', 'INVOICE', invoiceNumber, {
        grandTotal: data.grandTotal,
        paymentMode: data.paymentMode,
        itemsCount: processedItems.length
      });

      db.exec('COMMIT;');

      return db.prepare('SELECT * FROM sales_invoices WHERE id = ?').get(invoiceId);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  // ==========================================
  // CUSTOMER SALES RETURNS & REFUNDS
  // ==========================================
  static createCustomerReturn(data: any, user: UserContext): any {
    if (!['owner_admin', 'pharmacist', 'cashier'].includes(user.userRole)) {
      throw new Error('Access denied: Unauthorized role for processing customer sales returns');
    }

    const sale = db.prepare('SELECT * FROM sales_invoices WHERE invoice_number = ? OR id = ?').get(data.invoiceNumber || data.saleId, data.invoiceNumber || data.saleId) as any;
    if (!sale) {
      throw new Error('Original sale invoice not found for this return');
    }

    const now = new Date().toISOString();
    const returnNumber = 'RET-' + Date.now();
    const returnId = 'ret-' + Date.now();

    db.exec('BEGIN TRANSACTION;');
    try {
      let totalRefund = 0;
      const returnedItems: any[] = [];

      for (const item of data.items) {
        const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(item.batchId) as any;
        if (!batch) throw new Error(`Batch ID ${item.batchId} not found`);

        const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(batch.medicine_id) as any;
        const isPack = item.unitSold === 'PACK';
        const unitsPerPack = medicine?.units_per_pack || 1;
        const returnedQty = Number(item.quantity || 1);
        const baseUnitsToReturn = isPack ? Math.round(returnedQty * unitsPerPack) : Math.round(returnedQty);

        const refundAmt = Number(item.amount || (item.rate * returnedQty));
        totalRefund += refundAmt;

        // Traceability & Safe restocking rule:
        // Stock is ONLY restored to available batch if item is explicitly designated RESALABLE!
        if (item.isResalable) {
          const updatedBalance = batch.quantity_base_units + baseUnitsToReturn;
          db.prepare('UPDATE batches SET quantity_base_units = ? WHERE id = ?').run(updatedBalance, batch.id);

          db.prepare(`
            INSERT INTO stock_movements (
              id, timestamp, medicine_id, batch_id, movement_type, quantity_base_units,
              balance_after_base_units, reference_type, reference_id, user_id, user_name, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            'sm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            now,
            batch.medicine_id,
            batch.id,
            'SALE_RETURN',
            baseUnitsToReturn,
            updatedBalance,
            'CUSTOMER_RETURN',
            returnNumber,
            user.userId,
            user.userName,
            `Customer return accepted into resalable stock (${baseUnitsToReturn} base units)`
          );
        } else {
          // If damaged or expired, record waste/quarantine disposal without adding to resalable inventory
          db.prepare(`
            INSERT INTO stock_movements (
              id, timestamp, medicine_id, batch_id, movement_type, quantity_base_units,
              balance_after_base_units, reference_type, reference_id, user_id, user_name, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).run(
            'sm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            now,
            batch.medicine_id,
            batch.id,
            'QUARANTINE',
            0,
            batch.quantity_base_units,
            'CUSTOMER_RETURN_DAMAGED',
            returnNumber,
            user.userId,
            user.userName,
            `Customer return damaged/unusable: routed to quarantine bin`
          );
        }

        returnedItems.push({
          batchId: batch.id,
          medicineId: batch.medicine_id,
          batchNumber: batch.batch_number,
          quantity: returnedQty,
          unitSold: item.unitSold,
          baseUnitsReturned: baseUnitsToReturn,
          isResalable: !!item.isResalable,
          amount: refundAmt,
          reason: item.reason || 'Customer Return'
        });
      }

      // If customer credit refund and patient exists
      if (sale.patient_id && data.refundMode === 'CREDIT_BALANCE') {
        db.prepare('UPDATE patients SET credit_balance = MAX(0, credit_balance - ?) WHERE id = ?')
          .run(totalRefund, sale.patient_id);
      }

      db.prepare(`
        INSERT INTO sales_returns (
          id, return_number, sale_id, return_date, patient_id, patient_name,
          total_refund, refund_mode, items_json, notes, user_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        returnId,
        returnNumber,
        sale.id,
        now.split('T')[0],
        sale.patient_id || null,
        sale.patient_name,
        totalRefund,
        data.refundMode || 'CASH',
        JSON.stringify(returnedItems),
        data.notes || null,
        user.userId,
        now
      );

      this.recordAuditLog(user, 'CUSTOMER_RETURN', 'SALE_RETURN', returnNumber, {
        originalInvoice: sale.invoice_number,
        totalRefund,
        refundMode: data.refundMode
      });

      db.exec('COMMIT;');
      return db.prepare('SELECT * FROM sales_returns WHERE id = ?').get(returnId);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  // ==========================================
  // PURCHASING, SUPPLIERS & INWARD RECEIPTS
  // ==========================================
  static createPurchaseReceipt(data: any, user: UserContext): any {
    if (!['owner_admin', 'pharmacist', 'inventory_staff'].includes(user.userRole)) {
      throw new Error('Access denied: Unauthorized role for receiving goods purchases');
    }

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(data.supplierId) as any;
    if (!supplier) throw new Error('Supplier not found');

    const now = new Date().toISOString();
    const purchaseId = 'po-' + Date.now();
    const purchaseNumber = data.purchaseNumber || 'PO-2026-' + Math.floor(1000 + Math.random() * 9000);
    const invoiceNumber = data.invoiceNumber || 'PINV-' + Math.floor(10000 + Math.random() * 90000);

    db.exec('BEGIN TRANSACTION;');
    try {
      const processedItems: any[] = [];
      let totalAmount = 0;

      for (const item of data.items) {
        const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(item.medicineId) as any;
        if (!medicine) throw new Error(`Medicine ${item.medicineId} not found`);

        const unitsPerPack = medicine.units_per_pack || 1;
        const packQty = Number(item.packQuantity || item.quantity || 1);
        const freePacks = Number(item.freePackQuantity || item.freeQuantity || 0);
        const totalPacks = packQty + freePacks;
        const totalBaseUnits = Math.round(totalPacks * unitsPerPack);

        // Core Requirement: Receiving the same medicine with a new batch number must create a SEPARATE batch!
        // We always generate a separate batch record for distinct delivery batch numbers.
        const batchId = 'b-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
        const purchaseRate = Number(item.purchaseRate || medicine.purchase_rate);
        const mrp = Number(item.mrp || medicine.mrp);
        const saleRate = Number(item.saleRate || (mrp * 0.9));
        const wholesaleRate = Number(item.wholesaleRate || (mrp * 0.8));

        db.prepare(`
          INSERT INTO batches (
            id, medicine_id, batch_number, mfg_date, expiry_date, supplier_id,
            purchase_invoice_id, branch_id, location_rack, purchase_rate, mrp,
            sale_rate, wholesale_rate, quantity_base_units, reorder_level_base_units,
            status, is_damaged, received_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          batchId,
          medicine.id,
          item.batchNumber,
          item.mfgDate || '2025-06',
          item.expiryDate,
          supplier.id,
          invoiceNumber,
          data.branchId || 'br-1',
          item.locationRack || 'Rack A-01',
          purchaseRate,
          mrp,
          saleRate,
          wholesaleRate,
          totalBaseUnits,
          Number(item.reorderLevel || 30),
          'AVAILABLE',
          0,
          now.split('T')[0]
        );

        // Record stock movement
        db.prepare(`
          INSERT INTO stock_movements (
            id, timestamp, medicine_id, batch_id, movement_type, quantity_base_units,
            balance_after_base_units, reference_type, reference_id, user_id, user_name, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          'sm-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
          now,
          medicine.id,
          batchId,
          'PURCHASE_RECEIPT',
          totalBaseUnits,
          totalBaseUnits,
          'PURCHASE_ORDER',
          purchaseNumber,
          user.userId,
          user.userName,
          `Purchase delivery inward from ${supplier.name}: ${packQty} ${medicine.pack_unit} (+${freePacks} free) = ${totalBaseUnits} ${medicine.base_unit}`
        );

        const lineCost = packQty * purchaseRate;
        totalAmount += lineCost;

        processedItems.push({
          batchId,
          medicineId: medicine.id,
          brandName: medicine.brand_name,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          packQuantity: packQty,
          freeQuantity: freePacks,
          totalBaseUnits,
          purchaseRate,
          mrp,
          lineCost
        });
      }

      // Update supplier balance
      db.prepare('UPDATE suppliers SET outstanding_balance = outstanding_balance + ? WHERE id = ?')
        .run(totalAmount, supplier.id);

      db.prepare(`
        INSERT INTO purchases (
          id, purchase_number, invoice_number, supplier_id, invoice_date, received_date,
          branch_id, subtotal, tax_amount, total_amount, payment_status, notes, items_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        purchaseId,
        purchaseNumber,
        invoiceNumber,
        supplier.id,
        data.invoiceDate || now.split('T')[0],
        now.split('T')[0],
        data.branchId || 'br-1',
        totalAmount,
        totalAmount * 0.12,
        totalAmount * 1.12,
        'PENDING',
        data.notes || null,
        JSON.stringify(processedItems)
      );

      this.recordAuditLog(user, 'PURCHASE_RECEIPT', 'PURCHASE', purchaseNumber, {
        supplier: supplier.name,
        totalAmount,
        batchesCreatedCount: processedItems.length
      });

      db.exec('COMMIT;');
      return db.prepare('SELECT * FROM purchases WHERE id = ?').get(purchaseId);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  // ==========================================
  // SUPPLIER RETURNS & DEBIT NOTES
  // ==========================================
  static createSupplierReturn(data: any, user: UserContext): any {
    if (!['owner_admin', 'pharmacist', 'inventory_staff'].includes(user.userRole)) {
      throw new Error('Access denied: Unauthorized role for creating supplier returns');
    }

    const batch = db.prepare('SELECT * FROM batches WHERE id = ?').get(data.batchId) as any;
    if (!batch) throw new Error('Batch not found');

    const supplierId = data.supplierId || batch.supplier_id;
    if (!supplierId) throw new Error('Supplier ID required for supplier return');

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(supplierId) as any;
    if (!supplier) throw new Error('Supplier not found');

    const medicine = db.prepare('SELECT * FROM medicines WHERE id = ?').get(batch.medicine_id) as any;
    const unitsToReturn = Number(data.quantityBaseUnits || data.quantity || 1);

    if (batch.quantity_base_units < unitsToReturn) {
      throw new Error(`Insufficient batch stock for return. Available: ${batch.quantity_base_units}, Requested: ${unitsToReturn}`);
    }

    const returnNumber = data.returnNumber || 'DN-2026-' + Math.floor(1000 + Math.random() * 9000);
    const returnAmount = Number(data.amount || (batch.purchase_rate / (medicine?.units_per_pack || 1) * unitsToReturn));
    const now = new Date().toISOString();

    db.exec('BEGIN TRANSACTION;');
    try {
      // Deduct from batch
      const newBalance = batch.quantity_base_units - unitsToReturn;
      db.prepare('UPDATE batches SET quantity_base_units = ? WHERE id = ?').run(newBalance, batch.id);

      // Record stock movement
      db.prepare(`
        INSERT INTO stock_movements (
          id, timestamp, medicine_id, batch_id, movement_type, quantity_base_units,
          balance_after_base_units, reference_type, reference_id, user_id, user_name, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        'sm-' + Date.now(),
        now,
        batch.medicine_id,
        batch.id,
        'SUPPLIER_RETURN',
        -unitsToReturn,
        newBalance,
        'SUPPLIER_RETURN',
        returnNumber,
        user.userId,
        user.userName,
        `Supplier return to ${supplier.name} (${unitsToReturn} base units, Reason: ${data.reason || 'Damaged/Expired'})`
      );

      // Deduct from supplier outstanding balance (credit note claim)
      db.prepare('UPDATE suppliers SET outstanding_balance = MAX(0, outstanding_balance - ?) WHERE id = ?')
        .run(returnAmount, supplier.id);

      const returnId = 'sr-' + Date.now();
      db.prepare(`
        INSERT INTO supplier_returns (
          id, return_number, return_date, supplier_id, batch_id, medicine_id,
          quantity_base_units, amount, reason, return_type, status, credit_note_number,
          user_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        returnId,
        returnNumber,
        now.split('T')[0],
        supplier.id,
        batch.id,
        batch.medicine_id,
        unitsToReturn,
        returnAmount,
        data.reason || 'Near Expiry / Dump Return Claim',
        data.returnType || 'CREDIT_NOTE',
        'PENDING',
        data.creditNoteNumber || 'PENDING-DISTRIBUTOR-CN',
        user.userId,
        now
      );

      this.recordAuditLog(user, 'SUPPLIER_RETURN', 'DEBIT_NOTE', returnNumber, {
        supplier: supplier.name,
        batchNumber: batch.batch_number,
        unitsReturned: unitsToReturn,
        amount: returnAmount
      });

      db.exec('COMMIT;');
      return db.prepare('SELECT * FROM supplier_returns WHERE id = ?').get(returnId);
    } catch (err) {
      db.exec('ROLLBACK;');
      throw err;
    }
  }

  // ==========================================
  // PATIENT CRM & PRESCRIPTION ATTACHMENTS
  // ==========================================
  static getPatients(search?: string): any[] {
    let query = 'SELECT * FROM patients WHERE 1=1';
    const params: any[] = [];
    if (search && search.trim()) {
      const q = `%${search.trim().toLowerCase()}%`;
      query += ` AND (LOWER(name) LIKE ? OR phone LIKE ? OR LOWER(uhid) LIKE ?)`;
      params.push(q, q, q);
    }
    query += ' ORDER BY name ASC';
    const rows = db.prepare(query).all(...params) as any[];
    return rows.map((r) => ({
      ...r,
      knownAllergies: JSON.parse(r.known_allergies_json || '[]'),
      chronicConditions: JSON.parse(r.chronic_conditions_json || '[]')
    }));
  }

  static getPatientById(id: string): any {
    const p = db.prepare('SELECT * FROM patients WHERE id = ?').get(id) as any;
    if (!p) return null;

    const prescriptions = db.prepare('SELECT * FROM prescriptions WHERE patient_id = ? ORDER BY date DESC').all(id) as any[];
    const formattedRx = prescriptions.map((rx) => ({
      ...rx,
      medicines: JSON.parse(rx.medicines_json || '[]')
    }));

    return {
      ...p,
      knownAllergies: JSON.parse(p.known_allergies_json || '[]'),
      chronicConditions: JSON.parse(p.chronic_conditions_json || '[]'),
      prescriptions: formattedRx
    };
  }

  static createPatient(data: any, user: UserContext): any {
    const id = data.id || 'pat-' + Date.now();
    const count = (db.prepare('SELECT count(*) as count FROM patients').get() as { count: number }).count;
    const uhid = data.uhid || `SH-2026-${(count + 1).toString().padStart(4, '0')}`;
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO patients (
        id, uhid, name, phone, email, age, gender, blood_group, address,
        known_allergies_json, chronic_conditions_json, family_group_id, credit_balance,
        credit_limit, total_purchases, last_visit, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      uhid,
      data.name,
      data.phone,
      data.email || null,
      Number(data.age || 30),
      data.gender || 'Male',
      data.bloodGroup || data.blood_group || 'Unknown',
      data.address || 'Local Resident',
      JSON.stringify(data.knownAllergies || []),
      JSON.stringify(data.chronicConditions || []),
      data.familyGroupId || null,
      0.0,
      Number(data.creditLimit || 5000),
      0.0,
      now.split('T')[0],
      now
    );

    this.recordAuditLog(user, 'CREATE_PATIENT', 'PATIENT', uhid, { name: data.name, phone: data.phone });
    return this.getPatientById(id);
  }

  static addPrescription(patientId: string, rxData: any, user: UserContext): any {
    const id = 'rx-' + Date.now();
    const now = new Date().toISOString();

    // Validate prescription attachment file type and size if present
    if (rxData.attachmentDataBase64) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
      if (rxData.attachmentType && !allowedTypes.includes(rxData.attachmentType)) {
        throw new Error('Invalid file type for prescription attachment. Only JPG, PNG, WEBP, and PDF are allowed.');
      }
      // Max 5MB limit
      if (rxData.attachmentDataBase64.length > 7000000) {
        throw new Error('Prescription attachment exceeds maximum permitted size limit of 5MB.');
      }
    }

    db.prepare(`
      INSERT INTO prescriptions (
        id, patient_id, date, doctor_name, clinic_hospital, doctor_reg_no,
        diagnosis, medicines_json, next_refill_date, attachment_name, attachment_type,
        attachment_data_base64, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      patientId,
      rxData.date || now.split('T')[0],
      rxData.doctorName,
      rxData.clinicHospital || null,
      rxData.doctorRegNo || null,
      rxData.diagnosis || null,
      JSON.stringify(rxData.medicines || []),
      rxData.nextRefillDate || null,
      rxData.attachmentName || null,
      rxData.attachmentType || null,
      rxData.attachmentDataBase64 || null,
      now
    );

    this.recordAuditLog(user, 'ADD_PRESCRIPTION', 'PRESCRIPTION', id, {
      patientId,
      doctor: rxData.doctorName
    });

    return this.getPatientById(patientId);
  }

  static settlePatientCredit(patientId: string, amount: number, paymentMode: string, user: UserContext): any {
    const patient = db.prepare('SELECT * FROM patients WHERE id = ?').get(patientId) as any;
    if (!patient) throw new Error('Patient not found');

    const newBalance = Math.max(0, patient.credit_balance - Number(amount));
    db.prepare('UPDATE patients SET credit_balance = ? WHERE id = ?').run(newBalance, patientId);

    this.recordAuditLog(user, 'SETTLE_PATIENT_CREDIT', 'PATIENT', patientId, {
      amountReceived: amount,
      previousBalance: patient.credit_balance,
      newBalance,
      paymentMode
    });

    return this.getPatientById(patientId);
  }

  // ==========================================
  // REPORTS ENGINE
  // ==========================================
  static getReports(reportType: string, params?: any): any {
    if (reportType === 'gstr1') {
      const invoices = db.prepare('SELECT items_json, grand_total, date FROM sales_invoices').all() as any[];
      let totalGross = 0;
      let totalTaxable = 0;
      let totalCgst = 0;
      let totalSgst = 0;

      const rateSlabs: Record<number, { taxable: number; cgst: number; sgst: number; gross: number }> = {
        0: { taxable: 0, cgst: 0, sgst: 0, gross: 0 },
        5: { taxable: 0, cgst: 0, sgst: 0, gross: 0 },
        12: { taxable: 0, cgst: 0, sgst: 0, gross: 0 },
        18: { taxable: 0, cgst: 0, sgst: 0, gross: 0 }
      };

      for (const inv of invoices) {
        totalGross += inv.grand_total;
        try {
          const items = JSON.parse(inv.items_json);
          for (const item of items) {
            const lineGross = Number(item.amount || (item.rate * item.quantity));
            const rate = Number(item.gstPercent || 12);
            const lineTaxable = lineGross / (1 + rate / 100);
            const tax = lineGross - lineTaxable;
            const halfTax = tax / 2;

            totalTaxable += lineTaxable;
            totalCgst += halfTax;
            totalSgst += halfTax;

            if (!rateSlabs[rate]) rateSlabs[rate] = { taxable: 0, cgst: 0, sgst: 0, gross: 0 };
            rateSlabs[rate].taxable += lineTaxable;
            rateSlabs[rate].cgst += halfTax;
            rateSlabs[rate].sgst += halfTax;
            rateSlabs[rate].gross += lineGross;
          }
        } catch {}
      }

      return {
        totalGross,
        totalTaxable,
        totalCgst,
        totalSgst,
        rateSlabs,
        disclaimer: 'Recordkeeping support only; not a substitute for chartered accountant filing verification.'
      };
    }

    if (reportType === 'stock_valuation') {
      const batches = db.prepare(`
        SELECT b.*, m.brand_name, m.generic_composition, m.pack_unit, m.base_unit, m.units_per_pack
        FROM batches b
        JOIN medicines m ON b.medicine_id = m.id
        WHERE b.quantity_base_units > 0
      `).all() as any[];

      let totalCostValue = 0;
      let totalMrpValue = 0;

      const stockList = batches.map((b) => {
        const unitsPerPack = b.units_per_pack || 1;
        const packEquiv = b.quantity_base_units / unitsPerPack;
        const costValue = packEquiv * b.purchase_rate;
        const mrpValue = packEquiv * b.mrp;

        totalCostValue += costValue;
        totalMrpValue += mrpValue;

        return {
          ...b,
          packEquiv: packEquiv.toFixed(1),
          costValue: Number(costValue.toFixed(2)),
          mrpValue: Number(mrpValue.toFixed(2))
        };
      });

      return {
        totalCostValue,
        totalMrpValue,
        estimatedProfitMargin: totalMrpValue > 0 ? (((totalMrpValue - totalCostValue) / totalMrpValue) * 100).toFixed(1) : '0.0',
        stockList
      };
    }

    if (reportType === 'near_expiry') {
      const today = new Date();
      const thresholdDays = Number(params?.days || 60);
      const targetDate = new Date();
      targetDate.setDate(today.getDate() + thresholdDays);
      const targetYm = targetDate.toISOString().slice(0, 7);

      return db.prepare(`
        SELECT b.*, m.brand_name, m.generic_composition, m.pack_unit, m.base_unit, m.units_per_pack, s.name as supplier_name
        FROM batches b
        JOIN medicines m ON b.medicine_id = m.id
        LEFT JOIN suppliers s ON b.supplier_id = s.id
        WHERE b.expiry_date <= ? AND b.quantity_base_units > 0 AND b.status != 'EXPIRED'
        ORDER BY b.expiry_date ASC
      `).all(targetYm);
    }

    if (reportType === 'schedule_h1') {
      return db.prepare('SELECT * FROM schedule_h1_register ORDER BY date DESC').all();
    }

    if (reportType === 'supplier_returns') {
      return db.prepare(`
        SELECT sr.*, s.name as supplier_name, m.brand_name, b.batch_number
        FROM supplier_returns sr
        JOIN suppliers s ON sr.supplier_id = s.id
        JOIN medicines m ON sr.medicine_id = m.id
        JOIN batches b ON sr.batch_id = b.id
        ORDER BY sr.return_date DESC
      `).all();
    }

    if (reportType === 'customer_balances') {
      return db.prepare('SELECT * FROM patients WHERE credit_balance > 0 ORDER BY credit_balance DESC').all();
    }

    return null;
  }

  // ==========================================
  // AUDIT LOGS & USER MANAGEMENT
  // ==========================================
  static recordAuditLog(user: UserContext, action: string, entityType: string, entityId: string, details?: any) {
    db.prepare(`
      INSERT INTO audit_logs (id, timestamp, user_id, user_name, action, entity_type, entity_id, details_json)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      new Date().toISOString(),
      user.userId || 'system',
      user.userName || 'System Operator',
      action,
      entityType,
      entityId,
      details ? JSON.stringify(details) : null
    );
  }

  static getAuditLogs(limit: number = 100): any[] {
    return db.prepare('SELECT * FROM audit_logs ORDER BY timestamp DESC LIMIT ?').all(limit);
  }

  static getUsers(): any[] {
    return db.prepare('SELECT id, username, name, role, avatar_initials, pharmacist_reg_no, is_active, created_at FROM users').all();
  }

  static getSuppliers(): any[] {
    return db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
  }

  static getStockMovements(filters?: { medicineId?: string; batchId?: string }): any[] {
    let query = `
      SELECT sm.*, m.brand_name, b.batch_number
      FROM stock_movements sm
      JOIN medicines m ON sm.medicine_id = m.id
      JOIN batches b ON sm.batch_id = b.id
      WHERE 1=1
    `;
    const params: any[] = [];
    if (filters?.medicineId) {
      query += ` AND sm.medicine_id = ?`;
      params.push(filters.medicineId);
    }
    if (filters?.batchId) {
      query += ` AND sm.batch_id = ?`;
      params.push(filters.batchId);
    }
    query += ` ORDER BY sm.timestamp DESC LIMIT 200`;
    return db.prepare(query).all(...params);
  }
}
