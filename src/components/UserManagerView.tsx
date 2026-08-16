import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { User } from '../types';
import { MANDAL_CONFIG } from '../../shared/mandalConfig';
import {
  Users,
  UserPlus,
  Shield,
  Smartphone,
  CheckCircle2,
  LogOut,
  RefreshCw,
  Phone,
  Lock,
  Calendar,
  AlertCircle,
  Trash2,
  X,
  Edit3
} from 'lucide-react';

export const UserManagerView: React.FC = () => {
  const { authFetch, user: currentUser } = useAuth();
  const { language, t } = useLanguage();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Add User Modal/Form state
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [canUpdateReceiptStatus, setCanUpdateReceiptStatus] = useState(false);
  const [canManageExpenses, setCanManageExpenses] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetPassword, setResetPassword] = useState('');
  const [resetConfirmation, setResetConfirmation] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await authFetch('/api/auth/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone || !password) {
      setError(language === 'en' ? 'Please fill in all required fields.' : 'कृपया सर्व आवश्यक माहिती भरा.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await authFetch(editingUser ? `/api/auth/users/${editingUser.id}` : '/api/auth/create-user', {
        method: editingUser ? 'PATCH' : 'POST',
        body: JSON.stringify({ name, phone, password, role, isActive, canUpdateReceiptStatus, canManageExpenses }),
      });
      const data = await res.json();

      if (res.ok) {
        alert(language === 'en' ? (editingUser ? 'Member updated successfully!' : 'New volunteer created successfully!') : (editingUser ? 'कार्यकर्त्याची माहिती अद्ययावत झाली!' : 'नवीन कार्यकर्ता खाते तयार झाले!'));
        setName('');
        setPhone('');
        setPassword('');
        setShowAddModal(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        setError(data.error || 'Error creating user');
      }
    } catch (err: any) {
      setError(err.message || 'Error creating user');
    } finally {
      setSubmitting(false);
    }
  };

  const openCreateUser = () => {
    setEditingUser(null); setName(''); setPhone(''); setPassword(''); setRole('user'); setIsActive(true); setCanUpdateReceiptStatus(false); setCanManageExpenses(false); setError(null); setShowAddModal(true);
  };

  const openEditUser = (member: User) => {
    setEditingUser(member); setName(member.name); setPhone(member.phone); setPassword(''); setRole(member.role); setIsActive(member.isActive !== false); setCanUpdateReceiptStatus(Boolean(member.canUpdateReceiptStatus)); setCanManageExpenses(Boolean(member.canManageExpenses)); setError(null); setShowAddModal(true);
  };

  const handleDeleteUser = async (member: User) => {
    if (!window.confirm(language === 'en' ? `Permanently delete ${member.name}?` : `${member.name} यांचे खाते कायमचे हटवायचे आहे का?`)) return;
    const response = await authFetch(`/api/auth/users/${member.id}`, { method: 'DELETE' });
    const result = await response.json();
    if (!response.ok) return alert(result.error || 'Could not delete member.');
    await fetchUsers();
  };

  const handleForceLogout = async (userId: string, userName: string) => {
    const promptMsg = language === 'en'
      ? `Are you sure you want to terminate active session for "${userName}"?`
      : `तुम्हाला खरोखर "${userName}" चे चालू सत्र (Active Session) बंद करायचे आहे का?`;

    if (!window.confirm(promptMsg)) return;

    try {
      const res = await authFetch('/api/auth/force-logout-user', {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      if (res.ok) {
        alert(language === 'en' ? `Active session for ${userName} terminated.` : `${userName} यांचे सत्र सुरक्षिततेसाठी बंद करण्यात आले.`);
        fetchUsers();
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    }
  };

  const handleResetData = async (event: React.FormEvent) => {
    event.preventDefault();
    setResetting(true);
    setResetError(null);
    try {
      const response = await authFetch('/api/auth/reset-mandal-data', {
        method: 'POST',
        body: JSON.stringify({ password: resetPassword, confirmation: resetConfirmation }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Data reset failed.');
      setShowResetModal(false);
      setResetPassword('');
      setResetConfirmation('');
      await fetchUsers();
      alert(language === 'en' ? result.message : 'मंडळाचा आर्थिक डेटा यशस्वीरीत्या रीसेट झाला. मुख्य ॲडमिन खाते सुरक्षित ठेवले आहे.');
    } catch (resetRequestError: any) {
      setResetError(resetRequestError.message);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-amber-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 uppercase tracking-wider">
            <Shield className="w-4 h-4 text-amber-700" />
            <span>{t('usr_title')}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 font-serif mt-1">
            {t('usr_device_management')}
          </h2>
          <p className="text-xs text-slate-500">
            {t('usr_subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchUsers}
            className="p-2.5 text-slate-600 hover:text-amber-800 hover:bg-amber-50 rounded-xl border border-slate-200 cursor-pointer"
            title={t('action_refresh')}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={openCreateUser}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>{t('usr_btn_new')}</span>
          </button>
          {currentUser?.phone === MANDAL_CONFIG.primaryAdmin.phone && (
            <button onClick={() => setShowResetModal(true)} className="flex items-center gap-1.5 rounded-xl bg-red-700 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-600">
              <Trash2 className="h-4 w-4" />
              <span>{language === 'en' ? 'Reset Data' : 'डेटा रीसेट'}</span>
            </button>
          )}
        </div>
      </div>

      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border-2 border-red-400 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div><h3 className="flex items-center gap-2 text-lg font-black text-red-800"><AlertCircle className="h-5 w-5" />{language === 'en' ? 'Permanently reset Mandal data' : 'मंडळाचा डेटा कायमचा रीसेट करा'}</h3><p className="mt-2 text-xs leading-5 text-slate-600">{language === 'en' ? 'This deletes all receipts, expenses, audit history, and other member accounts. Your primary admin account remains.' : 'यामुळे सर्व पावत्या, खर्च, ऑडिट इतिहास आणि इतर कार्यकर्ता खाती हटतील. तुमचे मुख्य ॲडमिन खाते सुरक्षित राहील.'}</p></div>
              <button onClick={() => setShowResetModal(false)} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"><X className="h-5 w-5" /></button>
            </div>
            {resetError && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-bold text-red-800">{resetError}</div>}
            <form onSubmit={handleResetData} className="mt-5 space-y-4">
              <div><label className="mb-1 block text-xs font-bold text-slate-700">{language === 'en' ? 'Current admin password' : 'सध्याचा ॲडमिन पासवर्ड'}</label><input type="password" required value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:border-red-500" /></div>
              <div><label className="mb-1 block text-xs font-bold text-slate-700">{language === 'en' ? 'Type the exact confirmation phrase:' : 'खालील वाक्य जसेच्या तसे टाइप करा:'}</label><code className="mb-2 block rounded-lg bg-slate-100 p-2 text-xs font-black text-red-800">DELETE RAJMUDRA DATA</code><input required value={resetConfirmation} onChange={(event) => setResetConfirmation(event.target.value)} autoComplete="off" className="w-full rounded-xl border border-slate-300 px-3 py-2 font-mono text-sm outline-none focus:border-red-500" /></div>
              <div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setShowResetModal(false)} className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700">{t('action_cancel')}</button><button type="submit" disabled={resetting || resetConfirmation !== 'DELETE RAJMUDRA DATA'} className="rounded-xl bg-red-700 px-4 py-2 text-xs font-black text-white disabled:cursor-not-allowed disabled:opacity-40">{resetting ? '...' : (language === 'en' ? 'Delete and reset' : 'हटवा आणि रीसेट करा')}</button></div>
            </form>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6 border-2 border-amber-400">
            <h3 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2 font-serif">
              <UserPlus className="w-5 h-5 text-amber-700" />
              <span>{editingUser ? (language === 'en' ? 'Edit member' : 'कार्यकर्ता बदला') : t('usr_btn_new')}</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              {language === 'en' ? 'Authorized to create receipts and view accounts.' : 'या कार्यकर्त्याला पावती फाडण्याचे आणि हिशोब पाहण्याचे अधिकार मिळतील.'}
            </p>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 p-3 rounded-lg text-red-800 text-xs mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs sm:text-sm">
              <div>
                <label className="block font-bold text-slate-700 mb-1">{language === 'en' ? 'Full Name *' : 'पूर्ण नाव (Full Name) *'}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="उदा. राहुल तानाजी पाटील"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('login_phone_label')} *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={Boolean(editingUser)}
                  placeholder="उदा. 9822XXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{t('login_pass_label')} *</label>
                <input
                  type="password"
                  required={!editingUser}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={editingUser ? (language === 'en' ? 'Leave blank to keep current password' : 'सध्याचा पासवर्ड ठेवण्यासाठी रिकामे सोडा') : 'किमान ६ अक्षरी पासवर्ड'}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">{language === 'en' ? 'Role' : 'भूमिका (Role)'}</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  disabled={editingUser?.phone === MANDAL_CONFIG.primaryAdmin.phone}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-amber-500 bg-white"
                >
                  <option value="user">{t('role_user')}</option>
                  <option value="admin">{t('role_admin')}</option>
                </select>
              </div>

              <div className="grid gap-2 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
                <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={canUpdateReceiptStatus || role === 'admin'} disabled={role === 'admin'} onChange={(event) => setCanUpdateReceiptStatus(event.target.checked)} />{language === 'en' ? 'Can change Paid / Unpaid status' : 'जमा / बाकी स्थिती बदलण्याचा अधिकार'}</label>
                <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={canManageExpenses || role === 'admin'} disabled={role === 'admin'} onChange={(event) => setCanManageExpenses(event.target.checked)} />{language === 'en' ? 'Can record expenses' : 'खर्च नोंदवण्याचा अधिकार'}</label>
                {editingUser && <label className="flex items-center gap-2 font-semibold"><input type="checkbox" checked={isActive} disabled={editingUser.phone === MANDAL_CONFIG.primaryAdmin.phone} onChange={(event) => setIsActive(event.target.checked)} />{language === 'en' ? 'Account active' : 'खाते सक्रिय'}</label>}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-50 cursor-pointer"
                >
                  {t('action_cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow cursor-pointer"
                >
                  {submitting ? '...' : t('action_submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-amber-200/80 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-amber-50/80 border-b border-amber-200 text-amber-950 font-bold">
                <th className="py-3 px-3.5">{language === 'en' ? 'Volunteer Name' : 'कार्यकर्ता नाव'}</th>
                <th className="py-3 px-3.5">{language === 'en' ? 'Mobile Number' : 'मोबाईल नंबर'}</th>
                <th className="py-3 px-3.5">{language === 'en' ? 'Role' : 'भूमिका'}</th>
                <th className="py-3 px-3.5">{language === 'en' ? 'Session Status' : 'चालू सत्र (Session Status)'}</th>
                <th className="py-3 px-3.5">{language === 'en' ? 'Last Login' : 'शेवटचे लॉगिन'}</th>
                <th className="py-3 px-3.5">{language === 'en' ? 'Permissions' : 'अधिकार'}</th>
                <th className="py-3 px-3.5 text-right">{language === 'en' ? 'Controls' : 'नियंत्रण'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((u) => {
                const isMe = u.id === currentUser?.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-3.5 font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{u.name}</span>
                        {isMe && (
                          <span className="text-[10px] bg-amber-500 text-amber-950 font-extrabold px-1.5 py-0.2 rounded">
                            {language === 'en' ? 'Current (You)' : 'मी (Current)'}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3.5 font-mono text-slate-700">
                      {u.phone}
                    </td>

                    <td className="py-3 px-3.5">
                      {u.role === 'admin' ? (
                        <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-xs font-bold rounded-full border border-amber-300">
                          {t('role_admin')}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full border border-orange-200">
                          {t('role_user')}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-3.5">
                      {u.isActive === false ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">{language === 'en' ? 'Deactivated' : 'निष्क्रिय'}</span>
                      ) : u.hasActiveSession ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> {language === 'en' ? '1 Device Active' : 'सक्रिय (1 Device Active)'}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">{language === 'en' ? 'Logged Out' : 'लॉगआउट'}</span>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-xs text-slate-500">
                      <div>{u.lastLoginDevice || (language === 'en' ? 'N/A' : 'उपलब्ध नाही')}</div>
                      {u.lastLoginAt && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(u.lastLoginAt).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-3.5 text-[11px]"><div className="space-y-1"><div className={u.role === 'admin' || u.canUpdateReceiptStatus ? 'text-emerald-700 font-bold' : 'text-slate-400'}>{language === 'en' ? 'Receipt status' : 'पावती स्थिती'}</div><div className={u.role === 'admin' || u.canManageExpenses ? 'text-emerald-700 font-bold' : 'text-slate-400'}>{language === 'en' ? 'Expenses' : 'खर्च'}</div></div></td>

                    <td className="py-3 px-3.5 text-right">
                      <div className="flex justify-end gap-1">
                      <button onClick={() => openEditUser(u)} className="rounded-lg p-1.5 text-slate-500 hover:bg-amber-50 hover:text-amber-800" title="Edit"><Edit3 className="h-4 w-4" /></button>
                      {u.hasActiveSession && !isMe && (
                        <button
                          onClick={() => handleForceLogout(u.id, u.name)}
                          className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 font-bold rounded-lg text-xs transition cursor-pointer"
                          title="सत्र जबरदस्तीने बंद करा (Force Logout)"
                        >
                          {t('logout_btn')}
                        </button>
                      )}
                      {!isMe && u.phone !== MANDAL_CONFIG.primaryAdmin.phone && <button onClick={() => void handleDeleteUser(u)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-700" title="Delete"><Trash2 className="h-4 w-4" /></button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
