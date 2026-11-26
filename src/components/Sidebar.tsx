import React from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  LayoutDashboard,
  Pill,
  Boxes,
  Truck,
  ReceiptText,
  RotateCcw,
  FileText,
  Users,
  BarChart3,
  ShieldCheck,
  Settings,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface SidebarProps {
  isCollapsed: boolean;
  setIsCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isCollapsed, setIsCollapsed }) => {
  const { activeTab, setActiveTab, batches, patients } = usePharma();

  // Compute Near Expiry (<60 days) count
  const nearExpiryCount = (batches || []).filter(b => {
    const expDateStr = b.expiryDate || b.expiry_date;
    if (!expDateStr) return false;
    const parts = expDateStr.split('-');
    if (parts.length < 2) return false;
    const expDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, 28);
    const diffMs = expDate.getTime() - new Date().getTime();
    const days = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return days <= 60 && (b.quantityBaseUnits ?? b.quantity_base_units ?? b.quantity ?? 0) > 0;
  }).length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
      shortcut: 'Alt+1'
    },
    {
      id: 'catalogue',
      label: 'Medicines Catalogue',
      icon: Pill,
      badge: null,
      shortcut: 'Alt+2'
    },
    {
      id: 'inventory',
      label: 'Inventory & Batches',
      icon: Boxes,
      badge: nearExpiryCount > 0 ? `${nearExpiryCount} Near Exp` : null,
      shortcut: 'Alt+3'
    },
    {
      id: 'purchases',
      label: 'Purchases & Suppliers',
      icon: Truck,
      badge: null,
      shortcut: 'Alt+4'
    },
    {
      id: 'billing',
      label: 'Counter Billing / POS',
      icon: ReceiptText,
      badge: null,
      shortcut: 'F2'
    },
    {
      id: 'customer-returns',
      label: 'Customer Returns',
      icon: RotateCcw,
      badge: null,
      shortcut: 'Alt+5'
    },
    {
      id: 'supplier-returns',
      label: 'Supplier Returns & DN',
      icon: FileText,
      badge: null,
      shortcut: 'Alt+6'
    },
    {
      id: 'patients',
      label: 'Patients & Rx',
      icon: Users,
      badge: null,
      shortcut: 'F4'
    },
    {
      id: 'reports',
      label: 'Statutory Reports',
      icon: BarChart3,
      badge: null,
      shortcut: 'Alt+7'
    },
    {
      id: 'users-roles',
      label: 'Users & Roles',
      icon: ShieldCheck,
      badge: null,
      shortcut: 'Alt+8'
    },
    {
      id: 'settings',
      label: 'Settings & Master',
      icon: Settings,
      badge: null,
      shortcut: 'Alt+9'
    }
  ];

  return (
    <aside
      className={`bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col z-20 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center justify-between">
        {!isCollapsed && (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/10 border border-teal-500/20 text-teal-400 flex items-center justify-center font-bold text-sm">
              श
            </div>
            <div>
              <div className="font-bold text-white text-sm tracking-tight">Shakti MediStore</div>
              <div className="text-[10px] text-teal-400 font-semibold tracking-wider uppercase">Pharmacy ERP</div>
            </div>
          </div>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors mx-auto"
          title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-teal-500/10 text-teal-300 border border-teal-500/20 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-teal-400' : 'text-slate-400'}`} />
              {!isCollapsed && (
                <div className="flex-1 flex items-center justify-between overflow-hidden">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span className="ml-2 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer shortcut helper */}
      {!isCollapsed && (
        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between">
          <span>Shortcuts: F2 Billing • F4 Rx</span>
        </div>
      )}
    </aside>
  );
};
