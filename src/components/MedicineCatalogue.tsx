import React, { useState, useMemo } from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  Boxes,
  Plus,
  Search,
  Barcode,
  Sparkles,
  ShieldAlert,
  Snowflake,
  Layers,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  Eye,
  Tag
} from 'lucide-react';
import { Medicine, DrugSchedule, DrugCategory } from '../types/pharmacy';
import { api } from '../api/client';

export const MedicineCatalogue: React.FC = () => {
  const { medicines, addMedicine, hasPermission, globalSearch, setActiveTab } = usePharma();

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSchedule, setSelectedSchedule] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [expandedMedId, setExpandedMedId] = useState<string | null>(null);

  // Review Alternatives State (Pharmacist clinical review only, never auto-substituted)
  const [alternativeReviewItem, setAlternativeReviewItem] = useState<Medicine | null>(null);
  const [alternativesList, setAlternativesList] = useState<any[]>([]);
  const [loadingAlts, setLoadingAlts] = useState<boolean>(false);

  // New Medicine Form State
  const [formData, setFormData] = useState({
    brandName: '',
    genericComposition: '',
    strength: '',
    dosageForm: 'Tablet' as Medicine['dosageForm'],
    manufacturer: '',
    barcode: '',
    code: '',
    hsnCode: '30049099',
    gstPercent: 12,
    packUnit: 'Strip',
    baseUnit: 'Tablet',
    unitsPerPack: 10,
    mrp: 100,
    purchaseRate: 70,
    schedule: 'OTC' as DrugSchedule,
    category: 'Allopathic' as DrugCategory,
    temperatureRequirement: '',
    minStockAlert: 20
  });

  const filteredMedicines = useMemo(() => {
    const q = (searchTerm || globalSearch).toLowerCase().trim();
    return medicines.filter((m) => {
      const brand = (m.brandName || m.brand_name || '').toLowerCase();
      const generic = (m.genericComposition || m.generic_composition || '').toLowerCase();
      const barcode = (m.barcode || '').toLowerCase();
      const code = (m.code || '').toLowerCase();

      const matchesSearch = !q || brand.includes(q) || generic.includes(q) || barcode.includes(q) || code.includes(q);
      const matchesSchedule = selectedSchedule === 'all' || m.schedule === selectedSchedule;
      const matchesCategory = selectedCategory === 'all' || m.category === selectedCategory;

      return matchesSearch && matchesSchedule && matchesCategory;
    });
  }, [medicines, searchTerm, globalSearch, selectedSchedule, selectedCategory]);

  const handleReviewAlternatives = async (med: Medicine) => {
    setAlternativeReviewItem(med);
    setLoadingAlts(true);
    try {
      const generic = med.genericComposition || med.generic_composition || '';
      const alts = await api.getCompositionAlternatives(generic, med.id);
      setAlternativesList(alts);
    } catch {
      setAlternativesList([]);
    } finally {
      setLoadingAlts(false);
    }
  };

  const handleCreateMedicine = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.brandName.trim() || !formData.genericComposition.trim()) return;

    await addMedicine({
      brandName: formData.brandName,
      genericComposition: formData.genericComposition,
      strength: formData.strength || undefined,
      dosageForm: formData.dosageForm,
      manufacturer: formData.manufacturer || 'Generic Pharma',
      barcode: formData.barcode || undefined,
      code: formData.code || undefined,
      hsnCode: formData.hsnCode,
      gstPercent: Number(formData.gstPercent),
      packUnit: formData.packUnit,
      baseUnit: formData.baseUnit,
      unitsPerPack: Number(formData.unitsPerPack),
      mrp: Number(formData.mrp),
      purchaseRate: Number(formData.purchaseRate),
      schedule: formData.schedule,
      category: formData.category,
      temperatureRequirement: formData.temperatureRequirement || undefined,
      minStockAlert: Number(formData.minStockAlert)
    });

    setShowAddModal(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Boxes className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Master Medicine Catalogue & Formulations
            </h2>
            <span className="text-xs bg-slate-800 text-teal-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
              {filteredMedicines.length} Listed Items
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Standard drug definitions with pack-to-base unit conversion ratios, HSN classification, and composition review alternatives.
          </p>
        </div>

        {hasPermission('STOCK_ADJUST') && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3.5 py-2 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Catalogue New Medicine</span>
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-teal-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Brand Name, Active Salt / Composition, Barcode, Code..."
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={selectedSchedule}
            onChange={(e) => setSelectedSchedule(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Drug Schedules</option>
            <option value="OTC">OTC (Over the Counter)</option>
            <option value="Schedule H">Schedule H (Rx Required)</option>
            <option value="Schedule H1">Schedule H1 (Controlled Antibiotic)</option>
            <option value="Narcotic">Narcotic / Habit-Forming</option>
          </select>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal-500"
          >
            <option value="all">All Categories</option>
            <option value="Allopathic">Allopathic</option>
            <option value="Generic">Generic</option>
            <option value="Cold Chain">Cold Chain (2°C-8°C)</option>
            <option value="Nutraceutical">Nutraceutical</option>
            <option value="Surgical">Surgical</option>
          </select>
        </div>
      </div>

      {/* Catalogue Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3 w-8"></th>
                <th className="py-2.5 px-3">Brand & Strength</th>
                <th className="py-2.5 px-3">Active Composition / Salt</th>
                <th className="py-2.5 px-3">Manufacturer</th>
                <th className="py-2.5 px-3">Pack & Base Units</th>
                <th className="py-2.5 px-3">Schedule</th>
                <th className="py-2.5 px-3">HSN / GST</th>
                <th className="py-2.5 px-3 text-right">Pack MRP (₹)</th>
                <th className="py-2.5 px-3 text-center">Alternatives</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredMedicines.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-500">
                    No medicines match the selected filter.
                  </td>
                </tr>
              ) : (
                filteredMedicines.map((med) => {
                  const isExpanded = expandedMedId === med.id;
                  const brand = med.brandName || med.brand_name;
                  const generic = med.genericComposition || med.generic_composition;
                  const packUnit = med.packUnit || med.pack_unit || 'Strip';
                  const baseUnit = med.baseUnit || med.base_unit || 'Tablet';
                  const unitsPerPack = med.unitsPerPack || med.units_per_pack || 1;
                  const hsn = med.hsnCode || med.hsn_code || '30049099';
                  const gst = med.gstPercent ?? med.gst_percent ?? 12;

                  return (
                    <React.Fragment key={med.id}>
                      <tr
                        onClick={() => setExpandedMedId(isExpanded ? null : med.id)}
                        className={`hover:bg-slate-800/50 cursor-pointer transition select-none ${isExpanded ? 'bg-slate-800/40' : ''}`}
                      >
                        <td className="py-2.5 px-3 text-slate-400">
                          {isExpanded ? <ChevronDown className="w-4 h-4 text-teal-400" /> : <ChevronRight className="w-4 h-4" />}
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-white">
                          <div className="flex items-center gap-1.5">
                            <span>{brand}</span>
                            {med.strength && <span className="text-[10px] text-slate-400">({med.strength})</span>}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Code: {med.code || med.id} {med.barcode ? `• Barcode: ${med.barcode}` : ''}
                          </div>
                        </td>

                        <td className="py-2.5 px-3 font-mono text-[11px] text-cyan-300">
                          {generic}
                        </td>

                        <td className="py-2.5 px-3 text-slate-300">
                          {med.manufacturer}
                        </td>

                        <td className="py-2.5 px-3 font-mono text-[11px]">
                          <span className="text-slate-100 font-bold">1 {packUnit}</span> = {unitsPerPack} {baseUnit}s
                        </td>

                        <td className="py-2.5 px-3">
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                              med.schedule === 'Schedule H1'
                                ? 'bg-rose-950 text-rose-300 border-rose-700'
                                : med.schedule === 'Schedule H'
                                ? 'bg-purple-950 text-purple-300 border-purple-700'
                                : 'bg-slate-800 text-slate-300 border-slate-700'
                            }`}
                          >
                            {med.schedule}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 font-mono text-[10px] text-slate-400">
                          <div>HSN: {hsn}</div>
                          <div className="text-teal-400 font-semibold">{gst}% GST</div>
                        </td>

                        <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                          ₹{Number(med.mrp || 0).toFixed(2)}
                        </td>

                        <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleReviewAlternatives(med)}
                            className="px-2 py-1 bg-slate-800 hover:bg-cyan-950 text-cyan-300 hover:border-cyan-700 border border-slate-700 text-[10px] rounded transition cursor-pointer flex items-center gap-1 mx-auto"
                            title="Clinical Salt Alternative Review (Pharmacist verification only)"
                          >
                            <Sparkles className="w-3 h-3 text-cyan-400" />
                            <span>Review Alts</span>
                          </button>
                        </td>
                      </tr>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <tr className="bg-slate-950/80">
                          <td colSpan={9} className="py-3 px-6 border-b border-slate-800 text-xs">
                            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Base Unit Selling Price</span>
                                <div className="text-sm font-bold font-mono text-teal-400 mt-1">
                                  ₹{(Number(med.mrp) / unitsPerPack).toFixed(2)} / {baseUnit}
                                </div>
                                <span className="text-[10px] text-slate-500">Calculated loose tablet rate</span>
                              </div>

                              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Storage & Temperature</span>
                                <div className="text-xs font-semibold text-white mt-1">
                                  {med.temperatureRequirement || med.temperature_requirement || 'Store below 30°C in dry place'}
                                </div>
                                <span className="text-[10px] text-slate-500">Packaging: {packUnit}</span>
                              </div>

                              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                                <span className="text-[10px] text-slate-400 uppercase font-semibold">Reorder Threshold</span>
                                <div className="text-sm font-bold font-mono text-amber-400 mt-1">
                                  {med.minStockAlert || med.min_stock_alert || 20} {baseUnit}s
                                </div>
                                <span className="text-[10px] text-slate-500">Triggers reorder suggestion</span>
                              </div>

                              <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 flex items-center justify-between">
                                <div>
                                  <span className="text-[10px] text-slate-400 uppercase font-semibold">Active Batches</span>
                                  <div className="text-xs font-medium text-slate-300 mt-0.5">
                                    Manage individual lots in Batch Master
                                  </div>
                                </div>
                                <button
                                  onClick={() => setActiveTab('inventory')}
                                  className="px-2.5 py-1 bg-teal-600 hover:bg-teal-500 text-white rounded text-[10px] font-semibold cursor-pointer"
                                >
                                  View Batches →
                                </button>
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

      {/* MODAL 1: Add New Medicine Record */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-6 text-xs text-slate-200 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Boxes className="w-5 h-5 text-teal-400" />
                Add New Pharmaceutical Formulation
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-base cursor-pointer">
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateMedicine} className="space-y-4 mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">Brand Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fictional-Cure 500"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">Active Generic Composition *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Fictionalin Sodium 500mg"
                    value={formData.genericComposition}
                    onChange={(e) => setFormData({ ...formData, genericComposition: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">Strength</label>
                  <input
                    type="text"
                    placeholder="e.g. 500 mg"
                    value={formData.strength}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">Dosage Form</label>
                  <select
                    value={formData.dosageForm}
                    onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option>Tablet</option>
                    <option>Capsule</option>
                    <option>Syrup</option>
                    <option>Injection</option>
                    <option>Ointment</option>
                    <option>Drops</option>
                    <option>Inhaler</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">Manufacturer</label>
                  <input
                    type="text"
                    placeholder="e.g. Sun Pharma, Cipla"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              {/* Units & Conversions Box */}
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[11px] font-semibold text-teal-400 block">
                  Packaging & Unit Conversion (Base Unit vs Pack Unit)
                </span>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block">Pack Unit (Outer)</label>
                    <input
                      type="text"
                      placeholder="Strip / Box / Bottle"
                      value={formData.packUnit}
                      onChange={(e) => setFormData({ ...formData, packUnit: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block">Smallest Base Unit</label>
                    <input
                      type="text"
                      placeholder="Tablet / ml / Piece"
                      value={formData.baseUnit}
                      onChange={(e) => setFormData({ ...formData, baseUnit: e.target.value })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-slate-400 uppercase block">Units Per Pack *</label>
                    <input
                      type="number"
                      min={1}
                      value={formData.unitsPerPack}
                      onChange={(e) => setFormData({ ...formData, unitsPerPack: Number(e.target.value) })}
                      className="w-full bg-slate-900 border border-slate-700 rounded p-1.5 text-xs text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Pricing, Schedule & Taxes */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">MRP Per Pack (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">Purchase Rate Per Pack (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.purchaseRate}
                    onChange={(e) => setFormData({ ...formData, purchaseRate: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">Schedule</label>
                  <select
                    value={formData.schedule}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option>OTC</option>
                    <option>Schedule H</option>
                    <option>Schedule H1</option>
                    <option>Narcotic</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsnCode}
                    onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">GST Tax Slab %</label>
                  <select
                    value={formData.gstPercent}
                    onChange={(e) => setFormData({ ...formData, gstPercent: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  >
                    <option value={0}>0% (Exempt)</option>
                    <option value={5}>5% (Life-saving)</option>
                    <option value={12}>12% (Standard Pharma)</option>
                    <option value={18}>18% (Disinfectants/Supplements)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">Barcode / EAN</label>
                  <input
                    type="text"
                    placeholder="e.g. 8901234567890"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow cursor-pointer"
                >
                  Save Formulation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Review Composition Alternatives (Pharmacist Only) */}
      {alternativeReviewItem && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl p-6 text-xs text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  Composition-Based Alternatives Review
                </h3>
                <p className="text-[11px] text-cyan-300 font-mono mt-0.5">
                  Molecule: {alternativeReviewItem.genericComposition || alternativeReviewItem.generic_composition}
                </p>
              </div>
              <button
                onClick={() => setAlternativeReviewItem(null)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-950/40 border border-amber-800/80 rounded-xl my-3 text-[11px] text-amber-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong>Pharmacist Review Notice:</strong> These formulation alternatives are presented solely for the licensed pharmacist's reference during stock-out consultations. The system never automatically substitutes any medicine.
              </div>
            </div>

            {loadingAlts ? (
              <div className="py-8 text-center text-slate-400">Searching equivalent formulations...</div>
            ) : alternativesList.length === 0 ? (
              <div className="py-8 text-center text-slate-500">
                No other formulations registered with this exact active molecule.
              </div>
            ) : (
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {alternativesList.map((alt) => (
                  <div
                    key={alt.id}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-white">{alt.brand_name}</div>
                      <div className="text-[10px] text-slate-400">
                        {alt.manufacturer} • {alt.dosage_form} ({alt.pack_unit})
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-teal-400 font-mono font-bold">₹{alt.mrp}</div>
                      <div className="text-[10px] text-emerald-400 font-mono">
                        {alt.total_available_base_units} {alt.base_unit}s in stock
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
