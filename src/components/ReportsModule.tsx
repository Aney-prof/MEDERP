import React, { useState, useMemo } from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  FileText,
  Download,
  Calendar,
  Layers,
  BarChart3,
  TrendingUp,
  Percent,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileSpreadsheet
} from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const {
    medicines,
    batches,
    invoices,
    supplierReturns,
    patients,
    scheduleH1Register,
    addToast
  } = usePharma();

  const [activeReport, setActiveReport] = useState<'STOCK_VALUATION' | 'GSTR1' | 'EXPIRY_DUMP' | 'CUSTOMER_KHATA' | 'SCHEDULE_H1'>('STOCK_VALUATION');

  // Compute Stock Valuation
  const stockValuation = useMemo(() => {
    let totalPurchaseValue = 0;
    let totalMrpValue = 0;
    let totalUnits = 0;

    batches.forEach(b => {
      const units = b.quantityBaseUnits ?? b.quantity_base_units ?? 0;
      const pRate = b.purchaseRate ?? b.purchase_rate ?? 0;
      const mrp = b.mrp ?? 0;
      totalUnits += units;
      totalPurchaseValue += units * pRate;
      totalMrpValue += units * mrp;
    });

    return {
      totalUnits,
      totalPurchaseValue,
      totalMrpValue,
      grossMarginPotential: totalMrpValue - totalPurchaseValue
    };
  }, [batches]);

  // GSTR-1 Tax Summary
  const gstr1Summary = useMemo(() => {
    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalInvoiceAmount = 0;

    invoices.forEach(inv => {
      const sub = inv.subTotal ?? inv.subtotal ?? 0;
      const cgst = inv.cgstTotal ?? inv.cgst_total ?? 0;
      const sgst = inv.sgstTotal ?? inv.sgst_total ?? 0;
      const grand = inv.grandTotal ?? inv.grand_total ?? 0;

      totalTaxable += sub;
      totalCgst += cgst;
      totalSgst += sgst;
      totalInvoiceAmount += grand;
    });

    return {
      totalInvoices: invoices.length,
      totalTaxable,
      totalCgst,
      totalSgst,
      totalGst: totalCgst + totalSgst,
      totalInvoiceAmount
    };
  }, [invoices]);

  const handleExportCsv = (reportName: string, headers: string[], rows: any[][]) => {
    const csvContent = [
      headers.join(','),
      ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${reportName.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Report Exported', `${reportName} downloaded as CSV spreadsheet.`, 'success');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <BarChart3 className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Financial & Regulatory Reports</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
                Statutory Registers
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Stock valuation at cost, GSTR-1 outward tax liability, customer Khata balances, and Drugs Rules Form 65 registers.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-2">
        <button
          onClick={() => setActiveReport('STOCK_VALUATION')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeReport === 'STOCK_VALUATION'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Stock Valuation at Cost
        </button>
        <button
          onClick={() => setActiveReport('GSTR1')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeReport === 'GSTR1'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          GSTR-1 Outward Tax Summary
        </button>
        <button
          onClick={() => setActiveReport('CUSTOMER_KHATA')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeReport === 'CUSTOMER_KHATA'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Customer Khata Ledger
        </button>
        <button
          onClick={() => setActiveReport('SCHEDULE_H1')}
          className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all ${
            activeReport === 'SCHEDULE_H1'
              ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
              : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
          }`}
        >
          Form 65 (Schedule H1 Register)
        </button>
      </div>

      {/* VIEW: Stock Valuation */}
      {activeReport === 'STOCK_VALUATION' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Total On-Hand Units</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">{stockValuation.totalUnits}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-teal-400 font-medium">Inventory Value (Cost)</div>
              <div className="text-2xl font-bold font-mono text-teal-300 mt-1">₹{stockValuation.totalPurchaseValue.toFixed(2)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-emerald-400 font-medium">Retail Realization (MRP)</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">₹{stockValuation.totalMrpValue.toFixed(2)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-amber-400 font-medium">Gross Margin Potential</div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">₹{stockValuation.grossMarginPotential.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => handleExportCsv(
                'Stock-Valuation',
                ['Medicine_ID', 'Batch_Number', 'Expiry_Date', 'Quantity_Base_Units', 'Purchase_Rate', 'MRP', 'Cost_Value', 'MRP_Value'],
                batches.map(b => {
                  const qty = b.quantityBaseUnits ?? b.quantity_base_units ?? 0;
                  const pRate = b.purchaseRate ?? b.purchase_rate ?? 0;
                  const mrp = b.mrp ?? 0;
                  return [b.medicineId || b.medicine_id, b.batchNumber || b.batch_number, b.expiryDate || b.expiry_date, qty, pRate, mrp, (qty * pRate).toFixed(2), (qty * mrp).toFixed(2)];
                })
              )}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-teal-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Valuation CSV
            </button>
          </div>
        </div>
      )}

      {/* VIEW: GSTR-1 Summary */}
      {activeReport === 'GSTR1' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Total B2C Invoices</div>
              <div className="text-2xl font-bold font-mono text-white mt-1">{gstr1Summary.totalInvoices}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Total Taxable Value</div>
              <div className="text-2xl font-bold font-mono text-teal-300 mt-1">₹{gstr1Summary.totalTaxable.toFixed(2)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Total GST (CGST + SGST)</div>
              <div className="text-2xl font-bold font-mono text-amber-300 mt-1">₹{gstr1Summary.totalGst.toFixed(2)}</div>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-medium">Gross Outward Value</div>
              <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">₹{gstr1Summary.totalInvoiceAmount.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={() => handleExportCsv(
                'GSTR1-Summary',
                ['Invoice_Number', 'Date', 'Customer', 'Taxable_Value', 'CGST', 'SGST', 'Grand_Total'],
                invoices.map(inv => [
                  inv.invoiceNumber || inv.invoice_number,
                  inv.date,
                  inv.patientName || inv.patient_name || 'Walk-in',
                  inv.subTotal ?? inv.subtotal ?? 0,
                  inv.cgstTotal ?? inv.cgst_total ?? 0,
                  inv.sgstTotal ?? inv.sgst_total ?? 0,
                  inv.grandTotal ?? inv.grand_total ?? 0
                ])
              )}
              className="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-teal-400 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export GSTR-1 CSV
            </button>
          </div>
        </div>
      )}

      {/* VIEW: Customer Khata */}
      {activeReport === 'CUSTOMER_KHATA' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-4">Patient UHID</th>
                  <th className="py-3 px-4">Customer Name</th>
                  <th className="py-3 px-4">Phone</th>
                  <th className="py-3 px-4">Outstanding Credit (Khata)</th>
                  <th className="py-3 px-4">Credit Limit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {patients.map(p => (
                  <tr key={p.id} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-mono text-teal-300">{p.uhid}</td>
                    <td className="py-3 px-4 font-semibold text-white">{p.name}</td>
                    <td className="py-3 px-4">{p.phone}</td>
                    <td className={`py-3 px-4 font-mono font-bold ${
                      (p.creditBalance || p.credit_balance || 0) > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      ₹{(p.creditBalance || p.credit_balance || 0).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 font-mono">
                      ₹{(p.creditLimit || p.credit_limit || 2500).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW: Schedule H1 Register */}
      {activeReport === 'SCHEDULE_H1' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Form 65 Register of Schedule H1 Drugs</h3>
              <p className="text-xs text-slate-400 mt-0.5">Statutory 3-year record under Rule 65 of the Drugs and Cosmetics Rules, 1945.</p>
            </div>
            <button
              onClick={() => handleExportCsv(
                'Schedule-H1-Form65',
                ['Date', 'Invoice_Number', 'Patient_Name', 'Patient_Address', 'Doctor_Name', 'Doctor_Reg_No', 'Medicine_Name', 'Batch_Number', 'Quantity_Sold'],
                scheduleH1Register.map(r => [
                  r.date,
                  r.invoiceNumber || r.invoice_number,
                  r.patientName || r.patient_name,
                  r.patientAddress || r.patient_address,
                  r.doctorName || r.doctor_name,
                  r.doctorAddressReg || r.doctor_reg_no || '',
                  r.medicineName || r.medicine_name,
                  r.batchNumber || r.batch_number,
                  r.quantitySold || r.quantity_sold
                ])
              )}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-teal-400 text-xs font-medium rounded-xl flex items-center gap-1.5"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              Export Register
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Invoice #</th>
                  <th className="py-3 px-3">Patient</th>
                  <th className="py-3 px-3">Prescribing Doctor</th>
                  <th className="py-3 px-3">Medicine & Batch</th>
                  <th className="py-3 px-3">Quantity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {scheduleH1Register.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500 font-sans">
                      No Schedule H1 antibiotic or narcotic sales logged yet.
                    </td>
                  </tr>
                ) : (
                  scheduleH1Register.map((entry) => (
                    <tr key={entry.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-3 text-slate-400">{entry.date}</td>
                      <td className="py-3 px-3 text-teal-300 font-bold">{entry.invoiceNumber || entry.invoice_number}</td>
                      <td className="py-3 px-3 text-white font-sans">{entry.patientName || entry.patient_name}</td>
                      <td className="py-3 px-3 text-slate-300 font-sans">{entry.doctorName || entry.doctor_name}</td>
                      <td className="py-3 px-3 text-amber-300 font-sans">{entry.medicineName || entry.medicine_name} ({entry.batchNumber || entry.batch_number})</td>
                      <td className="py-3 px-3 font-bold text-white">{entry.quantitySold ?? entry.quantity_sold} Units</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
