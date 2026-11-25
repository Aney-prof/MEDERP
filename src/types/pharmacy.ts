// TypeScript definitions for Shakti MediStore & Healthcare ERP

export type DrugSchedule = 'OTC' | 'Schedule H' | 'Schedule H1' | 'Narcotic' | 'Schedule X';
export type DrugCategory = 'Allopathic' | 'Ayurvedic' | 'Generic' | 'Surgical' | 'Cold Chain' | 'Nutraceutical';

export type UserRole = 'owner_admin' | 'pharmacist' | 'cashier' | 'inventory_staff' | 'auditor';

export interface BatchItem {
  id: string;
  medicine_id?: string;
  medicineId?: string;
  batchNumber: string;
  batch_number?: string;
  mfgDate: string; // YYYY-MM
  mfg_date?: string;
  expiryDate: string; // YYYY-MM
  expiry_date?: string;
  mrp: number;
  purchaseRate: number;
  purchase_rate?: number;
  saleRate: number; // Rate A (Retail)
  sale_rate?: number;
  wholesaleRate: number; // Rate B
  wholesale_rate?: number;
  quantityBaseUnits?: number; // Single source of truth in base units
  quantity_base_units?: number;
  quantity?: number; // pack equivalent or base units helper
  reorderLevel: number;
  reorder_level_base_units?: number;
  locationRack?: string; // e.g. "Rack A-02", "Fridge-1"
  location_rack?: string;
  location?: string;
  supplierId?: string;
  supplier_id?: string;
  supplier_name?: string;
  purchaseInvoiceId?: string;
  purchase_invoice_id?: string;
  branchId?: string;
  branch_id?: string;
  status?: 'AVAILABLE' | 'HELD' | 'DAMAGED' | 'EXPIRED' | 'QUARANTINE';
  isDamaged?: boolean;
  is_damaged?: number;
  receivedDate?: string;
  received_date?: string;
}

export interface Medicine {
  id: string;
  code?: string;
  barcode?: string;
  brandName: string;
  brand_name?: string;
  genericComposition: string; // e.g. "Paracetamol 650mg"
  generic_composition?: string;
  strength?: string;
  dosageForm: 'Tablet' | 'Capsule' | 'Syrup' | 'Injection' | 'Ointment' | 'Drops' | 'Inhaler';
  dosage_form?: string;
  manufacturer: string;
  hsnCode: string; // e.g. "300490"
  hsn_code?: string;
  gstPercent: number; // 0, 5, 12, 18
  gst_percent?: number;
  packUnit?: string; // e.g. "Strip", "Box", "Bottle", "Vial"
  pack_unit?: string;
  baseUnit?: string; // e.g. "Tablet", "Capsule", "ml", "Piece"
  base_unit?: string;
  unitsPerPack?: number; // e.g. 10 tablets per strip
  units_per_pack?: number;
  packSize?: string; // e.g. "10 Tabs / Strip"
  mrp?: number;
  purchaseRate?: number;
  purchase_rate?: number;
  category: DrugCategory;
  schedule: DrugSchedule;
  temperatureRequirement?: string; // e.g. "2°C - 8°C"
  temperature_requirement?: string;
  minStockAlert?: number;
  min_stock_alert?: number;
  isActive?: boolean;
  is_active?: number;
  batches: BatchItem[];
  total_available_base_units?: number;
}

export interface Patient {
  id: string;
  uhid: string; // Unique Healthcare ID e.g., "SH-2026-089"
  name: string;
  phone: string;
  email?: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'Unknown';
  address: string;
  knownAllergies: string[]; // e.g. ["Penicillin", "Sulfa drugs"]
  chronicConditions: string[]; // e.g. ["Type 2 Diabetes", "Hypertension"]
  familyGroupId?: string;
  creditBalance: number; // Outstanding amount owed (Khata)
  credit_balance?: number;
  creditLimit: number;
  credit_limit?: number;
  totalPurchases: number;
  total_purchases?: number;
  lastVisit?: string;
  last_visit?: string;
  prescriptions: PrescriptionRecord[];
}

export interface PrescriptionRecord {
  id: string;
  date: string;
  doctorName: string;
  doctor_name?: string;
  clinicHospital?: string;
  clinic_hospital?: string;
  doctorRegNo?: string;
  doctor_reg_no?: string;
  diagnosis: string;
  medicines: {
    medicineName: string;
    dosage: string; // e.g. "1-0-1 after food"
    durationDays: number;
    refillRemaining: number;
  }[];
  nextRefillDate?: string;
  next_refill_date?: string;
  attachmentName?: string;
  attachment_name?: string;
  attachmentType?: string;
  attachment_type?: string;
  attachmentDataBase64?: string;
  attachment_data_base64?: string;
}

