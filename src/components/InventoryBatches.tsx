import React, { useState, useMemo } from 'react';
import { usePharma } from '../context/PharmaContext';
import { BatchItem, Medicine } from '../types/pharmacy';
import {
  Boxes,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Unlock,
  SlidersHorizontal,
  ArrowUpDown,
  RefreshCw,
  Building2,
  Calendar,
  Layers,
  MapPin,
  Clock,
  History,
  X
} from 'lucide-react';

export const InventoryBatches: React.FC = () => {
  const {
    medicines,
    batches,
    hasPermission,
    toggleBatchHoldStatus,
    adjustBatchStock,
    loadInitialData,
    addToast
  } = usePharma() as any;

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'AVAILABLE' | 'HELD' | 'EXPIRED' | 'DAMAGED'>('ALL');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');
  const [showNearExpiryOnly, setShowNearExpiryOnly] = useState(false);
  const [selectedBatchForAdjustment, setSelectedBatchForAdjustment] = useState<any>(null);
  const [adjustmentBaseUnits, setAdjustmentBaseUnits] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('Physical stock verification count');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Map medicines by ID for quick medicine lookup
  const medicineMap = useMemo(() => {
    const map = new Map<string, Medicine>();
    medicines.forEach(m => map.set(m.id, m));
    return map;
  }, [medicines]);

  // Combine batches with their medicine metadata
  const enrichedBatches = useMemo(() => {
    return batches.map(b => {
      const med = medicineMap.get(b.medicineId || b.medicine_id || '');
      const unitsPerPack = med?.unitsPerPack || med?.units_per_pack || 1;
      const baseUnits = b.quantityBaseUnits ?? b.quantity_base_units ?? 0;
      const packCount = Math.floor(baseUnits / unitsPerPack);
      const looseUnits = baseUnits % unitsPerPack;

      // Check if near expiry (< 60 days)
      let isNearExpiry = false;
      let daysUntilExpiry: number | null = null;
      const expStr = b.expiryDate || b.expiry_date;
      if (expStr) {
        const parts = expStr.split('-');
        if (parts.length === 2) {
          const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 28);
          const diffMs = expDate.getTime() - new Date().getTime();
          daysUntilExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          if (daysUntilExpiry <= 60 && daysUntilExpiry > 0) {
            isNearExpiry = true;
          }
        }
      }

      return {
        ...b,
        medicine: med,
        baseUnits,
        packCount,
        looseUnits,
        unitsPerPack,
        isNearExpiry,
        daysUntilExpiry
      };
    });
  }, [batches, medicineMap]);

  // Unique rack locations
  const locations = useMemo(() => {
    const locSet = new Set<string>();
    batches.forEach(b => {
      const loc = b.locationRack || b.location_rack || b.location;
      if (loc) locSet.add(loc);
    });
    return Array.from(locSet).sort();
  }, [batches]);

  // Filtered batches
  const filteredBatches = useMemo(() => {
    return enrichedBatches.filter(b => {
      const med = b.medicine;
      const query = searchQuery.toLowerCase().trim();
      if (query) {
        const matchBrand = med?.brandName?.toLowerCase().includes(query) || med?.brand_name?.toLowerCase().includes(query);
        const matchSalt = med?.genericComposition?.toLowerCase().includes(query) || med?.generic_composition?.toLowerCase().includes(query);
        const matchBatch = (b.batchNumber || b.batch_number || '').toLowerCase().includes(query);
        const matchSupplier = (b.supplier_name || '').toLowerCase().includes(query);
        if (!matchBrand && !matchSalt && !matchBatch && !matchSupplier) return false;
      }

      if (statusFilter !== 'ALL' && b.status !== statusFilter) {
        return false;
      }

      if (locationFilter !== 'ALL') {
        const loc = b.locationRack || b.location_rack || b.location;
        if (loc !== locationFilter) return false;
      }

      if (showNearExpiryOnly && !b.isNearExpiry) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      // FEFO Sort: earliest expiry date first
      const expA = a.expiryDate || a.expiry_date || '9999-99';
      const expB = b.expiryDate || b.expiry_date || '9999-99';
      return expA.localeCompare(expB);
    });
  }, [enrichedBatches, searchQuery, statusFilter, locationFilter, showNearExpiryOnly]);

  const handleToggleHold = async (batch: any) => {
    if (!hasPermission('canOverrideBatch')) {
      addToast('Permission Denied', 'Only authorized pharmacists and managers can hold or release batches.', 'error');
      return;
    }
    const isCurrentlyHeld = batch.status === 'HELD';
    const newStatus = isCurrentlyHeld ? 'AVAILABLE' : 'HELD';
    const reason = isCurrentlyHeld ? 'Released from quarantine by pharmacist' : 'Quarantined / Batch inspection pending';

    try {
      await toggleBatchHoldStatus(batch.id, isCurrentlyHeld, reason);
      addToast('Batch Updated', `Batch ${batch.batchNumber || batch.batch_number} is now ${newStatus}.`, 'success');
    } catch (err: any) {
      addToast('Update Failed', err.message || 'Could not update batch status', 'error');
    }
  };

  const openAdjustmentModal = (batch: any) => {
    if (!hasPermission('canAdjustStock')) {
      addToast('Permission Denied', 'Only inventory staff and administrators can perform stock adjustments.', 'error');
      return;
    }
    setSelectedBatchForAdjustment(batch);
    setAdjustmentBaseUnits(batch.baseUnits);
    setAdjustmentReason('Physical stock verification count');
  };

  const handleSaveAdjustment = async () => {
    if (!selectedBatchForAdjustment) return;
    setIsSubmitting(true);
    try {
      await adjustBatchStock(selectedBatchForAdjustment.id, Number(adjustmentBaseUnits), adjustmentReason);
      addToast('Stock Adjusted', `Batch ${selectedBatchForAdjustment.batchNumber || selectedBatchForAdjustment.batch_number} set to ${adjustmentBaseUnits} units.`, 'success');
      setSelectedBatchForAdjustment(null);
    } catch (err: any) {
      addToast('Adjustment Failed', err.message || 'Could not adjust batch stock', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Stats Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <Boxes className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Batch-Level Inventory</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                FEFO Ground Truth
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Traceable delivery batches, pack-to-loose tablet conversion, warehouse rack mapping, and quarantine controls.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadInitialData()}
              className="px-3.5 py-2 text-xs font-medium rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 transition-all shadow-sm"
              title="Refresh batches from SQLite database"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync DB
            </button>
          </div>
        </div>

        {/* Quick Batch Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-slate-400 font-medium">Total Batches</div>
            <div className="text-2xl font-bold text-white mt-1">{batches.length}</div>
            <div className="text-[11px] text-teal-400 mt-0.5">Across {medicines.length} medicines</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-emerald-400 font-medium">Active Available</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1">
              {batches.filter(b => b.status === 'AVAILABLE').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Eligible for counter sale</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-amber-400 font-medium">Held / Quarantine</div>
            <div className="text-2xl font-bold text-amber-400 mt-1">
              {batches.filter(b => b.status === 'HELD').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Blocked from cashier sale</div>
          </div>
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5">
            <div className="text-xs text-rose-400 font-medium">Expired Batches</div>
            <div className="text-2xl font-bold text-rose-400 mt-1">
              {batches.filter(b => b.status === 'EXPIRED').length}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Ready for supplier return</div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by brand, salt, batch #, or supplier..."
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="AVAILABLE">Available</option>
              <option value="HELD">Held / Quarantined</option>
              <option value="EXPIRED">Expired</option>
              <option value="DAMAGED">Damaged</option>
            </select>
          </div>

          {/* Location Filter */}
          <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="bg-transparent text-xs text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="ALL">All Racks / Storage</option>
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Near Expiry Toggle */}
          <button
            onClick={() => setShowNearExpiryOnly(!showNearExpiryOnly)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all ${
              showNearExpiryOnly
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            Near Expiry (&lt;60d)
          </button>
        </div>
      </div>

      {/* Batches Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Medicine & Salt</th>
                <th className="py-3.5 px-4">Batch Details</th>
                <th className="py-3.5 px-4">Expiry (FEFO)</th>
                <th className="py-3.5 px-4">Stock Breakdown</th>
                <th className="py-3.5 px-4">Rates (₹)</th>
                <th className="py-3.5 px-4">Location & Supplier</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-normal">
              {filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Boxes className="w-10 h-10 mx-auto mb-2 opacity-30 text-teal-400" />
                    No batches match your selected search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredBatches.map((batch) => {
                  const med = batch.medicine;
                  const isAvailable = batch.status === 'AVAILABLE';
                  const isHeld = batch.status === 'HELD';
                  const isExpired = batch.status === 'EXPIRED';

                  return (
                    <tr key={batch.id} className="hover:bg-slate-800/40 transition-colors">
                      {/* Medicine info */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">
                          {med?.brandName || med?.brand_name || 'Unknown Item'}
                        </div>
                        <div className="text-xs text-slate-400 line-clamp-1">
                          {med?.genericComposition || med?.generic_composition || 'No Salt Info'}
                        </div>
                        <div className="text-[11px] text-teal-400/80 mt-0.5">
                          {med?.dosageForm || med?.dosage_form} • 1 {med?.packUnit || med?.pack_unit} = {batch.unitsPerPack} {med?.baseUnit || med?.base_unit}s
                        </div>
                      </td>

                      {/* Batch # & Mfg */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-xs font-bold text-teal-300 bg-teal-950/60 border border-teal-800/60 px-2 py-0.5 rounded">
                          {batch.batchNumber || batch.batch_number}
                        </span>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Mfg: {batch.mfgDate || batch.mfg_date || 'N/A'}
                        </div>
                      </td>

                      {/* Expiry */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span className={`font-mono text-xs font-medium ${
                            isExpired ? 'text-rose-400 font-bold' : batch.isNearExpiry ? 'text-amber-400 font-bold' : 'text-slate-300'
                          }`}>
                            {batch.expiryDate || batch.expiry_date}
                          </span>
                        </div>
                        {batch.isNearExpiry && (
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                            Exp in ~{batch.daysUntilExpiry}d
                          </span>
                        )}
                        {isExpired && (
                          <span className="inline-block mt-0.5 text-[10px] font-semibold text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded border border-rose-500/20">
                            EXPIRED
                          </span>
                        )}
                      </td>

                      {/* Stock Breakdown */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-white">
                            {batch.baseUnits}
                          </span>
                          <span className="text-xs text-slate-400">
                            {med?.baseUnit || med?.base_unit || 'Units'}
                          </span>
                        </div>
                        <div className="text-[11px] text-teal-400 font-medium mt-0.5">
                          {batch.packCount} {med?.packUnit || med?.pack_unit}s + {batch.looseUnits} loose
                        </div>
                      </td>

                      {/* Rates */}
                      <td className="py-3.5 px-4">
                        <div className="text-xs font-semibold text-white">
                          MRP: ₹{batch.mrp?.toFixed(2)}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Purchase: ₹{(batch.purchaseRate ?? batch.purchase_rate ?? 0)?.toFixed(2)}
                        </div>
                      </td>

                      {/* Location & Supplier */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1 text-xs text-slate-200">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{batch.locationRack || batch.location_rack || batch.location || 'Unassigned'}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3 text-slate-500" />
                          <span className="truncate max-w-[120px]">
                            {batch.supplier_name || 'Distributor'}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {isAvailable && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <CheckCircle2 className="w-3 h-3" />
                            Available
                          </span>
                        )}
                        {isHeld && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Lock className="w-3 h-3" />
                            Held
                          </span>
                        )}
                        {isExpired && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            <AlertTriangle className="w-3 h-3" />
                            Expired
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Hold/Unhold Toggle */}
                          <button
                            onClick={() => handleToggleHold(batch)}
                            title={isHeld ? 'Release Batch to Available' : 'Quarantine / Hold Batch'}
                            className={`p-1.5 rounded-lg border text-xs transition-colors ${
                              isHeld
                                ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white hover:bg-slate-700'
                            }`}
                          >
                            {isHeld ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                          </button>

                          {/* Adjust Stock Button */}
                          <button
                            onClick={() => openAdjustmentModal(batch)}
                            title="Perform Physical Count Stock Adjustment"
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 border border-slate-700 hover:text-teal-300 hover:bg-slate-700 transition-colors"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stock Adjustment Modal */}
      {selectedBatchForAdjustment && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-teal-400" />
                <h3 className="font-bold text-white text-base">Adjust Batch Stock</h3>
              </div>
              <button
                onClick={() => setSelectedBatchForAdjustment(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="text-white font-medium">
                  {selectedBatchForAdjustment.medicine?.brandName || selectedBatchForAdjustment.medicine?.brand_name}
                </div>
                <div className="text-slate-400 font-mono">
                  Batch: {selectedBatchForAdjustment.batchNumber || selectedBatchForAdjustment.batch_number} • Expiry: {selectedBatchForAdjustment.expiryDate || selectedBatchForAdjustment.expiry_date}
                </div>
                <div className="text-teal-400 font-semibold mt-1">
                  Current Balance: {selectedBatchForAdjustment.quantityBaseUnits ?? selectedBatchForAdjustment.quantity_base_units ?? 0} {selectedBatchForAdjustment.medicine?.baseUnit || selectedBatchForAdjustment.medicine?.base_unit || 'Units'}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  New Physical Count (Base Units / Tablets)
                </label>
                <input
                  type="number"
                  min="0"
                  value={adjustmentBaseUnits}
                  onChange={(e) => setAdjustmentBaseUnits(Math.max(0, parseInt(e.target.value, 10) || 0))}
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono text-sm focus:outline-none focus:border-teal-500"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Equivalent to {Math.floor(adjustmentBaseUnits / (selectedBatchForAdjustment.unitsPerPack || 1))} packs + {adjustmentBaseUnits % (selectedBatchForAdjustment.unitsPerPack || 1)} loose units.
                </p>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Reason for Adjustment / Audit Note
                </label>
                <textarea
                  rows={2}
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  placeholder="e.g. Month-end physical verification count discrepancy"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedBatchForAdjustment(null)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSaveAdjustment}
                  className="px-4 py-2 text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition-colors shadow-lg shadow-teal-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Commit Adjustment'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
