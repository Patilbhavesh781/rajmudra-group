import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { MANDAL_CONFIG } from '../../shared/mandalConfig';
import { Pavti } from '../types';
import {
  Receipt,
  IndianRupee,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  FileText
} from 'lucide-react';

interface NewPavtiFormProps {
  onSuccess: (pavti: Pavti) => void;
  onCancel: () => void;
}

export const NewPavtiForm: React.FC<NewPavtiFormProps> = ({ onSuccess, onCancel }) => {
  const { authFetch, user } = useAuth();
  const { language, t, getWordsForAmount } = useLanguage();

  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [addressChoice, setAddressChoice] = useState('इतर गल्ली / पत्ता (Other)');
  const [customAddress, setCustomAddress] = useState('');
  const [amount, setAmount] = useState<string>('501');
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'online' | 'cheque'>('cash');
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid'>('paid');
  const [transactionId, setTransactionId] = useState('');
  const [donationCategory, setDonationCategory] = useState('उत्सव वर्गणी (Festival Vargani)');
  const [note, setNote] = useState('');
  const [date, setDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = Number(amount) || 0;
  const inWords = getWordsForAmount(numericAmount);

  const quickAmounts = [101, 251, 501, 1001, 2001, 5001, 11000, 21000];

  const galliPresets = ['इतर गल्ली / पत्ता (Other)'];

  const categoryPresets = [
    'उत्सव वर्गणी (Festival Vargani)',
    'महाप्रसाद व आरती सेवा (Mahaprasad & Aarti)',
    'मंडप व ध्वनी सजावट देणगी (Mandap & Decor)',
    'विशेष देणगी (Special Donation)',
    'इतर देणगी सेवा (Other Seva)',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!donorName.trim()) {
      setError(language === 'en' ? 'Please enter donor full name' : 'कृपया दात्याचे पूर्ण नाव प्रविष्ट करा');
      return;
    }

    if (!numericAmount || numericAmount <= 0) {
      setError(language === 'en' ? 'Please enter a valid amount' : 'कृपया वैध देणगी रक्कम प्रविष्ट करा');
      return;
    }

    const finalAddress = addressChoice === 'इतर गल्ली / पत्ता (Other)'
      ? customAddress.trim()
      : addressChoice;

    setSubmitting(true);

    try {
      const res = await authFetch('/api/pavti/create', {
        method: 'POST',
        body: JSON.stringify({
          donorName: donorName.trim(),
          donorPhone: donorPhone.trim(),
          donorAddress: finalAddress,
          amount: numericAmount,
          paymentMode,
          paymentStatus,
          transactionId: transactionId.trim(),
          donationCategory,
          note: note.trim(),
          date,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create receipt');
      }

      const createdPavti = data.pavti || data;

      // Automatically trigger WhatsApp share to the donor's number if provided
      if (donorPhone.trim()) {
        const rawPhone = donorPhone.trim().replace(/[^0-9]/g, '');
        const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;
        
        const isPaid = paymentStatus !== 'unpaid';
        const formattedAmount = numericAmount.toLocaleString('en-IN');
        const words = inWords;

        const whatsappText = language === 'en'
          ? `🚩 *RAJMUDRA GANPATI MANDAL* 🚩
*॥ Shree Ganeshay Namah ॥ ॥ Ganpati Bappa Morya ॥*

Dear *${donorName.trim()}*,
Thank you for your auspicious Ganesh Festival donation / vargani.

📜 *Official Receipt Details:*
• *Receipt No:* ${createdPavti.receiptNo || '-'}
• *Date:* ${date}
• *Amount:* ₹${formattedAmount}/- (${words})
• *Payment Status:* ${isPaid ? 'PAID (Received)' : 'UNPAID / PLEDGED (Pending)'}
• *Payment Mode:* ${paymentMode.toUpperCase()} ${transactionId ? `(Ref: ${transactionId})` : ''}
• *Category:* ${donationCategory}
• *Address:* ${finalAddress}
• *Issued By:* ${user?.name || 'Mandal Representative'}

${MANDAL_CONFIG.name.en} conveys its deepest gratitude. May Lord Ganesha bestow peace, health, and prosperity upon your family!

*॥ Ganpati Bappa Morya, Mangalmurtii Morya ॥*`
          : `🚩 *${MANDAL_CONFIG.name.mr}* 🚩
*॥ ॐ गं गणपतये नमः ॥ ॥ गणपती बाप्पा मोरया ॥*

प्रिय श्री/सौ. *${donorName.trim()}*,
गणेशोत्सवासाठी आपली वर्गणी / देणगी यशस्वीरित्या नोंदवली गेली आहे.

📜 *अधिकृत पावती तपशील (Receipt Details):*
• *पावती क्र:* ${createdPavti.receiptNo || '-'}
• *दिनांक:* ${date}
• *रक्कम:* ₹${formattedAmount}/- (${words})
• *पेमेंट स्थिती:* ${isPaid ? 'जमा (PAID)' : 'बाकी / प्रलंबित (UNPAID)'}
• *पेमेंट प्रकार:* ${paymentMode === 'upi' ? 'युपीआय (UPI)' : paymentMode === 'cash' ? 'रोख (Cash)' : paymentMode.toUpperCase()} ${transactionId ? `(Ref: ${transactionId})` : ''}
• *देणगी प्रकार:* ${donationCategory}
• *पत्ता:* ${finalAddress}
• *पावती देणारा:* ${user?.name || 'मंडळ प्रतिनिधी'}

${MANDAL_CONFIG.name.mr} आपले सहर्ष आभार मानत आहे! बाप्पाच्या कृपेने आपल्या सर्व मनोकामना पूर्ण होवोत.

*॥ गणपती बाप्पा मोरया, मंगलमूर्ती मोरया ॥*`;

        const encoded = encodeURIComponent(whatsappText);
        const wpUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
        
        // Open WhatsApp directly
        const wpLink = document.createElement('a');
        wpLink.href = wpUrl;
        wpLink.target = '_blank';
        wpLink.rel = 'noopener noreferrer';
        document.body.appendChild(wpLink);
        wpLink.click();
        wpLink.remove();
      }

      onSuccess(createdPavti);
    } catch (err: any) {
      setError(err.message || 'Error occurred while creating receipt');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl shadow-xl border-2 border-amber-500/40 overflow-hidden">
      {/* Form Header */}
      <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-orange-950 text-white p-5 sm:p-7 border-b border-amber-600">
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-[11px] font-bold tracking-wider text-amber-300 uppercase px-2 py-0.5 bg-amber-950/60 rounded border border-amber-500/30">
              {t('mandal_slogan')}
            </span>
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-white mt-1 flex items-center gap-2">
              <Receipt className="w-6 h-6 text-amber-400" />
              {t('form_title')}
            </h2>
            <p className="text-xs text-amber-200/90 mt-0.5">
              {t('form_desc')}
            </p>
          </div>

          <div className="hidden sm:block text-right bg-amber-950/70 px-3 py-1.5 rounded-xl border border-amber-700">
            <div className="text-[10px] text-amber-300">{t('form_collector_label')}</div>
            <div className="text-xs font-bold text-white">{user?.name}</div>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border-l-4 border-red-500 rounded-xl flex items-center gap-2 text-red-800 text-xs sm:text-sm font-semibold">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-7 space-y-5 text-slate-800 text-xs sm:text-sm">
        
        {/* Donor Name & Phone Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-8">
            <label className="block font-bold text-slate-900 mb-1.5">
              {t('form_donor_name')}
            </label>
            <input
              type="text"
              required
              value={donorName}
              onChange={(e) => setDonorName(e.target.value)}
              placeholder={t('form_donor_name_ph')}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-medium"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block font-bold text-slate-900 mb-1.5">
              {t('form_phone')}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="tel"
                value={donorPhone}
                onChange={(e) => setDonorPhone(e.target.value)}
                placeholder={t('form_phone_ph')}
                maxLength={10}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-200 outline-none text-sm font-mono"
              />
            </div>
            <p className="text-[10px] text-emerald-700 mt-1 font-medium">
              ✓ {t('form_phone_hint')}
            </p>
          </div>
        </div>

        {/* Amount Input & In-Words preview */}
        <div className="bg-amber-50/60 p-4 sm:p-5 rounded-2xl border border-amber-200">
          <label className="block font-black text-amber-950 mb-1.5 text-sm sm:text-base">
            {t('form_amount')}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg font-bold text-amber-800">
              ₹
            </span>
            <input
              type="number"
              required
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={t('form_amount_ph')}
              className="w-full pl-8 pr-4 py-3 rounded-xl border-2 border-amber-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-300 outline-none text-xl sm:text-2xl font-black font-mono text-slate-900 bg-white"
            />
          </div>

          {/* Quick Amount Buttons */}
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-amber-900 mr-1">{t('form_quick_amounts')}</span>
            {quickAmounts.map((preset) => (
              <button
                type="button"
                key={preset}
                onClick={() => setAmount(String(preset))}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                  numericAmount === preset
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-amber-950 border border-amber-300 hover:bg-amber-100'
                }`}
              >
                ₹{preset}
              </button>
            ))}
          </div>

          {/* Words Preview */}
          <div className="mt-3 pt-2.5 border-t border-amber-200/80 text-xs text-amber-900 font-medium">
            <strong className="text-amber-950">{t('slip_amount_words')} </strong>
            <span className="italic font-bold text-amber-950">{inWords}</span>
          </div>
        </div>

        {/* Payment Status (Paid vs Unpaid) & Payment Mode */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          
          {/* Payment Status */}
          <div>
            <label className="block font-bold text-slate-900 mb-1.5">
              {t('form_payment_status')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentStatus('paid')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  paymentStatus === 'paid'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{t('status_paid')}</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentStatus('unpaid')}
                className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  paymentStatus === 'unpaid'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                <AlertCircle className="w-4 h-4" />
                <span>{t('status_unpaid')}</span>
              </button>
            </div>
            <p className="text-[10px] text-slate-500 mt-1">
              {paymentStatus === 'paid' ? t('status_paid_desc') : t('status_unpaid_desc')}
            </p>
          </div>

          {/* Payment Mode */}
          <div>
            <label className="block font-bold text-slate-900 mb-1.5">
              {t('form_payment_mode')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setPaymentMode('cash')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  paymentMode === 'cash'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t('mode_cash')}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('upi')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  paymentMode === 'upi'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t('mode_upi')}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('online')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  paymentMode === 'online'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t('mode_online')}
              </button>

              <button
                type="button"
                onClick={() => setPaymentMode('cheque')}
                className={`py-2 px-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
                  paymentMode === 'cheque'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'
                }`}
              >
                {t('mode_cheque')}
              </button>
            </div>
          </div>
        </div>

        {/* Transaction ID if UPI or Online */}
        {(paymentMode === 'upi' || paymentMode === 'online' || paymentMode === 'cheque') && (
          <div>
            <label className="block font-bold text-slate-900 mb-1">
              {language === 'en' ? 'UPI UTR / Cheque / Transaction Ref No.' : 'युपीआय UTR / धनादेश / ट्रान्झॅक्शन क्र.'}
            </label>
            <input
              type="text"
              value={transactionId}
              onChange={(e) => setTransactionId(e.target.value)}
              placeholder="उदा. 423589XXXXXX"
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-amber-500 font-mono text-xs"
            />
          </div>
        )}

        {/* Address / Galli Preset & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-900 mb-1.5">
              {t('form_address')}
            </label>
            <select
              value={addressChoice}
              onChange={(e) => setAddressChoice(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 bg-white text-xs font-medium"
            >
              {galliPresets.map((galli) => (
                <option key={galli} value={galli}>
                  {galli}
                </option>
              ))}
            </select>

            {addressChoice === 'इतर गल्ली / पत्ता (Other)' && (
              <input
                type="text"
                value={customAddress}
                onChange={(e) => setCustomAddress(e.target.value)}
                placeholder={t('form_custom_address_ph')}
                className="mt-2 w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 text-xs"
              />
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1.5">
              {t('form_category')}
            </label>
            <select
              value={donationCategory}
              onChange={(e) => setDonationCategory(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 bg-white text-xs font-medium"
            >
              {categoryPresets.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date & Note Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-slate-900 mb-1.5">
              {t('form_date')}
            </label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 bg-white text-xs font-medium font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-900 mb-1.5">
              {t('form_note')}
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={t('form_note_ph')}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-300 focus:border-amber-500 text-xs"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 font-bold transition cursor-pointer"
          >
            {t('action_cancel')}
          </button>

          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-amber-950 font-black shadow-lg hover:shadow-xl transition cursor-pointer disabled:opacity-50 flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-950" />
            <span>{submitting ? t('form_submitting') : t('form_submit_btn')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
