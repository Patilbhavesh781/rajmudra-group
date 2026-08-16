import React, { useRef, useState } from 'react';
import { Pavti } from '../types';
import { useLanguage } from '../context/LanguageContext';
import {
  Printer,
  Share2,
  X,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Sparkles,
  Phone,
  MapPin,
  Calendar,
  IndianRupee,
  ShieldCheck,
  Download
} from 'lucide-react';

interface ReceiptSlipModalProps {
  pavti: Pavti | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReceiptSlipModal: React.FC<ReceiptSlipModalProps> = ({ pavti, isOpen, onClose }) => {
  const { language, t, getWordsForAmount } = useLanguage();
  const [copied, setCopied] = useState(false);
  const printableRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !pavti) return null;

  // Ensure safe unnesting if wrapped in { pavti: ... }
  const actualPavti: Pavti = (pavti as any)?.pavti ? (pavti as any).pavti : pavti;
  const numAmount = Number(actualPavti?.amount || 0);
  const formattedAmount = numAmount.toLocaleString('en-IN');
  const isPaid = actualPavti?.paymentStatus !== 'unpaid';
  const words = language === 'en' 
    ? (actualPavti?.amountInEnglishWords || getWordsForAmount(numAmount))
    : (actualPavti?.amountInWords || getWordsForAmount(numAmount));

  // Construct Bilingual WhatsApp Share message
  const generateWhatsAppMessage = () => {
    if (language === 'en') {
      return (
`🚩 *RAJMUDRA GANPATI MANDAL* 🚩
*॥ Shree Ganeshay Namah ॥ ॥ Ganpati Bappa Morya ॥*

Dear *${actualPavti?.donorName || 'Devotee'}*,
Thank you for your auspicious Ganesh Festival donation / vargani.

📜 *Official Receipt Details:*
• *Receipt No:* ${actualPavti?.receiptNo || '-'}
• *Date:* ${actualPavti?.date || ''}
• *Amount:* ₹${formattedAmount}/- (${words})
• *Payment Status:* ${isPaid ? 'PAID (Received)' : 'UNPAID / PLEDGED (Pending)'}
• *Payment Mode:* ${(actualPavti?.paymentMode || 'cash').toUpperCase()} ${actualPavti?.transactionId ? `(Ref: ${actualPavti.transactionId})` : ''}
• *Category:* ${actualPavti?.donationCategory || 'Utsav Vargani'}
• *Address:* ${actualPavti?.donorAddress || '-'}
• *Issued By:* ${actualPavti?.collectedBy?.name || 'Mandal Representative'}

Rajmudra Ganpati Mandal conveys its deepest gratitude. May Lord Ganesha bestow peace, health, and prosperity upon your family!

*॥ Ganpati Bappa Morya, Mangalmurti Morya ॥*`
      );
    }

    return (
`🚩 *राजमुद्रा गणपती मंडळ* 🚩
*॥ ॐ गं गणपतये नमः ॥ ॥ गणपती बाप्पा मोरया ॥*

प्रिय श्री/सौ. *${actualPavti?.donorName || 'देणगीदार'}*,
गणेशोत्सवासाठी आपली वर्गणी / देणगी यशस्वीरित्या नोंदवली गेली आहे.

📜 *अधिकृत पावती तपशील (Receipt Details):*
• *पावती क्र:* ${actualPavti?.receiptNo || '-'}
• *दिनांक:* ${actualPavti?.date || ''}
• *रक्कम:* ₹${formattedAmount}/- (${words})
• *पेमेंट स्थिती:* ${isPaid ? 'जमा (PAID)' : 'बाकी / प्रलंबित (UNPAID)'}
• *पेमेंट प्रकार:* ${actualPavti?.paymentMode === 'upi' ? 'युपीआय (UPI)' : actualPavti?.paymentMode === 'cash' ? 'रोख (Cash)' : (actualPavti?.paymentMode || 'CASH').toUpperCase()} ${actualPavti?.transactionId ? `(Ref: ${actualPavti.transactionId})` : ''}
• *देणगी प्रकार:* ${actualPavti?.donationCategory || 'उत्सव वर्गणी'}
• *पत्ता:* ${actualPavti?.donorAddress || '-'}
• *पावती देणारा:* ${actualPavti?.collectedBy?.name || 'मंडळ प्रतिनिधी'}

राजमुद्रा गणपती मंडळ आपले सहर्ष आभार मानत आहे! बाप्पाच्या कृपेने आपल्या सर्व मनोकामना पूर्ण होवोत.

*॥ गणपती बाप्पा मोरया, मंगलमूर्ती मोरया ॥*`
    );
  };

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const msg = generateWhatsAppMessage();
    const encoded = encodeURIComponent(msg);
    const rawPhone = actualPavti?.donorPhone ? actualPavti.donorPhone.replace(/[^0-9]/g, '') : '';
    const cleanPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone;

