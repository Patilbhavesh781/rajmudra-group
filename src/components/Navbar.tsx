import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  LogOut,
  Receipt,
  BarChart3,
  ListFilter,
  Wallet,
  Users,
  Database,
  Smartphone,
  Globe,
  Sparkles,
  Check,
  Activity,
  FileSpreadsheet,
  Clock
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenNewPavti: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, onOpenNewPavti }) => {
  const { user, logout } = useAuth();
  const { language, setLanguage, toggleLanguage, t } = useLanguage();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await logout();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const navTabs = [
    { id: 'calculations', label: language === 'en' ? '📊 Dashboard & Accounts' : '📊 डॅशबोर्ड व हिशोब', icon: BarChart3, badge: 'Live' },
    { id: 'new_pavti', label: t('tab_new_pavti'), icon: Receipt, highlight: true },
    { id: 'receipts', label: t('tab_receipts'), icon: ListFilter },
    { id: 'unpaid_receipts', label: language === 'en' ? 'Pending Receipts' : 'बाकी पावत्या', icon: Clock },
    { id: 'expenses', label: t('tab_expenses'), icon: Wallet },
    { id: 'member_performance', label: language === 'en' ? 'Member Performance' : 'कार्यकर्ता कामगिरी', icon: Users },
    ...(user?.role === 'admin' ? [{ id: 'users', label: t('tab_users'), icon: Users }] : []),
    ...(user?.role === 'admin' ? [{ id: 'financial_reports', label: language === 'en' ? 'Reports' : 'आर्थिक अहवाल', icon: FileSpreadsheet }] : []),
    ...(user?.role === 'admin' ? [{ id: 'audit_logs', label: language === 'en' ? 'Audit Logs' : 'ऑडिट नोंदी', icon: Activity }] : []),
  ];

  return (
    <header className="bg-gradient-to-r from-amber-900 via-amber-800 to-orange-950 text-white shadow-xl sticky top-0 z-40 border-b-2 border-amber-500/40">
      {/* Top Bar with Mandal branding & User Status */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
        <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
          {/* Logo & Mandal Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-amber-950 font-bold text-xl sm:text-2xl shadow-md border border-amber-200 shrink-0">
              🚩
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold tracking-wider text-amber-300 uppercase px-1.5 py-0.2 bg-amber-950/60 rounded border border-amber-500/30">
                  {t('mandal_slogan')}
                </span>
                <span className="hidden sm:inline-flex text-[11px] text-amber-200/80">
                  {t('mandal_established')}
                </span>
              </div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white flex items-center gap-1.5 font-serif">
                {t('mandal_name')}
                <span className="text-xs sm:text-sm font-normal text-amber-200 hidden md:inline">
                  ({t('mandal_tagline')})
                </span>
              </h1>
            </div>
          </div>

          {/* Right Controls: Language Selector & User Session & Logout */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Language Toggle Switch (मराठी <-> English) */}
            <div className="flex items-center bg-amber-950/80 border border-amber-500/40 rounded-lg p-0.5 shadow-sm">
              <button
                type="button"
                id="lang-toggle-mr"
                onClick={() => setLanguage('mr')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  language === 'mr'
                    ? 'bg-amber-500 text-amber-950 shadow-sm'
                    : 'text-amber-200 hover:text-white hover:bg-amber-800/50'
                }`}
                title="मराठी भाषा निवडा"
              >
                मराठी
              </button>
              <button
                type="button"
                id="lang-toggle-en"
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-amber-500 text-amber-950 shadow-sm'
                    : 'text-amber-200 hover:text-white hover:bg-amber-800/50'
                }`}
                title="Switch to English"
              >
                EN
              </button>
            </div>

            {user && (
              <>
                {/* User Profile Tag */}
                <div className="hidden md:flex items-center gap-2 bg-amber-950/50 px-3 py-1.5 rounded-lg border border-amber-700/50">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-100">
                    {user.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-amber-500 text-amber-950 font-bold uppercase tracking-wider">
                        {t('role_admin')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-orange-500/90 text-white font-bold uppercase tracking-wider">
                        {t('role_user')}
                      </span>
                    )}
                    <span className="font-bold">{user.name}</span>
                  </div>
                </div>

                {/* LOGOUT BUTTON - Reliable 1-Click Logout with instant feedback */}
                <button
                  id="header-logout-btn"
                  onClick={handleLogout}
                  disabled={loggingOut}
                  className="flex items-center gap-1.5 bg-red-600 hover:bg-red-500 active:scale-95 text-white text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg border border-red-400/40 shadow-sm transition duration-150 cursor-pointer disabled:opacity-50"
                  title={t('logout_btn')}
                >
                  <LogOut className="w-4 h-4 text-red-100" />
                  <span>{loggingOut ? '...' : t('logout_btn')}</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="bg-amber-950/70 border-t border-amber-800/60 backdrop-blur-sm px-2 sm:px-6 lg:hidden">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-1.5 no-scrollbar">
          {navTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => {
                  if (tab.id === 'new_pavti') {
                    onOpenNewPavti();
                  } else {
                    setActiveTab(tab.id);
                  }
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-150 cursor-pointer ${
                  tab.highlight
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-amber-950 font-bold shadow-md hover:from-amber-400 hover:to-orange-400'
                    : isActive
                    ? 'bg-amber-700/80 text-white font-semibold shadow-inner border border-amber-500/40'
                    : 'text-amber-200/90 hover:text-white hover:bg-amber-900/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${tab.highlight ? 'text-amber-950' : isActive ? 'text-amber-300' : 'text-amber-400/70'}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="ml-1 text-[10px] font-bold px-1.5 py-0.2 bg-emerald-500/90 text-emerald-950 rounded-full animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
