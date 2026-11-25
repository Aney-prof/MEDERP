import React, { useState, useEffect } from 'react';
import { PharmaProvider, usePharma } from './context/PharmaContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { LoginPage } from './components/LoginPage';
import { DashboardOverview } from './components/DashboardOverview';
import { MedicineCatalogue } from './components/MedicineCatalogue';
import { InventoryBatches } from './components/InventoryBatches';
import { PurchasesSuppliers } from './components/PurchasesSuppliers';
import { PosBilling } from './components/PosBilling';
import { CustomerReturns } from './components/CustomerReturns';
import { SupplierReturns } from './components/SupplierReturns';
import { PatientManagement } from './components/PatientManagement';
import { ReportsModule } from './components/ReportsModule';
import { UsersRoles } from './components/UsersRoles';
import { SettingsModule } from './components/SettingsModule';
import { InvoiceModal } from './components/InvoiceModal';
import { ToastContainer } from './components/ToastContainer';

const MainLayout: React.FC = () => {
  const { isAuthenticated, activeTab, setActiveTab } = usePharma();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Global Keyboard Shortcuts (F2: Billing, F4: Patients)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT');

      if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('billing');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('patients');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setActiveTab]);

  if (!isAuthenticated) {
    return (
      <>
        <LoginPage />
        <ToastContainer />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col font-sans text-slate-100 selection:bg-teal-500 selection:text-white">
      {/* Top Header */}
      <Navbar />

      {/* Main Container with Sidebar + Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-950">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'dashboard' && <DashboardOverview />}
            {activeTab === 'catalogue' && <MedicineCatalogue />}
            {activeTab === 'inventory' && <InventoryBatches />}
            {activeTab === 'purchases' && <PurchasesSuppliers />}
            {activeTab === 'billing' && <PosBilling />}
            {activeTab === 'customer-returns' && <CustomerReturns />}
            {activeTab === 'supplier-returns' && <SupplierReturns />}
            {activeTab === 'patients' && <PatientManagement />}
            {activeTab === 'reports' && <ReportsModule />}
            {activeTab === 'users-roles' && <UsersRoles />}
            {activeTab === 'settings' && <SettingsModule />}
          </div>
        </main>
      </div>

      {/* Printable Invoice Modal */}
      <InvoiceModal />

      {/* Notification Toasts */}
      <ToastContainer />
    </div>
  );
};

export default function App() {
  return (
    <PharmaProvider>
      <MainLayout />
    </PharmaProvider>
  );
}
