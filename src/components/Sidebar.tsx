import React from 'react';
import { Activity, BarChart3, Clock, FileSpreadsheet, ListFilter, Receipt, Trophy, Users, Wallet } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const items = [
    { id: 'calculations', label: language === 'en' ? 'Dashboard & Accounts' : 'डॅशबोर्ड व हिशोब', icon: BarChart3 },
    { id: 'new_pavti', label: t('tab_new_pavti'), icon: Receipt, accent: true },
    { id: 'receipts', label: t('tab_receipts'), icon: ListFilter },
    { id: 'unpaid_receipts', label: language === 'en' ? 'Pending Receipts' : 'बाकी पावत्या', icon: Clock },
    { id: 'expenses', label: t('tab_expenses'), icon: Wallet },
    { id: 'member_performance', label: language === 'en' ? 'Member Performance' : 'कार्यकर्ता कामगिरी', icon: Trophy },
    ...(user?.role === 'admin' ? [
      { id: 'users', label: t('tab_users'), icon: Users },
      { id: 'financial_reports', label: language === 'en' ? 'Financial Reports' : 'आर्थिक अहवाल', icon: FileSpreadsheet },
      { id: 'audit_logs', label: language === 'en' ? 'Audit Logs' : 'ऑडिट नोंदी', icon: Activity },
    ] : []),
  ];

  return (
    <aside className="hidden w-64 shrink-0 lg:block print:hidden">
      <div className="sticky top-24 overflow-hidden rounded-2xl border border-amber-800/50 bg-gradient-to-b from-amber-950 to-orange-950 text-white shadow-xl">
        <div className="border-b border-amber-700/50 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-amber-400">{language === 'en' ? 'Navigation' : 'मुख्य मेनू'}</p>
          <p className="mt-1 text-sm font-black text-amber-100">{t('mandal_name')}</p>
          <p className="text-[11px] text-amber-300">{t('mandal_sub')}</p>
        </div>
        <nav className="space-y-1 p-2.5">
          {items.map(({ id, label, icon: Icon, accent }) => {
            const selected = activeTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-xs font-bold transition ${selected ? 'bg-amber-400 text-amber-950 shadow-md' : accent ? 'bg-red-700/80 text-white hover:bg-red-600' : 'text-amber-100 hover:bg-amber-800/70'}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-amber-700/40 p-4 text-[10px] leading-4 text-amber-400">
          {language === 'en' ? `Signed in as ${user?.name || ''}` : `${user?.name || ''} म्हणून लॉगिन`}
        </div>
      </div>
    </aside>
  );
};
