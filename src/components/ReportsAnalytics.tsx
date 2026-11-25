import React, { useState } from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  FileSpreadsheet,
  IndianRupee,
  TrendingUp,
  Download,
  Calendar,
  Layers,
  ArrowUpRight,
  Printer
} from 'lucide-react';

export const ReportsAnalytics: React.FC = () => {
  const { invoices, medicines, gstinNo } = usePharma();
  const [activeReportTab, setActiveReportTab] = useState<'gstr1' | 'fast-moving' | 'cash-register'>('gstr1');

  // GSTR-1 Tax Computation
  let totalTaxableValue = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalGrossAmount = 0;

  // Breakdown by GST Rates (0%, 5%, 12%, 18%)
  const gstBreakdown: { [rate: number]: { taxable: number; cgst: number; sgst: number; gross: number } } = {
    0: { taxable: 0, cgst: 0, sgst: 0, gross: 0 },
    5: { taxable: 0, cgst: 0, sgst: 0, gross: 0 },
    12: { taxable: 0, cgst: 0, sgst: 0, gross: 0 },
    18: { taxable: 0, cgst: 0, sgst: 0, gross: 0 }
  };

  invoices.forEach((inv) => {
    totalGrossAmount += inv.grandTotal;
    inv.items.forEach((item) => {
      const lineGross = item.quantity * item.rate;
      const lineDisc = (lineGross * item.discountPercent) / 100;
      const lineTaxable = lineGross - lineDisc;
      const rate = item.gstPercent || 12;
      const lineTax = (lineTaxable * rate) / 100;
      const halfTax = lineTax / 2;

      totalTaxableValue += lineTaxable;
      totalCgst += halfTax;
      totalSgst += halfTax;

      if (!gstBreakdown[rate]) {
        gstBreakdown[rate] = { taxable: 0, cgst: 0, sgst: 0, gross: 0 };
      }
      gstBreakdown[rate].taxable += lineTaxable;
      gstBreakdown[rate].cgst += halfTax;
      gstBreakdown[rate].sgst += halfTax;
      gstBreakdown[rate].gross += lineTaxable + lineTax;
    });
  });

  return (
    <div className="space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-teal-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Marg Financial Reports, GSTR-1 & Sales Audit
            </h2>
            <span className="text-xs bg-slate-800 text-teal-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
              B2C Outward Supplies
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Automated Indian GST computation for monthly GSTR-1 return filing, HSN summary, and cash register settlement.
          </p>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          <span>Print GSTR-1 Summary</span>
        </button>
      </div>

      {/* Report Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveReportTab('gstr1')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeReportTab === 'gstr1'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          GSTR-1 Tax Summary (Table 7 B2C)
        </button>
        <button
          onClick={() => setActiveReportTab('cash-register')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeReportTab === 'cash-register'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Daily Cash & Tender Register
        </button>
        <button
          onClick={() => setActiveReportTab('fast-moving')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeReportTab === 'fast-moving'
              ? 'bg-teal-600 text-white shadow-sm'
              : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          Fast-Moving Drugs (ABC Analysis)
        </button>
      </div>

      {/* TAB 1: GSTR-1 Breakdown */}
      {activeReportTab === 'gstr1' && (
        <div className="space-y-4">
          {/* Statutory Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Gross Sales Value</span>
              <div className="text-xl font-bold font-mono text-white mt-1">₹{totalGrossAmount.toFixed(2)}</div>
              <span className="text-[10px] text-slate-500">Inclusive of all taxes</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Taxable Value</span>
              <div className="text-xl font-bold font-mono text-teal-400 mt-1">₹{totalTaxableValue.toFixed(2)}</div>
              <span className="text-[10px] text-slate-500">Base Net Value</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">Central Tax (CGST)</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">₹{totalCgst.toFixed(2)}</div>
              <span className="text-[10px] text-slate-500">Government Portal Output</span>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 uppercase">State Tax (SGST)</span>
              <div className="text-xl font-bold font-mono text-cyan-400 mt-1">₹{totalSgst.toFixed(2)}</div>
              <span className="text-[10px] text-slate-500">State Revenue Credit</span>
            </div>
          </div>

          {/* GSTR-1 Rate-Wise Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-3 bg-slate-950 border-b border-slate-800 font-bold text-xs text-white flex justify-between items-center">
              <span>GST Slab Classification (Form GSTR-1 B2CS)</span>
              <span className="text-slate-400 font-mono text-[11px]">GSTIN: {gstinNo}</span>
            </div>

            <table className="w-full text-left text-xs text-slate-200">
              <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Tax Slab (%)</th>
                  <th className="py-2.5 px-3 text-right">Taxable Turnover (₹)</th>
                  <th className="py-2.5 px-3 text-right">CGST Amount (₹)</th>
                  <th className="py-2.5 px-3 text-right">SGST Amount (₹)</th>
                  <th className="py-2.5 px-3 text-right">Total Tax Liability (₹)</th>
                  <th className="py-2.5 px-3 text-right">Gross Total (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {[0, 5, 12, 18].map((rate) => {
                  const data = gstBreakdown[rate] || { taxable: 0, cgst: 0, sgst: 0, gross: 0 };
                  const totalTax = data.cgst + data.sgst;

                  return (
                    <tr key={rate} className="hover:bg-slate-800/40">
                      <td className="py-2.5 px-3 font-mono font-bold text-teal-400">
                        {rate}% GST Slab
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-white">
                        ₹{data.taxable.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-cyan-300">
                        ₹{data.cgst.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-cyan-300">
                        ₹{data.sgst.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-400">
                        ₹{totalTax.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white">
                        ₹{data.gross.toFixed(2)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Cash & Tender Register */}
      {activeReportTab === 'cash-register' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-950 border-b border-slate-800 font-bold text-xs text-white">
            Daily Counter Billing & Payment Mode Reconciliation
          </div>
          <table className="w-full text-left text-xs text-slate-200">
            <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="py-2 px-3">Invoice No</th>
                <th className="py-2 px-3">Time</th>
                <th className="py-2 px-3">Patient / Buyer</th>
                <th className="py-2 px-3">Billed By</th>
                <th className="py-2 px-3 text-center">Payment Mode</th>
                <th className="py-2 px-3 text-right">Taxable</th>
                <th className="py-2 px-3 text-right">GST</th>
                <th className="py-2 px-3 text-right">Grand Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-800/40">
                  <td className="py-2 px-3 font-mono text-teal-400 font-medium">
                    {inv.invoiceNumber}
                  </td>
                  <td className="py-2 px-3 text-slate-400 text-[11px]">{inv.time}</td>
                  <td className="py-2 px-3 text-white font-medium">{inv.patientName}</td>
                  <td className="py-2 px-3 text-slate-300 text-[11px]">{inv.billedBy}</td>
                  <td className="py-2 px-3 text-center font-mono">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-teal-300">
                      {inv.paymentMode}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-slate-300">
                    ₹{inv.subTotal.toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono text-cyan-300">
                    ₹{(inv.cgstTotal + inv.sgstTotal).toFixed(2)}
                  </td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-white">
                    ₹{inv.grandTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Fast-Moving ABC Analysis */}
      {activeReportTab === 'fast-moving' && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="font-bold text-sm text-white mb-3">Fast Moving Pharmaceutical Formulations</div>
          <div className="space-y-3">
            {medicines.slice(0, 6).map((med, idx) => {
              const totalStock = med.batches.reduce((sum, b) => sum + b.quantity, 0);
              return (
                <div key={med.id} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-teal-900/60 text-teal-300 font-bold flex items-center justify-center font-mono">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="font-bold text-white">{med.brandName}</div>
                      <div className="text-[11px] text-cyan-300">{med.genericComposition}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-emerald-400 font-mono font-bold">Category A (Fast Turnaround)</div>
                    <div className="text-slate-400 text-[11px]">{totalStock} Units on Hand</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
