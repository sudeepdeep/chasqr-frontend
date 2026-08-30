import { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';
import { User, Mail, Shield, Crown, Calendar, Save, Lock, ShieldCheck } from 'lucide-react';
import { AuthStore, setAuth } from '../store/auth';
import {
  updateProfileAPI, changePasswordAPI,
  requestEnableMfaAPI, confirmEnableMfaAPI, disableMfaAPI,
} from '../api/auth.api';
import PasswordInput from '../components/PasswordInput';
import OtpInput from '../components/OtpInput';

export default function Profile() {
  const { user, token } = AuthStore.useState();
  const [name, setName] = useState(user?.name || '');
  const [savingName, setSavingName] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);

  const [mfaStep, setMfaStep] = useState<'idle' | 'confirming' | 'disabling'>('idle');
  const [mfaOtp, setMfaOtp] = useState('');
  const [mfaBusy, setMfaBusy] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');

  if (!user) return null;

  const initial = user.name?.[0]?.toUpperCase() || '?';
  const nameChanged = name.trim() && name.trim() !== user.name;

  const handleSaveName = async () => {
    if (!nameChanged) return;
    setSavingName(true);
    try {
      const res = await updateProfileAPI(name.trim());
      setAuth(res.data.data.user, token!);
      toast.success('Name updated');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to update name');
    } finally {
      setSavingName(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword) { toast.error('Fill in both password fields'); return; }
    if (newPassword.length < 8) { toast.error('New password must be at least 8 characters'); return; }
    setChangingPassword(true);
    try {
      await changePasswordAPI(currentPassword, newPassword);
      toast.success('Password changed');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to change password');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleRequestEnableMfa = async () => {
    setMfaBusy(true);
    try {
      await requestEnableMfaAPI();
      toast.success('Confirmation code sent to your email');
      setMfaStep('confirming');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send code');
    } finally {
      setMfaBusy(false);
    }
  };

  const handleConfirmEnableMfa = async (otp: string) => {
    setMfaBusy(true);
    try {
      const res = await confirmEnableMfaAPI(otp);
      setAuth(res.data.data.user, token!);
      toast.success('Two-factor authentication enabled');
      setMfaStep('idle');
      setMfaOtp('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Incorrect or expired code');
      setMfaOtp('');
    } finally {
      setMfaBusy(false);
    }
  };

  const handleDisableMfa = async () => {
    if (!disablePassword) { toast.error('Enter your password to confirm'); return; }
    setMfaBusy(true);
    try {
      const res = await disableMfaAPI(disablePassword);
      setAuth(res.data.data.user, token!);
      toast.success('Two-factor authentication disabled');
      setMfaStep('idle');
      setDisablePassword('');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Incorrect password');
    } finally {
      setMfaBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pt-8 pb-16 px-6">
      <div className="max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-bebas text-5xl text-slate-900 mb-1">My Profile</h1>
          <p className="text-slate-500 text-sm mb-10">Manage your account details and security.</p>

          {/* Account overview */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-primary-light text-primary flex items-center justify-center font-bebas text-3xl shrink-0">
                {initial}
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{user.name}</p>
                <p className="text-sm text-slate-500 truncate">{user.email}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2 text-slate-500">
                <Crown size={14} className={user.plan === 'paid' ? 'text-amber-500' : 'text-slate-400'} />
                Plan: <span className="font-medium text-slate-700 capitalize">{user.plan}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Shield size={14} />
                Role: <span className="font-medium text-slate-700 capitalize">{user.role}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-500">
                <Mail size={14} />
                Email: <span className={`font-medium ${user.email_verified ? 'text-green-600' : 'text-amber-600'}`}>
                  {user.email_verified ? 'Verified' : 'Unverified'}
                </span>
              </div>
              {user.created_at && (
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar size={14} />
                  Joined: <span className="font-medium text-slate-700">
                    {new Date(user.created_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Edit name */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <h2 className="font-bebas text-xl text-slate-900 mb-3">Display Name</h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <button
                onClick={handleSaveName}
                disabled={!nameChanged || savingName}
                className="flex items-center gap-1.5 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm shrink-0"
              >
                <Save size={14} /> {savingName ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          {/* Change password */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-6">
            <h2 className="font-bebas text-xl text-slate-900 mb-3">Change Password</h2>
            <div className="space-y-3">
              <PasswordInput
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Current password"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min. 8 characters)"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="flex items-center gap-1.5 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
              >
                <Lock size={14} /> {changingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* Two-factor authentication */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bebas text-xl text-slate-900">Two-Factor Authentication</h2>
              {user.mfaEnabled && (
                <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                  <ShieldCheck size={12} /> Enabled
                </span>
              )}
            </div>

            {mfaStep === 'idle' && (
              <>
                <p className="text-slate-500 text-sm mb-4">
                  {user.mfaEnabled
                    ? "We'll email you a 6-digit code to confirm it's you every time you log in."
                    : "Add an extra step at login — we'll email you a 6-digit code to confirm it's you."}
                </p>
                {user.mfaEnabled ? (
                  <button
                    onClick={() => setMfaStep('disabling')}
                    className="flex items-center gap-1.5 text-red-600 hover:text-red-700 border border-red-200 font-semibold px-5 py-2.5 rounded-xl hover:bg-red-50 transition-colors text-sm"
                  >
                    Disable
                  </button>
                ) : (
                  <button
                    onClick={handleRequestEnableMfa}
                    disabled={mfaBusy}
                    className="flex items-center gap-1.5 bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-50 text-sm"
                  >
                    <ShieldCheck size={14} /> {mfaBusy ? 'Sending...' : 'Enable'}
                  </button>
                )}
              </>
            )}

            {mfaStep === 'confirming' && (
              <div>
                <p className="text-slate-500 text-sm mb-4">
                  Enter the 6-digit code we emailed to <span className="font-medium text-slate-700">{user.email}</span> to confirm.
                </p>
                <div className="flex justify-start mb-4">
                  <OtpInput
                    value={mfaOtp}
                    disabled={mfaBusy}
                    onChange={(v) => {
                      setMfaOtp(v);
                      if (v.length === 6) handleConfirmEnableMfa(v);
                    }}
                  />
                </div>
                <button
                  onClick={() => { setMfaStep('idle'); setMfaOtp(''); }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}

            {mfaStep === 'disabling' && (
              <div>
                <p className="text-slate-500 text-sm mb-4">Enter your password to confirm you want to turn this off.</p>
                <div className="flex gap-3">
                  <PasswordInput
                    value={disablePassword}
                    onChange={(e) => setDisablePassword(e.target.value)}
                    placeholder="Current password"
                    className="flex-1 border border-slate-200 rounded-xl px-4 py-2.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <button
                    onClick={handleDisableMfa}
                    disabled={mfaBusy}
                    className="bg-red-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 text-sm shrink-0"
                  >
                    {mfaBusy ? 'Disabling...' : 'Confirm'}
                  </button>
                </div>
                <button
                  onClick={() => { setMfaStep('idle'); setDisablePassword(''); }}
                  className="text-xs text-slate-400 hover:text-slate-600 transition-colors mt-3"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
