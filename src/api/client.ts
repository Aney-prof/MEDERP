// Client API Layer for connecting to persistent SQLite backend

export interface ApiUserContext {
  userId: string;
  userName: string;
  userRole: string;
}

let activeUserContext: ApiUserContext = {
  userId: 'usr-2',
  userName: 'Dr. Kailash Pandey (Chief Pharmacist)',
  userRole: 'pharmacist'
};

export function setApiUserContext(ctx: ApiUserContext) {
  activeUserContext = ctx;
}

export function getApiUserContext(): ApiUserContext {
  return activeUserContext;
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  headers.set('Content-Type', 'application/json');
  headers.set('X-User-Id', activeUserContext.userId);
  headers.set('X-User-Name', activeUserContext.userName);
  headers.set('X-User-Role', activeUserContext.userRole);

  const res = await fetch(endpoint, {
    ...options,
    headers
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || `HTTP error ${res.status}`);
  }
  return data as T;
}

export const api = {
  // Settings
  getSettings: () => request<Record<string, any>>('/api/settings'),
  updateSettingSection: (section: string, data: any) =>
    request<{ success: boolean; section: string; data: any }>(`/api/settings/${section}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  // Medicines
  getMedicines: (q?: string) => request<any[]>(q ? `/api/medicines?q=${encodeURIComponent(q)}` : '/api/medicines'),
  getMedicineById: (id: string) => request<any>(`/api/medicines/${id}`),
  createMedicine: (data: any) => request<any>('/api/medicines', { method: 'POST', body: JSON.stringify(data) }),
  getCompositionAlternatives: (generic: string, excludeId?: string) =>
    request<any[]>(`/api/medicines/alternatives?generic=${encodeURIComponent(generic)}${excludeId ? `&exclude=${excludeId}` : ''}`),

  // Batches & Inventory
  getBatches: (filters?: { medicineId?: string; status?: string; branchId?: string; q?: string }) => {
    const params = new URLSearchParams();
    if (filters?.medicineId) params.append('medicineId', filters.medicineId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.branchId) params.append('branchId', filters.branchId);
    if (filters?.q) params.append('q', filters.q);
    const qs = params.toString();
    return request<any[]>(qs ? `/api/batches?${qs}` : '/api/batches');
  },
  updateBatchStatus: (batchId: string, status: string, reason?: string) =>
    request<any>(`/api/batches/${batchId}/status`, { method: 'PUT', body: JSON.stringify({ status, reason }) }),
  adjustStock: (batchId: string, newQuantityBaseUnits: number, reason: string) =>
    request<any>(`/api/batches/${batchId}/adjust`, {
      method: 'POST',
      body: JSON.stringify({ newQuantityBaseUnits, reason })
    }),

  // Sales & Billing
  createSale: (data: any) => request<any>('/api/sales', { method: 'POST', body: JSON.stringify(data) }),
  getSales: () => request<any[]>('/api/sales'),

  // Customer Sales Returns
  createCustomerReturn: (data: any) => request<any>('/api/sales/returns', { method: 'POST', body: JSON.stringify(data) }),
  getCustomerReturns: () => request<any[]>('/api/sales/returns'),

  // Purchases & Suppliers
  createPurchase: (data: any) => request<any>('/api/purchases', { method: 'POST', body: JSON.stringify(data) }),
  getPurchases: () => request<any[]>('/api/purchases'),
  getSuppliers: () => request<any[]>('/api/suppliers'),

  // Supplier Returns
  createSupplierReturn: (data: any) => request<any>('/api/suppliers/returns', { method: 'POST', body: JSON.stringify(data) }),
  getSupplierReturns: () => request<any[]>('/api/suppliers/returns'),

  // Patients & Prescriptions
  getPatients: (q?: string) => request<any[]>(q ? `/api/patients?q=${encodeURIComponent(q)}` : '/api/patients'),
  getPatientById: (id: string) => request<any>(`/api/patients/${id}`),
  createPatient: (data: any) => request<any>('/api/patients', { method: 'POST', body: JSON.stringify(data) }),
  addPrescription: (patientId: string, data: any) =>
    request<any>(`/api/patients/${patientId}/prescriptions`, { method: 'POST', body: JSON.stringify(data) }),
  settlePatientCredit: (patientId: string, amount: number, paymentMode?: string) =>
    request<any>(`/api/patients/${patientId}/settle-credit`, {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMode })
    }),

  // Reports
  getReport: (type: string, params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<any>(`/api/reports/${type}${qs}`);
  },

  // Stock Movements & Audit
  getStockMovements: (filters?: { medicineId?: string; batchId?: string }) => {
    const params = new URLSearchParams();
    if (filters?.medicineId) params.append('medicineId', filters.medicineId);
    if (filters?.batchId) params.append('batchId', filters.batchId);
    const qs = params.toString();
    return request<any[]>(qs ? `/api/stock-movements?${qs}` : '/api/stock-movements');
  },
  getAuditLogs: () => request<any[]>('/api/audit-logs'),
  getUsers: () => request<any[]>('/api/users')
};
