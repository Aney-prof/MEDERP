import React, { useState } from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  Building2,
  Lock,
  User,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  KeyRound,
  ArrowRight,
  Server,
  FileText
} from 'lucide-react';
import { UserRole } from '../types/pharmacy';

export const LoginPage: React.FC = () => {
  const { login, drugLicenseNo, gstinNo } = usePharma();

  const [username, setUsername] = useState<string>('pharmacist@shaktipharma.in');
  const [password, setPassword] = useState<string>('••••••••');
  const [selectedRole, setSelectedRole] = useState<UserRole>('pharmacist');
  const [selectedBranch, setSelectedBranch] = useState<string>('Branch 01 - Main Dispensary (24x7 OPD)');
  const [financialYear, setFinancialYear] = useState<string>('2026 - 2027');
  const [rememberMe, setRememberMe] = useState<boolean>(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole);
  };

  const presetRoles: { role: UserRole; label: string; desc: string; icon: string }[] = [
    {
      role: 'pharmacist',
      label: 'Chief Pharmacist',
      desc: 'Full POS Billing, FEFO Batches, Salt Generic Finder & Patient Records',
      icon: '💊'
    },
    {
      role: 'owner_admin',
      label: 'Store Manager / Admin',
      desc: 'Stock Reordering, Purchase Bills, Profit Margins, GSTR-1, & User Control',
      icon: '🏢'
    },
    {
      role: 'cashier',
      label: 'Billing Counter Clerk',
      desc: 'High-speed Counter Cash/UPI Billing, Instant Receipts & Khata Collection',
      icon: '🧾'
    },
    {
      role: 'auditor',
      label: 'Regulatory Auditor',
      desc: 'Schedule H / H1 Register Inspection, Expiry Dump Audit & License Verification',
      icon: '⚖️'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between text-slate-100 font-sans">
      {/* Top Header */}
      <div className="border-b border-slate-800 bg-slate-900/80 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-teal-600 flex items-center justify-center font-bold text-white shadow">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              SHAKTI MEDISTORE ERP
              <span className="text-[10px] bg-teal-900/60 text-teal-300 border border-teal-700/50 px-1.5 py-0.2 rounded font-mono">
                Enterprise 2026
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              Licensed Pharmacy & Healthcare Distribution Software
            </div>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-emerald-400" />
            <span>LAN & Cloud Sync: <span className="text-emerald-400 font-medium">Connected</span></span>
          </div>
          <div className="h-3 w-px bg-slate-700"></div>
          <div>DL: <span className="text-slate-300 font-mono">{drugLicenseNo}</span></div>
        </div>
      </div>

      {/* Main Login Card Area */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 my-auto">
        <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
          
          {/* Left Column: Preset Role Quick-Selector */}
          <div className="md:col-span-5 bg-gradient-to-b from-slate-950 to-slate-900 p-6 border-b md:border-b-0 md:border-r border-slate-800 flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs text-teal-400 font-semibold mb-2">
                <ShieldCheck className="w-4 h-4" />
                <span>SECURE WORKSTATION LOGIN</span>
              </div>
              <h2 className="text-xl font-bold text-white">Select Operator Role</h2>
              <p className="text-xs text-slate-400 mt-1">
                Click any profile to pre-fill security credentials for this session.
              </p>

              <div className="mt-5 space-y-2.5">
                {presetRoles.map((item) => (
                  <button
                    key={item.role}
                    type="button"
                    onClick={() => {
                      setSelectedRole(item.role);
                      if (item.role === 'owner_admin') {
                        setUsername('manager@shaktipharma.in');
                      } else if (item.role === 'pharmacist') {
                        setUsername('pharmacist@shaktipharma.in');
                      } else if (item.role === 'cashier') {
                        setUsername('pos.counter1@shaktipharma.in');
                      } else {
                        setUsername('auditor.fda@gov.in');
                      }
                    }}
                    className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      selectedRole === item.role
                        ? 'bg-teal-950/60 border-teal-500/80 ring-1 ring-teal-500/30'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`text-xs font-semibold ${
                              selectedRole === item.role ? 'text-teal-300' : 'text-slate-200'
                            }`}
                          >
                            {item.label}
                          </span>
                          {selectedRole === item.role && (
                            <CheckCircle2 className="w-4 h-4 text-teal-400" />
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>GSTIN Registration:</span>
                <span className="font-mono text-slate-300">{gstinNo}</span>
              </div>
              <div className="flex justify-between">
                <span>Central Drug Standards (CDSCO):</span>
                <span className="text-emerald-400 font-medium">Verified Active</span>
              </div>
            </div>
          </div>

          {/* Right Column: Credentials Form & Branch Settings */}
          <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Sign In to Pharmacy Portal</h3>
                  <p className="text-xs text-slate-400">Enter access key or sign in with selected role</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-teal-400">
                  <KeyRound className="w-4 h-4" />
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Branch / Store Selector (Marg ERP standard) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                      Store Unit / Branch
                    </label>
                    <select
                      value={selectedBranch}
                      onChange={(e) => setSelectedBranch(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                    >
                      <option>Branch 01 - Main Dispensary (24x7 OPD)</option>
                      <option>Branch 02 - In-Hospital Chemist Wing</option>
                      <option>Depot 03 - Wholesale Pharma Warehouse</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                      Financial Year
                    </label>
                    <div className="relative">
                      <select
                        value={financialYear}
                        onChange={(e) => setFinancialYear(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-teal-500"
                      >
                        <option>2026 - 2027 (Active)</option>
                        <option>2025 - 2026 (Audit View)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* User ID / Email */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 uppercase mb-1">
                    Pharmacist ID / Email
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                {/* Password / Access Token */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-[11px] font-semibold text-slate-300 uppercase">
                      Security Password / Token
                    </label>
                    <a href="#" onClick={(e) => { e.preventDefault(); alert('Demo mode: Click "Enter Workstation" to sign in directly.'); }} className="text-[11px] text-teal-400 hover:underline">
                      Default: demo
                    </a>
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 text-teal-600 focus:ring-teal-500 bg-slate-950"
                    />
                    <span>Remember terminal session</span>
                  </label>
                  <span className="text-[11px] text-teal-400/80">FEFO Enabled</span>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 active:from-teal-700 active:to-teal-600 text-white font-semibold py-2.5 px-4 rounded-xl shadow-lg shadow-teal-950 flex items-center justify-center gap-2 text-sm transition cursor-pointer"
                >
                  <span>Launch Workstation as {selectedRole.split('/')[0]}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Quick Demo Assist Banner */}
            <div className="mt-6 p-3 rounded-xl bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400">
              <span className="text-teal-400 font-semibold">Instant Access:</span> Click the button above to launch immediately into live pharma inventory, counter billing, FEFO batch tracking, and patient CRM.
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 px-6 py-3 text-center text-xs text-slate-500">
        Shakti Pharma ERP • Built for Retail Chemists, Wholesale Distributors & Hospital Pharmacies • CDSCO & GST Compliant
      </footer>
    </div>
  );
};
