'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, ArrowRight, Loader2 } from 'lucide-react';
import AuthErrorMessage from '@/components/AuthErrorMessage';
import { parseAuthError, AUTH_ERRORS } from '@/utils/authErrors';
import { useAuth } from '@/context/AuthContext';

function VerificationContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendDisabled, setResendDisabled] = useState(false);
  const { setAuthState } = useAuth();
  const inputRefs = useRef([]);
  const router = useRouter();

  useEffect(() => {
    if (!email) {
      router.push('/register');
    }
  }, [email, router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setResendDisabled(false);
    }
  }, [resendTimer]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    if (pasted.length === 6) {
      handleVerify(pasted);
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleVerify = async (verificationCode) => {
    if (verificationCode.length !== 6) {
      setError(AUTH_ERRORS.INVALID_CODE);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/verify-email`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, code: verificationCode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw { response, data };
      }

      setSuccess(true);
      
      // Store email for auto-login and redirect to dashboard
      sessionStorage.setItem('verifiedEmail', email);
      sessionStorage.setItem('verifiedUser', JSON.stringify(data.user));
      
      setTimeout(() => {
        router.push('/login?verified=true');
      }, 1500);
    } catch (err) {
      setError(parseAuthError(err.response, err.data, err));
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await handleVerify(code.join(''));
  };

  const handleResend = async () => {
    if (resendDisabled || !email) return;

    setResendDisabled(true);
    setResendTimer(60);
    setError(null);

    try {
      await fetch(`/api/resend-verification`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      setError(AUTH_ERRORS.SERVER_ERROR);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-violet-50 dark:from-[#030712] dark:via-[#0a0f1e] dark:to-[#0f172a] px-4">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center animate-pulse">
            <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Email Verified!</h2>
          <p className="text-lg text-gray-600 dark:text-slate-300">Verification successful! Redirecting to Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud-white dark:bg-[#030712] text-on-surface dark:text-slate-100 font-body relative overflow-hidden px-4 py-12 transition-colors duration-300">
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-baby-blue/5 dark:bg-sky-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-10">
          <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
            <span className="text-4xl font-headline font-bold italic text-gradient">HymyMom Pro</span>
          </Link>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-8 bg-baby-blue/20 dark:bg-sky-500/30"></div>
            <p className="text-on-surface-variant dark:text-slate-400 font-medium tracking-wide text-sm uppercase">Verify Your Sanctuary</p>
            <div className="h-px w-8 bg-baby-blue/20 dark:bg-sky-500/30"></div>
          </div>
        </div>

        <div className="glass-card vanta-glow p-8 md:p-10 shadow-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5">
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-baby-blue/10 dark:bg-sky-500/10 flex items-center justify-center">
              <Mail className="w-8 h-8 text-baby-blue dark:text-sky-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Check Your Email</h2>
            <p className="text-sm text-gray-500 dark:text-slate-400">
              We've sent a 6-digit code to<br />
              <span className="font-semibold text-baby-blue dark:text-sky-400">{email}</span>
            </p>
          </div>

          <AuthErrorMessage error={error} onAction={(action) => {
            if (action === 'resend') handleResend();
          }} />

          <form onSubmit={handleSubmit}>
            <div className="mb-8" onPaste={handlePaste}>
              <label className="block text-xs font-bold text-baby-blue dark:text-sky-400 uppercase tracking-widest mb-4 text-center">
                Enter Verification Code
              </label>
              <div className="flex justify-center gap-2">
                {code.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (inputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-xl font-bold rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/30 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-baby-blue/50 dark:focus:ring-sky-500/50 focus:border-baby-blue/50 dark:focus:border-sky-500/50 transition-all"
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || code.join('').length !== 6}
              className="w-full py-4.5 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 rounded-2xl font-bold text-lg hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-baby-blue/20 dark:shadow-sky-500/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  Verify Email
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
            <p className="text-sm text-gray-500 dark:text-slate-400 mb-4">
              Didn't receive the code?
            </p>
            <button
              onClick={handleResend}
              disabled={resendDisabled}
              className="text-sm text-baby-blue dark:text-sky-400 font-bold hover:underline disabled:opacity-50 disabled:no-underline transition-all flex items-center justify-center gap-2 mx-auto"
            >
              {resendDisabled ? (
                <>
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  Resend in {resendTimer}s
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">refresh</span>
                  Resend Code
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/register" className="inline-flex items-center gap-2 text-sm text-on-surface-variant dark:text-slate-500 hover:text-baby-blue dark:hover:text-sky-400 transition-colors font-bold">
            <span className="material-symbols-outlined text-sm">west</span>
            Back to Registration
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function EmailVerificationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerificationContent />
    </Suspense>
  );
}
