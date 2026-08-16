import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Expense } from '../types';
import {
  Wallet,
  PlusCircle,
  IndianRupee,
  Calendar,
  User,
  Tag,
  CheckCircle2,
  RefreshCw,
  TrendingDown,
  Trash2,
  ImagePlus,
  X,
  Printer,
  FileImage
} from 'lucide-react';

export const ExpenseManagerView: React.FC = () => {
  const { authFetch, user } = useAuth();
  const { language, t } = useLanguage();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // New Expense form
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('मंडप व स्टेज (Mandap & Stage)');
  const [amount, setAmount] = useState<number | ''>('');
  const [paidTo, setPaidTo] = useState('');
  const [paymentMode, setPaymentMode] = useState('cash');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [billPhotoUrl, setBillPhotoUrl] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<Expense | null>(null);

  const expenseCategories = [
    'मंडप व स्टेज (Mandap & Stage)',
    'ध्वनी व प्रकाश व्यवस्था (Sound & Lighting)',
    'गणेश मूर्ती व सजावट (Murti & Decoration)',
    'महाप्रसाद व पूजा साहित्य (Prasad & Puja)',
    'विसर्जन व मिरवणूक (Visarjan & Procession)',
    'फ्लेक्स व जाहिरात (Flex & Printing)',
    'इतर आकस्मिक खर्च (Other Miscellaneous)'
  ];

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/expenses/list');
      if (res.ok) {
        const data = await res.json();
        setExpenses(data);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchExpenses();
  }, [fetchExpenses]);

  const handleBillImage = (file?: File) => {
    setError(null);
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError(language === 'en' ? 'Only JPEG, PNG, or WebP bill images are allowed.' : 'फक्त JPEG, PNG किंवा WebP बिल इमेज वापरता येईल.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError(language === 'en' ? 'Bill image must be 2 MB or smaller.' : 'बिल इमेज २ MB किंवा त्यापेक्षा लहान असावी.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setBillPhotoUrl(String(reader.result || ''));
    reader.onerror = () => setError(language === 'en' ? 'Could not read the selected image.' : 'निवडलेली इमेज वाचता आली नाही.');
    reader.readAsDataURL(file);
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount) {
      setError(language === 'en' ? 'Please enter expense title and amount' : 'कृपया खर्चाचे नाव आणि रक्कम प्रविष्ट करा.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await authFetch('/api/expenses/create', {
        method: 'POST',
        body: JSON.stringify({
          title: title.trim(),
          category,
          amount: Number(amount),
          paidTo: paidTo.trim(),
          paymentMode,
          date,
          billPhotoUrl,
        }),
      });

      if (res.ok) {
        const savedAmt = Number(amount).toLocaleString('en-IN');
        setTitle('');
        setAmount('');
        setPaidTo('');
        setBillPhotoUrl('');
        setShowAddForm(false);
        setSuccessMsg(
          language === 'en'
            ? `Expense of ₹${savedAmt} recorded successfully and synchronized with Mandal accounts!`
            : `₹${savedAmt} चा खर्च यशस्वीरित्या नोंदवला गेला आणि डॅशबोर्ड हिशोबात जोडला गेला!`
        );
        setTimeout(() => setSuccessMsg(null), 6000);
        fetchExpenses();
      } else {
        const data = await res.json();
        setError(data.error || 'खर्च जतन करताना त्रुटी आली');
      }
    } catch (err: any) {
      setError(err.message || 'Error saving expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteExpense = async (id: string, expTitle: string, expAmt: number) => {
    if (user?.role !== 'admin') return;
    const confirmMsg = language === 'en'
      ? `Are you sure you want to delete expense "${expTitle}" of ₹${expAmt}?`
      : `तुम्हाला खात्री आहे का की "${expTitle}" हा ₹${expAmt} चा खर्च हटवायचा आहे?`;

    if (!window.confirm(confirmMsg)) return;

    setDeletingId(id);
    try {
      const res = await authFetch(`/api/expenses/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchExpenses();
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete expense');
      }
    } catch (err: any) {
      alert(err.message || 'Error deleting expense');
    } finally {
      setDeletingId(null);
    }
  };

  const totalExpenseAmount = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const handlePrintVoucher = () => {
    if (!selectedVoucher) return;
    void authFetch(`/api/expenses/${selectedVoucher._id}/voucher-printed`, { method: 'POST' })
      .catch((auditError) => console.warn('Could not record voucher print:', auditError));
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-700 uppercase tracking-wider">
            <Wallet className="w-4 h-4 text-red-700" />
            <span>{t('exp_title')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif mt-1">
            {t('stat_total_expenses')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('exp_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-red-50 text-red-950 px-4 py-2 rounded-xl border border-red-200 text-right">
            <div className="text-[11px] font-semibold text-red-700 uppercase">{language === 'en' ? 'Total Expenses' : 'एकूण खर्च'}</div>
            <div className="text-xl sm:text-2xl font-black font-mono">
              ₹{totalExpenseAmount.toLocaleString('en-IN')}
            </div>
          </div>

          {(user?.role === 'admin' || user?.canManageExpenses) ? <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-red-600 hover:bg-red-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>{showAddForm ? t('action_close') : t('exp_btn_new')}</span>
          </button> : <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-500">{language === 'en' ? 'View only' : 'फक्त पाहण्याचा अधिकार'}</span>}
        </div>
      </div>

      {/* Success Notification Banner */}
      {successMsg && (
        <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 flex items-center justify-between gap-3 text-emerald-950 shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
              ✓
            </div>
            <div>
              <div className="font-bold text-sm text-emerald-900">
                {language === 'en' ? 'Expense Saved!' : 'खर्च यशस्वीरित्या जतन झाला!'}
              </div>
              <div className="text-xs text-emerald-800 font-medium">
                {successMsg}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSuccessMsg(null)}
            className="text-xs text-emerald-800 hover:text-emerald-950 font-bold px-2 py-1 bg-emerald-100 hover:bg-emerald-200 rounded-lg cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Add Expense Form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-md border-2 border-red-200 animate-in fade-in duration-150">
          <h3 className="text-base font-bold text-slate-900 mb-3 flex items-center gap-2 font-serif">
            <TrendingDown className="w-5 h-5 text-red-600" />
            <span>{t('exp_btn_new')}</span>
          </h3>

          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg text-red-800 text-xs mb-4 font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleCreateExpense} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('exp_form_title')}
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="उदा. मंडप डेकोरेटर्स ॲडव्हान्स, मूर्ती आगमन प्रसाद"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('exp_form_amount')}
              </label>
              <input
                type="number"
                required
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                placeholder="रक्कम प्रविष्ट करा"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm font-bold font-mono outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('exp_form_category')}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm bg-white"
              >
                {expenseCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('exp_form_paid_to')}
              </label>
              <input
                type="text"
                value={paidTo}
                onChange={(e) => setPaidTo(e.target.value)}
                placeholder="उदा. साउंड सेवा / मंडप सेवा"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('form_payment_mode')}
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm bg-white"
              >
                <option value="cash">{t('mode_cash')}</option>
                <option value="upi">{t('mode_upi')}</option>
                <option value="cheque">{t('mode_cheque')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('form_date')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 focus:border-red-500 text-xs sm:text-sm bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {language === 'en' ? 'Bill / Invoice image (optional)' : 'बिल / पावतीचा फोटो (ऐच्छिक)'}
              </label>
              {!billPhotoUrl ? (
                <label className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center transition hover:border-red-400 hover:bg-red-50/40">
                  <ImagePlus className="mb-2 h-6 w-6 text-red-600" />
                  <span className="text-xs font-bold text-slate-700">
                    {language === 'en' ? 'Choose a JPEG, PNG or WebP image' : 'JPEG, PNG किंवा WebP फोटो निवडा'}
                  </span>
                  <span className="mt-1 text-[11px] text-slate-500">{language === 'en' ? 'Maximum 2 MB' : 'कमाल 2 MB'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => handleBillImage(event.target.files?.[0])}
                  />
                </label>
              ) : (
                <div className="relative inline-block overflow-hidden rounded-xl border border-slate-200 bg-white p-2">
                  <img src={billPhotoUrl} alt="Bill preview" className="h-32 max-w-full rounded-lg object-contain" />
                  <button
                    type="button"
                    onClick={() => setBillPhotoUrl('')}
                    className="absolute right-3 top-3 rounded-full bg-slate-900/80 p-1 text-white hover:bg-red-700"
                    title={language === 'en' ? 'Remove image' : 'फोटो काढा'}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="sm:col-span-2 pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold hover:bg-slate-50 cursor-pointer"
              >
                {t('action_cancel')}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-xs sm:text-sm font-bold rounded-xl shadow transition cursor-pointer"
              >
                {submitting ? '...' : t('action_save')}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Expenses Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-red-50/80 border-b border-red-200 text-red-950 font-bold">
                <th className="py-3 px-3.5">{language === 'en' ? 'Expense No.' : 'खर्च क्र.'}</th>
                <th className="py-3 px-3.5">{language === 'en' ? 'Title / Description' : 'खर्चाचे विवरण'}</th>
                <th className="py-3 px-3.5">{language === 'en' ? 'Category' : 'श्रेणी (Category)'}</th>
                <th className="py-3 px-3.5">{language === 'en' ? 'Paid To' : 'कोणाला दिले'}</th>
                <th className="py-3 px-3.5">{language === 'en' ? 'Payment' : 'पेमेंट'}</th>
                <th className="py-3 px-3.5">{language === 'en' ? 'Recorded By' : 'नोंदवणारा'}</th>
                <th className="py-3 px-3.5">{language === 'en' ? 'Date' : 'दिनांक'}</th>
                <th className="py-3 px-3.5 text-right">{language === 'en' ? 'Amount (₹)' : 'रक्कम (₹)'}</th>
                <th className="py-3 px-3.5 text-center">{language === 'en' ? 'Documents / Action' : 'कागदपत्रे / कृती'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map((exp) => (
                <tr key={exp._id || exp.expenseNo} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-3.5 font-mono text-xs text-slate-500 font-bold">
                    {exp.expenseNo}
                  </td>
                  <td className="py-3 px-3.5 font-bold text-slate-900">
                    {exp.title}
                  </td>
                  <td className="py-3 px-3.5 text-slate-600 text-xs">
                    {exp.category}
                  </td>
                  <td className="py-3 px-3.5 text-slate-700 text-xs">
                    {exp.paidTo || '-'}
                  </td>
                  <td className="py-3 px-3.5 uppercase text-[11px] font-bold text-slate-700">
                    {exp.paymentMode === 'cash' ? t('mode_cash') : exp.paymentMode === 'upi' ? t('mode_upi') : exp.paymentMode}
                  </td>
                  <td className="py-3 px-3.5 text-xs text-slate-500">
                    {exp.recordedBy?.name || 'ॲडमिन'}
                  </td>
                  <td className="py-3 px-3.5 font-mono text-xs text-slate-500">
                    {exp.date}
                  </td>
                  <td className="py-3 px-3.5 text-right font-black font-mono text-red-700 text-sm">
                    ₹{exp.amount.toLocaleString('en-IN')}
                  </td>
                  <td className="py-3 px-3.5 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setSelectedVoucher(exp)}
                        className="p-1.5 text-slate-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title={language === 'en' ? 'View / print voucher' : 'व्हाउचर पहा / प्रिंट करा'}
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                      {exp.billPhotoUrl && (
                        <a
                          href={exp.billPhotoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                          title={language === 'en' ? 'View attached bill' : 'जोडलेले बिल पहा'}
                        >
                          <FileImage className="w-4 h-4" />
                        </a>
                      )}
                      {user?.role === 'admin' && (
                      <button
                        onClick={() => handleDeleteExpense(exp._id, exp.title, exp.amount)}
                        disabled={deletingId === exp._id}
                        className="p-1.5 text-slate-400 hover:text-red-700 hover:bg-red-50 rounded-lg transition cursor-pointer"
                        title={language === 'en' ? 'Delete Expense' : 'खर्च हटवा'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {expenses.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    {language === 'en' ? 'No expenses recorded yet.' : 'अद्याप कोणत्याही खर्चाची नोंद नाही.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedVoucher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 print:static print:block print:bg-white print:p-0">
          <div className="max-h-[95vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:shadow-none">
            <div className="flex items-center justify-end gap-2 border-b border-slate-200 p-4 print:hidden">
              <button onClick={handlePrintVoucher} className="flex items-center gap-2 rounded-xl bg-red-700 px-4 py-2 text-xs font-bold text-white hover:bg-red-600">
                <Printer className="h-4 w-4" />
                {language === 'en' ? 'Print voucher' : 'व्हाउचर प्रिंट करा'}
              </button>
              <button onClick={() => setSelectedVoucher(null)} className="rounded-xl border border-slate-300 p-2 text-slate-600 hover:bg-slate-100" title="Close">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div id="expense-voucher-print" className="bg-white p-7 sm:p-10 text-slate-950">
              <div className="border-2 border-slate-900 p-5 sm:p-7">
                <div className="border-b-2 border-slate-900 pb-4 text-center">
                  <h2 className="text-xl font-black uppercase tracking-wide">{t('mandal_name')}</h2>
                  <p className="mt-1 text-xs font-bold">{t('mandal_sub')}</p>
                  <p className="mt-2 text-sm font-bold">{language === 'en' ? 'EXPENSE PAYMENT VOUCHER' : 'खर्च अदायगी व्हाउचर'}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 border-b border-slate-400 py-4 text-sm">
                  <VoucherRow label={language === 'en' ? 'Voucher No.' : 'व्हाउचर क्र.'} value={selectedVoucher.expenseNo} />
                  <VoucherRow label={language === 'en' ? 'Date' : 'दिनांक'} value={selectedVoucher.date} />
                </div>
                <div className="space-y-3 py-5 text-sm">
                  <VoucherRow label={language === 'en' ? 'Description' : 'खर्चाचे वर्णन'} value={selectedVoucher.title} />
                  <VoucherRow label={language === 'en' ? 'Category' : 'श्रेणी'} value={selectedVoucher.category} />
                  <VoucherRow label={language === 'en' ? 'Paid to' : 'ज्यांना दिले'} value={selectedVoucher.paidTo || '-'} />
                  <VoucherRow label={language === 'en' ? 'Payment mode' : 'पेमेंट पद्धत'} value={selectedVoucher.paymentMode.toUpperCase()} />
                  <VoucherRow label={language === 'en' ? 'Recorded by' : 'नोंद करणारे'} value={selectedVoucher.recordedBy?.name || '-'} />
                </div>
                <div className="border-y-2 border-slate-900 py-4 text-center">
                  <p className="text-xs font-bold uppercase text-slate-600">{language === 'en' ? 'Amount paid' : 'अदा केलेली रक्कम'}</p>
                  <p className="mt-1 text-3xl font-black">₹{selectedVoucher.amount.toLocaleString('en-IN')}</p>
                </div>
                {selectedVoucher.billPhotoUrl && (
                  <div className="mt-5 border-t border-dashed border-slate-400 pt-4">
                    <p className="mb-2 text-xs font-bold uppercase text-slate-600">{language === 'en' ? 'Attached bill / invoice' : 'जोडलेले बिल / पावती'}</p>
                    <img src={selectedVoucher.billPhotoUrl} alt="Attached bill" className="mx-auto max-h-72 max-w-full object-contain" />
                  </div>
                )}
                <div className="mt-16 grid grid-cols-3 gap-5 text-center text-xs font-bold">
                  <div className="border-t border-slate-800 pt-2">{language === 'en' ? 'Receiver signature' : 'स्वीकारणाऱ्याची सही'}</div>
                  <div className="border-t border-slate-800 pt-2">{language === 'en' ? 'Treasurer' : 'खजिनदार'}</div>
                  <div className="border-t border-slate-800 pt-2">{language === 'en' ? 'President / Secretary' : 'अध्यक्ष / सचिव'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const VoucherRow: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
  <div className="flex gap-2">
    <span className="shrink-0 font-bold text-slate-600">{label}:</span>
    <span className="font-semibold text-slate-950">{value}</span>
  </div>
);
