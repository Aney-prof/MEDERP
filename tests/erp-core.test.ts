import test from 'node:test';
import assert from 'node:assert';
import { ErpService } from '../server/erpService.ts';
import type { UserContext } from '../server/erpService.ts';
import { db } from '../server/db.ts';

const adminUser: UserContext = {
  userId: 'usr-1',
  userName: 'Vikram Singhania (Owner)',
  userRole: 'owner_admin'
};

const cashierUser: UserContext = {
  userId: 'usr-3',
  userName: 'Sunil Jadhav (Cashier)',
  userRole: 'cashier'
};

const pharmacistUser: UserContext = {
  userId: 'usr-2',
  userName: 'Dr. Kailash Pandey (Pharmacist)',
  userRole: 'pharmacist'
};

test.beforeEach(() => {
  db.prepare("UPDATE batches SET quantity_base_units = 100 WHERE id = 'b-fc-01'").run();
  db.prepare("UPDATE batches SET quantity_base_units = 150 WHERE id = 'b-fc-02'").run();
});

test('1. Batch Traceability: Multiple deliveries of same medicine remain distinct batches', () => {
  const batches = ErpService.getBatches({ medicineId: 'med-fc' });
  
  // Fictional-Cure 500 has at least two available batches from different suppliers
  const batch1 = batches.find((b) => b.batch_number === 'FC-BATCH-001');
  const batch2 = batches.find((b) => b.batch_number === 'FC-BATCH-002');

  assert.ok(batch1, 'Batch FC-BATCH-001 must exist');
  assert.ok(batch2, 'Batch FC-BATCH-002 must exist');
  assert.notStrictEqual(batch1.id, batch2.id, 'Batches must have distinct IDs');
  assert.notStrictEqual(batch1.supplier_id, batch2.supplier_id, 'Batches must be traceable to distinct suppliers');
  assert.notStrictEqual(batch1.expiry_date, batch2.expiry_date, 'Batches must preserve distinct expiry dates');
  assert.strictEqual(batch1.quantity_base_units, 100, 'Batch 1 initial quantity');
  assert.strictEqual(batch2.quantity_base_units, 150, 'Batch 2 initial quantity');
});

test('2. Unit Conversion: Selling 3 loose tablets deducts exactly 3 base units', () => {
  const batchBefore = ErpService.getBatchById('b-fc-01');
  const initialQty = batchBefore.quantity_base_units;

  const sale = ErpService.createSaleInvoice({
    patientName: 'Test Patient Loose',
    doctorName: 'Dr. Test',
    subTotal: 45.0,
    totalDiscount: 0,
    cgstTotal: 2.7,
    sgstTotal: 2.7,
    grandTotal: 50.0,
    paymentMode: 'Cash',
    items: [
      {
        batchId: 'b-fc-01',
        unitSold: 'BASE', // Loose unit!
        quantity: 3,
        freeQuantity: 0,
        mrp: 15.0,
        rate: 15.0,
        amount: 45.0
      }
    ]
  }, cashierUser);

  assert.ok(sale, 'Sale invoice must be generated');

  const batchAfter = ErpService.getBatchById('b-fc-01');
  assert.strictEqual(
    batchAfter.quantity_base_units,
    initialQty - 3,
    `Batch quantity must be exactly reduced by 3 loose tablets (from ${initialQty} to ${initialQty - 3})`
  );

  // Check stock movement ledger
  const movements = ErpService.getStockMovements({ batchId: 'b-fc-01' });
  const saleMovement = movements.find((m) => m.reference_id === sale.invoice_number);
  assert.ok(saleMovement, 'Stock movement record must exist for sale');
  assert.strictEqual(saleMovement.quantity_base_units, -3, 'Movement quantity must be -3 base units');
});

test('3. Pack Conversion: Selling 1 pack (10 tablets) deducts 10 base units', () => {
  const batchBefore = ErpService.getBatchById('b-fc-02');
  const initialQty = batchBefore.quantity_base_units;

  const sale = ErpService.createSaleInvoice({
    patientName: 'Test Patient Pack',
    doctorName: 'Dr. Test',
    subTotal: 135.0,
    totalDiscount: 0,
    cgstTotal: 8.1,
    sgstTotal: 8.1,
    grandTotal: 151.0,
    paymentMode: 'UPI',
    items: [
      {
        batchId: 'b-fc-02',
        unitSold: 'PACK', // Pack unit = Strip of 10
        quantity: 1,
        freeQuantity: 0,
        mrp: 150.0,
        rate: 135.0,
        amount: 135.0
      }
    ]
  }, cashierUser);

  const batchAfter = ErpService.getBatchById('b-fc-02');
  assert.strictEqual(
    batchAfter.quantity_base_units,
    initialQty - 10,
    `Batch quantity must be reduced by 10 base units for 1 pack (from ${initialQty} to ${initialQty - 10})`
  );
});

