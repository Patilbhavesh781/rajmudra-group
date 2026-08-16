import React, { useState } from 'react';
import { AlertTriangle, Eye, EyeOff, Lock, LogIn, Phone, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export const LoginView: React.FC = () => {
  const { login } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [loginAlert, setLoginAlert] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setShowErrorPopup(false);
    setLoginAlert(null);

    if (!phone.trim() || !password.trim()) {
      setError(language === 'mr' ? 'कृपया मोबाईल नंबर आणि पासवर्ड टाका.' : 'Please enter mobile number and password.');
      setShowErrorPopup(true);
      return;
    }

    setLoading(true);
    const result = await login(phone.trim(), password);
    setLoading(false);

    if (!result.success) {
      setError(result.error || (language === 'mr' ? 'लॉगिन अयशस्वी. कृपया पुन्हा प्रयत्न करा.' : 'Login failed. Please try again.'));
      setShowErrorPopup(true);
      return;
    }

    if (result.previousSessionTerminated) {
      setLoginAlert(language === 'mr'
        ? `तुमचे पूर्वीचे सत्र (${result.previousDevice || 'इतर डिव्हाइस'}) सुरक्षितपणे बंद करण्यात आले.`
        : `Your previous session (${result.previousDevice || 'another device'}) was securely closed.`);
    }
  };

  const errorTitle = error?.toLowerCase().includes('password') || error?.includes('पासवर्ड')
    ? (language === 'mr' ? 'चुकीचा पासवर्ड' : 'Incorrect Password')
    : error?.toLowerCase().includes('not found')
      ? (language === 'mr' ? 'युजर सापडला नाही' : 'User Not Found')
      : (language === 'mr' ? 'लॉगिन त्रुटी' : 'Login Alert');

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'radial-gradient(circle at top center, #7C2D12 0%, #450A0A 60%, #1C1917 100%)' }}
    >
      <div className="absolute inset-0 opacity-10 pointer-events-none login-festive-pattern" />

      <div className="absolute top-4 right-4 z-20 flex items-center bg-black/40 backdrop-blur-md p-1 rounded-xl border border-amber-500/30 text-xs">
        <button
          type="button"
          onClick={() => setLanguage('mr')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${language === 'mr' ? 'bg-amber-600 text-white' : 'text-amber-200 hover:text-white'}`}
        >
          मराठी
        </button>
        <button
          type="button"
          onClick={() => setLanguage('en')}
          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${language === 'en' ? 'bg-amber-600 text-white' : 'text-amber-200 hover:text-white'}`}
        >
          English
        </button>
      </div>

      {showErrorPopup && error && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border-2 border-red-500 text-center space-y-4 animate-scale-up">
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto border-2 border-red-200">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-base font-black text-red-950">⚠️ {errorTitle}</h3>
              <p className="text-xs font-semibold text-stone-800 mt-2 leading-relaxed bg-red-50 p-3.5 rounded-xl border border-red-200 text-left">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => setShowErrorPopup(false)}
              className="w-full py-2.5 px-4 bg-gradient-to-r from-red-600 to-amber-700 hover:from-red-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer"
            >
              {language === 'mr' ? 'समजले, पुन्हा प्रयत्न करा' : 'Okay, Try Again'}
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md w-full relative z-10">
        {loginAlert && (
          <div className="mb-4 bg-red-950/90 border-2 border-red-500 text-red-100 p-4 rounded-2xl shadow-xl space-y-1">
            <div className="flex items-center gap-2 font-black text-amber-300 text-sm">
              <ShieldAlert className="w-5 h-5 text-red-400" />
              <span>{language === 'mr' ? 'मागील सत्र समाप्त' : 'Previous Session Terminated'}</span>
            </div>
            <p className="text-xs text-stone-200">{loginAlert}</p>
          </div>
        )}

        <div className="bg-amber-50/95 backdrop-blur-md rounded-3xl shadow-2xl border-4 border-double border-amber-700/60 overflow-hidden">
          <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-red-800 text-amber-50 p-5 sm:p-6 text-center relative border-b-2 border-amber-600">
            <div className="flex items-center justify-between mb-3 px-1 gap-2">
              <div className="flex flex-col items-center shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-600 shadow-lg border-2 border-amber-300/80 overflow-hidden">
                  <img src="/images/ganpati.jpg" alt="Lord Ganesha" className="w-full h-full object-cover rounded-full" />
                </div>
                <span className="text-[10px] font-extrabold text-amber-200 mt-1">श्री गणेश</span>
              </div>

              <div className="text-center flex-1 px-1">
                <span className="text-[11px] font-extrabold text-amber-200 uppercase tracking-widest block">॥ श्री गणेशाय नमः ॥</span>
                <span className="text-xs font-bold text-white block mt-0.5">सार्वजनिक गणेशोत्सव २०२६</span>
                <h1 className="text-lg sm:text-2xl font-black text-yellow-300 font-serif tracking-tight mt-1 leading-tight drop-shadow-sm">राजमुद्रा गणपती मंडळ</h1>
                <p className="text-[11px] sm:text-xs font-semibold text-amber-100 mt-0.5">पावती व आर्थिक व्यवस्थापन प्रणाली</p>
              </div>

              <div className="flex flex-col items-center shrink-0">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full p-0.5 bg-gradient-to-tr from-amber-300 via-yellow-400 to-amber-600 shadow-lg border-2 border-amber-300/80 overflow-hidden">
                  <img src="/images/shivaji.jpg" alt="Chhatrapati Shivaji Maharaj" className="w-full h-full object-cover rounded-full" />
                </div>
                <span className="text-[10px] font-extrabold text-amber-200 mt-1">छ. शिवाजी महाराज</span>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">
            <div className="text-center">
              <h2 className="text-base font-bold text-stone-900">{t('login_title')}</h2>
              <p className="text-xs text-stone-600 mt-0.5">
                {language === 'mr' ? 'नोंदणीकृत मोबाईल नंबर व पासवर्ड वापरून प्रवेश करा.' : 'Enter your registered mobile number and password.'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label htmlFor="login-phone-input" className="block font-bold text-stone-700 uppercase tracking-wider mb-1.5">{t('login_phone_label')}</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    id="login-phone-input"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.replace(/\D/g, ''))}
                    placeholder="१० अंकी नोंदणीकृत मोबाईल नंबर"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-mono font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="login-password-input" className="block font-bold text-stone-700 uppercase tracking-wider mb-1.5">{t('login_pass_label')}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <input
                    id="login-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder={language === 'mr' ? 'पासवर्ड टाका' : 'Enter password'}
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((visible) => !visible)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-stone-500 hover:text-stone-800 cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-700 via-amber-800 to-red-800 hover:from-amber-800 hover:to-red-900 text-white font-black text-sm rounded-xl shadow-lg shadow-amber-900/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>{loading ? (language === 'mr' ? 'लॉगिन होत आहे...' : 'Signing in...') : t('login_btn')}</span>
              </button>
            </form>

            <div className="text-[10px] text-stone-500 text-center leading-tight bg-amber-100/50 p-2 rounded-lg border border-amber-200">
              🔒 <strong>{language === 'mr' ? 'सुरक्षा टीप:' : 'Security:'}</strong>{' '}
              {language === 'mr' ? 'एका वेळी फक्त एकाच डिव्हाइसवर लॉगिन चालू राहील.' : 'Only one device can remain logged in at a time.'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
