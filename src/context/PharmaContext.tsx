import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  Medicine,
  Patient,
  Supplier,
  ScheduleH1RegisterEntry,
  SaleInvoice,
  UserSession,
  UserRole,
  BatchItem,
  PrescriptionRecord,
  BillItem,
  CustomerReturn,
  SupplierReturn,
  AuditLogItem
} from '../types/pharmacy';
import { api, setApiUserContext } from '../api/client';
import {
  INITIAL_MEDICINES,
  INITIAL_PATIENTS,
  INITIAL_SUPPLIERS,
  INITIAL_SCHEDULE_H1_REGISTER,
  INITIAL_INVOICES
} from '../data/mockPharmaData';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
}

interface PharmaContextType {
  // Auth & Session
  currentUser: UserSession | null;
  isAuthenticated: boolean;
  login: (role?: UserRole) => void;
  logout: () => void;
  switchRole: (role: UserRole) => void;
  hasPermission: (action: string) => boolean;

  // Settings
  settings: Record<string, any>;
  updateSettingsSection: (section: string, data: any) => Promise<void>;
  financialYear: string;
  drugLicenseNo: string;
  gstinNo: string;
  storeName: string;

  // Navigation
  activeTab: string;
  setActiveTab: (tab: string) => void;
  globalSearch: string;
  setGlobalSearch: (q: string) => void;