export interface BillItem {
  medicineId: string;
  batchId?: string;
  brandName: string;
  genericComposition?: string;
  batchNumber: string;
  expiryDate: string;
  hsnCode: string;
  unitSold?: 'PACK' | 'BASE';
  unitLabel?: string;
  quantity: number;
  freeQuantity: number;
  baseUnitsDeducted?: number;
  mrp: number;
  rate: number;
  discountPercent: number;
  gstPercent: number;
  amount: number;
  schedule: DrugSchedule;
}

export interface SaleInvoice {
  id: string;
  invoiceNumber: string; // e.g. "INV-2026-0045"
  invoice_number?: string;
  date: string;
  time: string;
  patientId?: string;
  patient_id?: string;
  patientName: string;
  patient_name?: string;
  patientPhone?: string;
  patient_phone?: string;
  doctorName: string;
  doctor_name?: string;
  doctorRegNo?: string;
  doctor_reg_no?: string;
  items: BillItem[];
  items_json?: string;
  subTotal: number;
  subtotal?: number;
  totalDiscount: number;
  total_discount?: number;
  cgstTotal: number;
  cgst_total?: number;
  sgstTotal: number;
  sgst_total?: number;
  grandTotal: number;
  grand_total?: number;
  roundOff: number;
  round_off?: number;
  paymentMode: 'Cash' | 'UPI' | 'Card' | 'Credit (Khata)' | 'Split';
  payment_mode?: string;
  paymentStatus: 'Paid' | 'Partially Paid' | 'Due' | 'PAID' | 'DUE';
  payment_status?: string;
  cashReceived?: number;
  cash_received?: number;
  changeReturned?: number;
  change_returned?: number;
  billedBy: string;
  billed_by?: string;
}

export interface SalesReturnItem {
  batchId: string;
  medicineId: string;
  batchNumber: string;
  quantity: number;
  unitSold: 'PACK' | 'BASE';
  baseUnitsReturned: number;
  isResalable: boolean;
  amount: number;
  reason: string;
}

export interface CustomerReturn {
  id: string;
  returnNumber: string;
  return_number?: string;
  saleId: string;
  sale_id?: string;
  returnDate: string;
  return_date?: string;
  patientId?: string;
  patient_id?: string;
  patientName: string;
  patient_name?: string;
  totalRefund: number;
  total_refund?: number;
  refundMode: 'CASH' | 'CREDIT_BALANCE' | 'ORIGINAL_MODE';
  refund_mode?: string;
  items: SalesReturnItem[];
  items_json?: string;
  notes?: string;
  userId: string;
  user_id?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  contact_person?: string;
  phone: string;
  email?: string;
  address?: string;
  gstin?: string;
  dlNumber?: string; // Drug License Number
  dl_number?: string;
  paymentTermsDays?: number;
  payment_terms_days?: number;
  outstandingBalance: number;
  outstanding_balance?: number;
}

export interface SupplierReturn {
  id: string;
  returnNumber: string;
  return_number?: string;
  returnDate: string;
  return_date?: string;
  supplierId: string;
  supplier_id?: string;
  supplierName?: string;
  supplier_name?: string;
  batchId: string;
  batch_id?: string;
  batchNumber?: string;
  batch_number?: string;
  medicineId: string;
  medicine_id?: string;
  brandName?: string;
  brand_name?: string;
  quantityBaseUnits: number;
  quantity_base_units?: number;
  amount: number;
  reason: string;
  returnType: 'CREDIT_NOTE' | 'REPLACEMENT' | 'REFUND';
  return_type?: string;
  status: 'PENDING' | 'SETTLED' | 'REJECTED';
  creditNoteNumber?: string;
  credit_note_number?: string;
  userId: string;
  user_id?: string;
}

export interface StockMovement {
  id: string;
  timestamp: string;
  medicine_id: string;
  batch_id: string;
  brand_name?: string;
  batch_number?: string;
  movement_type: 'PURCHASE_RECEIPT' | 'SALE' | 'SALE_RETURN' | 'SUPPLIER_RETURN' | 'STOCK_ADJUSTMENT' | 'TRANSFER' | 'QUARANTINE';
  quantity_base_units: number;
  balance_after_base_units: number;
  reference_type?: string;
  reference_id?: string;
  user_id?: string;
  user_name?: string;
  notes?: string;
}

export interface ScheduleH1RegisterEntry {
  id: string;
  date: string;
  invoiceNumber: string;
  invoice_number?: string;
  patientName: string;
  patient_name?: string;
  patientAddress: string;
  patient_address?: string;
  doctorName: string;
  doctor_name?: string;
  doctorAddressReg?: string;
  doctor_reg_no?: string;
  medicineName: string;
  medicine_name?: string;
  batchNumber: string;
  batch_number?: string;
  quantitySold: number;
  quantity_sold?: number;
}

export interface UserSession {
  id: string;
  username?: string;
  name: string;
  role: UserRole;
  avatarInitials: string;
  avatar_initials?: string;
  pharmacistRegNo?: string;
  pharmacist_reg_no?: string;
}

export interface AuditLogItem {
  id: string;
  timestamp: string;
  user_id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  details_json?: string;
}
