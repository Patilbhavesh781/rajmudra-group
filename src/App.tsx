import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { CalculationsView } from './components/CalculationsView';
import { NewPavtiForm } from './components/NewPavtiForm';
import { PavtiListView } from './components/PavtiListView';
import { ExpenseManagerView } from './components/ExpenseManagerView';
import { UserManagerView } from './components/UserManagerView';
import { ReceiptSlipModal } from './components/ReceiptSlipModal';
import { SessionTerminatedModal } from './components/SessionTerminatedModal';
import { AuditLogsView } from './components/AuditLogsView';
import { FinancialReportsView } from './components/FinancialReportsView';
import { MemberPerformanceView } from './components/MemberPerformanceView';
import { Sidebar } from './components/Sidebar';
import { Pavti } from './types';
import { RefreshCw } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<string>('calculations');
  const [activePavtiModal, setActivePavtiModal] = useState<Pavti | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fcf8f0] flex flex-col items-center justify-center text-amber-900">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-3xl shadow-lg animate-pulse mb-4">
          🚩
        </div>
        <RefreshCw className="w-6 h-6 animate-spin text-amber-600 mb-2" />
        <h2 className="text-lg font-bold font-serif">{t('mandal_name')}</h2>
        <p className="text-xs text-amber-700">Loading session & financial data...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <LoginView />
        <SessionTerminatedModal />
      </>
    );
  }

  const handlePavtiCreated = (newPavti: Pavti) => {
    setActivePavtiModal(newPavti);
    setIsModalOpen(true);
    // Switch to calculations or receipts
    setActiveTab('calculations');
  };

  const handleViewReceipt = (pavti: Pavti) => {
    setActivePavtiModal(pavti);
    setIsModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7] flex flex-col text-slate-900 selection:bg-amber-500 selection:text-white">
      {/* Top Navbar with Tab navigation & Logout */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewPavti={() => setActiveTab('new_pavti')}
      />

      {/* Responsive navigation layout: sidebar on desktop, top tabs on mobile */}
      <div className="mx-auto flex w-full max-w-[1500px] flex-1 items-start gap-5 p-3.5 sm:p-6">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="min-w-0 flex-1">
        {activeTab === 'calculations' && (
          <CalculationsView
            onOpenNewPavti={() => setActiveTab('new_pavti')}
            onViewReceipts={() => setActiveTab('receipts')}
          />
        )}

        {activeTab === 'new_pavti' && (
          <div className="py-2">
            <NewPavtiForm
              onSuccess={handlePavtiCreated}
              onCancel={() => setActiveTab('calculations')}
            />
          </div>
        )}

        {activeTab === 'receipts' && (
          <PavtiListView
            onViewReceipt={handleViewReceipt}
            onOpenNewPavti={() => setActiveTab('new_pavti')}
          />
        )}

        {activeTab === 'unpaid_receipts' && (
          <PavtiListView
            unpaidOnly
            onViewReceipt={handleViewReceipt}
            onOpenNewPavti={() => setActiveTab('new_pavti')}
          />
        )}

        {activeTab === 'expenses' && <ExpenseManagerView />}

        {activeTab === 'member_performance' && <MemberPerformanceView />}

        {activeTab === 'users' && <UserManagerView />}

        {activeTab === 'financial_reports' && <FinancialReportsView />}

        {activeTab === 'audit_logs' && <AuditLogsView />}
      </main>
      </div>

      {/* Footer */}
      <footer className="bg-amber-950 text-amber-200/80 text-xs py-5 px-4 border-t border-amber-800/80 mt-auto print:hidden">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div>
            <div className="font-bold text-white font-serif flex items-center justify-center sm:justify-start gap-1.5">
              <span>🚩 {t('mandal_name')}</span>
              <span className="text-[11px] text-amber-400">• {t('mandal_sub')}</span>
            </div>
            <p className="text-[11px] text-amber-300/70 mt-0.5 font-serif">
              {t('ganpati_bappa_morya')}
            </p>
          </div>
          <div className="text-[11px] text-amber-400/80">
            {t('mandal_tagline')}
          </div>
        </div>
      </footer>

      {/* Printable Digital Receipt Modal */}
      <ReceiptSlipModal
        pavti={activePavtiModal}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />

      {/* Single-Device Concurrent Session Terminated Alert */}
      <SessionTerminatedModal />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainLayout />
      </AuthProvider>
    </LanguageProvider>
  );
}