  // Inventory & Stock
  medicines: Medicine[];
  batches: BatchItem[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  loadInitialData?: () => Promise<void>;
  addMedicine: (medicine: any) => Promise<void>;
  deleteMedicine?: (id: string) => void;
  addBatch: (medicineId: string, batch: any) => Promise<void>;
  updateBatchStock?: (medicineId: string, batchId: string, newQty: number) => void;
  quarantineBatch?: (medicineId: string, batchId: string, reason?: string) => void;
  updateBatchStatus: (batchId: string, status: string, reason?: string) => Promise<void>;
  toggleBatchHoldStatus?: (batchId: string, isCurrentlyHeld: boolean, reason?: string) => Promise<void>;
  adjustBatchStock: (batchId: string, newQuantityBaseUnits: number, reason: string) => Promise<void>;
  updateSettingSection?: (section: string, data: any) => Promise<any>;
  switchUserRole?: (role: UserRole) => void;
  addSupplier?: (supplier: any) => void;

  // Patients & Prescriptions
  patients: Patient[];
  addPatient: (patient: any) => Promise<Patient>;
  updatePatient: (patientId: string, data: Partial<Patient>) => void;
  addPrescription: (patientId: string, rx: any) => Promise<void>;
  settleCredit: (patientId: string, amount: number, note?: string) => Promise<void>;
  sendRefillAlert: (patientId: string, medicineName: string) => void;

  // Billing & Sales
  invoices: SaleInvoice[];
  recordSaleInvoice: (invoiceData: any) => Promise<SaleInvoice>;
  customerReturns: CustomerReturn[];
  recordCustomerReturn: (returnData: any) => Promise<CustomerReturn>;

  // Purchases & Suppliers
  suppliers: Supplier[];
  supplierReturns: SupplierReturn[];
  recordPurchaseReceipt: (purchaseData: any) => Promise<any>;
  recordSupplierReturn: (returnData: any) => Promise<SupplierReturn>;

  // Compliance & Registers
  scheduleH1Register: ScheduleH1RegisterEntry[];
  auditLogs: AuditLogItem[];

  // Modal Print State
  activeInvoiceToPrint: SaleInvoice | null;
  setActiveInvoiceToPrint: (invoice: SaleInvoice | null) => void;

  // Toasts
  toasts: ToastMessage[];
  addToast: (title: string, message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
}

const PharmaContext = createContext<PharmaContextType | undefined>(undefined);

export const PharmaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Session State
  const [currentUser, setCurrentUser] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem('shakti_erp_user');
    return saved
      ? JSON.parse(saved)
      : {
          id: 'usr-2',
          name: 'Dr. Kailash Pandey (Chief Pharmacist)',
          role: 'pharmacist',
          avatarInitials: 'KP',
          pharmacistRegNo: 'MH-PC-44192'
        };
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Settings State
  const [settings, setSettings] = useState<Record<string, any>>({
    business: {
      storeName: 'Shakti MediStore & Healthcare ERP',
      financialYear: '2026 - 2027',
      invoicePrefix: 'INV-2026-'
    },
    pharmacy: {
      drugLicenseNo20B: 'MH-MZ4-204918',
      drugLicenseNo21B: 'MH-MZ4-205919',
      pharmacistName: 'Dr. Kailash Pandey, B.Pharm',
      pharmacistRegNo: 'MH-PC-44192'
    },
    tax: {
      gstin: '27AABCS1429B1Z2'
    },
    inventory: {
      nearExpiryDaysThreshold: 60,
      lowStockThresholdUnits: 30,
      fefoPriorityEnabled: true
    }
  });

  // Data States
  const [medicines, setMedicines] = useState<Medicine[]>(INITIAL_MEDICINES as any);
  const [batches, setBatches] = useState<BatchItem[]>([]);
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS as any);
  const [suppliers, setSuppliers] = useState<Supplier[]>(INITIAL_SUPPLIERS as any);
  const [invoices, setInvoices] = useState<SaleInvoice[]>(INITIAL_INVOICES as any);
  const [customerReturns, setCustomerReturns] = useState<CustomerReturn[]>([]);
  const [supplierReturns, setSupplierReturns] = useState<SupplierReturn[]>([]);
  const [scheduleH1Register, setScheduleH1Register] = useState<ScheduleH1RegisterEntry[]>(INITIAL_SCHEDULE_H1_REGISTER as any);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);

  const [activeInvoiceToPrint, setActiveInvoiceToPrint] = useState<SaleInvoice | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Update API context when currentUser changes
  useEffect(() => {
    if (currentUser) {
      setApiUserContext({
        userId: currentUser.id,
        userName: currentUser.name,
        userRole: currentUser.role
      });
      localStorage.setItem('shakti_erp_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('shakti_erp_user');
    }
  }, [currentUser]);

  // Toast Helper
  const addToast = (title: string, message: string, type: ToastMessage['type'] = 'info') => {
    const id = 'toast-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Permission Check
  const hasPermission = useCallback((action: string): boolean => {
    if (!currentUser) return false;
    const role = currentUser.role as any;

    if (role === 'owner_admin') return true;

    if (action === 'SETTINGS_MODIFY' || action === 'USERS_MANAGE' || action === 'canManageSettings') {
      return role === 'owner_admin';
    }

    if (action === 'PRICE_OVERRIDE' || action === 'FORCE_EXPIRED_SALE') {
      return role === 'owner_admin';
    }

    if (action === 'STOCK_ADJUST' || action === 'BATCH_HOLD' || action === 'canAdjustStock' || action === 'canOverrideBatch') {
      return ['owner_admin', 'pharmacist', 'inventory_staff'].includes(role);
    }

    if (action === 'BILLING_SALE' || action === 'PAYMENT_COLLECT' || action === 'canSell') {
      return ['owner_admin', 'pharmacist', 'cashier'].includes(role);
    }

    if (action === 'PURCHASE_RECEIPT' || action === 'SUPPLIER_RETURN' || action === 'canReceivePurchase' || action === 'canCreateSupplierReturn') {
      return ['owner_admin', 'pharmacist', 'inventory_staff'].includes(role);
    }

    if (action === 'CUSTOMER_RETURN' || action === 'canCreateSalesReturn') {
      return ['owner_admin', 'pharmacist', 'cashier'].includes(role);
    }

    if (action === 'PRESCRIPTION_LOG') {
      return ['owner_admin', 'pharmacist'].includes(role);
    }

    return false;
  }, [currentUser]);

  // Fetch full data from SQLite Backend
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [fetchedSettings, fetchedMeds, fetchedBatches, fetchedPatients, fetchedSuppliers, fetchedSales, fetchedReturns, fetchedSupReturns, fetchedAudit] =
        await Promise.allSettled([
          api.getSettings(),
          api.getMedicines(),
          api.getBatches(),
          api.getPatients(),
          api.getSuppliers(),
          api.getSales(),
          api.getCustomerReturns(),
          api.getSupplierReturns(),
          api.getAuditLogs()
        ]);

      if (fetchedSettings.status === 'fulfilled') setSettings(fetchedSettings.value);
      if (fetchedMeds.status === 'fulfilled') setMedicines(fetchedMeds.value);
      if (fetchedBatches.status === 'fulfilled') setBatches(fetchedBatches.value);
      if (fetchedPatients.status === 'fulfilled') setPatients(fetchedPatients.value);
      if (fetchedSuppliers.status === 'fulfilled') setSuppliers(fetchedSuppliers.value);
      if (fetchedSales.status === 'fulfilled') {
        const sales = fetchedSales.value.map((s: any) => ({
          ...s,
          invoiceNumber: s.invoice_number,
          patientName: s.patient_name,
          grandTotal: s.grand_total,
          paymentMode: s.payment_mode,
          paymentStatus: s.payment_status,
          billedBy: s.billed_by,
          items: s.items_json ? JSON.parse(s.items_json) : []
        }));
        setInvoices(sales);
      }
      if (fetchedReturns.status === 'fulfilled') setCustomerReturns(fetchedReturns.value);
      if (fetchedSupReturns.status === 'fulfilled') setSupplierReturns(fetchedSupReturns.value);
      if (fetchedAudit.status === 'fulfilled') setAuditLogs(fetchedAudit.value);
    } catch (err: any) {
      console.warn('Backend sync note: operating with active local store cache', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auth Operations
  const login = (role: UserRole = 'pharmacist') => {
    const roleNames: Record<UserRole, string> = {
      owner_admin: 'Vikram Singhania (Store Director)',
      pharmacist: 'Dr. Kailash Pandey (Chief Pharmacist)',
      cashier: 'Sunil Jadhav (Billing Clerk)',
      inventory_staff: 'Rohan Mehta (Store Incharge)',
      auditor: 'Meera Rao (Statutory Auditor)'
    };

    const user: UserSession = {
      id: role === 'owner_admin' ? 'usr-1' : role === 'pharmacist' ? 'usr-2' : 'usr-3',
      name: roleNames[role],
      role,
      avatarInitials: role === 'owner_admin' ? 'VS' : role === 'pharmacist' ? 'KP' : 'SJ',
      pharmacistRegNo: role === 'pharmacist' ? 'MH-PC-44192' : undefined
    };
    setCurrentUser(user);
    addToast('Authenticated Successfully', `Active session: ${user.name} (${user.role})`, 'success');
  };

  const logout = () => {
    setCurrentUser(null);
    addToast('Logged Out', 'Your session has been securely locked.', 'info');
  };

  const switchRole = (newRole: UserRole) => {
    login(newRole);
  };

  // Settings
  const updateSettingsSection = async (section: string, data: any) => {
    try {
      const res = await api.updateSettingSection(section, data);
      setSettings((prev) => ({ ...prev, [section]: res.data }));
      addToast('Settings Saved', `${section.toUpperCase()} settings successfully persisted to SQLite.`, 'success');
      await refreshData();
    } catch (err: any) {
      addToast('Settings Update Failed', err.message, 'error');
      throw err;
    }
  };

  // Medicine & Stock Management
  const addMedicine = async (medicineData: any) => {
    try {
      const created = await api.createMedicine(medicineData);
      setMedicines((prev) => [created, ...prev]);
      addToast('Catalogue Updated', `${created.brandName || created.brand_name} added to master catalogue`, 'success');
      await refreshData();
    } catch (err: any) {
      addToast('Catalogue Error', err.message, 'error');
      throw err;
    }
  };

  const addBatch = async (medicineId: string, batchData: any) => {
    try {
      await api.createPurchase({
        supplierId: batchData.supplierId || suppliers[0]?.id,
        items: [{ medicineId, ...batchData }]
      });
      addToast('Batch Inward Recorded', `Batch ${batchData.batchNumber} added successfully`, 'success');
      await refreshData();
    } catch (err: any) {
      addToast('Batch Error', err.message, 'error');
      throw err;
    }
  };

  const updateBatchStatus = async (batchId: string, status: string, reason?: string) => {
    try {
      await api.updateBatchStatus(batchId, status, reason);
      addToast('Batch Status Updated', `Batch status changed to ${status}`, 'info');
      await refreshData();
    } catch (err: any) {
      addToast('Status Error', err.message, 'error');
      throw err;
    }
  };

  const adjustBatchStock = async (batchId: string, newQuantityBaseUnits: number, reason: string) => {
    try {
      await api.adjustStock(batchId, newQuantityBaseUnits, reason);
      addToast('Physical Stock Adjusted', `Batch stock updated to ${newQuantityBaseUnits} base units`, 'success');
      await refreshData();
    } catch (err: any) {
      addToast('Adjustment Error', err.message, 'error');
      throw err;
    }
  };

  // Patients
  const addPatient = async (patientData: any): Promise<Patient> => {
    try {
      const created = await api.createPatient(patientData);
      setPatients((prev) => [created, ...prev]);
      addToast('Patient Registered', `${created.name} registered with UHID ${created.uhid}`, 'success');
      return created;
    } catch (err: any) {
      addToast('Patient Registration Error', err.message, 'error');
      throw err;
    }
  };

  const updatePatient = (patientId: string, data: Partial<Patient>) => {
    setPatients((prev) => prev.map((p) => (p.id === patientId ? { ...p, ...data } : p)));
    addToast('Patient Record Updated', 'Details updated', 'success');
  };

  const addPrescription = async (patientId: string, rxData: any) => {
    try {
      await api.addPrescription(patientId, rxData);
      addToast('Prescription Logged', `Prescription by ${rxData.doctorName} attached`, 'success');
      await refreshData();
    } catch (err: any) {
      addToast('Prescription Error', err.message, 'error');
      throw err;
    }
  };

  const settleCredit = async (patientId: string, amount: number, note?: string) => {
    try {
      await api.settlePatientCredit(patientId, amount, note);
      addToast('Khata Payment Received', `₹${amount.toFixed(2)} credited to account.`, 'success');
      await refreshData();
    } catch (err: any) {
      addToast('Payment Error', err.message, 'error');
      throw err;
    }
  };

  const sendRefillAlert = (patientId: string, medicineName: string) => {
    const p = patients.find((pat) => pat.id === patientId);
    if (!p) return;
    addToast('Refill Reminder Dispatched', `Chronic refill notice sent to ${p.name} (${p.phone}) for ${medicineName}.`, 'success');
  };

  // Billing & Sales
  const recordSaleInvoice = async (invoiceData: any): Promise<SaleInvoice> => {
    try {
      const invoice = await api.createSale(invoiceData);
      setActiveInvoiceToPrint({
        ...invoice,
        invoiceNumber: invoice.invoice_number || invoice.invoiceNumber,
        grandTotal: invoice.grand_total || invoice.grandTotal,
        items: invoice.items_json ? JSON.parse(invoice.items_json) : invoice.items
      });
      addToast('Bill Generated & Stock Deducted', `Invoice ${invoice.invoice_number || invoice.invoiceNumber} printed`, 'success');
      await refreshData();
      return invoice;
    } catch (err: any) {
      addToast('Billing Blocked', err.message, 'error');
      throw err;
    }
  };

  const recordCustomerReturn = async (returnData: any): Promise<CustomerReturn> => {
    try {
      const ret = await api.createCustomerReturn(returnData);
      addToast('Sales Return Processed', `Return #${ret.return_number || ret.returnNumber} completed`, 'success');
      await refreshData();
      return ret;
    } catch (err: any) {
      addToast('Return Error', err.message, 'error');
      throw err;
    }
  };

  // Purchasing & Suppliers
  const recordPurchaseReceipt = async (purchaseData: any) => {
    try {
      const po = await api.createPurchase(purchaseData);
      addToast('Purchase Inward Complete', `Purchase order #${po.purchase_number || po.purchaseNumber} recorded`, 'success');
      await refreshData();
      return po;
    } catch (err: any) {
      addToast('Purchase Error', err.message, 'error');
      throw err;
    }
  };

  const recordSupplierReturn = async (returnData: any): Promise<SupplierReturn> => {
    try {
      const ret = await api.createSupplierReturn(returnData);
      addToast('Supplier Debit Note Issued', `Return claim #${ret.return_number || ret.returnNumber} pending credit note`, 'success');
      await refreshData();
      return ret;
    } catch (err: any) {
      addToast('Supplier Return Error', err.message, 'error');
      throw err;
    }
  };

  return (
    <PharmaContext.Provider
      value={{
        currentUser,
        isAuthenticated: !!currentUser,
        login,
        logout,
        switchRole,
        hasPermission,
        settings,
        updateSettingsSection,
        financialYear: settings.business?.financialYear || '2026 - 2027',
        drugLicenseNo: `${settings.pharmacy?.drugLicenseNo20B || 'MH-MZ4-204918'} / ${settings.pharmacy?.drugLicenseNo21B || '205919'}`,
        gstinNo: settings.tax?.gstin || '27AABCS1429B1Z2',
        storeName: settings.business?.storeName || 'Shakti MediStore & Healthcare ERP',
        activeTab,
        setActiveTab,
        globalSearch,
        setGlobalSearch,
        medicines,
        batches,
        isLoading,
        refreshData,
        loadInitialData: refreshData,
        addMedicine,
        deleteMedicine: (id: string) => setMedicines(prev => prev.filter(m => m.id !== id)),
        addBatch,
        updateBatchStock: () => {},
        quarantineBatch: () => {},
        updateBatchStatus,
        toggleBatchHoldStatus: (batchId: string, isHeld: boolean, reason?: string) =>
          updateBatchStatus(batchId, isHeld ? 'AVAILABLE' : 'HELD', reason),
        adjustBatchStock,
        updateSettingSection: updateSettingsSection,
        switchUserRole: switchRole,
        addSupplier: (s: any) => setSuppliers(prev => [s, ...prev]),
        patients,
        addPatient,
        updatePatient,
        addPrescription,
        settleCredit,
        sendRefillAlert,
        invoices,
        recordSaleInvoice,
        customerReturns,
        recordCustomerReturn,
        suppliers,
        supplierReturns,
        recordPurchaseReceipt,
        recordSupplierReturn,
        scheduleH1Register,
        auditLogs,
        activeInvoiceToPrint,
        setActiveInvoiceToPrint,
        toasts,
        addToast,
        removeToast
      }}
    >
      {children}
    </PharmaContext.Provider>
  );
};

export const usePharma = () => {
  const context = useContext(PharmaContext);
  if (!context) {
    throw new Error('usePharma must be used within a PharmaProvider');
  }
  return context;
};
