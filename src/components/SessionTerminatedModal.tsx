import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { ShieldAlert, Smartphone, Clock, LogIn, AlertTriangle } from 'lucide-react';

export const SessionTerminatedModal: React.FC = () => {
  const { sessionTerminated, dismissSessionTerminatedModal } = useAuth();
  const { language, t } = useLanguage();

  if (!sessionTerminated.isTerminated) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden border-2 border-red-500 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Warning Banner */}
        <div className="bg-gradient-to-r from-red-600 via-red-700 to-rose-800 p-6 text-white text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-3 border-2 border-white/20 shadow-inner">
            <ShieldAlert className="w-9 h-9 text-amber-300 animate-bounce" />
          </div>
          <h3 className="text-xl font-bold font-serif">
            {language === 'en' ? 'New Login Detected on Another Device!' : 'दुसऱ्या डिव्हाइसवर नवीन लॉगिन झाले आहे!'}
          </h3>
          <p className="text-xs text-red-100 mt-1">
            {language === 'en' ? '(Active session terminated for account security)' : '(सुरक्षिततेसाठी हे सत्र आपोआप बंद करण्यात आले)'}
          </p>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4 text-slate-800">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-xs sm:text-sm text-red-900 leading-relaxed">
            <p className="font-semibold mb-1 flex items-center gap-1.5 text-red-800">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{language === 'en' ? 'Single-Device Security Policy:' : 'सुरक्षित सिंगल-डिव्हाइस नियम:'}</span>
            </p>
            <p>
              {language === 'en' 
                ? 'Your account was logged in from a new mobile/browser. To prevent unauthorized concurrent access, this session has been automatically logged out.'
                : 'आपल्या खात्यावर दुसऱ्या मोबाइल किंवा संगणकावरून नवीन लॉगिन करण्यात आले आहे. त्यामुळे सुरक्षा धोरणानुसार हे जुने सत्र आपोआप लॉगआउट करण्यात आले आहे.'}
            </p>
          </div>

          {/* Session Metadata */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs space-y-2 text-slate-600">
            {sessionTerminated.device && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500">
                  <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'en' ? 'New Device:' : 'नवीन डिव्हाइस:'}</span>
                </span>
                <strong className="text-slate-900">{sessionTerminated.device}</strong>
              </div>
            )}

            {sessionTerminated.time && (
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{language === 'en' ? 'Login Time:' : 'लॉगिन वेळ:'}</span>
                </span>
                <strong className="text-slate-900">{sessionTerminated.time}</strong>
              </div>
            )}
          </div>

          <div className="pt-2">
            <button
              id="dismiss-session-terminated-btn"
              onClick={dismissSessionTerminatedModal}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-bold rounded-xl shadow-md transition transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>{language === 'en' ? 'Login Again' : 'पुन्हा लॉगिन करा (Login Again)'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
