import React, { useState, useMemo } from 'react';
import { usePharma } from '../context/PharmaContext';
import { CustomerReturn, SaleInvoice } from '../types/pharmacy';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  User,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck,
  Building,
  Plus
} from 'lucide-react';

export const CustomerReturns: React.FC = () => {
  const {
    invoices,
    customerReturns,
    recordCustomerReturn,
    hasPermission,
    addToast
  } = usePharma();

  const [searchInvoiceNumber, setSearchInvoiceNumber] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<SaleInvoice | null>(null);
  const [returnItemsState, setReturnItemsState] = useState<Record<string, {
    quantity: number;
    unitSold: 'PACK' | 'BASE';
    isResalable: boolean;
    reason: string;
  }>>({});
  const [refundMode, setRefundMode] = useState<'CASH' | 'CREDIT_BALANCE'>('CASH');
  const [returnNotes, setReturnNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Search invoice
  const handleSearchInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInvoiceNumber.trim().toUpperCase();
    if (!query) return;

    const found = invoices.find(inv =>
      (inv.invoiceNumber || inv.invoice_number || '').toUpperCase() === query
    );

    if (found) {
      setSelectedInvoice(found);
      // Initialize return state for items
      const initial: Record<string, any> = {};
      found.items.forEach((item, idx) => {
        initial[`${item.batchNumber}-${idx}`] = {
          quantity: 0,
          unitSold: item.unitSold || 'PACK',
          isResalable: true,
          reason: 'Customer requested return (unopened)'
        };
      });
      setReturnItemsState(initial);
    } else {
      addToast('Invoice Not Found', `No sale invoice found matching "${query}".`, 'error');
      setSelectedInvoice(null);
    }
  };

  const handleReturnItemChange = (key: string, field: string, value: any) => {
    setReturnItemsState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }));
  };

  // Compute calculated refund amount
  const computedRefundTotal = useMemo(() => {
    if (!selectedInvoice) return 0;
    let total = 0;
    selectedInvoice.items.forEach((item, idx) => {
      const state = returnItemsState[`${item.batchNumber}-${idx}`];
      if (state && state.quantity > 0) {
        const itemRate = item.rate || (item.amount / (item.quantity || 1));
        total += itemRate * state.quantity;
      }
    });
    return total;
  }, [selectedInvoice, returnItemsState]);

  const handleSubmitReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!hasPermission('canCreateSalesReturn')) {
      addToast('Permission Denied', 'Your user role cannot process customer returns.', 'error');
      return;
    }
    if (!selectedInvoice) return;

    // Collect items with quantity > 0
    const itemsToReturn: any[] = [];
    selectedInvoice.items.forEach((item, idx) => {
      const state = returnItemsState[`${item.batchNumber}-${idx}`];
      if (state && state.quantity > 0) {
        itemsToReturn.push({
          batchId: item.batchId || '',
          medicineId: item.medicineId,
          batchNumber: item.batchNumber,
          quantity: state.quantity,
          unitSold: state.unitSold,
          isResalable: state.isResalable,
          reason: state.reason
        });
      }
    });

    if (itemsToReturn.length === 0) {
      addToast('No Items Selected', 'Please enter a return quantity (> 0) for at least one item.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await recordCustomerReturn({
        saleId: selectedInvoice.id,
        refundMode,
        notes: returnNotes,
        items: itemsToReturn
      });

      addToast('Return Processed', `Customer return successfully posted with ₹${computedRefundTotal.toFixed(2)} refund.`, 'success');
      setSelectedInvoice(null);
      setSearchInvoiceNumber('');
    } catch (err: any) {
      addToast('Return Failed', err.message || 'Error processing sales return', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <RotateCcw className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Customer Sales Returns</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Batch Traceable
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Process customer returns linked directly to original sales invoices. Resalable stock restores batch inventory; damaged stock routes to quarantine.
            </p>
          </div>
        </div>
      </div>

      {/* Invoice Lookup Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <Receipt className="w-4 h-4 text-teal-400" />
          Lookup Original Sales Invoice
        </h2>
        <form onSubmit={handleSearchInvoice} className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchInvoiceNumber}
              onChange={(e) => setSearchInvoiceNumber(e.target.value)}
              placeholder="Enter exact Invoice Number (e.g. INV-2026-0001)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-teal-500 uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold rounded-xl shadow-lg shadow-teal-500/20 transition-all flex items-center gap-1.5"
          >
            Find Invoice
          </button>
        </form>

        {/* Selected Invoice Details */}
        {selectedInvoice && (
          <form onSubmit={handleSubmitReturn} className="mt-6 pt-6 border-t border-slate-800 space-y-6">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <span className="text-xs text-slate-400">Invoice Number: </span>
                <span className="text-sm font-mono font-bold text-teal-300">
                  {selectedInvoice.invoiceNumber || selectedInvoice.invoice_number}
                </span>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  <span>{selectedInvoice.patientName || selectedInvoice.patient_name || 'Walk-in Customer'}</span>
                  <span>•</span>
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{selectedInvoice.date}</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400">Original Total: </span>
                <span className="text-sm font-bold text-white">
                  ₹{(selectedInvoice.grandTotal ?? selectedInvoice.grand_total ?? 0).toFixed(2)}
                </span>
                <div className="text-xs text-teal-400 mt-0.5">
                  Mode: {selectedInvoice.paymentMode || selectedInvoice.payment_mode}
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="space-y-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Items to Return & Quality Classification
              </h3>
              <div className="overflow-x-auto border border-slate-800 rounded-xl">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-3 px-3">Medicine & Salt</th>
                      <th className="py-3 px-3">Batch #</th>
                      <th className="py-3 px-3">Sold Qty</th>
                      <th className="py-3 px-3">Return Qty</th>
                      <th className="py-3 px-3">Condition (Resalable?)</th>
                      <th className="py-3 px-3">Return Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {selectedInvoice.items.map((item, idx) => {
                      const key = `${item.batchNumber}-${idx}`;
                      const state = returnItemsState[key] || {
                        quantity: 0,
                        unitSold: item.unitSold || 'PACK',
                        isResalable: true,
                        reason: 'Customer return'
                      };

                      return (
                        <tr key={key} className="bg-slate-900/40">
                          <td className="p-3">
                            <div className="font-semibold text-white">{item.brandName}</div>
                            <div className="text-[11px] text-slate-400">{item.genericComposition}</div>
                          </td>
                          <td className="p-3 font-mono text-teal-300">
                            {item.batchNumber}
                          </td>
                          <td className="p-3">
                            {item.quantity} {item.unitSold === 'PACK' ? 'Packs' : 'Units'}
                          </td>
                          <td className="p-3 min-w-[100px]">
                            <input
                              type="number"
                              min="0"
                              max={item.quantity}
                              value={state.quantity}
                              onChange={(e) => handleReturnItemChange(key, 'quantity', parseInt(e.target.value, 10) || 0)}
                              className="w-20 p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:outline-none focus:border-teal-500"
                            />
                          </td>
                          <td className="p-3 min-w-[160px]">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={state.isResalable}
                                onChange={(e) => handleReturnItemChange(key, 'isResalable', e.target.checked)}
                                className="w-4 h-4 rounded text-teal-500 bg-slate-950 border-slate-800 focus:ring-teal-500"
                              />
                              <span className={`text-xs ${state.isResalable ? 'text-emerald-400 font-medium' : 'text-rose-400'}`}>
                                {state.isResalable ? 'Resalable (Restock)' : 'Damaged (Quarantine)'}
                              </span>
                            </label>
                          </td>
                          <td className="p-3 min-w-[180px]">
                            <input
                              type="text"
                              value={state.reason}
                              onChange={(e) => handleReturnItemChange(key, 'reason', e.target.value)}
                              placeholder="Reason for return..."
                              className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-lg text-white text-xs focus:outline-none focus:border-teal-500"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Refund Mode & Totals */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800">
              <div className="space-y-3">
                <label className="block text-xs font-medium text-slate-300">
                  Refund Method
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="refundMode"
                      value="CASH"
                      checked={refundMode === 'CASH'}
                      onChange={() => setRefundMode('CASH')}
                      className="text-teal-500 focus:ring-teal-500"
                    />
                    Cash Refund
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                    <input
                      type="radio"
                      name="refundMode"
                      value="CREDIT_BALANCE"
                      checked={refundMode === 'CREDIT_BALANCE'}
                      onChange={() => setRefundMode('CREDIT_BALANCE')}
                      className="text-teal-500 focus:ring-teal-500"
                    />
                    Patient Khata / Store Credit
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Return Notes
                  </label>
                  <input
                    type="text"
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                    placeholder="e.g. Returned unopened within 7 days with valid receipt"
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="text-xs text-slate-400">Total Refund Payable:</div>
                  <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
                    ₹{computedRefundTotal.toFixed(2)}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setSelectedInvoice(null)}
                    className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || computedRefundTotal <= 0}
                    className="px-5 py-2.5 text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-teal-500/20 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Posting...' : 'Confirm Return & Issue Refund'}
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>

      {/* Historical Customer Returns */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-semibold text-white flex items-center gap-2">
          <RotateCcw className="w-4 h-4 text-teal-400" />
          Recent Customer Returns Log ({customerReturns.length})
        </h2>

        {customerReturns.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-500">
            No customer returns recorded yet.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-800 rounded-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="py-3 px-3">Return #</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Items Returned</th>
                  <th className="py-3 px-3">Total Refund</th>
                  <th className="py-3 px-3">Refund Mode</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {customerReturns.map(ret => (
                  <tr key={ret.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono font-bold text-teal-300">
                      {ret.returnNumber || ret.return_number}
                    </td>
                    <td className="p-3">{ret.returnDate || ret.return_date}</td>
                    <td className="p-3">{ret.patientName || ret.patient_name || 'Walk-in'}</td>
                    <td className="p-3">
                      {ret.items?.length || 0} item(s)
                    </td>
                    <td className="p-3 font-mono font-bold text-emerald-400">
                      ₹{(ret.totalRefund ?? ret.total_refund ?? 0).toFixed(2)}
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">
                        {ret.refundMode || ret.refund_mode}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
