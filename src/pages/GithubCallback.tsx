import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import { githubAuthAPI, resendLoginMfaAPI, verifyLoginMfaAPI } from "../api/auth.api";
import EmailOtpVerify from "../components/EmailOtpVerify";
import AuthSplitLayout from "../layout/AuthSplitLayout";
import { consumeGithubReturnTo, consumeGithubState } from "../lib/github";
import { setAuth } from "../store/auth";

/**
 * Landing page for GitHub's redirect back from the authorization screen.
 *
 * The code lands in the browser rather than on the server so the resulting JWT
 * can go straight into localStorage the same way every other login does —
 * putting a token in a redirect URL would leak it through Referer headers and
 * browser history.
 */
export default function GithubCallback() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [error, setError] = useState("");
  const [mfaEmail, setMfaEmail] = useState("");
  // StrictMode double-invokes effects in development; the code is single-use,
  // so guard against redeeming it twice.
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    const code = params.get("code");
    const state = params.get("state");
    const returnTo = consumeGithubReturnTo();

    // GitHub sends the user back with ?error= when they cancel on its screen.
    const denied = params.get("error");
    if (denied) {
      setError(
        params.get("error_description") || "GitHub sign-in was cancelled.",
      );
      return;
    }

    if (!code) {
      setError("GitHub didn't send an authorization code. Please try again.");
      return;
    }

    // Reject anything whose state doesn't match what we stored before leaving,
    // which is what stops a third party from feeding us their own code.
    if (!consumeGithubState(state)) {
      setError(
        "This sign-in link couldn't be verified. Please start again from the sign-in page.",
      );
      return;
    }

    // Present when the user arrived by installing the app rather than a plain
    // sign-in — the server verifies it against their own GitHub account before
    // trusting it.
    const installationId = Number(params.get("installation_id")) || undefined;

    githubAuthAPI(code, installationId)
      .then((res) => {
        // MFA_REQUIRED comes back as HTTP 200 with success:false (a challenge,
        // not an error), so axios doesn't throw — check before setAuth.
        if (res.data?.code === "MFA_REQUIRED") {
          setMfaEmail(res.data.data.email);
          return;
        }
        setAuth(res.data.data.user, res.data.data.token);
        navigate(returnTo, { replace: true });
      })
      .catch((err: any) => {
        setError(
          err.response?.data?.message ||
            "GitHub sign-in failed. Please try again.",
        );
      });
  }, [params, navigate]);

  return (
    <AuthSplitLayout
      headline={
        <>
          Signing
          <br />
          You In
        </>
      }
      subheadline="Finishing up with GitHub — this only takes a moment."
      topPrompt="Not you?"
      topLinkLabel="Back to sign in"
      topLinkTo="/login"
    >
      {mfaEmail ? (
        <EmailOtpVerify
          email={mfaEmail}
          verify={verifyLoginMfaAPI}
          resend={resendLoginMfaAPI}
          title="Confirm it's you"
          onVerified={(user, token) => {
            setAuth(user, token);
            navigate("/dashboard", { replace: true });
          }}
          onBack={() => navigate("/login", { replace: true })}
        />
      ) : error ? (
        <div className="text-center">
          <span className="w-12 h-12 mx-auto mb-4 flex items-center justify-center rounded-xl bg-red-50 text-red-500">
            <AlertCircle size={22} />
          </span>
          <h2 className="font-bebas text-3xl text-slate-900 mb-1">
            Couldn't sign you in
          </h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">{error}</p>
          <Link
            to="/login"
            className="inline-flex items-center justify-center bg-primary text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-primary-dark transition-colors text-sm"
          >
            Back to sign in
          </Link>
        </div>
      ) : (
        <div className="text-center py-8">
          <span className="animate-spin w-8 h-8 mx-auto mb-4 border-4 border-primary border-t-transparent rounded-full inline-block" />
          <p className="text-slate-500 text-sm">Signing you in with GitHub…</p>
        </div>
      )}
    </AuthSplitLayout>
  );
}
