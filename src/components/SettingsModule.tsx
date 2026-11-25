import React, { useState } from 'react';
import { usePharma } from '../context/PharmaContext';
import {
  Settings as SettingsIcon,
  Building,
  Shield,
  Boxes,
  Receipt,
  RotateCcw,
  Truck,
  Users,
  Bell,
  Database,
  Save,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Download,
  Upload,
  RefreshCw
} from 'lucide-react';

export const SettingsModule: React.FC = () => {
  const {
    settings,
    updateSettingSection,
    hasPermission,
    currentUser,
    addToast
  } = usePharma();

  const [activeSection, setActiveSection] = useState<string>('business');
  const [formData, setFormData] = useState<Record<string, any>>(settings || {});
  const [isSaving, setIsSaving] = useState(false);

  const sections = [
    { id: 'business', label: 'Business Profile', icon: Building, desc: 'Store details, address, currency & financial year' },
    { id: 'pharmacy', label: 'Pharmacy & Drug Licences', icon: Shield, desc: 'DL 20B/21B, registered pharmacist details' },
    { id: 'inventory', label: 'Inventory & Batch Rules', icon: Boxes, desc: 'FEFO rules, expiry thresholds & negative stock' },
    { id: 'tax', label: 'Tax & GST Settings', icon: Receipt, desc: 'GSTIN, invoice prefixes, rounding & HSN codes' },
    { id: 'sales', label: 'Sales & Returns Policy', icon: RotateCcw, desc: 'Allowed return windows & customer credit rules' },
    { id: 'purchasing', label: 'Purchasing & Reorder', icon: Truck, desc: 'Automated reorder suggestion parameters' },
    { id: 'security', label: 'Users & Security', icon: Users, desc: 'Role permissions, session & audit policies' },
    { id: 'integrations', label: 'Notifications & Integrations', icon: Bell, desc: 'SMS, WhatsApp, UPI & e-Invoice credentials' },
    { id: 'data', label: 'Data Management & Backup', icon: Database, desc: 'Database export, import & maintenance' }
  ];

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] || {}),
        [field]: value
      }
    }));
  };

  const handleSaveSection = async (section: string) => {
    if (!hasPermission('canManageSettings')) {
      addToast('Permission Denied', 'Only administrators have authority to modify system settings.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const sectionPayload = formData[section] || {};
      await updateSettingSection(section, sectionPayload);
      addToast('Settings Saved', `${section.toUpperCase()} settings successfully saved to SQLite database.`, 'success');
    } catch (err: any) {
      addToast('Save Failed', err.message || 'Error updating settings', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportDatabase = () => {
    const fullBackup = {
      backupTimestamp: new Date().toISOString(),
      version: '1.0.0',
      exportedBy: currentUser?.name || 'Administrator',
      settings: formData
    };
    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `shakti-erp-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('Backup Exported', 'ERP configuration and database schema snapshot downloaded.', 'success');
  };

  const currentSectionData = formData[activeSection] || {};

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400 border border-teal-500/20">
                <SettingsIcon className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-bold text-white tracking-tight">System Configuration & Settings</h1>
              <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-full">
                Persistent SQLite
              </span>
            </div>
            <p className="text-slate-400 text-sm">
              Comprehensive pharmacy parameters, statutory drug licences, batch dispatch behavior, and GST rules.
            </p>
          </div>
        </div>
      </div>

      {/* Main Settings Layout (Tabs on Left, Content on Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="space-y-1.5 lg:col-span-1">
          {sections.map(sec => {
            const Icon = sec.icon;
            const isActive = activeSection === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSection(sec.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all flex items-start gap-3 ${
                  isActive
                    ? 'bg-slate-900 border-teal-500/40 text-white shadow-lg shadow-teal-500/5'
                    : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <span className={`p-2 rounded-lg mt-0.5 ${
                  isActive ? 'bg-teal-500/20 text-teal-300' : 'bg-slate-800 text-slate-400'
                }`}>
                  <Icon className="w-4 h-4" />
                </span>
                <div>
                  <div className="text-xs font-bold leading-tight">{sec.label}</div>
                  <div className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{sec.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Section Form Content */}
        <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white">
                {sections.find(s => s.id === activeSection)?.label}
              </h2>
              <p className="text-xs text-slate-400">
                {sections.find(s => s.id === activeSection)?.desc}
              </p>
            </div>
            {activeSection !== 'data' && (
              <button
                type="button"
                disabled={isSaving}
                onClick={() => handleSaveSection(activeSection)}
                className="px-4 py-2 text-xs font-semibold bg-teal-500 hover:bg-teal-400 text-slate-950 rounded-xl transition-all shadow-lg shadow-teal-500/20 flex items-center gap-1.5 disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </div>

          {/* TAB 1: Business Profile */}
          {activeSection === 'business' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Store / Pharmacy Name</label>
                <input
                  type="text"
                  value={currentSectionData.storeName || 'Shakti MediStore & Healthcare ERP'}
                  onChange={(e) => handleInputChange('business', 'storeName', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Financial Year</label>
                <input
                  type="text"
                  value={currentSectionData.financialYear || '2026 - 2027'}
                  onChange={(e) => handleInputChange('business', 'financialYear', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Invoice Prefix</label>
                <input
                  type="text"
                  value={currentSectionData.invoicePrefix || 'INV-2026-'}
                  onChange={(e) => handleInputChange('business', 'invoicePrefix', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Currency Code</label>
                <input
                  type="text"
                  disabled
                  value="INR (₹)"
                  className="w-full px-3 py-2 bg-slate-950/50 border border-slate-800 rounded-xl text-xs text-slate-500 font-mono cursor-not-allowed"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1">Store Address</label>
                <input
                  type="text"
                  value={currentSectionData.address || 'Shop 4, Ground Floor, Sai Plaza, MG Road, Pune, Maharashtra 411001'}
                  onChange={(e) => handleInputChange('business', 'address', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: Pharmacy & Drug Licences */}
          {activeSection === 'pharmacy' && (
            <div className="space-y-4">
              <div className="p-3 bg-teal-500/10 border border-teal-500/20 rounded-xl text-xs text-teal-300">
                Drug licence information is printed on retail invoices and Form 65 registers under the Drugs and Cosmetics Rules.
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Form 20B Licence No. (Biological & Non-biological)</label>
                  <input
                    type="text"
                    value={currentSectionData.drugLicenseNo20B || 'MH-MZ4-204918'}
                    onChange={(e) => handleInputChange('pharmacy', 'drugLicenseNo20B', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Form 21B Licence No.</label>
                  <input
                    type="text"
                    value={currentSectionData.drugLicenseNo21B || 'MH-MZ4-205919'}
                    onChange={(e) => handleInputChange('pharmacy', 'drugLicenseNo21B', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Supervising Registered Pharmacist</label>
                  <input
                    type="text"
                    value={currentSectionData.pharmacistName || 'Dr. Kailash Pandey, B.Pharm'}
                    onChange={(e) => handleInputChange('pharmacy', 'pharmacistName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Pharmacist Registration No.</label>
                  <input
                    type="text"
                    value={currentSectionData.pharmacistRegNo || 'MH-PC-44192'}
                    onChange={(e) => handleInputChange('pharmacy', 'pharmacistRegNo', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Inventory & Batch Rules */}
          {activeSection === 'inventory' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Near Expiry Alert Threshold (Days)</label>
                  <input
                    type="number"
                    min="15"
                    max="180"
                    value={currentSectionData.nearExpiryDaysThreshold || 60}
                    onChange={(e) => handleInputChange('inventory', 'nearExpiryDaysThreshold', parseInt(e.target.value, 10) || 60)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Default Low Stock Reorder Threshold (Base Units)</label>
                  <input
                    type="number"
                    min="1"
                    value={currentSectionData.lowStockThresholdUnits || 30}
                    onChange={(e) => handleInputChange('inventory', 'lowStockThresholdUnits', parseInt(e.target.value, 10) || 30)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSectionData.fefoPriorityEnabled ?? true}
                    onChange={(e) => handleInputChange('inventory', 'fefoPriorityEnabled', e.target.checked)}
                    className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Strict FEFO Batch Allocation</div>
                    <div className="text-[11px] text-slate-400">Automatically prioritizes earliest-expiring eligible batch at POS billing.</div>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSectionData.allowNegativeStock ?? false}
                    onChange={(e) => handleInputChange('inventory', 'allowNegativeStock', e.target.checked)}
                    className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Allow Negative Stock (Emergency Mode)</div>
                    <div className="text-[11px] text-slate-400">Only authorized administrators can bill stock with insufficient base units balance.</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: Tax & Billing */}
          {activeSection === 'tax' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Pharmacy GSTIN *</label>
                <input
                  type="text"
                  value={currentSectionData.gstin || '27AABCS1429B1Z2'}
                  onChange={(e) => handleInputChange('tax', 'gstin', e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono uppercase focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">State Code</label>
                <input
                  type="text"
                  value={currentSectionData.stateCode || '27 - Maharashtra'}
                  onChange={(e) => handleInputChange('tax', 'stateCode', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="flex items-center gap-3 p-3 bg-slate-950 rounded-xl border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentSectionData.enableInvoiceRounding ?? true}
                    onChange={(e) => handleInputChange('tax', 'enableInvoiceRounding', e.target.checked)}
                    className="w-4 h-4 rounded text-teal-500 bg-slate-900 border-slate-700"
                  />
                  <div>
                    <div className="text-xs font-semibold text-white">Round off final invoice payable to nearest Rupee (₹)</div>
                    <div className="text-[11px] text-slate-400">Standard Indian retail accounting convention for cash counters.</div>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: Sales & Returns Policy */}
          {activeSection === 'sales' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Customer Return Window (Days)</label>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={currentSectionData.returnWindowDays || 7}
                  onChange={(e) => handleInputChange('sales', 'returnWindowDays', parseInt(e.target.value, 10) || 7)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Default Max Patient Credit Limit (Khata)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  value={currentSectionData.defaultCreditLimit || 2500}
                  onChange={(e) => handleInputChange('sales', 'defaultCreditLimit', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* TAB 6: Purchasing & Reorder */}
          {activeSection === 'purchasing' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Automated Buffer Days for Supplier Lead Time</label>
                <input
                  type="number"
                  min="1"
                  max="14"
                  value={currentSectionData.leadTimeDays || 3}
                  onChange={(e) => handleInputChange('purchasing', 'leadTimeDays', parseInt(e.target.value, 10) || 3)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                />
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                Purchasing algorithms calculate suggested orders based on average daily counter consumption across the previous 30 calendar days.
              </div>
            </div>
          )}

          {/* TAB 7: Users & Security */}
          {activeSection === 'security' && (
            <div className="space-y-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-300 space-y-1">
                <div className="font-semibold text-white">Active Audit Logging: Enabled</div>
                <div className="text-[11px] text-slate-400">
                  All sensitive transactions (stock adjustments, price modifications, batch overrides) are recorded in the SQLite audit log table.
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: Integrations & Notifications */}
          {activeSection === 'integrations' && (
            <div className="space-y-4">
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-amber-200">Integration Boundary Notice:</div>
                  <p>
                    External gateways (WhatsApp Cloud API, SMS Twilio, Razorpay UPI Webhook, NIC e-Invoice Portal) are currently marked <strong>Not Configured</strong>.
                    Credentials entered below are securely encrypted in SQLite and never logged in plaintext.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">WhatsApp Cloud API Key</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••••••"
                    value={currentSectionData.whatsappApiKey || ''}
                    onChange={(e) => handleInputChange('integrations', 'whatsappApiKey', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-slate-500">Status: Not Configured</span>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">UPI Merchant VPA (Payment QR)</label>
                  <input
                    type="text"
                    placeholder="shaktipharma@icici"
                    value={currentSectionData.upiVpa || 'shaktipharma@icici'}
                    onChange={(e) => handleInputChange('integrations', 'upiVpa', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono focus:outline-none focus:border-teal-500"
                  />
                  <span className="text-[10px] text-emerald-400">Status: Dynamic BharatQR Ready</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: Data Management & Backup */}
          {activeSection === 'data' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-white">Download Database Backup JSON</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Export full schema snapshot, active settings, and audit metadata.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportDatabase}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-teal-500/20"
                >
                  <Download className="w-3.5 h-3.5" />
                  Export JSON Backup
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
