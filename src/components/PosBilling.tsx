import React, { useState, useMemo } from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  Receipt,
  Search,
  UserPlus,
  Plus,
  Trash2,
  Printer,
  CreditCard,
  QrCode,
  IndianRupee,
  AlertCircle,
  ShieldAlert,
  UserCheck,
  Check,
  Sparkles,
  RefreshCw,
  ShoppingBag
} from 'lucide-react';
import { Medicine, BatchItem, Patient, BillItem, SaleInvoice } from '../types/pharmacy';

export const PosBilling: React.FC = () => {
  const {
    medicines,
    patients,
    addPatient,
    recordSaleInvoice,
    currentUser,
    setActiveInvoiceToPrint
  } = usePharma();

  // Patient Selection State
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [patientSearch, setPatientSearch] = useState<string>('');
  const [showPatientDropdown, setShowPatientDropdown] = useState<boolean>(false);
  const [walkInName, setWalkInName] = useState<string>('Walk-in Cash Customer');
  const [walkInPhone, setWalkInPhone] = useState<string>('');
  const [doctorName, setDoctorName] = useState<string>('Dr. Self / OTC');
  const [doctorRegNo, setDoctorRegNo] = useState<string>('');

  // Item Search State
  const [itemSearchQuery, setItemSearchQuery] = useState<string>('');
  const [showItemResults, setShowItemResults] = useState<boolean>(false);

  // Active Bill Items
  const [cartItems, setCartItems] = useState<BillItem[]>([]);
  const [overallDiscountPercent, setOverallDiscountPercent] = useState<number>(0);

  // Payment State
  const [paymentMode, setPaymentMode] = useState<SaleInvoice['paymentMode']>('UPI');
  const [cashTendered, setCashTendered] = useState<string>('');
  const [showQuickAddPatient, setShowQuickAddPatient] = useState<boolean>(false);
  const [newQuickPatient, setNewQuickPatient] = useState({
    name: '',
    phone: '',
    age: 35,
    gender: 'Male' as Patient['gender'],
    bloodGroup: 'B+' as Patient['bloodGroup'],
    address: '',
    knownAllergies: '',
    chronicConditions: '',
    creditLimit: 5000
  });

  // Selected Patient Details
  const activePatient = useMemo(() => {
    return patients.find((p) => p.id === selectedPatientId) || null;
  }, [patients, selectedPatientId]);

  // Matching Patients
  const filteredPatients = useMemo(() => {
    if (!patientSearch.trim()) return patients.slice(0, 5);
    const q = patientSearch.toLowerCase();
    return patients.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.phone.includes(q) ||
        p.uhid.toLowerCase().includes(q)
    );
  }, [patients, patientSearch]);

  // Matching Medicines for Item Search
  const matchingMedicines = useMemo(() => {
    if (!itemSearchQuery.trim()) return [];
    const q = itemSearchQuery.toLowerCase();
    return medicines
      .filter((m) => {
        const matchesBrand = m.brandName.toLowerCase().includes(q);
        const matchesSalt = m.genericComposition.toLowerCase().includes(q);
        const matchesBatch = m.batches.some((b) => b.batchNumber.toLowerCase().includes(q));
        const hasStock = m.batches.some((b) => !b.isDamaged && b.quantity > 0);
        return (matchesBrand || matchesSalt || matchesBatch) && hasStock;
      })
      .slice(0, 6);
  }, [medicines, itemSearchQuery]);

  // Add Item to Bill (Auto select FEFO earliest expiry batch)
  const handleAddItemToCart = (med: Medicine, selectedBatch?: BatchItem) => {
    // Select batch with stock, earliest expiry
    const validBatches = med.batches
      .filter((b) => !b.isDamaged && b.quantity > 0)
      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));

    const batch = selectedBatch || validBatches[0];
    if (!batch) {
      alert(`No active stock available for ${med.brandName}`);
      return;
    }

    // Check if already in cart
    const existingIndex = cartItems.findIndex(
      (item) => item.medicineId === med.id && item.batchNumber === batch.batchNumber
    );

    if (existingIndex !== -1) {
      const updated = [...cartItems];
      const item = updated[existingIndex];
      if (item.quantity + 1 > batch.quantity) {
        alert(`Cannot exceed available batch stock of ${batch.quantity}`);
        return;
      }
      item.quantity += 1;
      const baseAmt = item.quantity * item.rate;
      const disc = (baseAmt * item.discountPercent) / 100;
      item.amount = Number((baseAmt - disc).toFixed(2));
      setCartItems(updated);
    } else {
      const qty = 1;
      const discPercent = 5; // default 5% retail discount
      const baseAmt = qty * batch.saleRate;
      const disc = (baseAmt * discPercent) / 100;
      const netAmt = Number((baseAmt - disc).toFixed(2));

      const newItem: BillItem = {
        medicineId: med.id,
        brandName: med.brandName,
        batchNumber: batch.batchNumber,
        expiryDate: batch.expiryDate,
        hsnCode: med.hsnCode,
        quantity: qty,
        freeQuantity: 0,
        mrp: batch.mrp,
        rate: batch.saleRate,
        discountPercent: discPercent,
        gstPercent: med.gstPercent,
        amount: netAmt,
        schedule: med.schedule
      };

      setCartItems((prev) => [...prev, newItem]);
    }

    setItemSearchQuery('');
    setShowItemResults(false);
  };

  // Update Cart Item Quantity
  const handleUpdateQuantity = (index: number, newQty: number) => {
    const updated = [...cartItems];
    const item = updated[index];
    const med = medicines.find((m) => m.id === item.medicineId);
    const batch = med?.batches.find((b) => b.batchNumber === item.batchNumber);

    if (batch && newQty > batch.quantity) {
      alert(`Available batch stock is only ${batch.quantity} units`);
      return;
    }

    item.quantity = Math.max(1, newQty);
    const baseAmt = item.quantity * item.rate;
    const disc = (baseAmt * item.discountPercent) / 100;
    item.amount = Number((baseAmt - disc).toFixed(2));
    setCartItems(updated);
  };

  // Update Cart Item Discount
  const handleUpdateDiscount = (index: number, newDisc: number) => {
    const updated = [...cartItems];
    const item = updated[index];
    item.discountPercent = Math.min(100, Math.max(0, newDisc));
    const baseAmt = item.quantity * item.rate;
    const disc = (baseAmt * item.discountPercent) / 100;
    item.amount = Number((baseAmt - disc).toFixed(2));
    setCartItems(updated);
  };

  // Remove Item
  const handleRemoveItem = (index: number) => {
    setCartItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Check if cart contains Schedule H or H1 medicines
  const hasScheduleH1 = useMemo(() => {
    return cartItems.some((i) => i.schedule === 'Schedule H1');
  }, [cartItems]);

  const hasScheduleH = useMemo(() => {
    return cartItems.some((i) => i.schedule === 'Schedule H');
  }, [cartItems]);

  // Billing Totals Calculations
  const calculations = useMemo(() => {
    let subTotal = 0;
    let totalDiscount = 0;
    let totalGstAmount = 0;

    cartItems.forEach((item) => {
      const lineGross = item.quantity * item.rate;
      const lineDisc = (lineGross * item.discountPercent) / 100;
      const lineTaxable = lineGross - lineDisc;
      const lineTax = (lineTaxable * item.gstPercent) / 100;

      subTotal += lineGross;
      totalDiscount += lineDisc;
      totalGstAmount += lineTax;
    });

    // Bill-level extra discount if any
    const billLevelDiscount = (subTotal * overallDiscountPercent) / 100;
    const netDiscount = totalDiscount + billLevelDiscount;

    const rawTotal = subTotal - netDiscount + totalGstAmount;
    const grandTotal = Math.round(rawTotal);
    const roundOff = Number((grandTotal - rawTotal).toFixed(2));

    const cgstTotal = Number((totalGstAmount / 2).toFixed(2));
    const sgstTotal = Number((totalGstAmount / 2).toFixed(2));

    return {
      subTotal: Number(subTotal.toFixed(2)),
      totalDiscount: Number(netDiscount.toFixed(2)),
      cgstTotal,
      sgstTotal,
      roundOff,
      grandTotal
    };
  }, [cartItems, overallDiscountPercent]);

  // Change Return Calculation for Cash
  const cashAmountNum = parseFloat(cashTendered) || 0;
  const changeToReturn = cashAmountNum > calculations.grandTotal
    ? Number((cashAmountNum - calculations.grandTotal).toFixed(2))
    : 0;

  // Complete Sale & Print Bill
  const handleCompleteSale = () => {
    if (cartItems.length === 0) {
      alert('Add at least one medicine item to generate invoice.');
      return;
    }

    if (hasScheduleH1 && (!doctorName || doctorName.toLowerCase().includes('self'))) {
      alert('Schedule H1 drug detected! Doctor Name and Registration are mandatory under Drug Law.');
      return;
    }

    if (paymentMode === 'Credit (Khata)') {
      if (!activePatient) {
        alert('Credit billing is only allowed for registered patients with active Khata accounts.');
        return;
      }
      if (activePatient.creditBalance + calculations.grandTotal > activePatient.creditLimit) {
        alert(`Credit limit of ₹${activePatient.creditLimit} exceeded! Current balance: ₹${activePatient.creditBalance}`);
        return;
      }
    }

    const patientName = activePatient ? activePatient.name : walkInName;
    const patientPhone = activePatient ? activePatient.phone : walkInPhone;

    recordSaleInvoice({
      patientId: activePatient ? activePatient.id : undefined,
      patientName,
      patientPhone: patientPhone || '+91 90000 00000',
      doctorName: doctorName || 'Dr. Self / OTC',
      doctorRegNo: doctorRegNo || undefined,
      items: cartItems,
      subTotal: calculations.subTotal,
      totalDiscount: calculations.totalDiscount,
      cgstTotal: calculations.cgstTotal,
      sgstTotal: calculations.sgstTotal,
      grandTotal: calculations.grandTotal,
      roundOff: calculations.roundOff,
      paymentMode,
      cashReceived: paymentMode === 'Cash' ? cashAmountNum : undefined,
      changeReturned: paymentMode === 'Cash' ? changeToReturn : undefined
    });

    // Reset bill
    setCartItems([]);
    setCashTendered('');
  };

  // Quick Add Patient
  const handleSaveQuickPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuickPatient.name.trim() || !newQuickPatient.phone.trim()) return;

    const created = await addPatient({
      name: newQuickPatient.name,
      phone: newQuickPatient.phone,
      age: Number(newQuickPatient.age),
      gender: newQuickPatient.gender,
      bloodGroup: newQuickPatient.bloodGroup,
      address: newQuickPatient.address || 'Local Resident',
      knownAllergies: newQuickPatient.knownAllergies
        ? newQuickPatient.knownAllergies.split(',').map((s) => s.trim())
        : [],
      chronicConditions: newQuickPatient.chronicConditions
        ? newQuickPatient.chronicConditions.split(',').map((s) => s.trim())
        : [],
      creditBalance: 0,
      creditLimit: Number(newQuickPatient.creditLimit)
    });

    setSelectedPatientId(created.id);
    setShowQuickAddPatient(false);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Patient Info & Doctor Information */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* Patient Selection Box (6 cols) */}
        <div className="md:col-span-6 relative">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-semibold text-slate-300 uppercase flex items-center gap-1.5">
              <UserCheck className="w-3.5 h-3.5 text-teal-400" />
              Patient / Customer Details
            </label>
            <button
              onClick={() => setShowQuickAddPatient(true)}
              className="text-[11px] text-teal-400 hover:text-teal-300 flex items-center gap-1 cursor-pointer"
            >
              <UserPlus className="w-3 h-3" />
              <span>+ New Patient</span>
            </button>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={activePatient ? `${activePatient.name} (${activePatient.uhid})` : patientSearch}
                onChange={(e) => {
                  setSelectedPatientId('');
                  setPatientSearch(e.target.value);
                  setShowPatientDropdown(true);
                }}
                onFocus={() => setShowPatientDropdown(true)}
                placeholder="Search Patient: Name, Mobile, UHID..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500 font-medium"
              />
              {activePatient && (
                <button
                  onClick={() => {
                    setSelectedPatientId('');
                    setPatientSearch('');
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Patient Dropdown */}
          {showPatientDropdown && !activePatient && (
            <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-56 overflow-y-auto divide-y divide-slate-800 text-xs">
              <div
                onClick={() => {
                  setSelectedPatientId('');
                  setWalkInName('Walk-in Cash Customer');
                  setShowPatientDropdown(false);
                }}
                className="p-2.5 hover:bg-slate-800 cursor-pointer flex justify-between items-center text-slate-300"
              >
                <span>Walk-in Anonymous Cash Customer</span>
                <span className="text-[10px] text-slate-500">Default OTC</span>
              </div>

              {filteredPatients.map((p) => (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setShowPatientDropdown(false);
                  }}
                  className="p-2.5 hover:bg-slate-800 cursor-pointer text-slate-200"
                >
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-white">{p.name}</span>
                    <span className="text-[10px] text-teal-400 font-mono">{p.uhid}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between mt-0.5">
                    <span>{p.phone} • {p.age}y/{p.gender}</span>
                    {p.creditBalance > 0 && (
                      <span className="text-amber-400 font-medium font-mono">
                        Due: ₹{p.creditBalance.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {p.knownAllergies.length > 0 && (
                    <div className="text-[10px] text-rose-400 mt-0.5">
                      ⚠️ Allergy: {p.knownAllergies.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Active Patient Pill / Warning Badges */}
          {activePatient && (
            <div className="mt-2 p-2 rounded-lg bg-slate-950 border border-slate-800 flex flex-wrap items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-2">
                <span className="text-slate-300 font-medium">{activePatient.phone}</span>
                <span className="text-slate-500">|</span>
                <span className="text-slate-400">Khata Due:</span>
                <span className={`font-mono font-bold ${activePatient.creditBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  ₹{activePatient.creditBalance.toFixed(2)}
                </span>
              </div>
              {activePatient.knownAllergies.length > 0 && (
                <span className="bg-rose-950 text-rose-300 border border-rose-800 text-[10px] px-2 py-0.5 rounded font-medium">
                  Allergy: {activePatient.knownAllergies.join(', ')}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Doctor & Prescription Details (6 cols) */}
        <div className="md:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
              Prescribing Doctor
            </label>
            <input
              type="text"
              placeholder="Dr. Name (e.g. Dr. Amit Joshi)"
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div>
            <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
              Doctor Reg No (Mandatory for H1)
            </label>
            <input
              type="text"
              placeholder="e.g. MMC-66231"
              value={doctorRegNo}
              onChange={(e) => setDoctorRegNo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-teal-500"
            />
          </div>
        </div>
      </div>

      {/* Main Billing Grid: Item Search & Cart Items */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column (8 cols): Items Table & Fast Item Search */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
          <div>
            {/* Quick Medicine Search Input */}
            <div className="relative mb-3">
              <Search className="w-4 h-4 text-teal-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={itemSearchQuery}
                onChange={(e) => {
                  setItemSearchQuery(e.target.value);
                  setShowItemResults(true);
                }}
                onFocus={() => setShowItemResults(true)}
                placeholder="Scan Barcode or Search Medicine / Salt: 'Dolo', 'Augmentin', 'Telma'..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 font-medium"
              />

              {/* Medicine Instant Dropdown */}
              {showItemResults && matchingMedicines.length > 0 && (
                <div className="absolute left-0 right-0 mt-1 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 max-h-72 overflow-y-auto divide-y divide-slate-800 text-xs">
                  {matchingMedicines.map((med) => {
                    const validBatches = med.batches
                      .filter((b) => !b.isDamaged && b.quantity > 0)
                      .sort((a, b) => a.expiryDate.localeCompare(b.expiryDate));
                    const earliest = validBatches[0];
                    const totalUnits = validBatches.reduce((s, b) => s + b.quantity, 0);

                    return (
                      <div
                        key={med.id}
                        onClick={() => handleAddItemToCart(med, earliest)}
                        className="p-3 hover:bg-slate-800 cursor-pointer text-slate-200 transition"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-xs">{med.brandName}</span>
                            <span className="text-[10px] text-slate-400">({med.packSize})</span>
                            <span
                              className={`text-[9px] px-1 py-0.2 rounded border font-semibold ${
                                med.schedule === 'Schedule H1'
                                  ? 'bg-rose-950 text-rose-300 border-rose-700'
                                  : 'bg-slate-800 text-slate-300 border-slate-700'
                              }`}
                            >
                              {med.schedule}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-teal-400 text-xs">
                              ₹{earliest?.saleRate.toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 block">
                              MRP: ₹{earliest?.mrp.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                          <span className="text-cyan-300 font-mono">{med.genericComposition}</span>
                          <span className="font-mono text-emerald-400">
                            {totalUnits} In Stock (Batch: {earliest?.batchNumber} • Exp: {earliest?.expiryDate})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Cart Table (Marg Dense Billing Style) */}
            <div className="overflow-x-auto min-h-[220px]">
              <table className="w-full text-left text-xs text-slate-200">
                <thead className="bg-slate-950 text-slate-400 text-[11px] uppercase tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="py-2 px-2.5">Item & Formulation</th>
                    <th className="py-2 px-2.5">Batch / Exp</th>
                    <th className="py-2 px-2.5 text-center">Qty</th>
                    <th className="py-2 px-2.5 text-right">Rate (₹)</th>
                    <th className="py-2 px-2.5 text-center">Disc %</th>
                    <th className="py-2 px-2.5 text-center">GST %</th>
                    <th className="py-2 px-2.5 text-right">Net Amount</th>
                    <th className="py-2 px-2.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {cartItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-500">
                        <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                        <p className="text-xs font-medium">Cart is currently empty.</p>
                        <p className="text-[11px] text-slate-600">Scan barcode or type medicine name in the search bar above.</p>
                      </td>
                    </tr>
                  ) : (
                    cartItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40 transition">
                        {/* Brand & Schedule */}
                        <td className="py-2 px-2.5">
                          <div className="font-bold text-white text-xs">{item.brandName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">HSN: {item.hsnCode}</div>
                          {item.schedule === 'Schedule H1' && (
                            <span className="text-[9px] text-rose-400 font-semibold block">
                              Schedule H1 (Rx logged)
                            </span>
                          )}
                        </td>

                        {/* Batch & Expiry */}
                        <td className="py-2 px-2.5 font-mono text-[11px]">
                          <div className="text-teal-300 font-medium">{item.batchNumber}</div>
                          <div className="text-slate-400 text-[10px]">Exp: {item.expiryDate}</div>
                        </td>

                        {/* Qty Input */}
                        <td className="py-2 px-2.5 text-center">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => handleUpdateQuantity(idx, parseInt(e.target.value) || 1)}
                            className="w-14 bg-slate-950 border border-slate-700 rounded px-1.5 py-1 text-xs text-center text-white font-mono focus:outline-none focus:border-teal-500"
                          />
                        </td>

                        {/* Sale Rate */}
                        <td className="py-2 px-2.5 text-right font-mono text-slate-100">
                          ₹{item.rate.toFixed(2)}
                        </td>

                        {/* Discount % */}
                        <td className="py-2 px-2.5 text-center">
                          <input
                            type="number"
                            min={0}
                            max={100}
                            value={item.discountPercent}
                            onChange={(e) => handleUpdateDiscount(idx, parseFloat(e.target.value) || 0)}
                            className="w-12 bg-slate-950 border border-slate-700 rounded px-1 py-1 text-xs text-center text-white font-mono focus:outline-none focus:border-teal-500"
                          />
                        </td>

                        {/* GST % */}
                        <td className="py-2 px-2.5 text-center font-mono text-slate-400 text-[11px]">
                          {item.gstPercent}%
                        </td>

                        {/* Net Amount */}
                        <td className="py-2 px-2.5 text-right font-mono font-bold text-white">
                          ₹{item.amount.toFixed(2)}
                        </td>

                        {/* Delete line */}
                        <td className="py-2 px-2.5 text-center">
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-500 hover:text-rose-400 transition cursor-pointer"
                            title="Remove Item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cart Bottom Summary Bar */}
          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-3">
              <span>Items Count: <strong className="text-white">{cartItems.length}</strong></span>
              <span>•</span>
              <span>Total Units: <strong className="text-white">{cartItems.reduce((s, i) => s + i.quantity, 0)}</strong></span>
            </div>

            {hasScheduleH1 && (
              <div className="flex items-center gap-1.5 text-rose-400 font-medium text-xs bg-rose-950/60 border border-rose-800 px-2.5 py-1 rounded-lg">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Schedule H1 Drug Sold - Automatically recorded in Drug Register</span>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (4 cols): Settlement, Taxes & Payment */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4">
          
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <IndianRupee className="w-4 h-4 text-teal-400" />
                Payment & GST Settlement
              </h3>
              <span className="text-[10px] text-slate-400 uppercase font-mono">GSTR-1 Ready</span>
            </div>

            {/* Calculations Breakdown */}
            <div className="mt-3 space-y-2 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Subtotal Gross:</span>
                <span className="font-mono text-slate-200">₹{calculations.subTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Discounts:</span>
                <span className="font-mono text-emerald-400 font-semibold">
                  -₹{calculations.totalDiscount.toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-800/60">
                <span>Central GST (CGST):</span>
                <span className="font-mono">₹{calculations.cgstTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>State GST (SGST):</span>
                <span className="font-mono">₹{calculations.sgstTotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>Round Off:</span>
                <span className="font-mono">{calculations.roundOff > 0 ? `+${calculations.roundOff}` : calculations.roundOff}</span>
              </div>

              {/* Grand Total */}
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-sm font-bold text-white uppercase tracking-wider">
                  Net Payable:
                </span>
                <span className="text-2xl font-bold font-mono text-teal-400">
                  ₹{calculations.grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Mode Selection */}
            <div className="mt-4 pt-3 border-t border-slate-800">
              <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1.5">
                Select Tender Mode
              </label>

              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {(['UPI', 'Cash', 'Card', 'Credit (Khata)'] as SaleInvoice['paymentMode'][]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMode(mode)}
                    className={`py-2 px-2.5 rounded-lg border font-medium transition cursor-pointer text-center ${
                      paymentMode === mode
                        ? 'bg-teal-600 border-teal-500 text-white font-semibold shadow-sm'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>

              {/* Cash Tender Details */}
              {paymentMode === 'Cash' && (
                <div className="mt-3 p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Cash Received:</span>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={cashTendered}
                      onChange={(e) => setCashTendered(e.target.value)}
                      className="w-24 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-right font-mono text-white focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  {changeToReturn > 0 && (
                    <div className="flex items-center justify-between text-emerald-400 font-semibold pt-1 border-t border-slate-800">
                      <span>Change to Return:</span>
                      <span className="font-mono text-sm">₹{changeToReturn.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              )}

              {/* UPI QR Display Simulator */}
              {paymentMode === 'UPI' && (
                <div className="mt-3 p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-xs flex items-center gap-3">
                  <div className="w-12 h-12 bg-white p-1 rounded border border-slate-300 shrink-0 flex items-center justify-center">
                    <QrCode className="w-10 h-10 text-slate-900" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-200">Dynamic Bharat QR Active</div>
                    <div className="text-[10px] text-slate-400">UPI ID: shaktipharma@icici</div>
                  </div>
                </div>
              )}

              {/* Khata Credit Info */}
              {paymentMode === 'Credit (Khata)' && (
                <div className="mt-3 p-2.5 bg-amber-950/40 rounded-lg border border-amber-800/80 text-xs text-amber-200">
                  <div className="font-semibold">Khata Credit Transaction</div>
                  <div className="text-[11px] mt-0.5">
                    {activePatient
                      ? `Will add ₹${calculations.grandTotal.toFixed(2)} to ${activePatient.name}'s balance.`
                      : '⚠️ Please select a registered patient above to allow credit sale.'}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Primary Action Button: Settle & Print Bill */}
          <button
            onClick={handleCompleteSale}
            disabled={cartItems.length === 0}
            className={`w-full py-3 px-4 rounded-xl text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer ${
              cartItems.length === 0
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                : 'bg-teal-600 hover:bg-teal-500 active:bg-teal-700 shadow-teal-950'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>Generate & Print Tax Bill (F6)</span>
          </button>
        </div>
      </div>

      {/* QUICK ADD PATIENT MODAL */}
      {showQuickAddPatient && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 text-xs text-slate-200 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-teal-400" />
                Quick Register Patient
              </h3>
              <button
                onClick={() => setShowQuickAddPatient(false)}
                className="text-slate-400 hover:text-white text-base cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveQuickPatient} className="space-y-3 mt-4">
              <div>
                <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Rathi"
                  value={newQuickPatient.name}
                  onChange={(e) =>
                    setNewQuickPatient({ ...newQuickPatient, name: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={newQuickPatient.phone}
                    onChange={(e) =>
                      setNewQuickPatient({ ...newQuickPatient, phone: e.target.value })
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                    Age & Gender
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      value={newQuickPatient.age}
                      onChange={(e) =>
                        setNewQuickPatient({ ...newQuickPatient, age: Number(e.target.value) })
                      }
                      className="w-16 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    />
                    <select
                      value={newQuickPatient.gender}
                      onChange={(e) =>
                        setNewQuickPatient({
                          ...newQuickPatient,
                          gender: e.target.value as Patient['gender']
                        })
                      }
                      className="flex-1 bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                    >
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                  Drug Allergies (Crucial for Patient Safety)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Penicillin, Sulfa drugs"
                  value={newQuickPatient.knownAllergies}
                  onChange={(e) =>
                    setNewQuickPatient({ ...newQuickPatient, knownAllergies: e.target.value })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-rose-300"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-300 uppercase block font-semibold mb-1">
                  Credit Limit (Khata) (₹)
                </label>
                <input
                  type="number"
                  value={newQuickPatient.creditLimit}
                  onChange={(e) =>
                    setNewQuickPatient({
                      ...newQuickPatient,
                      creditLimit: Number(e.target.value)
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white font-mono"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowQuickAddPatient(false)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-500 text-white font-semibold rounded-lg cursor-pointer shadow"
                >
                  Register & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
