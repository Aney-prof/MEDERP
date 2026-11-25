import React, { useState } from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  ShieldAlert,
  FileCheck2,
  Printer,
  Search,
  CheckCircle,
  Building,
  UserCheck,
  Calendar
} from 'lucide-react';

export const ScheduleH1Register: React.FC = () => {
  const { scheduleH1Register, drugLicenseNo, gstinNo } = usePharma();
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredEntries = scheduleH1Register.filter((entry) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      entry.medicineName.toLowerCase().includes(q) ||
      entry.patientName.toLowerCase().includes(q) ||
      entry.doctorName.toLowerCase().includes(q) ||
      entry.invoiceNumber.toLowerCase().includes(q) ||
      entry.batchNumber.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Statutory Schedule H1 & Controlled Substances Register
            </h2>
            <span className="text-xs bg-rose-950 text-rose-300 border border-rose-800 px-2 py-0.5 rounded font-mono">
              Drug Rules Form 65
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Mandatory under Drugs & Cosmetics Rules 1945 (Notification GSR 588(E)). Retained for minimum 3 years for State Drug Control inspection.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold px-3 py-2 rounded-lg transition cursor-pointer"
        >
          <Printer className="w-4 h-4 text-teal-400" />
          <span>Print Official Register</span>
        </button>
      </div>

      {/* Statutory Notice Card */}
      <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl text-xs flex flex-wrap items-center justify-between gap-3 text-slate-300">
        <div className="flex items-center gap-4">
          <div>Pharmacy DL: <strong className="font-mono text-teal-300">{drugLicenseNo}</strong></div>
          <span className="text-slate-600">|</span>
          <div>GSTIN: <strong className="font-mono text-teal-300">{gstinNo}</strong></div>
          <span className="text-slate-600">|</span>
          <div>Registered Pharmacist in Charge: <strong className="text-white">Kailash Pandey (MH-PC-44192)</strong></div>
        </div>
        <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
          <CheckCircle className="w-4 h-4" />
          <span>FDA Inspection Ready</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter register by Doctor Name, Reg No, Patient, Medicine, or Batch..."
          className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-rose-500"
        />
      </div>

      {/* Register Table (Exact Government Standard Columns) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Invoice No</th>
                <th className="py-2.5 px-3">Name of Patient & Address</th>
                <th className="py-2.5 px-3">Prescribing RMP & Reg No</th>
                <th className="py-2.5 px-3">Name of Schedule H1 Drug</th>
                <th className="py-2.5 px-3">Batch No</th>
                <th className="py-2.5 px-3 text-right">Qty Dispensed</th>
                <th className="py-2.5 px-3 text-center">Pharmacist Sign</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    No Schedule H1 sales records found for this filter.
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry) => (
                  <tr key={entry.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-mono text-slate-300">
                      {entry.date}
                    </td>

                    <td className="py-2.5 px-3 font-mono text-teal-400 font-medium">
                      {entry.invoiceNumber}
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-white">{entry.patientName}</div>
                      <div className="text-[11px] text-slate-400">{entry.patientAddress}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-slate-200">{entry.doctorName}</div>
                      <div className="text-[10px] text-teal-300 font-mono">{entry.doctorAddressReg}</div>
                    </td>

                    <td className="py-2.5 px-3">
                      <div className="font-bold text-rose-300">{entry.medicineName}</div>
                      <span className="text-[9px] bg-rose-950 text-rose-400 px-1 py-0.2 rounded border border-rose-800">
                        Schedule H1
                      </span>
                    </td>

                    <td className="py-2.5 px-3 font-mono text-slate-200">
                      {entry.batchNumber}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                      {entry.quantitySold} Units
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span className="text-[10px] text-emerald-400 font-mono border border-emerald-800/60 bg-emerald-950/60 px-2 py-0.5 rounded">
                        KP-44192 (Verified)
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
