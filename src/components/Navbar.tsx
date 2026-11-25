import React, { useState, useEffect } from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  Building2,
  Clock,
  Search,
  Bell,
  AlertTriangle,
  UserCheck,
  LogOut,
  ChevronDown,
  PlusCircle,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { UserSession } from '../types/pharmacy';

export const Navbar: React.FC = () => {
  const {
    currentUser,
    switchRole,
    logout,
    financialYear,
    drugLicenseNo,
    gstinNo,
    medicines,
    patients,
    setActiveTab,
    globalSearch,
    setGlobalSearch
  } = usePharma();

  const [currentTime, setCurrentTime] = useState<string>('');
  const [showRoleMenu, setShowRoleMenu] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        }) + ' | ' +
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Compute Near Expiry (<60 days) and Low Stock counts
  const today = new Date();
  const sixtyDaysAhead = new Date();
  sixtyDaysAhead.setDate(today.getDate() + 60);

  const nearExpiryBatches = medicines.flatMap((m) =>
    m.batches.filter((b) => {
      if (!b.expiryDate) return false;
      const [year, month] = b.expiryDate.split('-').map(Number);
      const expDate = new Date(year, month - 1, 28);
      return expDate <= sixtyDaysAhead && b.quantity > 0;
    }).map((b) => ({ medicineName: m.brandName, ...b }))
  );

  const lowStockItems = medicines.filter((m) => {
    const totalQty = m.batches.reduce((sum, b) => sum + (b.isDamaged ? 0 : b.quantity), 0);
    const minReorder = Math.min(...m.batches.map((b) => b.reorderLevel), 20);
    return totalQty <= minReorder;
  });

  // Chronic refills due in next 5 days
  const pendingRefills = patients.flatMap((p) =>
    p.prescriptions.flatMap((rx) =>
      rx.nextRefillDate
        ? [{ patient: p, rxDate: rx.nextRefillDate, doc: rx.doctorName }]
        : []
    )
  );

  const roles: UserSession['role'][] = [
    'owner_admin',
    'pharmacist',
    'cashier',
    'auditor'
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 select-none sticky top-0 z-40">
      {/* Top Statutory Banner */}
      <div className="bg-slate-950 text-slate-400 text-xs px-4 py-1.5 flex flex-wrap items-center justify-between border-b border-slate-800/80 gap-2">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-teal-400 font-semibold tracking-wide">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            SHAKTI PHARMA ERP
          </span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">DL: <span className="font-mono text-slate-200">{drugLicenseNo}</span></span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-300">GSTIN: <span className="font-mono text-slate-200">{gstinNo}</span></span>
          <span className="text-slate-500 hidden md:inline">|</span>
          <span className="text-slate-300 hidden md:inline">FY: <span className="text-amber-400 font-semibold">{financialYear}</span></span>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-slate-300 font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-teal-400" />
            {currentTime}
          </div>
          <div className="text-xs px-2 py-0.5 rounded bg-emerald-950 border border-emerald-700/60 text-emerald-300 font-medium">
            FEFO Active
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="px-4 py-2.5 flex items-center justify-between gap-4">
        {/* Brand Logo & Store Name */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600 to-cyan-700 flex items-center justify-center shadow-md shadow-teal-900/40 border border-teal-400/30">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-white tracking-tight leading-none">
                Shakti Medicos & Healthcare
              </h1>
              <span className="bg-teal-500/20 text-teal-300 text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border border-teal-500/30">
                Marg v9+ Engine
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Wholesale & Retail Pharmacy Management System
            </p>
          </div>
        </div>

        {/* Global Quick Search (Brand Name / Salt / Patient Phone / HSN) */}
        <div className="flex-1 max-w-md hidden lg:block">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={globalSearch}
              onChange={(e) => setGlobalSearch(e.target.value)}
              placeholder="Fast search: Paracetamol, Dolo 650, Batch No, Phone, HSN..."
              className="w-full bg-slate-800/90 border border-slate-700 rounded-lg pl-9 pr-12 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-colors"
            />
            <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded font-mono">
              /
            </span>
          </div>
        </div>

        {/* Right Action Tools */}
        <div className="flex items-center gap-2.5">
          {/* Quick POS Billing button [F2] */}
          <button
            onClick={() => setActiveTab('billing')}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-500 active:bg-teal-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-sm shadow-teal-900/30 transition cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Counter Bill</span>
            <kbd className="hidden sm:inline bg-teal-800 text-teal-200 text-[10px] px-1.5 py-0.2 rounded font-mono">
              F2
            </kbd>
          </button>

          {/* Near Expiry / Alert Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
              title="Pharma Alerts & Expiry Alarms"
            >
              <Bell className="w-4 h-4" />
              {(nearExpiryBatches.length > 0 || lowStockItems.length > 0) && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-950 font-bold text-[9px] rounded-full flex items-center justify-center animate-bounce">
                  {nearExpiryBatches.length + lowStockItems.length}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 text-xs overflow-hidden">
                <div className="p-3 bg-slate-900 border-b border-slate-700 flex justify-between items-center">
                  <span className="font-semibold text-slate-100 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                    Regulatory & Stock Alerts
                  </span>
                  <span className="text-[10px] text-slate-400">FEFO Monitoring</span>
                </div>

                <div className="max-h-72 overflow-y-auto divide-y divide-slate-700/60">
                  {nearExpiryBatches.length > 0 && (
                    <div className="p-2.5 bg-amber-950/20">
                      <div className="text-[11px] font-semibold text-amber-400 flex items-center justify-between mb-1.5">
                        <span>Expiring Within 60 Days ({nearExpiryBatches.length})</span>
                        <button
                          onClick={() => {
                            setActiveTab('expiry');
                            setShowNotifications(false);
                          }}
                          className="text-[10px] text-teal-400 hover:underline"
                        >
                          Dump Return →
                        </button>
                      </div>
                      {nearExpiryBatches.slice(0, 3).map((b, idx) => (
                        <div key={idx} className="text-slate-300 py-1 flex justify-between">
                          <span className="truncate max-w-[170px]">{b.medicineName}</span>
                          <span className="text-amber-300 font-mono">Exp: {b.expiryDate}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {lowStockItems.length > 0 && (
                    <div className="p-2.5 bg-rose-950/20">
                      <div className="text-[11px] font-semibold text-rose-400 flex items-center justify-between mb-1.5">
                        <span>Stock Reorder Required ({lowStockItems.length})</span>
                        <button
                          onClick={() => {
                            setActiveTab('inventory');
                            setShowNotifications(false);
                          }}
                          className="text-[10px] text-teal-400 hover:underline"
                        >
                          View Master →
                        </button>
                      </div>
                      {lowStockItems.slice(0, 3).map((item) => (
                        <div key={item.id} className="text-slate-300 py-1 flex justify-between">
                          <span className="truncate max-w-[170px]">{item.brandName}</span>
                          <span className="text-rose-400 font-medium">
                            {item.batches.reduce((acc, b) => acc + b.quantity, 0)} left
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {pendingRefills.length > 0 && (
                    <div className="p-2.5 bg-cyan-950/20">
                      <div className="text-[11px] font-semibold text-cyan-400 flex items-center justify-between mb-1.5">
                        <span>Chronic Refills Due ({pendingRefills.length})</span>
                        <button
                          onClick={() => {
                            setActiveTab('patients');
                            setShowNotifications(false);
                          }}
                          className="text-[10px] text-cyan-400 hover:underline"
                        >
                          Remind →
                        </button>
                      </div>
                      {pendingRefills.slice(0, 2).map((item, idx) => (
                        <div key={idx} className="text-slate-300 py-1 flex justify-between">
                          <span className="truncate max-w-[170px]">{item.patient.name}</span>
                          <span className="text-cyan-300 font-mono">Due: {item.rxDate}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {nearExpiryBatches.length === 0 && lowStockItems.length === 0 && (
                    <div className="p-4 text-center text-slate-400">
                      All inventory and compliance records in optimal status.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Session Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700/80 px-2.5 py-1.5 rounded-lg border border-slate-700 transition cursor-pointer text-left"
            >
              <div className="w-7 h-7 rounded-md bg-teal-600/30 text-teal-300 border border-teal-500/40 font-bold text-xs flex items-center justify-center">
                {currentUser?.avatarInitials || 'PH'}
              </div>
              <div className="hidden md:block leading-tight">
                <div className="text-xs font-medium text-slate-200 truncate max-w-[130px]">
                  {currentUser?.name || 'Pharmacist'}
                </div>
                <div className="text-[10px] text-teal-400 font-normal">
                  {currentUser?.role || 'Guest'}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Role Switcher Menu */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl z-50 text-xs overflow-hidden">
                <div className="p-3 bg-slate-900 border-b border-slate-700">
                  <div className="text-slate-400 text-[10px] uppercase font-semibold">Active Session Profile</div>
                  <div className="font-medium text-slate-100 mt-0.5">{currentUser?.name}</div>
                  {currentUser?.pharmacistRegNo && (
                    <div className="text-teal-400 text-[10px] font-mono mt-0.5">
                      Reg: {currentUser.pharmacistRegNo}
                    </div>
                  )}
                </div>

                <div className="p-2 border-b border-slate-700/60">
                  <div className="text-[10px] text-slate-400 px-2 py-1 uppercase font-semibold">
                    Switch Operational Role
                  </div>
                  {roles.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        switchRole(r);
                        setShowRoleMenu(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition cursor-pointer ${
                        currentUser?.role === r
                          ? 'bg-teal-900/40 text-teal-300 font-semibold border border-teal-700/40'
                          : 'text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      <span>{r}</span>
                      {currentUser?.role === r && <UserCheck className="w-3.5 h-3.5 text-teal-400" />}
                    </button>
                  ))}
                </div>

                <div className="p-1.5 bg-slate-900">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      logout();
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-md text-rose-400 hover:bg-rose-950/40 flex items-center gap-2 cursor-pointer transition"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Lock Session & Log Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
