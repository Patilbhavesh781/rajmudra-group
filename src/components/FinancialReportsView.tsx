import React, { useCallback, useEffect, useState } from 'react';
import { Download, FileSpreadsheet, IndianRupee, PieChart, Printer, RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CalculationsData } from '../types';
import { MANDAL_CONFIG } from '../../shared/mandalConfig';

export const FinancialReportsView: React.FC = () => {
  const { authFetch } = useAuth();
  const { language } = useLanguage();
  const [data, setData] = useState<CalculationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<'receipts' | 'expenses' | null>(null);

  const loadReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await authFetch('/api/pavti/calculations');
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Failed to load report.');
      setData(result);
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load report.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { loadReport(); }, [loadReport]);

  const downloadCsv = async (kind: 'receipts' | 'expenses') => {
    setDownloading(kind);
    setError(null);
    try {
      const response = await authFetch(`/api/reports/${kind}.csv`);
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Export failed.');
      }
      const blob = await response.blob();
      const disposition = response.headers.get('content-disposition') || '';
      const filename = disposition.match(/filename="([^"]+)"/)?.[1] || `${MANDAL_CONFIG.exportPrefix}_${kind}.csv`;
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } catch (downloadError: any) {
      setError(downloadError.message || 'Export failed.');
    } finally {
      setDownloading(null);
    }
  };

  const summary = data?.mandalTotal;
  const paymentModes: Array<[string, { amount: number; count: number }]> = data?.paymentModes
    ? Object.entries(data.paymentModes)
    : [];
  const categories: Array<[string, { amount: number; count: number }]> = data?.categories
    ? (Object.entries(data.categories) as Array<[string, { amount: number; count: number }]>).sort((a, b) => b[1].amount - a[1].amount)
    : [];

  return (
    <div className="space-y-4 print:space-y-3">
      <section className="rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-950 to-amber-950 text-white p-5 sm:p-6 shadow-xl border border-emerald-800/60 print:bg-white print:text-black print:border-slate-400 print:shadow-none">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2"><FileSpreadsheet className="w-6 h-6 text-emerald-400" /><h2 className="text-xl sm:text-2xl font-black font-serif">{language === 'mr' ? 'आर्थिक अहवाल' : 'Financial Reports'}</h2></div>
            <p className="text-xs text-emerald-100/75 mt-1">{language === 'mr' ? 'मंडळाचा थेट जमा, बाकी, खर्च आणि शिल्लक अहवाल.' : 'Live collection, pending, expense, and balance statement for the Mandal.'}</p>
          </div>
          <div className="flex flex-wrap gap-2 print:hidden">
            <button onClick={loadReport} disabled={loading} className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-white/15 cursor-pointer disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />{language === 'mr' ? 'रिफ्रेश' : 'Refresh'}</button>
            <button onClick={() => window.print()} className="px-3 py-2 bg-amber-600 hover:bg-amber-500 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"><Printer className="w-4 h-4" />{language === 'mr' ? 'प्रिंट' : 'Print'}</button>
          </div>
        </div>
      </section>

      {error && <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800 print:hidden">{error}</div>}

      {loading || !summary ? (
        <div className="bg-white rounded-2xl border border-slate-200 py-20 flex flex-col items-center text-slate-500"><RefreshCw className="w-8 h-8 animate-spin text-emerald-700 mb-2" /><span className="text-sm">{language === 'mr' ? 'अहवाल तयार होत आहे...' : 'Preparing report...'}</span></div>
      ) : (
        <>
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <SummaryCard label={language === 'mr' ? 'एकूण जमा' : 'Paid collection'} amount={summary.paidAmount} icon={<TrendingUp />} tone="emerald" />
            <SummaryCard label={language === 'mr' ? 'येणे बाकी' : 'Pending collection'} amount={summary.unpaidAmount} icon={<IndianRupee />} tone="amber" />
            <SummaryCard label={language === 'mr' ? 'एकूण खर्च' : 'Total expenses'} amount={summary.totalExpenses} icon={<TrendingDown />} tone="red" />
            <SummaryCard label={language === 'mr' ? 'निव्वळ शिल्लक' : 'Net balance'} amount={summary.balanceInHand} icon={<IndianRupee />} tone="blue" />
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 print:shadow-none">
              <h3 className="font-black text-slate-900 flex items-center gap-2"><PieChart className="w-5 h-5 text-emerald-700" />{language === 'mr' ? 'पेमेंट प्रकारानुसार जमा' : 'Collection by payment mode'}</h3>
              <div className="mt-4 space-y-2">
                {paymentModes.map(([mode, values]) => (
                  <div key={mode} className="flex items-center justify-between rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-sm">
                    <span className="font-bold uppercase text-slate-700">{mode} <small className="text-slate-400">({values.count})</small></span>
                    <span className="font-black font-mono">₹{values.amount.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 print:shadow-none">
              <h3 className="font-black text-slate-900 flex items-center gap-2"><PieChart className="w-5 h-5 text-amber-700" />{language === 'mr' ? 'देणगी वर्गवारी' : 'Donation categories'}</h3>
              <div className="mt-4 space-y-2 max-h-72 overflow-auto print:max-h-none print:overflow-visible">
                {categories.length ? categories.map(([category, values]) => (
                  <div key={category} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 border border-slate-100 px-3 py-2.5 text-sm">
                    <span className="font-semibold text-slate-700 truncate">{category} <small className="text-slate-400">({values.count})</small></span>
                    <span className="font-black font-mono shrink-0">₹{values.amount.toLocaleString('en-IN')}</span>
                  </div>
                )) : <p className="text-sm text-slate-400 text-center py-8">{language === 'mr' ? 'नोंदी उपलब्ध नाहीत.' : 'No category records.'}</p>}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 print:hidden">
            <h3 className="font-black text-slate-900">{language === 'mr' ? 'Excel / CSV निर्यात' : 'Excel / CSV exports'}</h3>
            <p className="text-xs text-slate-500 mt-1">{language === 'mr' ? 'लेखापरीक्षण आणि नोंदवहीसाठी UTF-8 CSV फाइल डाउनलोड करा.' : 'Download UTF-8 CSV files for accounting, reconciliation, and audits.'}</p>
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ExportButton label={language === 'mr' ? 'सर्व पावत्या CSV' : 'All receipts CSV'} loading={downloading === 'receipts'} onClick={() => downloadCsv('receipts')} />
              <ExportButton label={language === 'mr' ? 'सर्व खर्च CSV' : 'All expenses CSV'} loading={downloading === 'expenses'} onClick={() => downloadCsv('expenses')} />
            </div>
          </section>

          <footer className="hidden print:block text-xs text-slate-600 border-t border-slate-300 pt-3">{language === 'mr' ? `${MANDAL_CONFIG.name.mr} — आर्थिक अहवाल` : `${MANDAL_CONFIG.name.en} — Financial Report`} • {new Date(data.lastUpdated).toLocaleString(language === 'mr' ? 'mr-IN' : 'en-IN')}</footer>
        </>
      )}
    </div>
  );
};

const toneClasses = {
  emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  amber: 'border-amber-200 bg-amber-50 text-amber-950',
  red: 'border-red-200 bg-red-50 text-red-950',
  blue: 'border-blue-200 bg-blue-50 text-blue-950',
};

const SummaryCard = ({ label, amount, icon, tone }: { label: string; amount: number; icon: React.ReactNode; tone: keyof typeof toneClasses }) => (
  <div className={`rounded-2xl border p-4 shadow-sm print:shadow-none ${toneClasses[tone]}`}>
    <div className="flex items-center justify-between gap-2"><span className="text-xs font-bold uppercase tracking-wide opacity-75">{label}</span><span className="w-5 h-5">{icon}</span></div>
    <div className="text-2xl font-black font-mono mt-2">₹{amount.toLocaleString('en-IN')}</div>
  </div>
);

const ExportButton = ({ label, loading, onClick }: { label: string; loading: boolean; onClick: () => void }) => (
  <button onClick={onClick} disabled={loading} className="rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 px-4 py-3 font-bold text-sm flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50">
    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}{label}
  </button>
);