test('4. Security & Safety: Cashier cannot sell Held or Expired stock', () => {
  // Try selling HELD batch
  assert.throws(
    () => {
      ErpService.createSaleInvoice({
        patientName: 'Test Held Sale',
        doctorName: 'Dr. Test',
        subTotal: 100,
        totalDiscount: 0,
        cgstTotal: 6,
        sgstTotal: 6,
        grandTotal: 112,
        paymentMode: 'Cash',
        items: [{ batchId: 'b-fc-held', unitSold: 'BASE', quantity: 1, mrp: 15, rate: 15, amount: 15 }]
      }, cashierUser);
    },
    /is HELD and blocked/,
    'Held batch must be blocked from cashier dispensing'
  );

  // Try selling EXPIRED batch
  assert.throws(
    () => {
      ErpService.createSaleInvoice({
        patientName: 'Test Expired Sale',
        doctorName: 'Dr. Test',
        subTotal: 100,
        totalDiscount: 0,
        cgstTotal: 6,
        sgstTotal: 6,
        grandTotal: 112,
        paymentMode: 'Cash',
        items: [{ batchId: 'b-fc-exp', unitSold: 'BASE', quantity: 1, mrp: 15, rate: 15, amount: 15 }]
      }, cashierUser);
    },
    /Cannot sell expired medicine batch/,
    'Expired batch must be blocked from sale'
  );
});

test('5. Supplier Returns: Creates trackable debit note and deducts stock', () => {
  const batchBefore = ErpService.getBatchById('b-fc-01');
  const initialQty = batchBefore.quantity_base_units;

  const supplierReturn = ErpService.createSupplierReturn({
    batchId: 'b-fc-01',
    supplierId: 'sup-1',
    quantityBaseUnits: 5,
    amount: 50.0,
    reason: 'Defective packaging return claim',
    returnType: 'CREDIT_NOTE'
  }, pharmacistUser);

  assert.ok(supplierReturn, 'Supplier return record must be generated');
  assert.strictEqual(supplierReturn.status, 'PENDING', 'Status must be trackable as PENDING replacement/credit');
  assert.strictEqual(supplierReturn.quantity_base_units, 5);

  const batchAfter = ErpService.getBatchById('b-fc-01');
  assert.strictEqual(batchAfter.quantity_base_units, initialQty - 5, 'Batch stock must be reduced by 5');
});

test('6. Customer Returns: Restores stock only when designated resalable', () => {
  // First make a sale
  const sale = ErpService.createSaleInvoice({
    patientName: 'Return Test Customer',
    doctorName: 'Dr. Test',
    subTotal: 50,
    totalDiscount: 0,
    cgstTotal: 3,
    sgstTotal: 3,
    grandTotal: 56,
    paymentMode: 'Cash',
    items: [{ batchId: 'b-fc-02', unitSold: 'BASE', quantity: 5, mrp: 15, rate: 15, amount: 75 }]
  }, cashierUser);

  const batchAfterSale = ErpService.getBatchById('b-fc-02');
  const stockBeforeReturn = batchAfterSale.quantity_base_units;

  // Process customer return with isResalable = true
  const resalableReturn = ErpService.createCustomerReturn({
    saleId: sale.id,
    invoiceNumber: sale.invoice_number,
    refundMode: 'CASH',
    items: [{ batchId: 'b-fc-02', unitSold: 'BASE', quantity: 2, amount: 30, isResalable: true, reason: 'Excess tablets returned' }]
  }, cashierUser);

  const batchAfterResalableReturn = ErpService.getBatchById('b-fc-02');
  assert.strictEqual(
    batchAfterResalableReturn.quantity_base_units,
    stockBeforeReturn + 2,
    'Resalable return must restore 2 base units back to batch'
  );

  // Process customer return with isResalable = false (damaged)
  const damagedReturn = ErpService.createCustomerReturn({
    saleId: sale.id,
    invoiceNumber: sale.invoice_number,
    refundMode: 'CASH',
    items: [{ batchId: 'b-fc-02', unitSold: 'BASE', quantity: 2, amount: 30, isResalable: false, reason: 'Broken foil' }]
  }, cashierUser);

  const batchAfterDamagedReturn = ErpService.getBatchById('b-fc-02');
  assert.strictEqual(
    batchAfterDamagedReturn.quantity_base_units,
    batchAfterResalableReturn.quantity_base_units,
    'Damaged return must NOT add units back into saleable batch stock'
  );
});

test('7. Settings Persistence & Workflow Enforcement', () => {
  const currentInvSettings = ErpService.getSettingSection('inventory');
  assert.strictEqual(currentInvSettings.allowNegativeStock, false, 'Negative stock should be false by default');

  // Cashier cannot update settings
  assert.throws(
    () => {
      ErpService.updateSettingSection('inventory', { ...currentInvSettings, nearExpiryDaysThreshold: 45 }, cashierUser);
    },
    /Access denied/,
    'Cashier must be prevented from updating settings'
  );

  // Admin updates setting
  ErpService.updateSettingSection('inventory', { ...currentInvSettings, nearExpiryDaysThreshold: 45 }, adminUser);
  const updatedSettings = ErpService.getSettingSection('inventory');
  assert.strictEqual(updatedSettings.nearExpiryDaysThreshold, 45, 'Updated threshold must persist');
});
