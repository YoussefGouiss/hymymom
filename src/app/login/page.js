'use client';

import { useState, Suspense, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, ArrowRight, Loader2, Globe } from 'lucide-react';
import AuthErrorMessage from '@/components/AuthErrorMessage';
import { parseAuthError, AUTH_ERRORS } from '@/utils/authErrors';

function LoginContent() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  const { login, loginWithGoogle, isAuthenticating, setAuthState } = useAuth();
  const searchParams = useSearchParams();
  const errorFromUrl = searchParams.get('error');
  const verified = searchParams.get('verified');
  const router = useRouter();

  useEffect(() => {
    if (verified === 'true') {
      const verifiedEmail = sessionStorage.getItem('verifiedEmail');
      if (verifiedEmail) {
        setEmail(verifiedEmail);
        setSuccessMessage('Email verified successfully! Please enter your password to continue.');
        sessionStorage.removeItem('verifiedEmail');
      }
    }
  }, [verified]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 403 && data.requires_verification) {
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }
        throw { response, data };
      }

      const token = data.token || data.access_token;
      const userData = data.user;

      if (!token || !userData) {
        throw { response: { status: 500 }, data: {} };
      }

      setAuthState(token, userData);
      
      const redirect = searchParams.get('redirect') || '/dashboard';
      router.push(redirect);
    } catch (err) {
      setError(parseAuthError(err.response, err.data, err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(AUTH_ERRORS.GOOGLE_AUTH_FAILED);
    }
  };

  const getUrlErrorMessage = (code) => {
    switch (code) {
      case 'auth_failed':
        return AUTH_ERRORS.GOOGLE_AUTH_FAILED;
      case 'cancelled':
        return AUTH_ERRORS.GOOGLE_AUTH_CANCELLED;
      case 'no_token':
        return AUTH_ERRORS.NO_TOKEN_RECEIVED;
      default:
        return AUTH_ERRORS.UNKNOWN_ERROR;
    }
  };

  const urlError = errorFromUrl ? getUrlErrorMessage(errorFromUrl) : null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-cloud-white dark:bg-[#030712] text-on-surface dark:text-slate-100 font-body relative overflow-hidden px-4 py-12 transition-colors duration-300">
      {/* Cinematic Background Glows */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-baby-blue/5 dark:bg-sky-500/10 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[10%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-block transition-transform hover:scale-105 active:scale-95">
            <span className="text-4xl font-headline font-bold italic text-gradient">HymyMom Pro</span>
          </Link>
          <div className="flex items-center justify-center gap-2 mt-3">
            <div className="h-px w-8 bg-baby-blue/20 dark:bg-sky-500/30"></div>
            <p className="text-on-surface-variant dark:text-slate-400 font-medium tracking-wide text-sm uppercase">Welcome back, doula</p>
            <div className="h-px w-8 bg-baby-blue/20 dark:bg-sky-500/30"></div>
          </div>
        </div>

          {/* Card */}
        <div className="glass-card vanta-glow p-8 md:p-10 shadow-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5">
          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl">
              <p className="text-sm text-green-700 dark:text-green-400 font-medium">{successMessage}</p>
            </div>
          )}
          
          {/* Error Message */}
          <AuthErrorMessage error={error || urlError} />

          {/* Creative Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading || isAuthenticating}
            className="w-full py-4.5 px-6 bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-on-surface dark:text-slate-100 hover:bg-white dark:hover:bg-white/10 hover:border-baby-blue/30 dark:hover:border-sky-500/30 transition-all duration-300 flex items-center justify-center gap-4 mb-8 group/btn shadow-sm hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5 disabled:opacity-50"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-white dark:bg-white/10 rounded-full group-hover/btn:scale-110 transition-transform shadow-sm dark:shadow-none border border-slate-100 dark:border-white/10">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <span className="tracking-tight">Sign in with Google</span>
          </button>

          {/* Cinematic Divider */}
          <div className="relative mb-8 flex items-center gap-4">
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-slate-200 dark:to-white/10"></div>
            <span className="flex-shrink-0 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
              Or use Sanctuary Key
            </span>
            <div className="flex-grow h-px bg-gradient-to-l from-transparent via-slate-200 dark:via-white/10 to-slate-200 dark:to-white/10"></div>
          </div>

          {/* Email Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-baby-blue dark:text-sky-400 uppercase tracking-widest mb-2 px-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@agency.com"
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/30 text-on-surface dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-baby-blue/50 dark:focus:ring-sky-500/50 focus:border-baby-blue/50 dark:focus:border-sky-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-baby-blue dark:text-sky-400 uppercase tracking-widest mb-2 px-1">
                Security Key
              </label>
              <div className="relative">
                <Lock className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/30 text-on-surface dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-baby-blue/50 dark:focus:ring-sky-500/50 focus:border-baby-blue/50 dark:focus:border-sky-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative w-5 h-5 flex items-center justify-center">
                  <input type="checkbox" className="peer appearance-none w-5 h-5 rounded-lg border-2 border-slate-200 dark:border-white/10 checked:bg-baby-blue dark:checked:bg-sky-500 checked:border-baby-blue dark:checked:border-sky-500 transition-all cursor-pointer" />
                  <span className="material-symbols-outlined text-white text-[16px] absolute opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none font-bold">check</span>
                </div>
                <span className="text-sm text-on-surface-variant dark:text-slate-400 group-hover:text-on-surface dark:group-hover:text-slate-200 transition-colors">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-baby-blue dark:text-sky-400 hover:text-baby-blue-variant dark:hover:text-sky-300 font-bold transition-colors">
                Reset Access
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || isAuthenticating}
              className="w-full py-4.5 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 rounded-2xl font-bold text-lg hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-baby-blue/20 dark:shadow-sky-500/20 disabled:opacity-50"
            >
              {isLoading || isAuthenticating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Access Dashboard
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
            <p className="text-on-surface-variant dark:text-slate-400 font-medium">
              New to the platform?{' '}
              <Link href="/register" className="text-baby-blue dark:text-sky-400 font-bold hover:underline transition-colors ml-1">
                Start Free Trial
              </Link>
            </p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-on-surface-variant dark:text-slate-500 hover:text-baby-blue dark:hover:text-sky-400 transition-colors font-bold">
            <span className="material-symbols-outlined text-sm">west</span>
            Return to Sanctuary
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <LoginContent />
    </Suspense>
  );
}
