import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { loginAPI, googleAuthAPI, verifyLoginMfaAPI, resendLoginMfaAPI } from '../api/auth.api';
import { setAuth } from '../store/auth';
import AuthSplitLayout from '../layout/AuthSplitLayout';
import PasswordInput from '../components/PasswordInput';
import EmailOtpVerify from '../components/EmailOtpVerify';

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [otpContext, setOtpContext] = useState<'none' | 'verify-email' | 'mfa'>('none');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await loginAPI(form);
      setAuth(res.data.data.user, res.data.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      const code = err.response?.data?.code;
      if (code === 'EMAIL_NOT_VERIFIED') {
        setOtpContext('verify-email');
      } else if (code === 'MFA_REQUIRED') {
        setOtpContext('mfa');
      } else {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = (user: any, token: string) => {
    setAuth(user, token);
    navigate('/dashboard');
  };

  const handleGoogle = async (credential: string) => {
    try {
      const res = await googleAuthAPI(credential);
      setAuth(res.data.data.user, res.data.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Google login failed');
    }
  };

  return (
    <AuthSplitLayout
      headline={<>Welcome<br />Back</>}
      subheadline="Sign in to manage your sites, track analytics, and ship updates in seconds."
      topPrompt="New to Chasqr?"
      topLinkLabel="Create an account"
      topLinkTo="/register"
    >
      {otpContext !== 'none' ? (
        <EmailOtpVerify
          email={form.email}
          onVerified={handleVerified}
          onBack={() => setOtpContext('none')}
          {...(otpContext === 'mfa'
            ? { verify: verifyLoginMfaAPI, resend: resendLoginMfaAPI, title: "Confirm it's you" }
            : {})}
        />
      ) : (
      <>
      <h2 className="font-bebas text-3xl text-slate-900 mb-1">Sign in</h2>
      <p className="text-slate-500 text-sm mb-6">Welcome back — enter your details below.</p>

      <div className="flex justify-center mb-6">
        <GoogleLogin
          onSuccess={(res) => res.credential && handleGoogle(res.credential)}
          onError={() => toast.error('Google login failed')}
          theme="outline"
          size="large"
          width="100%"
          text="signin_with"
        />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-slate-400 text-xs">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Email</label>
          <input
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="you@example.com"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-slate-700">Password</label>
            <Link
              to="/forgot-password"
              className="text-xs text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <PasswordInput
            required
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="••••••••"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />}
          {loading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>
      </>
      )}
    </AuthSplitLayout>
  );
}
