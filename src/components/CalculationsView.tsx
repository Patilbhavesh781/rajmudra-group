import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { CalculationsData, CollectorStat } from '../types';
import {
  BarChart3,
  TrendingUp,
  Receipt,
  Wallet,
  Coins,
  IndianRupee,
  Users,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  RefreshCw,
  Award,
  ChevronRight,
  PiggyBank,
  ArrowDownRight,
  CreditCard,
  Smartphone,
  Building,
  FileCheck,
  ShieldCheck,
  UserCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CalculationsViewProps {
  onOpenNewPavti: () => void;
  onViewReceipts: () => void;
}

export const CalculationsView: React.FC<CalculationsViewProps> = ({ onOpenNewPavti, onViewReceipts }) => {
  const { authFetch, user } = useAuth();
  const { language, t } = useLanguage();
  const [data, setData] = useState<CalculationsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  const fetchCalculations = async () => {
    try {
      setRefreshing(true);
      const res = await authFetch('/api/pavti/calculations');
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error fetching calculations:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCalculations();
    // Auto refresh every 8 seconds for real-time live synchronization
    const interval = setInterval(fetchCalculations, 8000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !data) {
    return (
      <div className="py-20 text-center text-amber-900">
        <RefreshCw className="w-9 h-9 animate-spin mx-auto text-amber-600 mb-3" />
        <p className="font-bold text-sm sm:text-base">
          {language === 'en' ? 'Loading live financial dashboard...' : 'थेट आर्थिक डॅशबोर्ड व हिशोब लोड होत आहे...'}
        </p>
      </div>
    );
  }

  const mandal = data?.mandalTotal || {
    totalAmount: 0,
    paidAmount: 0,
    unpaidAmount: 0,
    paidCount: 0,
    unpaidCount: 0,
    totalReceipts: 0,
    todayAmount: 0,
    todayPaidAmount: 0,
    todayUnpaidAmount: 0,
    todayCount: 0,
    totalExpenses: 0,
    balanceInHand: 0,
    date: new Date().toISOString().split('T')[0],
  };

  const userStats = data?.userPersonalStats;
  const modes = data?.paymentModes;
  const categories = data?.categories;
  const collectors = data?.collectors || [];

  return (
    <div className="space-y-5 max-w-full overflow-x-hidden">
      {/* Top Banner with Mandal Branding & Live Sync */}
      <div className="bg-gradient-to-br from-amber-900 via-amber-800 to-orange-950 rounded-2xl sm:rounded-3xl p-4 sm:p-6 text-white shadow-lg border border-amber-500/40 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-amber-950 uppercase tracking-wider shadow-xs">
                {language === 'en' ? 'Live Accounting' : 'थेट रिअल-टाइम हिशोब'}
              </span>
              <span className="text-xs text-amber-200 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-amber-300" />
                {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : ''}
              </span>
              <span className="text-xs text-amber-300/80 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-600/30">
                {user?.role === 'admin' ? (language === 'en' ? '👑 Admin View' : '👑 ॲडमिन डॅशबोर्ड') : (language === 'en' ? '🚩 Volunteer View' : '🚩 कार्यकर्ता डॅशबोर्ड')}
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-white font-serif mt-1 tracking-tight">
              {language === 'en' ? 'Mandal Financial Dashboard' : 'राजमुद्रा गणपती मंडळ आर्थिक डॅशबोर्ड'}
            </h2>
            <p className="text-xs sm:text-sm text-amber-200/90 max-w-2xl mt-0.5">
              {language === 'en'
                ? 'Overview of total collected donations, used expenses, pending balances, and collector breakdown.'
                : 'एकूण जमा देणगी, झालेला खर्च, प्रलंबित बाकी आणि कार्यकर्त्यांचे सविस्तर हिशोब विश्लेषण.'}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
            <button
              onClick={fetchCalculations}
              disabled={refreshing}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-950/70 hover:bg-amber-950 text-amber-200 rounded-xl text-xs font-semibold border border-amber-600/40 transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-amber-300' : ''}`} />
              <span>{t('action_refresh')}</span>
            </button>
            <button
              onClick={onOpenNewPavti}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-300 hover:to-orange-300 text-amber-950 font-bold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer transform active:scale-95"
            >
              <span>{t('tab_new_pavti')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 PRIMARY METRIC TILES: Total Collected, Used/Expenses, Net In Hand, Pending */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        
        {/* 1. TOTAL DONATION COLLECTION (एकूण जमा देणगी) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-200 hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {language === 'en' ? 'Total Collection' : 'एकूण देणगी संकलन'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-slate-900 font-mono tracking-tight">
            ₹{mandal.totalAmount.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>{t('stat_total_receipts')}:</span>
            <strong className="text-slate-800 font-bold font-mono">{mandal.totalReceipts}</strong>
          </div>
        </div>

        {/* 2. TOTAL USED AMOUNT / EXPENSES (एकूण झालेला खर्च) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-red-200 hover:border-red-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-red-700 uppercase tracking-wider">
              {language === 'en' ? 'Total Used (Expenses)' : 'एकूण झालेला खर्च (Used)'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center text-red-700">
              <ArrowDownRight className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-red-950 font-mono tracking-tight">
            ₹{mandal.totalExpenses.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>{language === 'en' ? 'Mandal Utilities & Decor' : 'उत्सव व मंडप खर्च'}</span>
            <strong className="text-red-700 font-bold font-mono">
              {mandal.paidAmount > 0 ? `${((mandal.totalExpenses / mandal.paidAmount) * 100).toFixed(0)}%` : '0%'}
            </strong>
          </div>
        </div>

        {/* 3. NET BALANCE IN HAND (मंडळाकडे शिल्लक रक्कम = जमा - खर्च) */}
        <div className="bg-gradient-to-br from-emerald-800 to-teal-900 rounded-2xl p-4 sm:p-5 text-white shadow-xs hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              {language === 'en' ? 'Net Balance In Hand' : 'मंडळाकडे शिल्लक रक्कम'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-700/60 flex items-center justify-center text-emerald-200">
              <PiggyBank className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-white font-mono tracking-tight">
            ₹{mandal.balanceInHand.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-emerald-200/90 pt-2 border-t border-emerald-700/60">
            <span>{language === 'en' ? `₹${mandal.paidAmount.toLocaleString('en-IN')} − ₹${mandal.totalExpenses.toLocaleString('en-IN')}` : `₹${mandal.paidAmount.toLocaleString('en-IN')} − ₹${mandal.totalExpenses.toLocaleString('en-IN')}`}</span>
            <strong className="text-amber-300 font-bold font-mono">✓ Verified</strong>
          </div>
        </div>

        {/* 4. PENDING / UNPAID PLEDGES (प्रलंबित / बाकी देणगी) */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-300 hover:border-amber-400 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">
              {language === 'en' ? 'Pending (Unpaid Pledges)' : 'बाकी / प्रलंबित देणगी (Pending)'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800">
              <AlertCircle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black text-amber-950 font-mono tracking-tight">
            ₹{mandal.unpaidAmount.toLocaleString('en-IN')}
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>{language === 'en' ? 'Pending Receipts:' : 'बाकी पावत्या:'}</span>
            <strong className="text-amber-800 font-bold font-mono">{mandal.unpaidCount}</strong>
          </div>
        </div>
      </div>

      {/* LIVE FINANCIAL BALANCE AUDIT EQUATION (हिशोब ताळेबंद व स्पष्टीकरण) */}
      <div className="bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-amber-200">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold text-xs">
              ₹
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 font-serif">
                {language === 'en' ? 'Live Balance Audit Equation' : 'थेट हिशोब ताळेबंद व गणितीय पडताळणी'}
              </h3>
              <p className="text-[11px] text-slate-600">
                {language === 'en'
                  ? 'Transparent calculation formula: Net Balance = Total Received (Paid) − Total Expenses'
                  : 'हिशोब सूत्र: शिल्लक रक्कम = प्रत्यक्ष जमा देणगी (Paid) − एकूण झालेला खर्च (Expenses)'}
              </p>
            </div>
          </div>

          <div className="text-xs font-mono font-bold bg-white px-3 py-1.5 rounded-xl border border-amber-300 text-amber-950 shadow-xs flex items-center gap-2">
            <span className="text-emerald-700">₹{mandal.paidAmount.toLocaleString('en-IN')} (जमा)</span>
            <span className="text-red-600">− ₹{mandal.totalExpenses.toLocaleString('en-IN')} (खर्च)</span>
            <span className="text-slate-400">=</span>
            <span className="text-emerald-900 font-extrabold bg-emerald-100 px-2 py-0.5 rounded-lg">₹{mandal.balanceInHand.toLocaleString('en-IN')} शिल्लक</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-1">
          <div className="bg-white/80 p-3 rounded-xl border border-amber-200">
            <div className="text-[11px] font-bold text-emerald-800 uppercase">{language === 'en' ? '1. Total Received (Paid)' : '१. प्रत्यक्ष जमा रक्कम'}</div>
            <div className="text-lg font-black text-emerald-950 font-mono mt-0.5">₹{mandal.paidAmount.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-slate-500 mt-1">{mandal.paidCount} {language === 'en' ? 'paid receipts received' : 'पावत्यांची रक्कम जमा'}</div>
          </div>

          <div className="bg-white/80 p-3 rounded-xl border border-red-200">
            <div className="text-[11px] font-bold text-red-800 uppercase">{language === 'en' ? '2. Total Used (Expenses)' : '२. एकूण झालेला खर्च'}</div>
            <div className="text-lg font-black text-red-950 font-mono mt-0.5">− ₹{mandal.totalExpenses.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-slate-500 mt-1">{language === 'en' ? 'Mandap, sound, prasad & decor' : 'मंडप, ध्वनी, प्रसाद, विसर्जन'}</div>
          </div>

          <div className="bg-emerald-900 text-white p-3 rounded-xl shadow-xs">
            <div className="text-[11px] font-bold text-emerald-300 uppercase">{language === 'en' ? '3. Net In Hand (Cash + Bank)' : '३. मंडळाकडे शिल्लक (Net In Hand)'}</div>
            <div className="text-lg font-black text-amber-300 font-mono mt-0.5">₹{mandal.balanceInHand.toLocaleString('en-IN')}</div>
            <div className="text-[10px] text-emerald-200 mt-1">
              {language === 'en'
                ? `Math proof: ₹${mandal.balanceInHand.toLocaleString('en-IN')} + ₹${mandal.totalExpenses.toLocaleString('en-IN')} = ₹${mandal.paidAmount.toLocaleString('en-IN')}`
                : `पडताळा: ₹${mandal.balanceInHand.toLocaleString('en-IN')} + ₹${mandal.totalExpenses.toLocaleString('en-IN')} = ₹${mandal.paidAmount.toLocaleString('en-IN')}`}
            </div>
          </div>
        </div>
      </div>

      {/* TODAY'S ACTIVITY & LOGGED-IN VOLUNTEER'S SUMMARY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        
        {/* Today's Collection Card */}
        <div className="lg:col-span-6 bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold text-slate-800">
                {t('stat_today_collection')} ({mandal.date})
              </h3>
            </div>
            <span className="text-xs font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-mono">
              {mandal.todayCount} {language === 'en' ? 'Pavtis' : 'पावत्या'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-slate-900 font-mono">
              ₹{mandal.todayAmount.toLocaleString('en-IN')}
            </span>
            <span className="text-xs text-slate-500">{language === 'en' ? 'collected today' : 'आजचे एकूण संकलन'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
            <div className="bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
              <div className="text-emerald-700 font-medium">{language === 'en' ? 'Today Paid (Received):' : 'आज जमा (रोख/UPI):'}</div>
              <div className="text-base font-extrabold text-emerald-950 font-mono">₹{(mandal.todayPaidAmount || 0).toLocaleString('en-IN')}</div>
            </div>
            <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100">
              <div className="text-amber-800 font-medium">{language === 'en' ? 'Today Pending:' : 'आज बाकी:'}</div>
              <div className="text-base font-extrabold text-amber-950 font-mono">₹{(mandal.todayUnpaidAmount || 0).toLocaleString('en-IN')}</div>
            </div>
          </div>
        </div>

        {/* Logged in User Contribution Card */}
        <div className="lg:col-span-6 bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-700" />
              <h3 className="text-sm font-bold text-amber-950">
                {t('stat_my_contribution')}: <span className="font-extrabold underline">{user?.name}</span>
              </h3>
            </div>
            <span className="text-xs font-bold bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-mono">
              {userStats?.mandalContributionPercentage || '0%'} {language === 'en' ? 'Share' : 'वाटा'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200">
              <div className="text-[11px] text-slate-500 font-semibold">{language === 'en' ? 'Total' : 'एकूण संकलन'}</div>
              <div className="text-base sm:text-lg font-black text-amber-950 font-mono">
                ₹{(userStats?.totalAmount || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-emerald-200">
              <div className="text-[11px] text-emerald-700 font-semibold">{language === 'en' ? 'Paid' : 'जमा'}</div>
              <div className="text-base sm:text-lg font-black text-emerald-950 font-mono">
                ₹{(userStats?.paidAmount || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="bg-white/90 p-2.5 rounded-xl border border-amber-200">
              <div className="text-[11px] text-amber-800 font-semibold">{language === 'en' ? 'Pending' : 'बाकी'}</div>
              <div className="text-base sm:text-lg font-black text-amber-950 font-mono">
                ₹{(userStats?.unpaidAmount || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-amber-900 pt-2 border-t border-amber-200/70">
            <span>{language === 'en' ? 'My today generated:' : 'माझ्याद्वारे आज फाडलेल्या:'} <strong>{userStats?.todayCount || 0}</strong> {language === 'en' ? 'Pavtis' : 'पावत्या'}</span>
            <span className="font-bold font-mono">₹{(userStats?.todayAmount || 0).toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* DETAILED USER/VOLUNTEER COLLECTION BREAKDOWN (Which user collected how much with payment types & statuses) */}
      <div className="bg-white rounded-2xl p-4 sm:p-6 shadow-xs border border-amber-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2 font-serif">
              <Users className="w-5 h-5 text-amber-700" />
              {language === 'en' ? 'Volunteer & Admin Collection Breakdown' : 'कार्यकर्ते व ॲडमिननिहाय संकलन, पेमेंट प्रकार व स्थिती'}
            </h3>
            <p className="text-xs text-slate-500">
              {language === 'en'
                ? 'Individual collection amounts, payment type breakdown (Cash, UPI, Bank, Cheque), and paid vs pending status.'
                : 'प्रत्येक कार्यकर्त्याने गोळा केलेली रक्कम, पेमेंट प्रकार (रोख, युपीआय, बँक, धनादेश) आणि जमा/बाकी स्थितीचा सविस्तर हिशोब.'}
            </p>
          </div>
          <button
            onClick={onViewReceipts}
            className="text-xs font-bold text-amber-800 hover:text-amber-900 hover:underline flex items-center gap-1 self-start sm:self-auto cursor-pointer"
          >
            <span>{language === 'en' ? 'View All Receipts List →' : 'सर्व पावत्या यादी पाहा →'}</span>
          </button>
        </div>

        {/* Responsive Grid of Collector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {collectors.map((c, idx) => {
            const isMe = c.userId === user?.id;
            const isExpanded = expandedUser === c.userId;
            const paidPct = c.totalAmount > 0 ? (( (c.paidAmount || 0) / c.totalAmount) * 100).toFixed(0) : '0';

            return (
              <div
                key={c.userId}
                className={`rounded-2xl border transition-all ${
                  isMe
                    ? 'border-amber-400 bg-amber-50/40 shadow-xs ring-1 ring-amber-300'
                    : 'border-slate-200 bg-white hover:border-slate-300 shadow-xs'
                }`}
              >
                {/* Header */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                        {idx + 1}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 flex items-center gap-1.5 flex-wrap">
                          <span>{c.name}</span>
                          {isMe && (
                            <span className="text-[10px] bg-amber-200 text-amber-950 px-1.5 py-0.2 rounded font-bold">
                              {language === 'en' ? 'You' : 'तुम्ही'}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono">
                          <span>{c.phone || '-'}</span>
                          <span>•</span>
                          <span className={`font-bold ${c.role === 'admin' ? 'text-amber-700' : 'text-orange-700'}`}>
                            {c.role === 'admin' ? t('role_admin') : t('role_user')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-base sm:text-lg font-black text-slate-900 font-mono">
                        ₹{c.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {c.totalCount} {language === 'en' ? 'Pavtis' : 'पावत्या'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Status & Payment Modes Summary */}
                <div className="p-3.5 space-y-2.5">
                  {/* Paid vs Pending Status Row */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-emerald-50/80 p-2 rounded-xl border border-emerald-100">
                      <div className="text-emerald-700 font-semibold flex items-center justify-between text-[11px]">
                        <span>{language === 'en' ? 'Paid (जमा)' : 'जमा (Paid)'}</span>
                        <span className="font-bold font-mono">{c.paidCount || 0}</span>
                      </div>
                      <div className="text-sm font-extrabold text-emerald-950 font-mono mt-0.5">
                        ₹{(c.paidAmount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-200">
                      <div className="text-amber-800 font-semibold flex items-center justify-between text-[11px]">
                        <span>{language === 'en' ? 'Pending (बाकी)' : 'बाकी (Pending)'}</span>
                        <span className="font-bold font-mono">{c.unpaidCount || 0}</span>
                      </div>
                      <div className="text-sm font-extrabold text-amber-950 font-mono mt-0.5">
                        ₹{(c.unpaidAmount || 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  {/* Payment Type Breakdown (Cash, UPI, Online, Cheque) */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                      <span>{language === 'en' ? 'Payment Types' : 'पेमेंट प्रकार'}</span>
                      <span className="text-[10px] font-mono text-emerald-700">{paidPct}% paid</span>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 flex items-center gap-1">💵 {language === 'en' ? 'Cash' : 'रोख'}</span>
                        <span className="font-bold font-mono text-slate-900">₹{(c.modes?.cash || 0).toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 flex items-center gap-1">📱 {language === 'en' ? 'UPI' : 'युपीआय'}</span>
                        <span className="font-bold font-mono text-slate-900">₹{(c.modes?.upi || 0).toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 flex items-center gap-1">🏦 {language === 'en' ? 'Bank' : 'बँक'}</span>
                        <span className="font-bold font-mono text-slate-900">₹{(c.modes?.online || 0).toLocaleString('en-IN')}</span>
                      </div>

                      <div className="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-slate-600 flex items-center gap-1">📑 {language === 'en' ? 'Cheque' : 'धनादेश'}</span>
                        <span className="font-bold font-mono text-slate-900">₹{(c.modes?.cheque || 0).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Today's contribution by this collector */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                    <span>{language === 'en' ? "Today's Pavtis:" : 'आजचे संकलन:'} <strong>{c.todayCount}</strong></span>
                    <span className="font-bold font-mono text-slate-800">₹{c.todayAmount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* OVERALL PAYMENT MODES & CATEGORIES BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        
        {/* Payment Modes */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-200">
          <h3 className="text-sm font-bold text-slate-900 mb-3 font-serif flex items-center gap-1.5">
            <Wallet className="w-4 h-4 text-amber-700" />
            {t('payment_modes_title')}
          </h3>

          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <div>
                <span className="font-bold text-emerald-950">{t('mode_cash')}</span>
                <div className="text-[10px] text-emerald-700">{modes?.cash?.count || 0} {language === 'en' ? 'Pavtis' : 'पावत्या'}</div>
              </div>
              <div className="font-mono font-extrabold text-emerald-950 text-sm">
                ₹{(modes?.cash?.amount || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-blue-50 border border-blue-100">
              <div>
                <span className="font-bold text-blue-950">{t('mode_upi')}</span>
                <div className="text-[10px] text-blue-700">{modes?.upi?.count || 0} {language === 'en' ? 'Pavtis' : 'पावत्या'}</div>
              </div>
              <div className="font-mono font-extrabold text-blue-950 text-sm">
                ₹{(modes?.upi?.amount || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-purple-50 border border-purple-100">
              <div>
                <span className="font-bold text-purple-950">{t('mode_online')}</span>
                <div className="text-[10px] text-purple-700">{modes?.online?.count || 0} {language === 'en' ? 'Pavtis' : 'पावत्या'}</div>
              </div>
              <div className="font-mono font-extrabold text-purple-950 text-sm">
                ₹{(modes?.online?.amount || 0).toLocaleString('en-IN')}
              </div>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-xl bg-amber-50 border border-amber-100">
              <div>
                <span className="font-bold text-amber-950">{t('mode_cheque')}</span>
                <div className="text-[10px] text-amber-700">{modes?.cheque?.count || 0} {language === 'en' ? 'Pavtis' : 'पावत्या'}</div>
              </div>
              <div className="font-mono font-extrabold text-amber-950 text-sm">
                ₹{(modes?.cheque?.amount || 0).toLocaleString('en-IN')}
              </div>
            </div>
          </div>
        </div>

        {/* Donation Categories Breakdown */}
        <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-200">
          <h3 className="text-sm font-bold text-slate-900 mb-3 font-serif flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-700" />
            {t('categories_title')}
          </h3>

          <div className="space-y-2 text-xs">
            {categories && Object.keys(categories).length > 0 ? (
              Object.entries(categories).map(([catName, catData]: [string, { amount: number; count: number }]) => (
                <div key={catName} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <div className="font-bold text-slate-800">{catName}</div>
                    <div className="text-[10px] text-slate-500">{catData.count} {language === 'en' ? 'receipts' : 'पावत्या'}</div>
                  </div>
                  <div className="font-mono font-extrabold text-amber-950 text-sm">
                    ₹{catData.amount.toLocaleString('en-IN')}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs">
                {language === 'en' ? 'No category records yet' : 'अद्याप देणगी नोंदी उपलब्ध नाहीत'}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
