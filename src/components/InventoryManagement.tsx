import React, { useState, useMemo } from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  Calendar,
  Sparkles,
  ArrowUpDown,
  Tag,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Snowflake,
  Edit2,
  Trash2,
  ExternalLink,
  CheckCircle,
  Thermometer,
  Layers,
  FileSpreadsheet
} from 'lucide-react';
import { Medicine, BatchItem, DrugSchedule, DrugCategory } from '../types/pharmacy';

export const InventoryManagement: React.FC = () => {
  const {
    medicines,
    addMedicine,
    addBatch,
    updateBatchStock,
    quarantineBatch,
    deleteMedicine,
    suppliers,
    globalSearch,
    setGlobalSearch
  } = usePharma();

  // Local state
  const [filterType, setFilterType] = useState<
    'all' | 'near-expiry' | 'expired' | 'low-stock' | 'schedule-h1' | 'cold-chain'
  >('all');
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);
  const [saltSearchQuery, setSaltSearchQuery] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showAddBatchModal, setShowAddBatchModal] = useState<Medicine | null>(null);

  // New Medicine Form State
  const [newMedData, setNewMedData] = useState({
    brandName: '',
    genericComposition: '',
    manufacturer: '',
    hsnCode: '30049099',
    gstPercent: 12,
    dosageForm: 'Tablet' as Medicine['dosageForm'],
    packSize: '10 Tabs / Strip',
    category: 'Allopathic' as DrugCategory,
    schedule: 'OTC' as DrugSchedule,
    temperatureRequirement: '',
    initialBatch: {
      batchNumber: '',
      mfgDate: '2025-06',
      expiryDate: '2027-05',
      mrp: 100,
      purchaseRate: 70,
      saleRate: 90,
      wholesaleRate: 78,
      quantity: 50,
      reorderLevel: 20,
      location: 'Rack A-01',
      supplierId: suppliers[0]?.id || 'sup-1'
    }
  });

  // New Batch Form State (for adding batch to existing med)
  const [newBatchData, setNewBatchData] = useState<Omit<BatchItem, 'id'>>({
    batchNumber: '',
    mfgDate: '2025-08',
    expiryDate: '2027-07',
    mrp: 100,
    purchaseRate: 70,
    saleRate: 90,
    wholesaleRate: 78,
    quantity: 50,
    reorderLevel: 20,
    location: 'Rack A-01',
    supplierId: suppliers[0]?.id || 'sup-1'
  });

  // Calculate Dates for Expiry Filters
  const today = new Date();
  const sixtyDaysAhead = new Date();
  sixtyDaysAhead.setDate(today.getDate() + 60);

  // Filtered Medicines list
  const filteredMedicines = useMemo(() => {
    return medicines.filter((med) => {
      // 1. Search Query Match (Global or Local Salt)
      const q = (saltSearchQuery || globalSearch).toLowerCase().trim();
      if (q) {
        const matchesBrand = med.brandName.toLowerCase().includes(q);
        const matchesGeneric = med.genericComposition.toLowerCase().includes(q);
        const matchesMfr = med.manufacturer.toLowerCase().includes(q);
        const matchesHsn = med.hsnCode.toLowerCase().includes(q);
        const matchesBatch = med.batches.some((b) => b.batchNumber.toLowerCase().includes(q));

        if (!matchesBrand && !matchesGeneric && !matchesMfr && !matchesHsn && !matchesBatch) {
          return false;
        }
      }

      // 2. Tab Filter
      if (filterType === 'near-expiry') {
        return med.batches.some((b) => {
          if (!b.expiryDate || b.quantity <= 0) return false;
          const [y, m] = b.expiryDate.split('-').map(Number);
          const exp = new Date(y, m - 1, 28);
          return exp <= sixtyDaysAhead && exp >= today;
        });
      }

      if (filterType === 'expired') {
        return med.batches.some((b) => {
          if (!b.expiryDate) return false;
          const [y, m] = b.expiryDate.split('-').map(Number);
          const exp = new Date(y, m - 1, 28);
          return exp < today || b.isDamaged;
        });
      }

      if (filterType === 'low-stock') {
        const totalStock = med.batches.reduce((sum, b) => sum + (b.isDamaged ? 0 : b.quantity), 0);
        const minReorder = Math.min(...med.batches.map((b) => b.reorderLevel), 20);
        return totalStock <= minReorder;
      }

      if (filterType === 'schedule-h1') {
        return med.schedule === 'Schedule H1';
      }

      if (filterType === 'cold-chain') {
        return med.category === 'Cold Chain' || !!med.temperatureRequirement;
      }

      return true;
    });
  }, [medicines, filterType, saltSearchQuery, globalSearch]);

  // Handler for creating new medicine
  const handleCreateMedicine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedData.brandName.trim() || !newMedData.genericComposition.trim()) return;

    addMedicine({
      brandName: newMedData.brandName,
      genericComposition: newMedData.genericComposition,
      manufacturer: newMedData.manufacturer || 'Generic Pharma',
      hsnCode: newMedData.hsnCode,
      gstPercent: Number(newMedData.gstPercent),
      dosageForm: newMedData.dosageForm,
      packSize: newMedData.packSize,
      category: newMedData.category,
      schedule: newMedData.schedule,
      temperatureRequirement: newMedData.temperatureRequirement || undefined,
      batches: [
        {
          id: 'b-' + Date.now(),
          ...newMedData.initialBatch,
          mrp: Number(newMedData.initialBatch.mrp),
          purchaseRate: Number(newMedData.initialBatch.purchaseRate),
          saleRate: Number(newMedData.initialBatch.saleRate),
          wholesaleRate: Number(newMedData.initialBatch.wholesaleRate),
          quantity: Number(newMedData.initialBatch.quantity),
          reorderLevel: Number(newMedData.initialBatch.reorderLevel)
        }
      ]
    });

    setShowAddModal(false);
  };

  // Handler for adding batch to existing medicine
  const handleCreateBatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showAddBatchModal || !newBatchData.batchNumber.trim()) return;

    addBatch(showAddBatchModal.id, {
      ...newBatchData,
      mrp: Number(newBatchData.mrp),
      purchaseRate: Number(newBatchData.purchaseRate),
      saleRate: Number(newBatchData.saleRate),
      wholesaleRate: Number(newBatchData.wholesaleRate),
      quantity: Number(newBatchData.quantity),
      reorderLevel: Number(newBatchData.reorderLevel)
    });

    setShowAddBatchModal(null);
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Master Stock & Batch Register
            </h2>
            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700 font-mono">
              {medicines.length} Formulations ({filteredMedicines.length} Listed)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Batch-wise FEFO tracking, Salt Composition alternatives, HSN tax classifications, and multi-tier pricing.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine / Batch</span>
          </button>
        </div>
      </div>

      {/* Marg ERP Filter & Salt Alternative Quick Search Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Quick Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filterType === 'all'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Stock
          </button>

          <button
            onClick={() => setFilterType('near-expiry')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              filterType === 'near-expiry'
                ? 'bg-amber-600 text-white shadow-sm'
                : 'bg-slate-800 text-amber-300 hover:bg-slate-700'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Near Expiry (&lt;60d)</span>
          </button>

          <button
            onClick={() => setFilterType('expired')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filterType === 'expired'
                ? 'bg-rose-700 text-white shadow-sm'
                : 'bg-slate-800 text-rose-300 hover:bg-slate-700'
            }`}
          >
            Expired / Quarantine
          </button>

          <button
            onClick={() => setFilterType('low-stock')}
            className={`px-3 py-1.5 rounded-lg font-medium transition cursor-pointer ${
              filterType === 'low-stock'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Reorder Level
          </button>

          <button
            onClick={() => setFilterType('schedule-h1')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              filterType === 'schedule-h1'
                ? 'bg-purple-700 text-white shadow-sm'
                : 'bg-slate-800 text-purple-300 hover:bg-slate-700'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Schedule H1</span>
          </button>

          <button
            onClick={() => setFilterType('cold-chain')}
            className={`px-3 py-1.5 rounded-lg font-medium flex items-center gap-1.5 transition cursor-pointer ${
              filterType === 'cold-chain'
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'bg-slate-800 text-cyan-300 hover:bg-slate-700'
            }`}
          >
            <Snowflake className="w-3.5 h-3.5" />
            <span>Cold Chain (2-8°C)</span>
          </button>
        </div>

        {/* Salt / Generic Substitute Lookup */}
        <div className="relative min-w-[280px]">
          <Search className="w-4 h-4 text-cyan-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={saltSearchQuery}
            onChange={(e) => setSaltSearchQuery(e.target.value)}
            placeholder="Search salt: 'Paracetamol', 'Amoxicillin'..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-8 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-cyan-500"
          />
          {saltSearchQuery && (
            <button
              onClick={() => setSaltSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main Stock Data Grid (Marg ERP Density Style) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3">Brand Name / Molecule</th>
                <th className="py-2.5 px-3">Manufacturer</th>
                <th className="py-2.5 px-3">Category / Schedule</th>
                <th className="py-2.5 px-3">HSN / GST</th>
                <th className="py-2.5 px-3 text-right">Total Stock</th>
                <th className="py-2.5 px-3 text-right">MRP (₹)</th>
                <th className="py-2.5 px-3 text-center">FEFO Batch Status</th>
                <th className="py-2.5 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No pharmaceutical items match the active query.</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting the filter or searching for another salt/generic molecule.</p>
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((med) => {
                  const isExpanded = expandedMedId === med.id;
                  const totalUnits = med.batches.reduce((sum, b) => sum + (b.isDamaged ? 0 : b.quantity), 0);
                  const minReorder = Math.min(...med.batches.map((b) => b.reorderLevel), 20);
                  const isLow = totalUnits <= minReorder;

                  // Earliest expiry batch (FEFO)
                  const sortedBatches = [...med.batches].sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
                  const earliestBatch = sortedBatches[0];

                  let expStatus = 'Normal';
                  let expColor = 'text-slate-300';
                  if (earliestBatch) {
                    const [y, m] = earliestBatch.expiryDate.split('-').map(Number);
                    const exp = new Date(y, m - 1, 28);
                    if (exp < today) {
                      expStatus = 'Expired';
                      expColor = 'text-rose-400 bg-rose-950/80 border-rose-800';
                    } else if (exp <= sixtyDaysAhead) {
                      expStatus = `Exp: ${earliestBatch.expiryDate}`;
                      expColor = 'text-amber-400 bg-amber-950/80 border-amber-800';
                    } else {
                      expStatus = `Exp: ${earliestBatch.expiryDate}`;
                      expColor = 'text-emerald-400 bg-emerald-950/80 border-emerald-800';
                    }
                  }

                  return (
                    <React.Fragment key={med.id}>
                      <tr
                        onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                        className={`hover:bg-slate-800/60 cursor-pointer transition select-none ${
                          isExpanded ? 'bg-slate-800/40' : ''
                        }`}
                      >
                        <td className="py-2.5 px-3 text-slate-400">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-teal-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </td>

                        {/* Brand & Composition */}
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-white text-xs flex items-center gap-1.5">
                            <span>{med.brandName}</span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({med.dosageForm} • {med.packSize})
                            </span>
                          </div>
                          <div className="text-[11px] text-cyan-300/90 font-mono mt-0.5">
                            {med.genericComposition}
                          </div>
                        </td>

                        {/* Manufacturer */}
                        <td className="py-2.5 px-3 text-slate-300">
                          {med.manufacturer}
                        </td>

                        {/* Schedule & Category */}
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap items-center gap-1">
                            <span
                              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${
                                med.schedule === 'Schedule H1'
                                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                                  : med.schedule === 'Schedule H'
                                  ? 'bg-purple-950 text-purple-300 border-purple-700'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {med.schedule}
                            </span>
                            {med.temperatureRequirement && (
                              <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <Snowflake className="w-3 h-3" />
                                {med.temperatureRequirement}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* HSN & GST */}
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400">
                          <div>HSN: {med.hsnCode}</div>
                          <div className="text-teal-400">GST: {med.gstPercent}%</div>
                        </td>

                        {/* Total Stock */}
                        <td className="py-2.5 px-3 text-right">
                          <div
                            className={`font-bold font-mono text-xs ${
                              isLow ? 'text-rose-400' : 'text-slate-100'
                            }`}
                          >
                            {totalUnits} Units
                          </div>
                          <div className="text-[10px] text-slate-400">
                            {med.batches.length} Batch{med.batches.length > 1 ? 'es' : ''}
                          </div>
                        </td>

                        {/* MRP */}
                        <td className="py-2.5 px-3 text-right font-mono font-medium text-slate-100">
                          ₹{earliestBatch?.mrp.toFixed(2) || '0.00'}
                        </td>

                        {/* FEFO Status */}
                        <td className="py-2.5 px-3 text-center">
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded-full border font-mono font-medium ${expColor}`}
                          >
                            {expStatus}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setShowAddBatchModal(med)}
                              className="px-2 py-1 bg-slate-800 hover:bg-teal-900/60 hover:text-teal-300 text-slate-300 text-[11px] rounded border border-slate-700 transition cursor-pointer"
                              title="Add new inward batch"
                            >
                              + Batch
                            </button>
                            <button
                              onClick={() => {
                                setSaltSearchQuery(med.genericComposition.split('+')[0].trim());
                              }}
                              className="p-1 hover:bg-slate-700 text-cyan-400 rounded transition cursor-pointer"
                              title="Find all formulations with this generic salt"
                            >
                              <Sparkles className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Batch-Level Detail View (Marg ERP Drill-down) */}
                      {isExpanded && (
                        <tr className="bg-slate-950/70">
                          <td colSpan={9} className="py-3 px-4 sm:px-8 border-b border-slate-800">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                                  <Layers className="w-3.5 h-3.5 text-teal-400" />
                                  Active Batches for {med.brandName} (Sorted First-Expiry-First-Out)
                                </span>
                                <span className="text-[11px] text-slate-400">
                                  Click batch quantity to adjust physical stock count
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                {med.batches.map((batch) => {
                                  const [by, bm] = batch.expiryDate.split('-').map(Number);
                                  const bExp = new Date(by, bm - 1, 28);
                                  const isNear = bExp <= sixtyDaysAhead && bExp >= today;
                                  const isExp = bExp < today || batch.isDamaged;

                                  return (
                                    <div
                                      key={batch.id}
                                      className={`p-3 rounded-lg border text-xs ${
                                        isExp
                                          ? 'bg-rose-950/30 border-rose-800/80 text-rose-200'
                                          : isNear
                                          ? 'bg-amber-950/30 border-amber-800/80 text-amber-200'
                                          : 'bg-slate-900 border-slate-800 text-slate-300'
                                      }`}
                                    >
                                      <div className="flex items-center justify-between font-mono">
                                        <span className="font-bold text-white text-xs">
                                          {batch.batchNumber}
                                        </span>
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300">
                                          Loc: {batch.location}
                                        </span>
                                      </div>

                                      <div className="mt-2 grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400">
                                        <div>Mfg: <span className="text-slate-200 font-mono">{batch.mfgDate}</span></div>
                                        <div>Exp: <span className="text-slate-200 font-mono font-bold">{batch.expiryDate}</span></div>
                                        <div>Cost: <span className="text-slate-200 font-mono">₹{batch.purchaseRate}</span></div>
                                        <div>MRP: <span className="text-slate-200 font-mono">₹{batch.mrp}</span></div>
                                        <div>Retail A: <span className="text-teal-300 font-mono">₹{batch.saleRate}</span></div>
                                        <div>Margin: <span className="text-emerald-400 font-mono font-semibold">
                                          {(((batch.mrp - batch.purchaseRate) / batch.mrp) * 100).toFixed(0)}%
                                        </span></div>
                                      </div>

                                      {/* Stock Level & Fast Actions */}
                                      <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-slate-400 text-[10px]">Stock:</span>
                                          <input
                                            type="number"
                                            value={batch.quantity}
                                            onChange={(e) =>
                                              updateBatchStock(med.id, batch.id, Math.max(0, parseInt(e.target.value) || 0))
                                            }
                                            className="w-16 bg-slate-950 border border-slate-700 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                                          />
                                          <span className="text-[10px] text-slate-400">Units</span>
                                        </div>

                                        {!batch.isDamaged ? (
                                          <button
                                            onClick={() => quarantineBatch(med.id, batch.id)}
                                            className="text-[10px] text-amber-400 hover:text-amber-300 hover:underline cursor-pointer"
                                            title="Move to Expiry Dump Bin"
                                          >
                                            Quarantine Dump
                                          </button>
                                        ) : (
                                          <span className="text-[10px] text-rose-400 font-semibold">
                                            In Return Dump
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Add New Medicine & Inward Initial Batch */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl p-6 text-xs text-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Boxes className="w-5 h-5 text-teal-400" />
                <h3 className="text-base font-bold text-white">Add Medicine & Inward Batch</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="space-y-4 mt-4">
              {/* Row 1: Brand & Salt */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Telma 40, Dolo 650"
                    value={newMedData.brandName}
                    onChange={(e) => setNewMedData({ ...newMedData, brandName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Generic Salt / Composition *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Telmisartan 40 mg"
                    value={newMedData.genericComposition}
                    onChange={(e) =>
                      setNewMedData({ ...newMedData, genericComposition: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Row 2: Manufacturer, Form, Pack Size */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Manufacturer
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cipla Ltd, Sun Pharma"
                    value={newMedData.manufacturer}
                    onChange={(e) => setNewMedData({ ...newMedData, manufacturer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Dosage Form
                  </label>
                  <select
                    value={newMedData.dosageForm}
                    onChange={(e) =>
                      setNewMedData({
                        ...newMedData,
                        dosageForm: e.target.value as Medicine['dosageForm']
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option>Tablet</option>
                    <option>Capsule</option>
                    <option>Syrup</option>
                    <option>Injection</option>
                    <option>Ointment</option>
                    <option>Inhaler</option>
                    <option>Drops</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Pack Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 15 Tabs / Strip"
                    value={newMedData.packSize}
                    onChange={(e) => setNewMedData({ ...newMedData, packSize: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Row 3: Regulatory Schedule & HSN / GST */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Schedule Classification
                  </label>
                  <select
                    value={newMedData.schedule}
                    onChange={(e) =>
                      setNewMedData({ ...newMedData, schedule: e.target.value as DrugSchedule })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option>OTC</option>
                    <option>Schedule H</option>
                    <option>Schedule H1</option>
                    <option>Narcotic</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    HSN Code
                  </label>
                  <input
                    type="text"
                    value={newMedData.hsnCode}
                    onChange={(e) => setNewMedData({ ...newMedData, hsnCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    GST Tax Slab %
                  </label>
                  <select
                    value={newMedData.gstPercent}
                    onChange={(e) =>
                      setNewMedData({ ...newMedData, gstPercent: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Life Saving / Insulin)</option>
                    <option value={12}>12% (Standard Pharma)</option>
                    <option value={18}>18% (Disinfectants/Supplements)</option>
                  </select>
                </div>
              </div>

              {/* Inward Initial Batch Box */}
              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <span className="text-xs font-semibold text-teal-400 block">
                  Initial Inward Batch Details
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase">Batch Number *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. TL40-891"
                      value={newMedData.initialBatch.batchNumber}
                      onChange={(e) =>
                        setNewMedData({
                          ...newMedData,
                          initialBatch: { ...newMedData.initialBatch, batchNumber: e.target.value }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase">Expiry (YYYY-MM) *</label>
                    <input
                      type="text"
                      required
                      placeholder="2027-08"
                      value={newMedData.initialBatch.expiryDate}
                      onChange={(e) =>
                        setNewMedData({
                          ...newMedData,
                          initialBatch: { ...newMedData.initialBatch, expiryDate: e.target.value }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase">Inward Qty (Units)</label>
                    <input
                      type="number"
                      value={newMedData.initialBatch.quantity}
                      onChange={(e) =>
                        setNewMedData({
                          ...newMedData,
                          initialBatch: {
                            ...newMedData.initialBatch,
                            quantity: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase">Rack / Shelf</label>
                    <input
                      type="text"
                      placeholder="Rack A-02"
                      value={newMedData.initialBatch.location}
                      onChange={(e) =>
                        setNewMedData({
                          ...newMedData,
                          initialBatch: { ...newMedData.initialBatch, location: e.target.value }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                  </div>
                </div>

                {/* Price Calculations */}
                <div className="grid grid-cols-3 gap-2.5 pt-1">
                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase">Cost / Purchase Rate (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newMedData.initialBatch.purchaseRate}
                      onChange={(e) =>
                        setNewMedData({
                          ...newMedData,
                          initialBatch: {
                            ...newMedData.initialBatch,
                            purchaseRate: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase">Sale Rate A (Retail) (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newMedData.initialBatch.saleRate}
                      onChange={(e) =>
                        setNewMedData({
                          ...newMedData,
                          initialBatch: {
                            ...newMedData.initialBatch,
                            saleRate: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 block uppercase">MRP (₹)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newMedData.initialBatch.mrp}
                      onChange={(e) =>
                        setNewMedData({
                          ...newMedData,
                          initialBatch: {
                            ...newMedData.initialBatch,
                            mrp: Number(e.target.value)
                          }
                        })
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow cursor-pointer"
                >
                  Save & Inward Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Add Batch to Existing Medicine */}
      {showAddBatchModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg p-6 text-xs text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white">
                  Inward New Batch: {showAddBatchModal.brandName}
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {showAddBatchModal.genericComposition}
                </p>
              </div>
              <button
                onClick={() => setShowAddBatchModal(null)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateBatch} className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B-99801"
                    value={newBatchData.batchNumber}
                    onChange={(e) =>
                      setNewBatchData({ ...newBatchData, batchNumber: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Expiry Date (YYYY-MM) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="2027-08"
                    value={newBatchData.expiryDate}
                    onChange={(e) =>
                      setNewBatchData({ ...newBatchData, expiryDate: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Quantity Inward (Units) *
                  </label>
                  <input
                    type="number"
                    required
                    value={newBatchData.quantity}
                    onChange={(e) =>
                      setNewBatchData({ ...newBatchData, quantity: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Storage Shelf / Rack
                  </label>
                  <input
                    type="text"
                    placeholder="Rack A-01"
                    value={newBatchData.location}
                    onChange={(e) =>
                      setNewBatchData({ ...newBatchData, location: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Cost Rate (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBatchData.purchaseRate}
                    onChange={(e) =>
                      setNewBatchData({ ...newBatchData, purchaseRate: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Sale Rate A (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBatchData.saleRate}
                    onChange={(e) =>
                      setNewBatchData({ ...newBatchData, saleRate: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    MRP (₹)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={newBatchData.mrp}
                    onChange={(e) =>
                      setNewBatchData({ ...newBatchData, mrp: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddBatchModal(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg cursor-pointer shadow"
                >
                  Confirm Inward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
