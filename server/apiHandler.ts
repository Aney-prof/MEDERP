import type { UserContext } from './erpService.ts';
import { ErpService } from './erpService.ts';
import type { IncomingMessage, ServerResponse } from 'node:http';

export async function handleApiRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  if (!pathname.startsWith('/api')) {
    return false;
  }

  // Parse user context from headers or query (default to chief pharmacist if not specified)
  const user: UserContext = {
    userId: (req.headers['x-user-id'] as string) || 'usr-2',
    userName: (req.headers['x-user-name'] as string) || 'Dr. Kailash Pandey (Chief Pharmacist)',
    userRole: (req.headers['x-user-role'] as string) || 'pharmacist'
  };

  const sendJson = (statusCode: number, data: any) => {
    res.statusCode = statusCode;
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id, X-User-Name, X-User-Role');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.end(JSON.stringify(data));
  };

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-User-Id, X-User-Name, X-User-Role');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.end();
    return true;
  }

  // Read request body for POST / PUT
  let body: any = null;
  if (['POST', 'PUT', 'PATCH'].includes(req.method || '')) {
    try {
      const chunks: Buffer[] = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const raw = Buffer.concat(chunks).toString('utf-8');
      if (raw) {
        body = JSON.parse(raw);
      }
    } catch {
      sendJson(400, { error: 'Invalid JSON request payload' });
      return true;
    }
  }

  try {
    // 1. Settings Routes
    if (pathname === '/api/settings' && req.method === 'GET') {
      const settings = ErpService.getSettings();
      sendJson(200, settings);
      return true;
    }

    const settingsMatch = pathname.match(/^\/api\/settings\/([a-zA-Z0-9_-]+)$/);
    if (settingsMatch && req.method === 'PUT') {
      const section = settingsMatch[1];
      const updated = ErpService.updateSettingSection(section, body, user);
      sendJson(200, { success: true, section, data: updated });
      return true;
    }

    // 2. Medicines Catalogue
    if (pathname === '/api/medicines' && req.method === 'GET') {
      const search = url.searchParams.get('q') || undefined;
      const medicines = ErpService.getMedicines(search);
      sendJson(200, medicines);
      return true;
    }

    if (pathname === '/api/medicines' && req.method === 'POST') {
      const created = ErpService.createMedicine(body, user);
      sendJson(201, created);
      return true;
    }

    if (pathname === '/api/medicines/alternatives' && req.method === 'GET') {
      const generic = url.searchParams.get('generic') || '';
      const exclude = url.searchParams.get('exclude') || undefined;
      const alts = ErpService.getCompositionAlternatives(generic, exclude);
      sendJson(200, alts);
      return true;
    }

    const medIdMatch = pathname.match(/^\/api\/medicines\/([a-zA-Z0-9_-]+)$/);
    if (medIdMatch && req.method === 'GET') {
      const med = ErpService.getMedicineById(medIdMatch[1]);
      if (!med) {
        sendJson(404, { error: 'Medicine not found' });
        return true;
      }
      sendJson(200, med);
      return true;
    }

    // 3. Batches & Stock
    if (pathname === '/api/batches' && req.method === 'GET') {
      const medicineId = url.searchParams.get('medicineId') || undefined;
      const status = url.searchParams.get('status') || undefined;
      const branchId = url.searchParams.get('branchId') || undefined;
      const search = url.searchParams.get('q') || undefined;
      const batches = ErpService.getBatches({ medicineId, status, branchId, search });
      sendJson(200, batches);
      return true;
    }

    const batchStatusMatch = pathname.match(/^\/api\/batches\/([a-zA-Z0-9_-]+)\/status$/);
    if (batchStatusMatch && req.method === 'PUT') {
      const updated = ErpService.updateBatchStatus(batchStatusMatch[1], body.status, user, body.reason);
      sendJson(200, updated);
      return true;
    }

    const batchAdjustMatch = pathname.match(/^\/api\/batches\/([a-zA-Z0-9_-]+)\/adjust$/);
    if (batchAdjustMatch && req.method === 'POST') {
      const updated = ErpService.adjustStock(batchAdjustMatch[1], Number(body.newQuantityBaseUnits), body.reason, user);
      sendJson(200, updated);
      return true;
    }

    // 4. Sales & Invoices
    if (pathname === '/api/sales' && req.method === 'POST') {
      const invoice = ErpService.createSaleInvoice(body, user);
      sendJson(201, invoice);
      return true;
    }

    if (pathname === '/api/sales' && req.method === 'GET') {
      const { db } = await import('./db.ts');
      const invoices = db.prepare('SELECT * FROM sales_invoices ORDER BY date DESC, time DESC LIMIT 100').all();
      sendJson(200, invoices);
      return true;
    }

    // Customer Returns
    if (pathname === '/api/sales/returns' && req.method === 'POST') {
      const ret = ErpService.createCustomerReturn(body, user);
      sendJson(201, ret);
      return true;
    }

    if (pathname === '/api/sales/returns' && req.method === 'GET') {
      const { db } = await import('./db.ts');
      const returns = db.prepare('SELECT * FROM sales_returns ORDER BY return_date DESC LIMIT 100').all();
      sendJson(200, returns);
      return true;
    }

    // 5. Purchases & Suppliers
    if (pathname === '/api/purchases' && req.method === 'POST') {
      const po = ErpService.createPurchaseReceipt(body, user);
      sendJson(201, po);
      return true;
    }

    if (pathname === '/api/purchases' && req.method === 'GET') {
      const { db } = await import('./db.ts');
      const purchases = db.prepare('SELECT p.*, s.name as supplier_name FROM purchases p JOIN suppliers s ON p.supplier_id = s.id ORDER BY p.received_date DESC').all();
      sendJson(200, purchases);
      return true;
    }

    if (pathname === '/api/suppliers' && req.method === 'GET') {
      const suppliers = ErpService.getSuppliers();
      sendJson(200, suppliers);
      return true;
    }

    // Supplier Returns
    if (pathname === '/api/suppliers/returns' && req.method === 'POST') {
      const ret = ErpService.createSupplierReturn(body, user);
      sendJson(201, ret);
      return true;
    }

    if (pathname === '/api/suppliers/returns' && req.method === 'GET') {
      const returns = ErpService.getReports('supplier_returns');
      sendJson(200, returns);
      return true;
    }

    // 6. Patients & Prescriptions
    if (pathname === '/api/patients' && req.method === 'GET') {
      const search = url.searchParams.get('q') || undefined;
      const patients = ErpService.getPatients(search);
      sendJson(200, patients);
      return true;
    }

    if (pathname === '/api/patients' && req.method === 'POST') {
      const p = ErpService.createPatient(body, user);
      sendJson(201, p);
      return true;
    }

    const patientIdMatch = pathname.match(/^\/api\/patients\/([a-zA-Z0-9_-]+)$/);
    if (patientIdMatch && req.method === 'GET') {
      const p = ErpService.getPatientById(patientIdMatch[1]);
      if (!p) {
        sendJson(404, { error: 'Patient not found' });
        return true;
      }
      sendJson(200, p);
      return true;
    }

    const patientRxMatch = pathname.match(/^\/api\/patients\/([a-zA-Z0-9_-]+)\/prescriptions$/);
    if (patientRxMatch && req.method === 'POST') {
      const updated = ErpService.addPrescription(patientRxMatch[1], body, user);
      sendJson(201, updated);
      return true;
    }

    const patientSettleMatch = pathname.match(/^\/api\/patients\/([a-zA-Z0-9_-]+)\/settle-credit$/);
    if (patientSettleMatch && req.method === 'POST') {
      const updated = ErpService.settlePatientCredit(patientSettleMatch[1], body.amount, body.paymentMode || 'Cash', user);
      sendJson(200, updated);
      return true;
    }

    // 7. Reports
    const reportMatch = pathname.match(/^\/api\/reports\/([a-zA-Z0-9_-]+)$/);
    if (reportMatch && req.method === 'GET') {
      const type = reportMatch[1];
      const params = Object.fromEntries(url.searchParams.entries());
      const report = ErpService.getReports(type, params);
      sendJson(200, report);
      return true;
    }

    // 8. Stock Movements & Audit
    if (pathname === '/api/stock-movements' && req.method === 'GET') {
      const medicineId = url.searchParams.get('medicineId') || undefined;
      const batchId = url.searchParams.get('batchId') || undefined;
      const movements = ErpService.getStockMovements({ medicineId, batchId });
      sendJson(200, movements);
      return true;
    }

    if (pathname === '/api/audit-logs' && req.method === 'GET') {
      const limit = Number(url.searchParams.get('limit') || 100);
      const logs = ErpService.getAuditLogs(limit);
      sendJson(200, logs);
      return true;
    }

    if (pathname === '/api/users' && req.method === 'GET') {
      const users = ErpService.getUsers();
      sendJson(200, users);
      return true;
    }

    sendJson(404, { error: `Endpoint not found: ${pathname}` });
    return true;
  } catch (err: any) {
    sendJson(400, { error: err.message || 'Server error occurred during processing' });
    return true;
  }
}
