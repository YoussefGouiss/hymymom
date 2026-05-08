'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import AuthErrorMessage from '@/components/AuthErrorMessage';

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef([]);
  const router = useRouter();

  useEffect(() => {
    if (!email) {
      router.push('/forgot-password');
    }
  }, [email, router]);

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
      inputRefs.current[5]?.focus();
    } else {
      inputRefs.current[pasted.length]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (code.join('').length !== 6) {
      setError({
        code: 'INVALID_CODE',
        title: 'Invalid Code',
        message: 'Please enter the 6-digit code from your email.',
        type: 'error'
      });
      return;
    }

    if (newPassword.length < 8) {
      setError({
        code: 'WEAK_PASSWORD',
        title: 'Password Too Short',
        message: 'Password must be at least 8 characters.',
        type: 'error'
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setError({
        code: 'PASSWORD_MISMATCH',
        title: 'Passwords Do Not Match',
        message: 'Please make sure both passwords are identical.',
        type: 'error'
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(`/api/reset-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ 
          email, 
          code: code.join(''),
          newPassword 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw { response: { status: response.status }, data };
      }

      setSuccess(true);
    } catch (err) {
      setError({
        code: 'RESET_FAILED',
        title: 'Reset Failed',
        message: data.message || 'Failed to reset password. Please try again.',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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
          </div>

          <div className="glass-card vanta-glow p-8 md:p-10 shadow-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Password Reset!</h2>
            <p className="text-gray-600 dark:text-slate-300 mb-8">
              Your password has been reset successfully. Please login with your new password.
            </p>
            <Link 
              href="/login" 
              className="inline-flex items-center gap-2 px-6 py-3 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 rounded-2xl font-bold hover:opacity-90 transition-all"
            >
              Go to Login
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
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
            <p className="text-on-surface-variant dark:text-slate-400 font-medium tracking-wide text-sm uppercase">Create New Key</p>
            <div className="h-px w-8 bg-baby-blue/20 dark:bg-sky-500/30"></div>
          </div>
        </div>

        <div className="glass-card vanta-glow p-8 md:p-10 shadow-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5">
          <div className="text-center mb-6">
            <p className="text-sm text-gray-500 dark:text-slate-400">
              Enter the 6-digit code sent to<br />
              <span className="font-semibold text-baby-blue dark:text-sky-400">{email}</span>
            </p>
          </div>

          <AuthErrorMessage error={error} />

          <form onSubmit={handleSubmit}>
            <div className="mb-6" onPaste={handlePaste}>
              <label className="block text-xs font-bold text-baby-blue dark:text-sky-400 uppercase tracking-widest mb-4 text-center">
                Verification Code
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

            <div className="mb-4">
              <label className="block text-xs font-bold text-baby-blue dark:text-sky-400 uppercase tracking-widest mb-2 px-1">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/30 text-on-surface dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-baby-blue/50 dark:focus:ring-sky-500/50 focus:border-baby-blue/50 dark:focus:border-sky-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-baby-blue dark:text-sky-400 uppercase tracking-widest mb-2 px-1">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/30 text-on-surface dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-baby-blue/50 dark:focus:ring-sky-500/50 focus:border-baby-blue/50 dark:focus:border-sky-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4.5 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 rounded-2xl font-bold text-lg hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-baby-blue/20 dark:shadow-sky-500/20 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Resetting...
                </>
              ) : (
                <>
                  Reset Password
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-on-surface-variant dark:text-slate-500 hover:text-baby-blue dark:hover:text-sky-400 transition-colors font-bold">
              <span className="material-symbols-outlined text-sm">west</span>
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}