import React, { useState, useMemo } from 'react';
import { usePharma } from '../context/PharmaContext';
import { SupplierReturn, BatchItem } from '../types/pharmacy';
import {
  FileText,
  AlertTriangle,
  Building2,
  Calendar,
  Layers,
  ArrowRight,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react';

export const SupplierReturns: React.FC = () => {
  const {
    batches,
    medicines,
    suppliers,
    supplierReturns,
    recordSupplierReturn,
    hasPermission,
    loadInitialData,
    addToast
  } = usePharma();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [returnQuantityPacks, setReturnQuantityPacks] = useState(1);
  const [returnReason, setReturnReason] = useState('Expired / Near-expiry return under distributor agreement');
  const [returnType, setReturnType] = useState<'CREDIT_NOTE' | 'REPLACEMENT' | 'REFUND'>('CREDIT_NOTE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Eligible batches for supplier return: Expired, Near-Expiry, or Damaged
  const candidateBatches = useMemo(() => {
    return batches.filter(b => (b.quantityBaseUnits ?? b.quantity_base_units ?? 0) > 0);
  }, [batches]);

  const selectedBatch = useMemo(() => {
    return batches.find(b => b.id === selectedBatchId);
  }, [batches, selectedBatchId]);

  const selectedMedicine = useMemo(() => {
    if (!selectedBatch) return null;
    return medicines.find(m => m.id === (selectedBatch.medicineId || selectedBatch.medicine_id));
  }, [medicines, selectedBatch]);

  const filteredReturns = useMemo(() => {
    return supplierReturns.filter(ret => {
      const q = searchQuery.toLowerCase().trim();
      if (!q) return true;
      return (
        (ret.returnNumber || ret.return_number || '').toLowerCase().includes(q) ||
        (ret.supplierName || ret.supplier_name || '').toLowerCase().includes(q) ||
        (ret.brandName || ret.brand_name || '').toLowerCase().includes(q) ||
        (ret.batchNumber || ret.batch_number || '').toLowerCase().includes(q)
      );
    });
  }, [supplierReturns, searchQuery]);

  const handleOpenModal = (batch?: BatchItem) => {
    if (!hasPermission('canCreateSupplierReturn')) {
      addToast('Permission Denied', 'Your user role cannot generate supplier debit notes.', 'error');
      return;
    }
    if (batch) {
      setSelectedBatchId(batch.id);
      setSelectedSupplierId(batch.supplierId || batch.supplier_id || suppliers[0]?.id || '');
    } else if (candidateBatches.length > 0) {
      setSelectedBatchId(candidateBatches[0].id);
      setSelectedSupplierId(candidateBatches[0].supplierId || candidateBatches[0].supplier_id || suppliers[0]?.id || '');
    }
    setReturnQuantityPacks(1);
    setIsModalOpen(true);
  };

  const handleCreateSupplierReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBatch) {
      addToast('Batch Required', 'Please select a valid batch.', 'error');
      return;
    }

    const unitsPerPack = selectedMedicine?.unitsPerPack || selectedMedicine?.units_per_pack || 1;
    const baseUnitsToReturn = returnQuantityPacks * unitsPerPack;
    const availableBaseUnits = selectedBatch.quantityBaseUnits ?? selectedBatch.quantity_base_units ?? 0;

    if (baseUnitsToReturn > availableBaseUnits) {
      addToast('Quantity Exceeded', `Cannot return ${baseUnitsToReturn} units. Only ${availableBaseUnits} available in this batch.`, 'error');
      return;
    }

    const purchaseRate = selectedBatch.purchaseRate ?? selectedBatch.purchase_rate ?? 0;
    const debitAmount = purchaseRate * baseUnitsToReturn;

    setIsSubmitting(true);
    try {
      await recordSupplierReturn({
        batchId: selectedBatch.id,
        supplierId: selectedSupplierId || selectedBatch.supplierId || selectedBatch.supplier_id,
        quantityBaseUnits: baseUnitsToReturn,
        amount: debitAmount,
        reason: returnReason,
        returnType
      });

      addToast('Debit Note Created', `Supplier debit note generated for ₹${debitAmount.toFixed(2)}.`, 'success');
      setIsModalOpen(false);
    } catch (err: any) {
      addToast('Debit Note Failed', err.message || 'Error generating debit note', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <FileText className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Supplier Returns & Debit Notes</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full">
                Expiry Dump & Claims
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Issue debit notes against specific batches for expired, damaged, or slow-moving stock with credit tracking.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-teal-500 text-slate-950 hover:bg-teal-400 transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20"
            >
              <Plus className="w-4 h-4" />
              New Debit Note
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex items-center justify-between gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search debit notes by DN #, supplier, brand, or batch..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500"
          />
        </div>
        <div className="text-xs text-slate-400">
          Total Claims: <span className="text-white font-bold">{supplierReturns.length}</span>
        </div>
      </div>

      {/* Supplier Returns List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Debit Note #</th>
                <th className="py-3.5 px-4">Supplier / Distributor</th>
                <th className="py-3.5 px-4">Medicine & Batch</th>
                <th className="py-3.5 px-4">Returned Qty</th>
                <th className="py-3.5 px-4">Claim Amount</th>
                <th className="py-3.5 px-4">Claim Type</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-normal text-xs">
              {filteredReturns.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No supplier debit notes found.
                  </td>
                </tr>
              ) : (
                filteredReturns.map((ret) => (
                  <tr key={ret.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-teal-300">
                      {ret.returnNumber || ret.return_number}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-white">
                      {ret.supplierName || ret.supplier_name || 'Distributor'}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-200">{ret.brandName || ret.brand_name}</div>
                      <div className="text-[11px] font-mono text-teal-400">Batch: {ret.batchNumber || ret.batch_number}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono">
                      {ret.quantityBaseUnits ?? ret.quantity_base_units} Units
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-emerald-400">
                      ₹{(ret.amount || 0).toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                        {ret.returnType || ret.return_type}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        ret.status === 'SETTLED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      }`}>
                        {ret.status === 'SETTLED' ? <CheckCircle2 className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                        {ret.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {ret.returnDate || ret.return_date}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create Supplier Return */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-400" />
                Issue Supplier Debit Note
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSupplierReturn} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Select Batch to Return *
                </label>
                <select
                  required
                  value={selectedBatchId}
                  onChange={(e) => {
                    setSelectedBatchId(e.target.value);
                    const b = batches.find(item => item.id === e.target.value);
                    if (b?.supplierId || b?.supplier_id) {
                      setSelectedSupplierId(b.supplierId || b.supplier_id || '');
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {candidateBatches.map(b => {
                    const med = medicines.find(m => m.id === (b.medicineId || b.medicine_id));
                    return (
                      <option key={b.id} value={b.id}>
                        {med?.brandName || med?.brand_name} • Batch {b.batchNumber || b.batch_number} (Exp: {b.expiryDate || b.expiry_date}) [Avail: {b.quantityBaseUnits ?? b.quantity_base_units} units]
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Target Supplier / Distributor *
                </label>
                <select
                  required
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Return Quantity (Packs) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={returnQuantityPacks}
                    onChange={(e) => setReturnQuantityPacks(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Claim Type
                  </label>
                  <select
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value="CREDIT_NOTE">Credit Note against Outstanding</option>
                    <option value="REPLACEMENT">Physical Batch Replacement</option>
                    <option value="REFUND">Bank / Cash Refund</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason for Return
                </label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                  placeholder="e.g. Expired stock dump / damaged in transit"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {selectedBatch && (
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                  <div className="text-slate-400">
                    Units deducted: <strong className="text-white">{returnQuantityPacks * (selectedMedicine?.unitsPerPack || 1)} base units</strong>
                  </div>
                  <div className="text-teal-400 font-bold">
                    Estimated Debit Note Value: ₹{((selectedBatch.purchaseRate ?? selectedBatch.purchase_rate ?? 0) * (returnQuantityPacks * (selectedMedicine?.unitsPerPack || 1))).toFixed(2)}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Generating...' : 'Issue Debit Note & Deduct Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
