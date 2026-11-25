import React, { useState } from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  Truck,
  Plus,
  Phone,
  Mail,
  MapPin,
  FileText,
  IndianRupee,
  ShieldCheck,
  Building2
} from 'lucide-react';
import { Supplier } from '../types/pharmacy';

export const SuppliersLedger: React.FC = () => {
  const { suppliers, addSupplier } = usePharma();
  const [showAddSupplierModal, setShowAddSupplierModal] = useState<boolean>(false);

  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    gstin: '',
    dlNumber: '',
    outstandingBalance: 0
  });

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupplier.name.trim() || !newSupplier.phone.trim()) return;

    addSupplier({
      name: newSupplier.name,
      contactPerson: newSupplier.contactPerson || 'Sales Dept',
      phone: newSupplier.phone,
      email: newSupplier.email || 'orders@distributor.com',
      address: newSupplier.address || 'Pharma Distribution Zone',
      gstin: newSupplier.gstin || '27AAAAA0000A1Z5',
      dlNumber: newSupplier.dlNumber || 'DL-PENDING',
      outstandingBalance: Number(newSupplier.outstandingBalance)
    });

    setShowAddSupplierModal(false);
  };

  const totalPayableToSuppliers = suppliers.reduce((sum, s) => sum + s.outstandingBalance, 0);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Pharma Distributors & Inward Purchase Ledger
            </h2>
            <span className="text-xs bg-slate-800 text-teal-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
              {suppliers.length} Authorized Vendors
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Maintain C&F distributor drug licenses, GSTIN compliance, purchase bills, and payment settlements.
          </p>
        </div>

        <button
          onClick={() => setShowAddSupplierModal(true)}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Distributor</span>
        </button>
      </div>

      {/* Payables Summary */}
      <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
        <div>
          <span className="text-slate-400 uppercase font-semibold">Total Accounts Payable (Vendor Credit Dues)</span>
          <div className="text-2xl font-bold font-mono text-amber-400 mt-0.5">
            ₹{totalPayableToSuppliers.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
        </div>
        <div className="text-right text-[11px] text-slate-400">
          <div>Payment Cycle: 21 Days</div>
          <div className="text-emerald-400">All DLs Verified Active</div>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suppliers.map((supplier) => (
          <div
            key={supplier.id}
            className="p-4 bg-slate-900 border border-slate-800 rounded-xl text-xs space-y-3 hover:border-slate-700 transition"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-white text-sm">{supplier.name}</h3>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Contact: <strong className="text-slate-300">{supplier.contactPerson}</strong>
                </div>
              </div>
              <span className="font-mono text-amber-400 font-bold text-xs bg-slate-950 border border-slate-800 px-2 py-1 rounded">
                Due: ₹{supplier.outstandingBalance.toFixed(2)}
              </span>
            </div>

            <div className="space-y-1 text-slate-300 text-[11px]">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-teal-400" />
                <span>{supplier.phone}</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>{supplier.email}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-teal-400" />
                <span className="truncate">{supplier.address}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-400 font-mono">
              <span>GSTIN: {supplier.gstin}</span>
              <span className="text-teal-400">DL: {supplier.dlNumber}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-xs text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Truck className="w-4 h-4 text-teal-400" />
                Add Authorized Distributor
              </h3>
              <button
                onClick={() => setShowAddSupplierModal(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSupplier} className="space-y-3 mt-4">
              <div>
                <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                  Distributor Agency Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Zydus Pharma Distribution"
                  value={newSupplier.name}
                  onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Contact Person
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vikas Gupta"
                    value={newSupplier.contactPerson}
                    onChange={(e) =>
                      setNewSupplier({ ...newSupplier, contactPerson: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Phone *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98200 11223"
                    value={newSupplier.phone}
                    onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    GSTIN
                  </label>
                  <input
                    type="text"
                    placeholder="27AABC1234F1Z1"
                    value={newSupplier.gstin}
                    onChange={(e) => setNewSupplier({ ...newSupplier, gstin: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Drug License (DL No)
                  </label>
                  <input
                    type="text"
                    placeholder="MH-MZ-20419"
                    value={newSupplier.dlNumber}
                    onChange={(e) => setNewSupplier({ ...newSupplier, dlNumber: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                  Address
                </label>
                <input
                  type="text"
                  placeholder="Gala / Depot Location"
                  value={newSupplier.address}
                  onChange={(e) => setNewSupplier({ ...newSupplier, address: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg shadow cursor-pointer"
                >
                  Save Distributor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