    const url = cleanPhone ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}` : `https://api.whatsapp.com/send?text=${encoded}`;
    
    // Safely trigger navigation without sandbox popup blockage
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleCopyMessage = async () => {
    try {
      const msg = generateWhatsAppMessage();
      await navigator.clipboard.writeText(msg);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white print:static print:overflow-visible">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl overflow-hidden border-2 border-amber-500/50 print:border-none print:shadow-none print:max-w-none print:w-full">
        
        {/* Top Actions Bar (Hidden when printing) */}
        <div className="bg-gradient-to-r from-amber-900 via-amber-800 to-orange-950 text-amber-100 p-3 sm:p-4 flex items-center justify-between gap-2 flex-wrap print:hidden">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{t('slip_official_title')}</span>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
            {/* Copy WhatsApp text button */}
            <button
              onClick={handleCopyMessage}
              className="flex items-center gap-1 bg-amber-800 hover:bg-amber-700 text-amber-100 text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-amber-600/50 shadow-xs transition cursor-pointer"
              title={language === 'en' ? 'Copy receipt text' : 'पावती मेसेज कॉपी करा'}
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
              <span>{copied ? t('action_copied') : t('action_copy_msg')}</span>
            </button>

            {/* Direct WhatsApp Share button */}
            <button
              onClick={handleWhatsAppShare}
              className="flex items-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg shadow transition cursor-pointer"
              title="Share receipt via WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{t('action_share_wp')}</span>
            </button>

            {/* Print button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1.5 rounded-lg shadow transition cursor-pointer"
              title="Print Receipt"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('action_print')}</span>
            </button>

            {/* Close button */}
            <button
              onClick={onClose}
              className="text-amber-300 hover:text-white p-1 rounded-md hover:bg-amber-800 transition cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Completion Success Notification & WhatsApp Prompt Banner (Hidden when printing) */}
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-emerald-950 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
              ✓
            </span>
            <div>
              <span className="font-bold text-emerald-900">
                {language === 'en'
                  ? `Receipt #${actualPavti?.receiptNo} Created! `
                  : `पावती क्र. #${actualPavti?.receiptNo} नोंदवली गेली! `}
              </span>
              <span className="text-emerald-800">
                {language === 'en'
                  ? `₹${formattedAmount} added to total collection immediately.`
                  : `₹${formattedAmount} रक्कम एकूण जमा हिशोबात तात्काळ जोडली गेली.`}
              </span>
            </div>
          </div>

          {actualPavti?.donorPhone && (
            <button
              onClick={handleWhatsAppShare}
              className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold shadow-xs transition cursor-pointer text-xs shrink-0"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>
                {language === 'en'
                  ? `Send on WhatsApp (${actualPavti.donorPhone})`
                  : `WhatsApp वर पाठवा (${actualPavti.donorPhone})`}
              </span>
            </button>
          )}
        </div>

        {/* PRINTABLE OFFICIAL RECEIPT SLIP BODY */}
        <div ref={printableRef} id="printable-receipt-slip" className="p-3.5 sm:p-7 bg-[#fffbf2] text-slate-900 font-sans print:p-0 print:bg-white print:m-0">
          {/* Traditional Ornate Border Frame */}
          <div className="border-4 border-double border-amber-800 p-4 sm:p-6 rounded-xl bg-white relative shadow-inner print:border-2 print:border-amber-900 print:shadow-none">
            
            {/* Background Ganesh Watermark */}
            <div className="absolute inset-0 flex items-center justify-center opacity-3 pointer-events-none text-9xl font-bold text-amber-900 select-none">
              🚩
            </div>

            {/* Top Mandal Banner Header */}
            <div className="text-center pb-2.5 border-b-2 border-amber-300">
              <div className="text-amber-800 font-bold text-xs sm:text-sm tracking-wider uppercase">
                {t('mandal_slogan')}
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-amber-950 font-serif tracking-tight mt-0.5">
                {t('mandal_name')}
              </h2>
              <div className="text-xs sm:text-sm font-medium text-amber-900 flex items-center justify-center gap-1.5 flex-wrap">
                <span>{t('mandal_sub')}</span>
                <span>•</span>
                <span className="font-semibold">{t('mandal_established')}</span>
              </div>
            </div>

            {/* Receipt Number & Date Row */}
            <div className="flex items-center justify-between gap-2 py-2.5 border-b border-dashed border-amber-300 text-xs sm:text-sm font-bold text-slate-800">
              <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <span className="text-amber-900">{t('slip_receipt_no')}</span>
                <span className="text-red-700 text-sm sm:text-base font-mono font-extrabold">{actualPavti?.receiptNo}</span>
              </div>

              {/* Status Badge (Paid vs Unpaid) */}
              <div className="flex items-center gap-1">
                {isPaid ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{language === 'en' ? 'PAID' : 'जमा (PAID)'}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                    <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{language === 'en' ? 'UNPAID / PENDING' : 'बाकी / प्रलंबित (UNPAID)'}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                <span className="text-amber-900">{t('slip_date')}</span>
                <span className="text-slate-900 font-mono">{actualPavti?.date}</span>
              </div>
            </div>

            {/* Donor & Payment Details Table */}
            <div className="py-3.5 space-y-3 text-xs sm:text-sm">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="text-amber-900 font-bold whitespace-nowrap min-w-[150px]">
                  {t('slip_donor_name')}
                </span>
                <span className="text-slate-950 font-extrabold text-sm sm:text-base border-b border-dotted border-amber-400 flex-1 pb-0.5">
                  {actualPavti?.donorName}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-amber-900 font-bold whitespace-nowrap">{t('slip_address')}</span>
                  <span className="text-slate-800 border-b border-dotted border-amber-400 flex-1 pb-0.5">
                    {actualPavti?.donorAddress || '-'}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-amber-900 font-bold whitespace-nowrap">{t('slip_phone')}</span>
                  <span className="text-slate-800 border-b border-dotted border-amber-400 flex-1 pb-0.5 font-mono">
                    {actualPavti?.donorPhone || '-'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-baseline gap-2">
                  <span className="text-amber-900 font-bold whitespace-nowrap">{t('slip_category')}</span>
                  <span className="text-slate-800 border-b border-dotted border-amber-400 flex-1 pb-0.5 font-semibold">
                    {actualPavti?.donationCategory}
                  </span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-amber-900 font-bold whitespace-nowrap">{t('slip_payment_mode')}</span>
                  <span className="text-slate-800 border-b border-dotted border-amber-400 flex-1 pb-0.5 uppercase font-semibold">
                    {actualPavti?.paymentMode === 'cash' ? (language === 'en' ? 'CASH' : 'रोख (Cash)') : actualPavti?.paymentMode === 'upi' ? (language === 'en' ? 'UPI' : 'युपीआय (UPI)') : (actualPavti?.paymentMode || 'CASH').toUpperCase()}
                    {actualPavti?.transactionId ? ` [Ref: ${actualPavti.transactionId}]` : ''}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                <span className="text-amber-900 font-bold whitespace-nowrap min-w-[150px]">
                  {t('slip_amount_words')}
                </span>
                <span className="text-amber-950 font-bold border-b border-dotted border-amber-400 flex-1 pb-0.5 italic">
                  {words}
                </span>
              </div>
            </div>

            {/* Highlighted Amount & QR & Signature Block */}
            <div className="mt-2 pt-3 border-t-2 border-amber-600/60 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
              {/* Big Amount Badge */}
              <div className="bg-gradient-to-br from-amber-600 to-orange-700 text-white px-5 py-2 rounded-xl shadow-md border border-amber-400 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider">{t('slip_amount_badge')}</span>
                <span className="text-2xl sm:text-3xl font-black tracking-tight font-mono">
                  ₹{formattedAmount}/-
                </span>
              </div>

              {/* QR Code & Verification Stamp */}
              {actualPavti?.qrCodeDataUrl && (
                <div className="flex items-center gap-2 bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                  <img
                    src={actualPavti.qrCodeDataUrl}
                    alt="Digital QR Verification"
                    className="w-13 h-13 object-contain"
                  />
                  <div className="text-[10px] text-amber-900 font-medium leading-tight">
                    <div className="font-bold flex items-center gap-1 text-emerald-700">
                      <ShieldCheck className="w-3.5 h-3.5" /> {t('slip_verified_badge')}
                    </div>
                    <div>{t('slip_scan_note')}</div>
                    <div className="text-[9px] text-slate-500 font-mono">ID: {actualPavti?.receiptNo}</div>
                  </div>
                </div>
              )}

              {/* Collector Signature */}
              <div className="text-center sm:text-right">
                <div className="text-[11px] font-semibold text-slate-500">{t('slip_collector')}</div>
                <div className="text-xs sm:text-sm font-bold text-amber-950">{actualPavti?.collectedBy?.name || 'कार्यकर्ता'}</div>
                <div className="mt-0.5 border-t border-amber-800/40 pt-0.5 text-[10px] text-amber-800 font-semibold uppercase tracking-wider">
                  {t('slip_mandal_stamp')}
                </div>
              </div>
            </div>

            {/* Footer Blessing */}
            <div className="text-center mt-3 pt-2 border-t border-dashed border-amber-300 text-[11px] text-amber-900/80 italic font-serif">
              "{t('blessing_footer')}"
            </div>
          </div>
        </div>

        {/* Bottom Bar Close Button (Hidden when printing) */}
        <div className="bg-slate-100 p-3 flex justify-end gap-2 print:hidden border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-semibold rounded-lg transition cursor-pointer"
          >
            {t('action_close')}
          </button>
        </div>
      </div>
    </div>
  );
};
