import React from 'react';
import { usePharma } from '../context/PharmaContext';
import { Printer, Download, X, Building2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { SaleInvoice } from '../types/pharmacy';

export const InvoiceModal: React.FC = () => {
  const {
    activeInvoiceToPrint,
    setActiveInvoiceToPrint,
    drugLicenseNo,
    gstinNo
  } = usePharma();

  if (!activeInvoiceToPrint) return null;

  const inv = activeInvoiceToPrint;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col my-auto max-h-[95vh]">
        {/* Modal Controls Bar (Hidden during print) */}
        <div className="no-print bg-slate-950 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Tax Invoice Preview: {inv.invoiceNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Tax Invoice</span>
            </button>
            <button
              onClick={() => setActiveInvoiceToPrint(null)}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area (Uses #printable-invoice for print CSS) */}
        <div className="p-6 overflow-y-auto bg-white text-slate-950 text-xs font-sans" id="printable-invoice">
          
          {/* Pharmacy Header */}
          <div className="border-b-2 border-slate-900 pb-3">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black tracking-tight text-slate-950 uppercase">
                  SHAKTI MEDICOS & HEALTHCARE
                </h1>
                <p className="text-[11px] text-slate-700 font-medium">
                  Retail & Wholesale Chemists • 24x7 Emergency Dispensary
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">
                  Shop 12-14, Ground Floor, Shaktikunj Healthcare Complex, Near Civil Hospital Road, Mumbai - 400069
                </p>
                <p className="text-[10px] text-slate-600">
                  Tel: +91 22 2841 9900 / +91 98201 44521 • Email: billing@shaktipharma.in
                </p>
              </div>

              <div className="text-right border border-slate-900 p-2 rounded text-[10px] space-y-0.5 bg-slate-50 font-mono">
                <div className="font-bold text-slate-900 uppercase">RETAIL TAX INVOICE</div>
                <div>DL No: <strong className="font-bold">{drugLicenseNo}</strong></div>
                <div>GSTIN: <strong className="font-bold">{gstinNo}</strong></div>
                <div>State Code: <strong>27 (Maharashtra)</strong></div>
              </div>
            </div>
          </div>

          {/* Invoice & Patient Meta Information */}
          <div className="grid grid-cols-2 gap-4 py-3 border-b border-slate-300 text-[11px]">
            <div>
              <div className="text-slate-500 uppercase text-[9px] font-bold">Patient / Buyer Details:</div>
              <div className="font-bold text-slate-950 text-xs">{inv.patientName}</div>
              <div className="text-slate-700">Phone: {inv.patientPhone || 'Walk-in'}</div>
              <div className="text-slate-700">Prescribing Doctor: <strong>{inv.doctorName}</strong></div>
              {inv.doctorRegNo && (
                <div className="text-slate-600 text-[10px] font-mono">Doctor Reg: {inv.doctorRegNo}</div>
              )}
            </div>

            <div className="text-right space-y-0.5">
              <div className="text-slate-500 uppercase text-[9px] font-bold">Invoice Details:</div>
              <div>Invoice No: <strong className="font-mono text-slate-950 text-xs">{inv.invoiceNumber}</strong></div>
              <div>Date: <strong className="font-mono">{inv.date}</strong> | Time: <strong className="font-mono">{inv.time}</strong></div>
              <div>Tender Mode: <strong className="uppercase">{inv.paymentMode}</strong> ({inv.paymentStatus})</div>
              <div>Dispensed By: <span className="font-medium">{inv.billedBy}</span></div>
            </div>
          </div>

          {/* Items Table */}
          <table className="w-full text-left text-[11px] my-3 border border-slate-300">
            <thead className="bg-slate-100 text-slate-800 uppercase text-[9px] border-b border-slate-300 font-bold">
              <tr>
                <th className="py-1.5 px-2">#</th>
                <th className="py-1.5 px-2">Description / Formulation</th>
                <th className="py-1.5 px-2">Batch</th>
                <th className="py-1.5 px-2">Exp</th>
                <th className="py-1.5 px-2">HSN</th>
                <th className="py-1.5 px-2 text-center">Qty</th>
                <th className="py-1.5 px-2 text-right">MRP (₹)</th>
                <th className="py-1.5 px-2 text-right">Rate (₹)</th>
                <th className="py-1.5 px-2 text-center">Disc %</th>
                <th className="py-1.5 px-2 text-center">GST %</th>
                <th className="py-1.5 px-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {inv.items.map((item, idx) => (
                <tr key={idx}>
                  <td className="py-1.5 px-2 font-mono text-[10px]">{idx + 1}</td>
                  <td className="py-1.5 px-2">
                    <span className="font-bold text-slate-950">{item.brandName}</span>
                    {item.schedule === 'Schedule H1' && (
                      <span className="ml-1 text-[8px] bg-red-100 text-red-800 font-bold px-1 rounded">
                        H1
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 px-2 font-mono text-[10px]">{item.batchNumber}</td>
                  <td className="py-1.5 px-2 font-mono text-[10px]">{item.expiryDate}</td>
                  <td className="py-1.5 px-2 font-mono text-[10px]">{item.hsnCode}</td>
                  <td className="py-1.5 px-2 text-center font-bold">{item.quantity}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{item.mrp.toFixed(2)}</td>
                  <td className="py-1.5 px-2 text-right font-mono">{item.rate.toFixed(2)}</td>
                  <td className="py-1.5 px-2 text-center font-mono">{item.discountPercent}%</td>
                  <td className="py-1.5 px-2 text-center font-mono">{item.gstPercent}%</td>
                  <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-950">
                    {item.amount.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals & Tax Calculation Breakdown */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-300">
            {/* Statutory Terms & Compliance Notice */}
            <div className="text-[9px] text-slate-600 space-y-1">
              <div className="font-bold text-slate-800 uppercase">Statutory Compliance Note:</div>
              <p>• Schedule H & H1 drugs are dispensed strictly in compliance with Section 65 of the Drugs and Cosmetics Rules 1945 against valid doctor prescription.</p>
              <p>• Goods once sold will not be taken back without original cash memo within 7 days. Cold storage items are non-returnable.</p>
              <p>• All prices conform to DPCO (Drug Price Control Order) ceiling limits.</p>
            </div>

            {/* Calculations Box */}
            <div className="text-[11px] space-y-1 text-right">
              <div className="flex justify-between">
                <span className="text-slate-600">Subtotal Gross:</span>
                <span className="font-mono">₹{inv.subTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-emerald-700">
                <span>Special Discount:</span>
                <span className="font-mono">-₹{inv.totalDiscount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>CGST (Central Tax):</span>
                <span className="font-mono">₹{inv.cgstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>SGST (State Tax):</span>
                <span className="font-mono">₹{inv.sgstTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Round Off:</span>
                <span className="font-mono">{inv.roundOff}</span>
              </div>
              <div className="flex justify-between pt-1 border-t-2 border-slate-900 text-sm font-black text-slate-950">
                <span>TOTAL AMOUNT PAYABLE:</span>
                <span className="font-mono text-base">₹{inv.grandTotal.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Signatures */}
          <div className="mt-8 pt-4 border-t border-slate-300 grid grid-cols-2 text-center text-[10px] text-slate-700">
            <div>
              <div className="h-6"></div>
              <div className="border-t border-slate-400 mx-8 pt-1">Customer / Patient Signature</div>
            </div>
            <div>
              <div className="font-medium text-slate-900 font-mono text-[9px]">MH-PC-44192 (Registered Chemist)</div>
              <div className="border-t border-slate-400 mx-8 pt-1 font-bold text-slate-900">
                For SHAKTI MEDICOS & HEALTHCARE (Auth Signatory)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
