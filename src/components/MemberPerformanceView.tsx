import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Award, CheckCircle2, Clock, RefreshCw, Search, Trophy, Users } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CalculationsData } from '../types';

export const MemberPerformanceView: React.FC = () => {
  const { authFetch } = useAuth();
  const { language, t } = useLanguage();
  const [data, setData] = useState<CalculationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch('/api/pavti/calculations');
      if (!response.ok) throw new Error('Could not load member performance.');
      setData(await response.json());
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    void load();
  }, [load]);

  const members = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return (data?.collectors || []).filter((member) => !query || member.name.toLocaleLowerCase().includes(query));
  }, [data, search]);

  const totalCollected = (data?.collectors || []).reduce((sum, member) => sum + (member.paidAmount || 0), 0);

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-amber-500/40 bg-gradient-to-br from-amber-900 via-amber-800 to-orange-950 p-5 text-white shadow-lg sm:p-6">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-300">{t('mandal_name')} • {t('mandal_sub')}</p>
            <h2 className="mt-1 flex items-center gap-2 text-xl font-black sm:text-2xl"><Trophy className="h-6 w-6 text-yellow-300" />{language === 'en' ? 'Member Performance' : 'कार्यकर्ता कामगिरी'}</h2>
            <p className="mt-1 text-xs text-amber-100 sm:text-sm">{language === 'en' ? 'Live donation collection performance for every registered member.' : 'प्रत्येक नोंदणीकृत कार्यकर्त्याची थेट देणगी संकलन कामगिरी.'}</p>
          </div>
          <button onClick={() => void load()} disabled={loading} className="flex items-center justify-center gap-2 rounded-xl border border-amber-400/40 bg-amber-950/60 px-4 py-2 text-xs font-bold hover:bg-amber-950">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> {t('action_refresh')}
          </button>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <Summary label={language === 'en' ? 'Registered members' : 'नोंदणीकृत कार्यकर्ते'} value={String(data?.collectors.length || 0)} icon={<Users />} />
        <Summary label={language === 'en' ? 'Collected amount' : 'जमा झालेली रक्कम'} value={`₹${totalCollected.toLocaleString('en-IN')}`} icon={<CheckCircle2 />} />
        <Summary label={language === 'en' ? "Today's collection" : 'आजचे संकलन'} value={`₹${(data?.mandalTotal.todayPaidAmount || 0).toLocaleString('en-IN')}`} icon={<Clock />} />
      </div>

      <section className="overflow-hidden rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-amber-200 p-4 sm:flex-row sm:items-center sm:justify-between">
          <h3 className="flex items-center gap-2 font-black text-slate-900"><Award className="h-5 w-5 text-amber-600" />{language === 'en' ? 'Collection leaderboard' : 'संकलन क्रमवारी'}</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={language === 'en' ? 'Search member...' : 'कार्यकर्ता शोधा...'} className="rounded-xl border border-slate-300 py-2 pl-9 pr-3 text-xs outline-none focus:border-amber-500" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs sm:text-sm">
            <thead className="bg-amber-50 text-amber-950"><tr><th className="px-4 py-3">#</th><th className="px-4 py-3">{language === 'en' ? 'Member' : 'कार्यकर्ता'}</th><th className="px-4 py-3 text-right">{language === 'en' ? 'Receipts' : 'पावत्या'}</th><th className="px-4 py-3 text-right">{language === 'en' ? 'Paid' : 'जमा'}</th><th className="px-4 py-3 text-right">{language === 'en' ? 'Pending' : 'बाकी'}</th><th className="px-4 py-3 text-right">{language === 'en' ? 'Today' : 'आज'}</th><th className="px-4 py-3 text-right">{language === 'en' ? 'Share' : 'हिस्सा'}</th></tr></thead>
            <tbody className="divide-y divide-slate-100">
              {members.map((member, index) => {
                const share = totalCollected > 0 ? ((member.paidAmount || 0) / totalCollected) * 100 : 0;
                return <tr key={member.userId} className="hover:bg-amber-50/40"><td className="px-4 py-3 font-black text-amber-700">{index + 1}</td><td className="px-4 py-3"><p className="font-bold text-slate-900">{member.name}</p><p className="text-[11px] uppercase text-slate-500">{member.role}</p></td><td className="px-4 py-3 text-right font-mono font-bold">{member.totalCount}</td><td className="px-4 py-3 text-right font-mono font-bold text-emerald-700">₹{(member.paidAmount || 0).toLocaleString('en-IN')}</td><td className="px-4 py-3 text-right font-mono font-bold text-amber-700">₹{(member.unpaidAmount || 0).toLocaleString('en-IN')}</td><td className="px-4 py-3 text-right font-mono">₹{member.todayAmount.toLocaleString('en-IN')}</td><td className="px-4 py-3 text-right font-black text-slate-700">{share.toFixed(1)}%</td></tr>;
              })}
              {!loading && members.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">{language === 'en' ? 'No matching members found.' : 'कोणताही कार्यकर्ता सापडला नाही.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

const Summary: React.FC<{ label: string; value: string; icon: React.ReactNode }> = ({ label, value, icon }) => <div className="rounded-2xl border border-amber-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-amber-700">{icon}<span className="text-xs font-bold uppercase">{label}</span></div><p className="mt-2 text-2xl font-black text-slate-900">{value}</p></div>;
