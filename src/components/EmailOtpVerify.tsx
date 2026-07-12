import { useEffect, useRef, useState } from "react";
import { toast } from "react-toastify";
import { MailCheck } from "lucide-react";
import OtpInput from "./OtpInput";
import { verifyOtpAPI, resendOtpAPI } from "../api/auth.api";

const RESEND_COOLDOWN = 60;

interface EmailOtpVerifyProps {
  email: string;
  onVerified: (user: any, token: string) => void;
  onBack?: () => void;
  /** Defaults to the registration-verification endpoints — pass these to
   *  reuse the same boxed-OTP flow for other purposes (e.g. login MFA). */
  verify?: (email: string, otp: string) => Promise<{ data: { data: { user: any; token: string } } }>;
  resend?: (email: string) => Promise<unknown>;
  title?: string;
}

export default function EmailOtpVerify({
  email,
  onVerified,
  onBack,
  verify = verifyOtpAPI,
  resend = resendOtpAPI,
  title = "Check your email",
}: EmailOtpVerifyProps) {
  const [otp, setOtp] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);
  const submittedRef = useRef(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleVerify = async (code: string) => {
    if (code.length !== 6 || submittedRef.current) return;
    submittedRef.current = true;
    setVerifying(true);
    try {
      const res = await verify(email, code);
      onVerified(res.data.data.user, res.data.data.token);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Verification failed");
      setOtp("");
    } finally {
      setVerifying(false);
      submittedRef.current = false;
    }
  };

  const handleOtpChange = (value: string) => {
    setOtp(value);
    if (value.length === 6) handleVerify(value);
  };

  const handleResend = async () => {
    setResending(true);
    try {
      await resend(email);
      toast.success("Code resent — check your inbox");
      setCooldown(RESEND_COOLDOWN);
      setOtp("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to resend code");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="text-center">
      <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
        <MailCheck size={22} className="text-primary" />
      </div>
      <h2 className="font-bebas text-3xl text-slate-900 mb-1">{title}</h2>
      <p className="text-slate-500 text-sm mb-6">
        Enter the 6-digit code we sent to <span className="font-medium text-slate-700">{email}</span>
      </p>

      <OtpInput value={otp} onChange={handleOtpChange} disabled={verifying} />

      {verifying && (
        <p className="text-xs text-slate-400 mt-4 flex items-center justify-center gap-1.5">
          <span className="animate-spin w-3 h-3 border-2 border-primary border-t-transparent rounded-full inline-block" />
          Verifying...
        </p>
      )}

      <p className="text-sm text-slate-500 mt-6">
        Didn't get it?{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending || cooldown > 0}
          className="text-primary font-medium hover:underline disabled:text-slate-400 disabled:no-underline disabled:cursor-not-allowed"
        >
          {cooldown > 0 ? `Resend code (${cooldown}s)` : resending ? "Resending..." : "Resend code"}
        </button>
      </p>

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="text-xs text-slate-400 hover:text-slate-600 mt-4 transition-colors"
        >
          ← Use a different email
        </button>
      )}
    </div>
  );
}
