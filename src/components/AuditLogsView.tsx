import React, { useCallback, useEffect, useState } from 'react';
import { Activity, ChevronLeft, ChevronRight, Clock, Filter, RefreshCw, ShieldCheck, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { AuditAction, AuditLog } from '../types';

const actionLabels: Record<AuditAction, { en: string; mr: string; color: string }> = {
  LOGIN: { en: 'Login', mr: 'लॉगिन', color: 'bg-emerald-100 text-emerald-800' },
  LOGOUT: { en: 'Logout', mr: 'लॉगआउट', color: 'bg-slate-100 text-slate-700' },
  USER_CREATED: { en: 'User created', mr: 'युजर तयार', color: 'bg-blue-100 text-blue-800' },
  USER_FORCE_LOGOUT: { en: 'Force logout', mr: 'सत्र बंद', color: 'bg-orange-100 text-orange-800' },
  PAVTI_CREATED: { en: 'Receipt created', mr: 'पावती तयार', color: 'bg-amber-100 text-amber-900' },
  PAVTI_PAYMENT_STATUS_CHANGED: { en: 'Payment updated', mr: 'पेमेंट बदल', color: 'bg-purple-100 text-purple-800' },
  PAVTI_CANCELLED: { en: 'Receipt cancelled', mr: 'पावती रद्द', color: 'bg-red-100 text-red-800' },
  EXPENSE_CREATED: { en: 'Expense created', mr: 'खर्च नोंद', color: 'bg-rose-100 text-rose-800' },
  EXPENSE_DELETED: { en: 'Expense deleted', mr: 'खर्च हटवला', color: 'bg-red-100 text-red-800' },
};

const formatMetadata = (metadata: Record<string, unknown>) =>
  Object.entries(metadata || {}).map(([key, value]) => `${key}: ${String(value)}`).join(' • ');

export const AuditLogsView: React.FC = () => {
  const { authFetch } = useAuth();
  const { language } = useLanguage();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [action, setAction] = useState('all');
  const [entityType, setEntityType] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50', action, entityType });
      const response = await authFetch(`/api/audit/list?${params.toString()}`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to load audit logs.');
      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch (loadError: any) {
      setError(loadError.message || 'Failed to load audit logs.');
    } finally {
      setLoading(false);
    }
  }, [action, authFetch, entityType, page]);

  useEffect(() => { loadLogs(); }, [loadLogs]);
  useEffect(() => { setPage(1); }, [action, entityType]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-gradient-to-r from-slate-950 via-amber-950 to-slate-900 text-white p-5 sm:p-6 shadow-xl border border-amber-700/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-400" />
              <h2 className="text-xl sm:text-2xl font-black font-serif">{language === 'mr' ? 'ऑडिट नोंदी' : 'Audit Logs'}</h2>
            </div>
            <p className="text-xs text-amber-200/80 mt-1">
              {language === 'mr' ? 'लॉगिन, पावती, खर्च आणि युजर प्रशासनातील महत्त्वाच्या क्रियांची सुरक्षित नोंद.' : 'Permanent history of important login, receipt, expense, and user-administration actions.'}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 border border-white/15 px-4 py-2 text-center">
            <div className="text-2xl font-black font-mono text-amber-300">{total}</div>
            <div className="text-[10px] uppercase tracking-wider text-amber-100">{language === 'mr' ? 'एकूण नोंदी' : 'Total events'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3.5 flex flex-col sm:flex-row gap-3 sm:items-end">
        <div className="flex items-center gap-2 text-slate-600 text-xs font-bold sm:pb-2"><Filter className="w-4 h-4" />{language === 'mr' ? 'फिल्टर' : 'Filters'}</div>
        <label className="text-xs font-bold text-slate-600 flex-1">
          {language === 'mr' ? 'क्रिया' : 'Action'}
          <select value={action} onChange={(event) => setAction(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium">
            <option value="all">{language === 'mr' ? 'सर्व क्रिया' : 'All actions'}</option>
            {Object.entries(actionLabels).map(([key, label]) => <option key={key} value={key}>{language === 'mr' ? label.mr : label.en}</option>)}
          </select>
        </label>
        <label className="text-xs font-bold text-slate-600 flex-1">
          {language === 'mr' ? 'विभाग' : 'Section'}
          <select value={entityType} onChange={(event) => setEntityType(event.target.value)} className="mt-1 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium">
            <option value="all">{language === 'mr' ? 'सर्व विभाग' : 'All sections'}</option>
            <option value="auth">Authentication</option><option value="user">Users</option><option value="pavti">Pavtis</option><option value="expense">Expenses</option>
          </select>
        </label>
        <button onClick={loadLogs} disabled={loading} className="px-4 py-2 rounded-xl bg-amber-700 hover:bg-amber-800 text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer">
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />{language === 'mr' ? 'रिफ्रेश' : 'Refresh'}
        </button>
      </div>

      {error && <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-semibold text-red-800">{error}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex flex-col items-center text-slate-500"><RefreshCw className="w-7 h-7 animate-spin text-amber-700 mb-2" /><span className="text-sm">{language === 'mr' ? 'नोंदी लोड होत आहेत...' : 'Loading audit logs...'}</span></div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-slate-500"><Activity className="w-9 h-9 mx-auto mb-2 text-slate-300" /><p className="text-sm font-semibold">{language === 'mr' ? 'या फिल्टरसाठी नोंदी उपलब्ध नाहीत.' : 'No audit events match these filters.'}</p></div>
        ) : (
          <div className="divide-y divide-slate-100">
            {logs.map((log) => {
              const label = actionLabels[log.action] || { en: log.action, mr: log.action, color: 'bg-slate-100 text-slate-700' };
              const details = formatMetadata(log.metadata);
              return (
                <article key={log._id} className="p-4 hover:bg-amber-50/30 transition-colors">
                  <div className="flex flex-col sm:flex-row gap-3 sm:items-start">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-black uppercase tracking-wide rounded-full px-2 py-1 ${label.color}`}>{language === 'mr' ? label.mr : label.en}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400">{log.entityType}</span>
                      </div>
                      <p className="mt-2 text-sm font-bold text-slate-900">{log.description}</p>
                      {details && <p className="mt-1.5 text-xs text-slate-500 break-words">{details}</p>}
                      <div className="mt-2 flex items-center gap-x-4 gap-y-1 flex-wrap text-[11px] text-slate-500">
                        <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{log.actor?.name || 'System'} ({log.actor?.role || 'system'})</span>
                        {log.actor?.phone && <span className="font-mono">{log.actor.phone}</span>}
                        {log.ipAddress && <span className="font-mono">IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                    <time className="shrink-0 text-[11px] text-slate-500 flex items-center gap-1 sm:justify-end"><Clock className="w-3.5 h-3.5" />{new Date(log.createdAt).toLocaleString(language === 'mr' ? 'mr-IN' : 'en-IN')}</time>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-slate-500">{language === 'mr' ? `पृष्ठ ${page} / ${totalPages}` : `Page ${page} of ${totalPages}`}</span>
        <div className="flex gap-2">
          <button onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || loading} className="p-2 rounded-lg border border-slate-300 bg-white disabled:opacity-40 cursor-pointer"><ChevronLeft className="w-4 h-4" /></button>
          <button onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || loading} className="p-2 rounded-lg border border-slate-300 bg-white disabled:opacity-40 cursor-pointer"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
    </div>
  );
};
