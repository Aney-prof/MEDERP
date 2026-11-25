import React, { useState } from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  CalendarClock,
  AlertTriangle,
  RotateCcw,
  Trash2,
  FileText,
  Truck,
  IndianRupee,
  CheckCircle2,
  Printer,
  Boxes
} from 'lucide-react';

export const ExpiryDumpManagement: React.FC = () => {
  const { medicines, quarantineBatch, updateBatchStock, suppliers } = usePharma();

  const [filterPeriod, setFilterPeriod] = useState<'30' | '60' | '90' | 'expired'>('60');
  const [selectedSupplierFilter, setSelectedSupplierFilter] = useState<string>('all');
  const [generatedDebitNote, setGeneratedDebitNote] = useState<string | null>(null);

  const today = new Date();

  // Find all batches matching criteria
  const expBatches = medicines.flatMap((med) =>
    med.batches.map((batch) => {
      const [year, month] = batch.expiryDate.split('-').map(Number);
      const expDate = new Date(year, month - 1, 28);
      const diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const supplier = suppliers.find((s) => s.id === batch.supplierId);

      return {
        medicine: med,
        batch,
        expDate,
        diffDays,
        supplierName: supplier?.name || 'Authorized Distributor'
      };
    })
  );

  const filteredBatches = expBatches.filter((item) => {
    if (selectedSupplierFilter !== 'all' && item.batch.supplierId !== selectedSupplierFilter) {
      return false;
    }

    if (filterPeriod === 'expired') {
      return item.diffDays <= 0 || item.batch.isDamaged;
    }
    if (filterPeriod === '30') {
      return item.diffDays > 0 && item.diffDays <= 30 && item.batch.quantity > 0;
    }
    if (filterPeriod === '60') {
      return item.diffDays > 0 && item.diffDays <= 60 && item.batch.quantity > 0;
    }
    if (filterPeriod === '90') {
      return item.diffDays > 0 && item.diffDays <= 90 && item.batch.quantity > 0;
    }
    return true;
  });

  const totalAtRiskAmount = filteredBatches.reduce(
    (acc, item) => acc + item.batch.purchaseRate * item.batch.quantity,
    0
  );

  const handleGenerateDebitNote = () => {
    const dnNo = `DN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setGeneratedDebitNote(dnNo);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Marg Expiry, Breakage & Supplier Return Management
            </h2>
            <span className="text-xs bg-amber-950 text-amber-300 border border-amber-800 px-2 py-0.5 rounded font-mono">
              Dump Return Engine
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Track batches nearing expiry, isolate from active counter sale bins, and generate Supplier Return Claims / Debit Notes.
          </p>
        </div>

        <button
          onClick={handleGenerateDebitNote}
          disabled={filteredBatches.length === 0}
          className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs px-3.5 py-2 rounded-lg shadow-sm transition cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Generate Supplier Debit Note</span>
        </button>
      </div>

      {/* Generated Debit Note Banner */}
      {generatedDebitNote && (
        <div className="p-4 bg-emerald-950/40 border border-emerald-700/80 rounded-xl text-xs text-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <div className="font-bold text-white text-sm">
                Supplier Return Debit Note #{generatedDebitNote} Generated
              </div>
              <div className="text-[11px] text-emerald-300">
                {filteredBatches.length} items totaling ₹{totalAtRiskAmount.toFixed(2)} moved to return claim against distributor credit.
              </div>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1.5 rounded-lg font-medium cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Claim Memo</span>
          </button>
        </div>
      )}

      {/* Filter Tabs & Distributor Filter */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterPeriod('30')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filterPeriod === '30'
                ? 'bg-amber-600 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Expiring in 30 Days
          </button>
          <button
            onClick={() => setFilterPeriod('60')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filterPeriod === '60'
                ? 'bg-amber-600 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Expiring in 60 Days
          </button>
          <button
            onClick={() => setFilterPeriod('90')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filterPeriod === '90'
                ? 'bg-amber-600 text-slate-950 font-bold'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Expiring in 90 Days
          </button>
          <button
            onClick={() => setFilterPeriod('expired')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filterPeriod === 'expired'
                ? 'bg-rose-700 text-white font-bold'
                : 'bg-slate-800 text-rose-300 hover:bg-slate-700'
            }`}
          >
            Expired / Damaged Dump
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Supplier:</span>
          <select
            value={selectedSupplierFilter}
            onChange={(e) => setSelectedSupplierFilter(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Distributors</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid of Near Expiry Items */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Item / Formulation</th>
                <th className="py-2.5 px-3">Batch No</th>
                <th className="py-2.5 px-3">Distributor</th>
                <th className="py-2.5 px-3">Expiry Date</th>
                <th className="py-2.5 px-3 text-center">Remaining Days</th>
                <th className="py-2.5 px-3 text-right">Stock Qty</th>
                <th className="py-2.5 px-3 text-right">Cost Rate (₹)</th>
                <th className="py-2.5 px-3 text-right">Value at Risk (₹)</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-400" />
                    <p className="text-xs font-semibold text-slate-300">No stock batches in this risk period.</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Your inventory FEFO turnaround is optimal.</p>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((item, idx) => {
                  const isPast = item.diffDays <= 0;
                  const itemValue = item.batch.purchaseRate * item.batch.quantity;

                  return (
                    <tr key={idx} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-white text-xs">{item.medicine.brandName}</div>
                        <div className="text-[11px] text-cyan-300 font-mono">
                          {item.medicine.genericComposition}
                        </div>
                      </td>

                      <td className="py-2.5 px-3 font-mono text-teal-300">
                        {item.batch.batchNumber}
                      </td>

                      <td className="py-2.5 px-3 text-slate-300">
                        {item.supplierName}
                      </td>

                      <td className="py-2.5 px-3 font-mono font-bold text-amber-400">
                        {item.batch.expiryDate}
                      </td>

                      <td className="py-2.5 px-3 text-center font-mono">
                        {isPast ? (
                          <span className="text-rose-400 font-bold">EXPIRED ({Math.abs(item.diffDays)}d ago)</span>
                        ) : (
                          <span className="text-amber-300 font-medium">{item.diffDays} Days Left</span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        {item.batch.quantity} Units
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                        ₹{item.batch.purchaseRate.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                        ₹{itemValue.toFixed(2)}
                      </td>

                      <td className="py-2.5 px-3 text-center">
                        {!item.batch.isDamaged ? (
                          <button
                            onClick={() => quarantineBatch(item.medicine.id, item.batch.id)}
                            className="px-2 py-1 bg-amber-950 hover:bg-amber-900 text-amber-300 border border-amber-700 text-[10px] rounded cursor-pointer transition"
                            title="Quarantine batch to dump bin"
                          >
                            Quarantine to Dump
                          </button>
                        ) : (
                          <span className="text-[10px] text-rose-400 font-semibold">
                            In Return Dump
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
