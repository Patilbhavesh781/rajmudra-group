import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Pavti } from '../types';
import { MANDAL_CONFIG } from '../../shared/mandalConfig';
import {
  Search,
  Receipt,
  Eye,
  Share2,
  Trash2,
  Calendar,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  ArrowRightLeft,
  Phone,
  MapPin,
  User as UserIcon,
  Tag
} from 'lucide-react';

interface PavtiListViewProps {
  onViewReceipt: (pavti: Pavti) => void;
  onOpenNewPavti: () => void;
  unpaidOnly?: boolean;
}

export const PavtiListView: React.FC<PavtiListViewProps> = ({ onViewReceipt, onOpenNewPavti, unpaidOnly = false }) => {
  const { authFetch, user } = useAuth();
  const { language, t, getWordsForAmount } = useLanguage();

  const [pavtis, setPavtis] = useState<Pavti[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modeFilter, setModeFilter] = useState('all');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState(unpaidOnly ? 'unpaid' : 'all');
  const [onlyMine, setOnlyMine] = useState(false);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const fetchPavtis = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (modeFilter !== 'all') params.set('paymentMode', modeFilter);
      if (paymentStatusFilter !== 'all') params.set('paymentStatus', paymentStatusFilter);
      if (onlyMine) params.set('onlyMine', 'true');
      if (dateFilter) params.set('date', dateFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);

      const res = await authFetch(`/api/pavti/list?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setPavtis(data);
      }
    } catch (err) {
      console.error('Error fetching pavtis:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch, search, modeFilter, paymentStatusFilter, onlyMine, dateFilter, statusFilter]);

  useEffect(() => {
    fetchPavtis();
  }, [fetchPavtis]);

  // Status toggle handler - ADMIN ONLY
  const handleTogglePaymentStatus = async (receiptNo: string, currentStatus: 'paid' | 'unpaid') => {
    if (user?.role !== 'admin' && !user?.canUpdateReceiptStatus) {
      alert(t('list_admin_only_change_alert'));
      return;
    }

    const nextStatus = currentStatus === 'paid' ? 'unpaid' : 'paid';
    const confirmPrompt = language === 'en'
      ? `Change Receipt #${receiptNo} payment status from ${currentStatus.toUpperCase()} to ${nextStatus.toUpperCase()}?`
      : `पावती क्र. ${receiptNo} ची स्थिती '${currentStatus === 'paid' ? 'जमा (PAID)' : 'बाकी (UNPAID)'}' वरून '${nextStatus === 'paid' ? 'जमा (PAID)' : 'बाकी (UNPAID)'}' करायची आहे का?`;

    if (!window.confirm(confirmPrompt)) return;

    setStatusUpdatingId(receiptNo);
    try {
      const res = await authFetch('/api/pavti/update-payment-status', {
        method: 'POST',
        body: JSON.stringify({
          receiptNo,
          paymentStatus: nextStatus,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setActionMessage(`✓ ${data.message || 'Status updated'}`);
        setTimeout(() => setActionMessage(null), 3500);
        fetchPavtis();
      } else {
        alert(data.error || 'Failed to update payment status');
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setStatusUpdatingId(null);
    }
  };

  const handleCancelPavti = async (receiptNo: string) => {
    const reasonPrompt = language === 'en'
      ? `Enter reason for cancelling Receipt #${receiptNo}:`
      : `पावती क्र. ${receiptNo} रद्द करण्याचे कारण प्रविष्ट करा:`;

    const reason = window.prompt(reasonPrompt);
    if (!reason) return;

    try {
      const res = await authFetch('/api/pavti/cancel', {
        method: 'POST',
        body: JSON.stringify({ receiptNo, reason }),
      });
      if (res.ok) {
        alert(language === 'en' ? `Receipt #${receiptNo} cancelled successfully.` : `पावती क्र. ${receiptNo} यशस्वीरित्या रद्द करण्यात आली.`);
        fetchPavtis();
      } else {
        const data = await res.json();
        alert('Error: ' + (data.error || 'Failed to cancel receipt'));
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleWhatsAppDirect = (p: Pavti) => {
    const isPaid = p.paymentStatus !== 'unpaid';
    const formattedAmount = p.amount.toLocaleString('en-IN');
    const words = language === 'en'
      ? (p.amountInEnglishWords || getWordsForAmount(p.amount))
      : (p.amountInWords || getWordsForAmount(p.amount));

    let msg = '';
    if (language === 'en') {
      msg = 
`🚩 *RAJMUDRA GANPATI MANDAL* 🚩
*॥ Shree Ganeshay Namah ॥ ॥ Ganpati Bappa Morya ॥*

Dear *${p.donorName}*,
Thank you for your generous Ganesh Festival donation / vargani.

📜 *Receipt Details:*
• *Receipt No:* ${p.receiptNo}
• *Date:* ${p.date}
• *Amount:* ₹${formattedAmount}/- (${words})
• *Payment Status:* ${isPaid ? 'PAID (Received)' : 'UNPAID / PLEDGED'}
• *Payment Mode:* ${p.paymentMode.toUpperCase()}
• *Collector:* ${p.collectedBy?.name || 'Volunteer'}

May Lord Ganesha bless you and your family!
*॥ Ganpati Bappa Morya, Mangalmurti Morya ॥*`;
    } else {
      msg = 
`🚩 *${MANDAL_CONFIG.name.mr}* 🚩
*॥ ॐ गं गणपतये नमः ॥*

प्रिय श्री/सौ. *${p.donorName}*,
गणेशोत्सवासाठी आपली वर्गणी/देणगी नोंदवली गेली आहे.

📜 *पावती तपशील:*
• *पावती क्र:* ${p.receiptNo}
• *दिनांक:* ${p.date}
• *रक्कम:* ₹${formattedAmount}/- (${words})
• *पेमेंट स्थिती:* ${isPaid ? 'जमा (PAID)' : 'बाकी / प्रलंबित (UNPAID)'}
• *पेमेंट प्रकार:* ${p.paymentMode === 'upi' ? 'युपीआय (UPI)' : p.paymentMode === 'cash' ? 'रोख (Cash)' : p.paymentMode.toUpperCase()}
• *पावती देणारा:* ${p.collectedBy?.name || 'मंडळ प्रतिनिधी'}

${MANDAL_CONFIG.name.mr} आपले मनःपूर्वक आभार मानत आहे!
*॥ गणपती बाप्पा मोरया, मंगलमूर्ती मोरया ॥*`;
    }

    const encoded = encodeURIComponent(msg);
    const rawPhone = p.donorPhone ? p.donorPhone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
    const url = cleanPhone ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const totalFilteredAmount = pavtis
    .filter((p) => p.status === 'active')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const paidFilteredAmount = pavtis
    .filter((p) => p.status === 'active' && p.paymentStatus !== 'unpaid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const unpaidFilteredAmount = pavtis
    .filter((p) => p.status === 'active' && p.paymentStatus === 'unpaid')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  return (
    <div className="space-y-4 max-w-full overflow-x-hidden">
      {/* Top Banner Notice if Action Completed */}
      {actionMessage && (
        <div className="bg-emerald-50 border-l-4 border-emerald-500 p-3 rounded-xl flex items-center gap-2 text-emerald-800 text-xs sm:text-sm font-semibold shadow-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Top Header & Filter Controls */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-amber-200">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex items-center gap-2 font-serif">
              <Receipt className="w-5 h-5 text-amber-700" />
              {unpaidOnly ? (language === 'en' ? 'Pending / Unpaid Receipts' : 'बाकी / प्रलंबित पावत्या') : t('list_title')}
            </h2>
            <p className="text-xs text-slate-500">
              {unpaidOnly
                ? (language === 'en' ? 'Follow up pending donations and mark them paid after collection.' : 'येणे बाकी असलेल्या देणग्यांचा पाठपुरावा करा आणि रक्कम मिळाल्यानंतर जमा म्हणून नोंदवा.')
                : t('list_subtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchPavtis}
              className="p-2 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl transition border border-slate-200 cursor-pointer"
              title={t('action_refresh')}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onOpenNewPavti}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs sm:text-sm font-bold px-3.5 py-2 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1.5"
            >
              <span>{t('tab_new_pavti')}</span>
            </button>
          </div>
        </div>

        {/* Search Inputs & Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-2.5">
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('list_search_ph')}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-xs sm:text-sm"
            />
          </div>

          {/* Payment Mode Filter */}
          {!unpaidOnly && <div className="lg:col-span-2">
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 text-xs bg-white"
            >
              <option value="all">{t('list_all_modes')}</option>
              <option value="cash">{t('mode_cash')}</option>
              <option value="upi">{t('mode_upi')}</option>
              <option value="online">{t('mode_online')}</option>
              <option value="cheque">{t('mode_cheque')}</option>
            </select>
          </div>}

          {/* Payment Status Filter */}
          <div className="lg:col-span-2">
            <select
              value={paymentStatusFilter}
              onChange={(e) => setPaymentStatusFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 text-xs bg-white font-medium"
            >
              <option value="all">{language === 'en' ? 'All Payment Status' : 'सर्व पेमेंट स्थिती'}</option>
              <option value="paid">{language === 'en' ? '✓ Paid (Received)' : '✓ फक्त जमा (Paid)'}</option>
              <option value="unpaid">{language === 'en' ? '⏳ Unpaid (Pending)' : '⏳ फक्त बाकी (Unpaid)'}</option>
            </select>
          </div>

          {/* Date Filter */}
          <div className="lg:col-span-2">
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 text-xs bg-white"
            />
          </div>

          {/* My Only Filter */}
          <div className="lg:col-span-2 flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setOnlyMine(!onlyMine)}
              className={`flex-1 py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer text-center whitespace-nowrap ${
                onlyMine
                  ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
              }`}
            >
              {onlyMine ? `✓ ${t('list_my_only')}` : t('list_my_only')}
            </button>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-2 py-2 rounded-xl border border-slate-300 text-xs bg-white"
            >
              <option value="active">{t('status_active')}</option>
              <option value="cancelled">{t('status_cancelled')}</option>
              <option value="all">{t('action_all')}</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Stats */}
        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div>
              {t('list_total_found')} <strong className="text-slate-900 font-bold">{pavtis.length}</strong>
            </div>
            {onlyMine && (
              <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded text-[11px]">
                {user?.name} ({t('list_my_only')})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="bg-emerald-50 text-emerald-900 px-2.5 py-1 rounded-lg border border-emerald-200 font-bold text-xs">
              {language === 'en' ? 'Paid:' : 'जमा:'} <span className="font-mono font-extrabold text-emerald-950">₹{paidFilteredAmount.toLocaleString('en-IN')}</span>
            </div>

            {unpaidFilteredAmount > 0 && (
              <div className="bg-amber-50 text-amber-900 px-2.5 py-1 rounded-lg border border-amber-200 font-bold text-xs">
                {language === 'en' ? 'Pending:' : 'बाकी:'} <span className="font-mono font-extrabold text-amber-950">₹{unpaidFilteredAmount.toLocaleString('en-IN')}</span>
              </div>
            )}

            <div className="bg-amber-100 text-amber-950 px-3 py-1 rounded-lg border border-amber-300 font-bold">
              {t('list_filtered_total')} <span className="text-sm font-extrabold font-mono text-amber-950">₹{totalFilteredAmount.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RESPONSIVE CARDS VIEW FOR MOBILE & TABLET (No Horizontal Scroll) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {pavtis.map((p) => {
          const isCancelled = p.status === 'cancelled';
          const isPaid = p.paymentStatus !== 'unpaid';
          const isUpdating = statusUpdatingId === p.receiptNo;

          return (
            <div
              key={p._id || p.receiptNo}
              className={`bg-white rounded-2xl border transition-all shadow-xs flex flex-col justify-between ${
                isCancelled
                  ? 'border-red-200 bg-red-50/20 opacity-75'
                  : 'border-amber-200 hover:border-amber-300 hover:shadow-sm'
              }`}
            >
              <div className="p-4">
                {/* Top Row: Receipt No + Status Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-mono font-black text-amber-900 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                      #{p.receiptNo}
                    </span>
                    {isCancelled && (
                      <span className="text-[10px] bg-red-100 text-red-700 font-bold px-1.5 py-0.5 rounded">
                        {t('status_cancelled')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {/* Paid/Unpaid Badge */}
                    {isPaid ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>{language === 'en' ? 'PAID' : 'जमा'}</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                        <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                        <span>{language === 'en' ? 'UNPAID' : 'बाकी'}</span>
                      </span>
                    )}

                    {/* Admin Status Toggle Button */}
                    {(user?.role === 'admin' || user?.canUpdateReceiptStatus) && !isCancelled && (
                      <button
                        type="button"
                        onClick={() => handleTogglePaymentStatus(p.receiptNo, isPaid ? 'paid' : 'unpaid')}
                        disabled={isUpdating}
                        className="p-1 text-slate-500 hover:text-amber-800 hover:bg-amber-100 rounded-lg transition cursor-pointer"
                        title={isPaid ? (language === 'en' ? 'Admin: Change to UNPAID' : 'ॲडमिन अधिकार: अनपेड (बाकी) करा') : (language === 'en' ? 'Admin: Change to PAID' : 'ॲडमिन अधिकार: पेड (जमा) करा')}
                      >
                        <ArrowRightLeft className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin text-amber-600' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Donor & Amount Details */}
                <div className="flex items-start justify-between gap-2 mt-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {p.donorName}
                    </h3>
                    {p.donorPhone && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{p.donorPhone}</span>
                      </div>
                    )}
                    {p.donorAddress && (
                      <div className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{p.donorAddress}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-lg font-black text-slate-900 font-mono">
                      ₹{Number(p.amount || 0).toLocaleString('en-IN')}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {p.date}
                    </div>
                  </div>
                </div>

                {/* Category & Payment Mode Tags */}
                <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-slate-100 text-[11px]">
                  <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                    {p.donationCategory || 'उत्सव वर्गणी'}
                  </span>

                  {p.paymentMode === 'cash' && (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                      {t('mode_cash')}
                    </span>
                  )}
                  {p.paymentMode === 'upi' && (
                    <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                      {t('mode_upi')}
                    </span>
                  )}
                  {p.paymentMode === 'online' && (
                    <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                      {t('mode_online')}
                    </span>
                  )}
                  {p.paymentMode === 'cheque' && (
                    <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                      {t('mode_cheque')}
                    </span>
                  )}

                  <span className="text-slate-400 text-[10px] ml-auto">
                    {p.collectedBy?.name || 'कार्यकर्ता'}
                  </span>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="p-2.5 bg-amber-50/50 border-t border-amber-100 rounded-b-2xl flex items-center justify-between gap-2">
                <button
                  onClick={() => onViewReceipt(p)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{t('action_view_print')}</span>
                </button>

                <button
                  onClick={() => handleWhatsAppDirect(p)}
                  className="flex items-center justify-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-2xs"
                  title={t('action_share_wp')}
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                {!isCancelled && (user?.role === 'admin' || p.collectedBy?.userId === user?.id) && (
                  <button
                    onClick={() => handleCancelPavti(p.receiptNo)}
                    className="p-1.5 text-red-500 hover:bg-red-50 hover:text-red-700 rounded-xl transition cursor-pointer border border-transparent hover:border-red-200"
                    title={t('action_cancel')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {pavtis.length === 0 && !loading && (
        <div className="bg-white rounded-2xl p-12 text-center text-slate-400 border border-amber-200">
          <Receipt className="w-12 h-12 mx-auto text-amber-300 mb-3" />
          <h3 className="font-bold text-slate-700 text-base">{t('list_no_records')}</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {language === 'en'
              ? 'Try changing your search keywords, payment mode filters, or create a new receipt.'
              : 'शोध निकष किंवा फिल्टर्स बदला अथवा नवीन पावती नोंदवा.'}
          </p>
        </div>
      )}
    </div>
  );
};
