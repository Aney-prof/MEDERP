import React, { useState, useMemo } from 'react';
import { usePharma } from '../context/PharmaContext';
import { Supplier, Medicine } from '../types/pharmacy';
import {
  Truck,
  Plus,
  Search,
  Building2,
  Phone,
  Mail,
  FileSpreadsheet,
  Upload,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Layers,
  X,
  FileText,
  AlertTriangle,
  PackagePlus,
  RefreshCw
} from 'lucide-react';

export const PurchasesSuppliers: React.FC = () => {
  const {
    suppliers,
    medicines,
    recordPurchaseReceipt,
    hasPermission,
    loadInitialData,
    addToast
  } = usePharma();

  const [activeTab, setActiveTab] = useState<'LEDGER' | 'NEW_RECEIPT' | 'IMPORT_CSV' | 'OCR_IMPORT'>('LEDGER');
  const [searchQuery, setSearchQuery] = useState('');

  // New Purchase Inward State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [purchaseItems, setPurchaseItems] = useState<Array<{
    medicineId: string;
    batchNumber: string;
    mfgDate: string;
    expiryDate: string;
    quantityPacks: number;
    purchaseRatePack: number;
    mrpPack: number;
    rackLocation: string;
  }>>([
    {
      medicineId: medicines[0]?.id || '',
      batchNumber: '',
      mfgDate: '2026-01',
      expiryDate: '2028-12',
      quantityPacks: 10,
      purchaseRatePack: 50,
      mrpPack: 85,
      rackLocation: 'Rack A-01'
    }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // CSV Import State
  const [csvContent, setCsvContent] = useState('');
  const [csvPreviewData, setCsvPreviewData] = useState<any[]>([]);
  const [csvErrors, setCsvErrors] = useState<string[]>([]);

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        (s.contactPerson || s.contact_person || '').toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        (s.gstin || '').toLowerCase().includes(q)
      );
    });
  }, [suppliers, searchQuery]);

  const addPurchaseLine = () => {
    setPurchaseItems([
      ...purchaseItems,
      {
        medicineId: medicines[0]?.id || '',
        batchNumber: '',
        mfgDate: '2026-01',
        expiryDate: '2028-12',
        quantityPacks: 10,
        purchaseRatePack: 50,
        mrpPack: 85,
        rackLocation: 'Rack A-01'
      }
    ]);
  };

  const removePurchaseLine = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const updatePurchaseLine = (index: number, field: string, value: any) => {
    const updated = [...purchaseItems];
    updated[index] = { ...updated[index], [field]: value };
    setPurchaseItems(updated);
  };

  const handleCommitPurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('canReceivePurchase')) {
      addToast('Permission Denied', 'Your user role cannot receive inward purchase invoices.', 'error');
      return;
    }
    if (!selectedSupplierId) {
      addToast('Missing Supplier', 'Please select a registered supplier.', 'error');
      return;
    }
    if (!invoiceNumber.trim()) {
      addToast('Missing Invoice Number', 'Please enter the supplier bill/invoice number.', 'error');
      return;
    }

    for (const item of purchaseItems) {
      if (!item.medicineId || !item.batchNumber.trim() || !item.expiryDate) {
        addToast('Invalid Line Item', 'Medicine, Batch #, and Expiry date are mandatory for all items.', 'error');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const itemsPayload = purchaseItems.map(p => {
        const med = medicines.find(m => m.id === p.medicineId);
        const unitsPerPack = med?.unitsPerPack || med?.units_per_pack || 1;
        const totalBaseUnits = p.quantityPacks * unitsPerPack;
        const purchaseRateBaseUnit = p.purchaseRatePack / unitsPerPack;
        const mrpBaseUnit = p.mrpPack / unitsPerPack;

        return {
          medicineId: p.medicineId,
          batchNumber: p.batchNumber.toUpperCase().trim(),
          mfgDate: p.mfgDate,
          expiryDate: p.expiryDate,
          quantityBaseUnits: totalBaseUnits,
          purchaseRate: purchaseRateBaseUnit,
          mrp: mrpBaseUnit,
          locationRack: p.rackLocation
        };
      });

      await recordPurchaseReceipt({
        supplierId: selectedSupplierId,
        invoiceNumber: invoiceNumber.trim(),
        invoiceDate,
        items: itemsPayload
      });

      addToast('Goods Received', `Inward purchase invoice ${invoiceNumber} created and batches updated.`, 'success');
      setActiveTab('LEDGER');
      setInvoiceNumber('');
      setPurchaseItems([
        {
          medicineId: medicines[0]?.id || '',
          batchNumber: '',
          mfgDate: '2026-01',
          expiryDate: '2028-12',
          quantityPacks: 10,
          purchaseRatePack: 50,
          mrpPack: 85,
          rackLocation: 'Rack A-01'
        }
      ]);
    } catch (err: any) {
      addToast('Purchase Receipt Failed', err.message || 'Error recording purchase', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleParseCsv = (raw: string) => {
    setCsvContent(raw);
    const lines = raw.trim().split('\n');
    if (lines.length <= 1) {
      setCsvPreviewData([]);
      setCsvErrors(['CSV contains no data rows']);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const expectedHeaders = ['medicine_id', 'batch_number', 'expiry_date', 'quantity_packs', 'purchase_rate'];
    const missing = expectedHeaders.filter(h => !headers.includes(h));
    if (missing.length > 0) {
      setCsvErrors([`Missing mandatory CSV headers: ${missing.join(', ')}`]);
      setCsvPreviewData([]);
      return;
    }

    const rows: any[] = [];
    const errors: string[] = [];

    lines.slice(1).forEach((line, idx) => {
      if (!line.trim()) return;
      const values = line.split(',').map(v => v.trim());
      const rowObj: any = {};
      headers.forEach((h, i) => {
        rowObj[h] = values[i] || '';
      });

      // Simple validation
      if (!rowObj['medicine_id'] || !rowObj['batch_number'] || !rowObj['expiry_date']) {
        errors.push(`Row ${idx + 2}: Missing required fields (medicine_id, batch_number, expiry_date)`);
      } else {
        rows.push(rowObj);
      }
    });

    setCsvPreviewData(rows);
    setCsvErrors(errors);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Truck className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Purchases & Suppliers</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
                Distributor Network
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Inward goods receipts, distributor ledgers, separate batch creation per delivery, and invoice imports.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('NEW_RECEIPT')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'NEW_RECEIPT'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <PackagePlus className="w-4 h-4" />
              New Inward Receipt
            </button>
            <button
              onClick={() => setActiveTab('LEDGER')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-2 transition-all ${
                activeTab === 'LEDGER'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              <Building2 className="w-4 h-4" />
              Suppliers Ledger
            </button>
            <button
              onClick={() => setActiveTab('IMPORT_CSV')}
              className={`px-3 py-2 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === 'IMPORT_CSV'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              CSV Import
            </button>
            <button
              onClick={() => setActiveTab('OCR_IMPORT')}
              className={`px-3 py-2 text-xs font-medium rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === 'OCR_IMPORT'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              Scan / OCR
            </button>
          </div>
        </div>
      </div>

      {/* VIEW: Suppliers Ledger */}
      {activeTab === 'LEDGER' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search suppliers by name, contact, phone, or GSTIN..."
                className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500"
              />
            </div>
            <div className="text-xs text-slate-400 font-medium">
              Total Distributors: <span className="text-white font-bold">{suppliers.length}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSuppliers.map(sup => (
              <div key={sup.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4 hover:border-slate-700 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-white text-base">{sup.name}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Contact: {sup.contactPerson || sup.contact_person || 'N/A'}
                    </div>
                  </div>
                  <span className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
                    <Building2 className="w-4 h-4" />
                  </span>
                </div>

                <div className="space-y-2 text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>{sup.phone}</span>
                  </div>
                  {sup.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span>{sup.email}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 font-mono bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                    GSTIN: {sup.gstin || 'Unregistered'} • DL: {sup.dlNumber || sup.dl_number || 'Pending'}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Outstanding: </span>
                    <span className={`font-mono font-bold ${
                      (sup.outstandingBalance || sup.outstanding_balance || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      ₹{(sup.outstandingBalance || sup.outstanding_balance || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedSupplierId(sup.id);
                      setActiveTab('NEW_RECEIPT');
                    }}
                    className="text-teal-400 hover:text-teal-300 font-semibold flex items-center gap-1 text-[11px]"
                  >
                    Receive Stock →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW: New Inward Purchase Receipt */}
      {activeTab === 'NEW_RECEIPT' && (
        <form onSubmit={handleCommitPurchase} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">Inward Goods Receipt (Purchase Entry)</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Every delivery creates traceable, distinct batch allocations under the selected distributor.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('LEDGER')}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Supplier & Invoice Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Select Supplier / Distributor *
              </label>
              <select
                required
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
              >
                <option value="">-- Choose Supplier --</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name} ({s.gstin || 'No GSTIN'})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Supplier Invoice / Bill No. *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. SUN-INV-88210"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Invoice Date *
              </label>
              <input
                type="date"
                required
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-200">Delivered Medicines & Batches</h3>
              <button
                type="button"
                onClick={addPurchaseLine}
                className="px-3 py-1.5 text-xs font-medium text-teal-400 bg-teal-500/10 border border-teal-500/20 rounded-xl hover:bg-teal-500/20 transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Medicine Line
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-800 rounded-xl">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-3">Medicine</th>
                    <th className="py-3 px-3">Batch #</th>
                    <th className="py-3 px-3">Mfg (YYYY-MM)</th>
                    <th className="py-3 px-3">Expiry (YYYY-MM)</th>
                    <th className="py-3 px-3">Packs Qty</th>
                    <th className="py-3 px-3">Purchase Rate / Pack</th>
                    <th className="py-3 px-3">MRP / Pack</th>
                    <th className="py-3 px-3">Rack</th>
                    <th className="py-3 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {purchaseItems.map((item, idx) => (
                    <tr key={idx} className="bg-slate-900/60">
                      <td className="p-2 min-w-[200px]">
                        <select
                          value={item.medicineId}
                          onChange={(e) => updatePurchaseLine(idx, 'medicineId', e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-teal-500"
                        >
                          {medicines.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.brandName || m.brand_name} ({m.genericComposition || m.generic_composition})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-2 min-w-[120px]">
                        <input
                          type="text"
                          required
                          placeholder="e.g. B-994"
                          value={item.batchNumber}
                          onChange={(e) => updatePurchaseLine(idx, 'batchNumber', e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-teal-500 uppercase"
                        />
                      </td>
                      <td className="p-2 min-w-[100px]">
                        <input
                          type="text"
                          placeholder="2026-01"
                          value={item.mfgDate}
                          onChange={(e) => updatePurchaseLine(idx, 'mfgDate', e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                        />
                      </td>
                      <td className="p-2 min-w-[100px]">
                        <input
                          type="text"
                          required
                          placeholder="2028-12"
                          value={item.expiryDate}
                          onChange={(e) => updatePurchaseLine(idx, 'expiryDate', e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                        />
                      </td>
                      <td className="p-2 min-w-[90px]">
                        <input
                          type="number"
                          min="1"
                          value={item.quantityPacks}
                          onChange={(e) => updatePurchaseLine(idx, 'quantityPacks', Math.max(1, parseInt(e.target.value, 10) || 1))}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                        />
                      </td>
                      <td className="p-2 min-w-[100px]">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.purchaseRatePack}
                          onChange={(e) => updatePurchaseLine(idx, 'purchaseRatePack', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                        />
                      </td>
                      <td className="p-2 min-w-[100px]">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.mrpPack}
                          onChange={(e) => updatePurchaseLine(idx, 'mrpPack', parseFloat(e.target.value) || 0)}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                        />
                      </td>
                      <td className="p-2 min-w-[100px]">
                        <input
                          type="text"
                          placeholder="Rack A-01"
                          value={item.rackLocation}
                          onChange={(e) => updatePurchaseLine(idx, 'rackLocation', e.target.value)}
                          className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-teal-500"
                        />
                      </td>
                      <td className="p-2 text-right">
                        {purchaseItems.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removePurchaseLine(idx)}
                            className="p-1 text-rose-400 hover:text-rose-300 rounded hover:bg-slate-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('LEDGER')}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
            >
              {isSubmitting ? 'Inwarding Batches...' : 'Post Inward Receipt & Create Batches'}
            </button>
          </div>
        </form>
      )}

      {/* VIEW: CSV Import Preview */}
      {activeTab === 'IMPORT_CSV' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">Purchase CSV / Excel Import</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Bulk ingest supplier delivery sheets with schema validation and pre-commit error checks.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('LEDGER')}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Paste CSV Data (Header: medicine_id, batch_number, expiry_date, quantity_packs, purchase_rate)
            </label>
            <textarea
              rows={4}
              value={csvContent}
              onChange={(e) => handleParseCsv(e.target.value)}
              placeholder="medicine_id,batch_number,expiry_date,quantity_packs,purchase_rate&#10;med-1,SUN-9921,2028-10,20,45.50&#10;med-2,CIP-4410,2027-08,15,62.00"
              className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-teal-300 focus:outline-none focus:border-teal-500"
            />
          </div>

          {/* Errors list */}
          {csvErrors.length > 0 && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" /> Validation Warnings:
              </div>
              {csvErrors.map((err, i) => (
                <div key={i} className="pl-5">• {err}</div>
              ))}
            </div>
          )}

          {/* Preview Table */}
          {csvPreviewData.length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Preview ({csvPreviewData.length} Valid Rows Detected):
              </div>
              <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-60">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 text-[10px] uppercase">
                    <tr>
                      <th className="py-2.5 px-3">Medicine ID</th>
                      <th className="py-2.5 px-3">Batch Number</th>
                      <th className="py-2.5 px-3">Expiry Date</th>
                      <th className="py-2.5 px-3">Quantity (Packs)</th>
                      <th className="py-2.5 px-3">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 font-mono">
                    {csvPreviewData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-2 px-3">{row.medicine_id}</td>
                        <td className="py-2 px-3 text-teal-300">{row.batch_number}</td>
                        <td className="py-2 px-3">{row.expiry_date}</td>
                        <td className="py-2 px-3">{row.quantity_packs}</td>
                        <td className="py-2 px-3">₹{row.purchase_rate}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* VIEW: OCR Scan Boundary */}
      {activeTab === 'OCR_IMPORT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-white">Physical Invoice OCR / Photo Scan</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload scanned distributor bill photos for computer vision ingestion.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('LEDGER')}
              className="p-1 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Genuine Integration Boundary Alert */}
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <div className="font-semibold text-amber-200">OCR Service Boundary Notice:</div>
              <p>
                Optical Character Recognition (OCR) cloud API keys (e.g., Google Document AI / AWS Textract) are currently marked <strong>Not Configured</strong> in Settings.
                To avoid hallucinations or silent data corruption, automatic OCR parsing is paused until valid service credentials are provided. Please use manual entry or the CSV import utility above.
              </p>
            </div>
          </div>

          <div className="border-2 border-dashed border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <Upload className="w-10 h-10 text-slate-600 mx-auto" />
            <div className="text-sm font-medium text-slate-300">
              Drag and drop scanned invoice image (PNG, JPG, PDF)
            </div>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Scanned files are stored in compliance archive once OCR credentials are enabled in settings.
            </p>
            <button
              type="button"
              disabled
              className="px-4 py-2 text-xs font-semibold bg-slate-800 text-slate-500 rounded-xl cursor-not-allowed"
            >
              OCR Engine Offline
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
