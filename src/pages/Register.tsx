import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { toast } from 'react-toastify';
import { registerAPI, googleAuthAPI } from '../api/auth.api';
import { setAuth } from '../store/auth';
import AuthSplitLayout from '../layout/AuthSplitLayout';
import PasswordInput from '../components/PasswordInput';
import EmailOtpVerify from '../components/EmailOtpVerify';

export default function Register() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [awaitingOtp, setAwaitingOtp] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!acceptedTerms) {
      toast.error('Please accept the Terms and Conditions to continue');
      return;
    }
    setLoading(true);
    try {
      await registerAPI({ ...form, acceptedTerms });
      setAwaitingOtp(true);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerified = (user: any, token: string) => {
    setAuth(user, token);
    toast.success('Account created!');
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
      headline={<>Create Your<br />Free Account</>}
      subheadline="Upload a ZIP or HTML files and get a live, shareable website in seconds."
      topPrompt="Already have an account?"
      topLinkLabel="Sign in"
      topLinkTo="/login"
    >
      {awaitingOtp ? (
        <EmailOtpVerify
          email={form.email}
          onVerified={handleVerified}
          onBack={() => setAwaitingOtp(false)}
        />
      ) : (
      <>
      <h2 className="font-bebas text-3xl text-slate-900 mb-1">Sign up for Chasqr</h2>
      <p className="text-slate-500 text-sm mb-6">Free forever for basic use — no credit card required.</p>

      <div className="flex justify-center mb-6">
        <GoogleLogin
          onSuccess={(res) => res.credential && handleGoogle(res.credential)}
          onError={() => toast.error('Google login failed')}
          theme="outline"
          size="large"
          width="100%"
          text="signup_with"
        />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-slate-400 text-xs">or</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Name</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
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
          <label className="text-sm font-medium text-slate-700 block mb-1.5">Password</label>
          <PasswordInput
            required
            minLength={8}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Min. 8 characters"
            className="w-full border border-slate-200 rounded-xl px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        <label className="flex items-start gap-2.5 text-xs text-slate-500 leading-relaxed cursor-pointer">
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary shrink-0"
          />
          <span>
            I agree to the{' '}
            <Link to="/terms" target="_blank" className="text-primary hover:underline">
              Terms and Conditions
            </Link>{' '}
            and{' '}
            <Link to="/privacy" target="_blank" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={loading || !acceptedTerms}
          className="w-full bg-primary text-white font-semibold py-3 rounded-xl hover:bg-primary-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading && <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" />}
          {loading ? 'Creating account...' : 'Create Account'}
        </button>
      </form>

      <p className="text-center text-xs text-slate-400 mt-4">
        By continuing with Google, you also agree to our{' '}
        <Link to="/terms" target="_blank" className="text-primary hover:underline">Terms</Link>
        {' '}and{' '}
        <Link to="/privacy" target="_blank" className="text-primary hover:underline">Privacy Policy</Link>.
      </p>
      </>
      )}
    </AuthSplitLayout>
  );
}
