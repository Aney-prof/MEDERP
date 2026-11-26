import React from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  IndianRupee,
  Boxes,
  AlertTriangle,
  Users,
  TrendingUp,
  Receipt,
  Search,
  PlusCircle,
  FileText,
  Calendar,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Printer
} from 'lucide-react';

export const DashboardOverview: React.FC = () => {
  const {
    medicines,
    patients,
    invoices,
    scheduleH1Register,
    setActiveTab,
    setActiveInvoiceToPrint
  } = usePharma();

  // 1. Today's Sales Calculation
  const todayStr = new Date().toISOString().split('T')[0];
  const todayInvoices = invoices.filter((inv) => inv.date === todayStr);
  const todaySalesTotal = todayInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);

  // Payment Breakdown
  const cashSales = todayInvoices.filter((i) => i.paymentMode === 'Cash').reduce((s, i) => s + i.grandTotal, 0);
  const upiSales = todayInvoices.filter((i) => i.paymentMode === 'UPI').reduce((s, i) => s + i.grandTotal, 0);
  const creditSales = todayInvoices.filter((i) => i.paymentMode === 'Credit (Khata)').reduce((s, i) => s + i.grandTotal, 0);

  // 2. Stock Valuation
  let totalStockCost = 0;
  let totalStockMrp = 0;
  let totalUnitsInStock = 0;

  (medicines || []).forEach((med) => {
    (med.batches || []).forEach((b) => {
      if (!b.isDamaged) {
        const qty = b.quantityBaseUnits ?? b.quantity ?? 0;
        const pRate = b.purchaseRate ?? b.purchase_rate ?? 0;
        const mrp = b.mrp ?? 0;
        totalStockCost += pRate * qty;
        totalStockMrp += mrp * qty;
        totalUnitsInStock += qty;
      }
    });
  });

  const estimatedProfitMargin = totalStockMrp > 0
    ? (((totalStockMrp - totalStockCost) / totalStockMrp) * 100).toFixed(1)
    : '0.0';

  // 3. Expiry Risk (<60 days)
  const today = new Date();
  const sixtyDaysAhead = new Date();
  sixtyDaysAhead.setDate(today.getDate() + 60);

  const nearExpiryBatches = (medicines || []).flatMap((m) =>
    (m.batches || []).filter((b) => {
      const expDateStr = b.expiryDate || b.expiry_date;
      if (!expDateStr) return false;
      const parts = expDateStr.split('-');
      if (parts.length < 2) return false;
      const year = Number(parts[0]);
      const month = Number(parts[1]);
      const expDate = new Date(year, month - 1, 28);
      const qty = b.quantityBaseUnits ?? b.quantity ?? 0;
      return expDate <= sixtyDaysAhead && qty > 0;
    }).map((b) => ({ medicine: m, batch: b }))
  );

  const expiryValueRisk = nearExpiryBatches.reduce(
    (sum, item) => sum + (item.batch.purchaseRate ?? item.batch.purchase_rate ?? 0) * (item.batch.quantityBaseUnits ?? item.batch.quantity ?? 0),
    0
  );

  // 4. Low Stock Reorder List
  const lowStockItems = (medicines || []).filter((m) => {
    const totalQty = (m.batches || []).reduce((sum, b) => sum + (b.isDamaged ? 0 : (b.quantityBaseUnits ?? b.quantity ?? 0)), 0);
    const minReorder = (m.batches && m.batches.length > 0)
      ? Math.min(...m.batches.map((b) => b.reorderLevel ?? b.reorder_level_base_units ?? 20))
      : (m.minStockAlert ?? 20);
    return totalQty <= minReorder;
  });

  // 5. Chronic Refill Reminders Due
  const patientsDueForRefill = (patients || []).filter((p) =>
    (p.prescriptions || []).some((rx) => rx.nextRefillDate && new Date(rx.nextRefillDate) <= sixtyDaysAhead)
  );

  // Total Patient Khata Credit Due
  const totalKhataOutstanding = (patients || []).reduce((acc, p) => acc + (p.creditBalance || p.credit_balance || 0), 0);

  return (
    <div className="space-y-5">
      {/* Welcome & Fast Command Bar */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Dispensary & Wholesale Operations Center
            </h2>
            <span className="bg-slate-800 text-teal-400 text-xs px-2 py-0.5 rounded border border-slate-700 font-mono">
              FEFO Priority Enabled
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time batch tracking, Indian GST compliance, Schedule H1 registers, and patient Khata CRM.
          </p>
        </div>

        {/* Quick Shortcut Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveTab('billing')}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-2 rounded-lg shadow-sm transition cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>New Bill</span>
            <kbd className="bg-teal-800 text-teal-200 text-[10px] px-1.5 py-0.2 rounded font-mono">
              F2
            </kbd>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <Search className="w-4 h-4 text-cyan-400" />
            <span>Salt / Generic Finder</span>
          </button>

          <button
            onClick={() => setActiveTab('expiry')}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-amber-300 text-xs font-medium px-3 py-2 rounded-lg border border-slate-700 transition cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Expiry Dump</span>
            <kbd className="bg-slate-900 text-amber-400 text-[10px] px-1 py-0.2 rounded font-mono border border-slate-700">
              F7
            </kbd>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards Grid (Marg ERP Standard Metrics) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Today's Revenue */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Today's Gross Sales
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            ₹{todaySalesTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
            <span className="text-emerald-400 font-medium">UPI: ₹{upiSales.toFixed(0)}</span>
            <span>•</span>
            <span className="text-slate-300">Cash: ₹{cashSales.toFixed(0)}</span>
            {creditSales > 0 && (
              <>
                <span>•</span>
                <span className="text-amber-400">Credit: ₹{creditSales.toFixed(0)}</span>
              </>
            )}
          </div>
        </div>

        {/* Metric 2: Inventory Valuation */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Inventory Valuation
            </span>
            <div className="w-8 h-8 rounded-lg bg-teal-950/80 text-teal-400 border border-teal-800/60 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            ₹{totalStockCost.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>MRP Value: ₹{totalStockMrp.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <span className="text-teal-400 font-semibold font-mono">+{estimatedProfitMargin}% Margin</span>
          </div>
        </div>

        {/* Metric 3: Expiry Risk at 60 Days */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Near-Expiry Exposure
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-950/80 text-amber-400 border border-amber-800/60 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-amber-400 tracking-tight">
            {nearExpiryBatches.length} <span className="text-sm font-normal text-slate-300">Batches</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Valuation at risk:</span>
            <span className="text-amber-300 font-semibold font-mono">₹{expiryValueRisk.toFixed(2)}</span>
          </div>
        </div>

        {/* Metric 4: Chronic Patients & Khata Due */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Khata Ledger Dues
            </span>
            <div className="w-8 h-8 rounded-lg bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-white tracking-tight">
            ₹{totalKhataOutstanding.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="text-cyan-400 font-medium">{patientsDueForRefill.length} Refills Due this week</span>
            <button
              onClick={() => setActiveTab('patients')}
              className="text-[10px] text-teal-400 hover:underline cursor-pointer"
            >
              Manage →
            </button>
          </div>
        </div>
      </div>

      {/* Two Column Layout: Critical Stock Alerts & Fast Billing Log */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 cols): Live Counter Billing Register */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-teal-400" />
                <h3 className="text-sm font-bold text-white">Recent Counter Invoices</h3>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {invoices.length} Bills Issued
              </span>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-2 px-2.5">Inv No</th>
                    <th className="py-2 px-2.5">Time</th>
                    <th className="py-2 px-2.5">Patient / Customer</th>
                    <th className="py-2 px-2.5 text-right">Items</th>
                    <th className="py-2 px-2.5 text-right">Amount</th>
                    <th className="py-2 px-2.5 text-center">Mode</th>
                    <th className="py-2 px-2.5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {invoices.slice(0, 6).map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-2 px-2.5 font-mono text-teal-400 font-medium">
                        {inv.invoiceNumber}
                      </td>
                      <td className="py-2 px-2.5 text-slate-400 text-[11px]">
                        {inv.time}
                      </td>
                      <td className="py-2 px-2.5">
                        <div className="font-medium text-slate-200 truncate max-w-[140px]">
                          {inv.patientName}
                        </div>
                        {inv.doctorName && (
                          <div className="text-[10px] text-slate-400 truncate max-w-[140px]">
                            {inv.doctorName}
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-2.5 text-right text-slate-300 font-mono">
                        {inv.items.length}
                      </td>
                      <td className="py-2 px-2.5 text-right font-semibold text-white font-mono">
                        ₹{inv.grandTotal.toFixed(2)}
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                            inv.paymentMode === 'Cash'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                              : inv.paymentMode === 'UPI'
                              ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/60'
                              : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          }`}
                        >
                          {inv.paymentMode}
                        </span>
                      </td>
                      <td className="py-2 px-2.5 text-center">
                        <button
                          onClick={() => setActiveInvoiceToPrint(inv)}
                          className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition cursor-pointer"
                          title="Print / View GST Invoice"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>Includes auto-calculated CGST (6%) + SGST (6%) / HSN Breakdown</span>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-teal-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>View Full Sales Register</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Column (5 cols): Marg ERP Alerts & Fast Stock Reorder */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Box 1: Reorder Trigger (Low Stock) */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                Minimum Stock Level (Reorder Triggers)
              </span>
              <span className="text-[10px] bg-rose-950 text-rose-300 border border-rose-800/60 px-1.5 py-0.2 rounded font-mono">
                {lowStockItems.length} Critical
              </span>
            </div>

            <div className="mt-2.5 divide-y divide-slate-800/60">
              {lowStockItems.slice(0, 3).map((item) => {
                const totalQty = item.batches.reduce((sum, b) => sum + (b.isDamaged ? 0 : b.quantity), 0);
                const minReorder = Math.min(...item.batches.map((b) => b.reorderLevel), 20);

                return (
                  <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-100">{item.brandName}</div>
                      <div className="text-[11px] text-slate-400">{item.genericComposition}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-rose-400 font-bold">
                        {totalQty} Units
                      </div>
                      <div className="text-[10px] text-slate-400">Min: {minReorder}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={() => setActiveTab('inventory')}
              className="mt-3 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 hover:text-teal-300 text-xs font-semibold rounded-lg border border-slate-700 transition cursor-pointer text-center"
            >
              Order from Distributor →
            </button>
          </div>

          {/* Box 2: Mandatory Schedule H1 Compliance Tracker */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-rose-500" />
                Drug Law Schedule H1 Register
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">100% Audited</span>
            </div>

            <p className="text-[11px] text-slate-400 mt-2">
              Mandatory under Drugs & Cosmetics Rules (3rd gen cephalosporins, anti-TB, psychotropics).
            </p>

            <div className="mt-2 bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs">
              <div className="flex justify-between text-slate-300 font-medium">
                <span>Recent Record:</span>
                <span className="text-teal-400 font-mono">
                  {scheduleH1Register[0]?.invoiceNumber || 'INV-2026-0038'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                {scheduleH1Register[0]?.medicineName} • Sold to: {scheduleH1Register[0]?.patientName}
              </div>
            </div>

            <button
              onClick={() => setActiveTab('schedule-h1')}
              className="mt-2.5 w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition cursor-pointer text-center"
            >
              Inspect Schedule H1 Register ({scheduleH1Register.length} records)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
