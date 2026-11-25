import React, { useState } from 'react';
import { usePharma } from '../context/PharmaContext';
import { UserRole } from '../types/pharmacy';
import {
  Users,
  Shield,
  ShieldCheck,
  UserCheck,
  Clock,
  History,
  FileText,
  KeyRound,
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';

export const UsersRoles: React.FC = () => {
  const {
    currentUser,
    switchUserRole,
    auditLogs
  } = usePharma();

  const [activeTab, setActiveTab] = useState<'USERS' | 'MATRIX' | 'AUDIT'>('USERS');

  const predefinedUsers = [
    {
      id: 'usr-1',
      name: 'Ramesh Sharma',
      role: 'owner_admin' as UserRole,
      title: 'Store Owner & Managing Director',
      pharmacistRegNo: 'MH-PC-10822',
      badge: 'Full Root Privileges'
    },
    {
      id: 'usr-2',
      name: 'Dr. Kailash Pandey',
      role: 'pharmacist' as UserRole,
      title: 'Chief Registered Pharmacist (B.Pharm)',
      pharmacistRegNo: 'MH-PC-44192',
      badge: 'Clinical Authority'
    },
    {
      id: 'usr-3',
      name: 'Pooja Verma',
      role: 'cashier' as UserRole,
      title: 'Senior Counter Billing Cashier',
      pharmacistRegNo: undefined,
      badge: 'POS Terminal Restricted'
    },
    {
      id: 'usr-4',
      name: 'Amit Deshmukh',
      role: 'inventory_staff' as UserRole,
      title: 'Warehouse & Receiving Supervisor',
      pharmacistRegNo: undefined,
      badge: 'Stock Inward & Adjustments'
    },
    {
      id: 'usr-5',
      name: 'CA Suresh Kothari',
      role: 'auditor' as UserRole,
      title: 'Statutory GST & Stock Auditor',
      pharmacistRegNo: undefined,
      badge: 'Read-Only Regulatory Access'
    }
  ];

  const permissionsMatrix = [
    { action: 'Counter Billing & POS Sales', owner_admin: true, pharmacist: true, cashier: true, inventory_staff: false, auditor: false },
    { action: 'Process Customer Sales Returns', owner_admin: true, pharmacist: true, cashier: false, inventory_staff: false, auditor: false },
    { action: 'Create Inward Purchase & Receive Batches', owner_admin: true, pharmacist: true, cashier: false, inventory_staff: true, auditor: false },
    { action: 'Issue Supplier Debit Notes / Expiry Dump', owner_admin: true, pharmacist: true, cashier: false, inventory_staff: true, auditor: false },
    { action: 'Quarantine / Hold / Unhold Batches', owner_admin: true, pharmacist: true, cashier: false, inventory_staff: false, auditor: false },
    { action: 'Physical Stock Adjustments', owner_admin: true, pharmacist: true, cashier: false, inventory_staff: true, auditor: false },
    { action: 'Emergency Negative Stock Override', owner_admin: true, pharmacist: false, cashier: false, inventory_staff: false, auditor: false },
    { action: 'System Configuration & Tax Settings', owner_admin: true, pharmacist: false, cashier: false, inventory_staff: false, auditor: false },
    { action: 'View GSTR-1, Form 65 & Profit Reports', owner_admin: true, pharmacist: true, cashier: false, inventory_staff: false, auditor: true }
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">Users, Roles & Audit Trails</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
                RBAC Security
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Role-based access controls enforcing pharmacy dispensing safety, price protection, and tamper-evident audit logging.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('USERS')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === 'USERS'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              User Accounts
            </button>
            <button
              onClick={() => setActiveTab('MATRIX')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === 'MATRIX'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              Permission Matrix
            </button>
            <button
              onClick={() => setActiveTab('AUDIT')}
              className={`px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all ${
                activeTab === 'AUDIT'
                  ? 'bg-teal-500 text-slate-950 shadow-lg shadow-teal-500/20'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Audit Logs ({auditLogs.length})
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: User Accounts */}
      {activeTab === 'USERS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {predefinedUsers.map(user => {
            const isCurrent = currentUser?.role === user.role;
            return (
              <div
                key={user.id}
                className={`bg-slate-900 border rounded-2xl p-5 shadow-lg space-y-4 transition-all ${
                  isCurrent ? 'border-teal-500 shadow-teal-500/10' : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-300 flex items-center justify-center font-bold text-sm">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{user.name}</h3>
                      <div className="text-[11px] text-teal-400 font-medium">{user.title}</div>
                    </div>
                  </div>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      Active
                    </span>
                  )}
                </div>

                <div className="space-y-1.5 text-xs text-slate-300">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">System Role:</span>
                    <span className="font-mono text-teal-300">{user.role}</span>
                  </div>
                  {user.pharmacistRegNo && (
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">Reg No:</span>
                      <span className="font-mono text-white">{user.pharmacistRegNo}</span>
                    </div>
                  )}
                  <div className="text-[11px] text-slate-400 pt-1">
                    {user.badge}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <button
                    onClick={() => switchUserRole(user.role)}
                    disabled={isCurrent}
                    className={`w-full py-2 text-xs font-semibold rounded-xl transition-all ${
                      isCurrent
                        ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20 cursor-default'
                        : 'bg-slate-800 hover:bg-teal-500 hover:text-slate-950 text-slate-300'
                    }`}
                  >
                    {isCurrent ? 'Current Session' : `Switch Role to ${user.name.split(' ')[0]}`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: Permission Matrix */}
      {activeTab === 'MATRIX' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60">
            <h3 className="text-sm font-bold text-white">Granular Role-Based Permission Matrix</h3>
            <p className="text-xs text-slate-400 mt-0.5">Enforced synchronously across both REST API endpoints and UI operations.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Action / Workflow</th>
                  <th className="py-3 px-3 text-center">Owner / Admin</th>
                  <th className="py-3 px-3 text-center">Pharmacist</th>
                  <th className="py-3 px-3 text-center">Cashier</th>
                  <th className="py-3 px-3 text-center">Inventory Staff</th>
                  <th className="py-3 px-3 text-center">Auditor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {permissionsMatrix.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/40">
                    <td className="py-3 px-4 font-medium text-white">{row.action}</td>
                    <td className="py-3 px-3 text-center">
                      {row.owner_admin ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.pharmacist ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.cashier ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.inventory_staff ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                    </td>
                    <td className="py-3 px-3 text-center">
                      {row.auditor ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" /> : <XCircle className="w-4 h-4 text-slate-600 mx-auto" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: Audit Trail Log */}
      {activeTab === 'AUDIT' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60">
            <h3 className="text-sm font-bold text-white">Immutable SQLite Audit Trail</h3>
            <p className="text-xs text-slate-400 mt-0.5">Captures every sensitive transaction, status change, and regulatory movement.</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 font-sans">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-800/40">
                      <td className="py-3 px-4 text-slate-400">{log.timestamp}</td>
                      <td className="py-3 px-4 text-teal-300 font-sans font-medium">{log.user_name}</td>
                      <td className="py-3 px-4 text-white font-bold">{log.action}</td>
                      <td className="py-3 px-4 text-amber-300">{log.entity_type} {log.entity_id ? `(${log.entity_id})` : ''}</td>
                      <td className="py-3 px-4 text-slate-400 max-w-xs truncate">{log.details_json || '-'}</td>
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
