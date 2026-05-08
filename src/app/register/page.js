'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Mail, Lock, User, ArrowRight, Loader2, Globe } from 'lucide-react';
import AuthErrorMessage from '@/components/AuthErrorMessage';
import { parseAuthError, AUTH_ERRORS } from '@/utils/authErrors';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const { loginWithGoogle, isAuthenticating } = useAuth();
  const router = useRouter();

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      setError(AUTH_ERRORS.EMPTYFields);
      return false;
    }

    if (password !== confirmPassword) {
      setError(AUTH_ERRORS.PASSWORD_MISMATCH);
      return false;
    }

    if (password.length < 8) {
      setError(AUTH_ERRORS.WEAK_PASSWORD);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/register`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: confirmPassword,
        }),
      });

      const data = await response.json();
      console.log('Register response:', response.status, data);

      if (!response.ok) {
        setError({
          code: 'REGISTER_FAILED',
          title: 'Registration Failed',
          message: data.message || 'Something went wrong. Please try again.',
          type: 'error'
        });
        setIsLoading(false);
        console.error('Register failed:', response.status, data);
        return;
      }

      if (data.requires_verification) {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        setIsLoading(false);
        return;
      }

      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
      setIsLoading(false);
    } catch (err) {
      console.error('Registration error catch:', err);
      const parsedError = parseAuthError(err.response, err.data, err);
      console.log('Parsed error:', parsedError);
      setError(parsedError || AUTH_ERRORS.UNKNOWN_ERROR);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err) {
      setError(AUTH_ERRORS.GOOGLE_AUTH_FAILED);
    }
  };

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
            <p className="text-on-surface-variant dark:text-slate-400 font-medium tracking-wide text-sm uppercase">Create your sanctuary</p>
            <div className="h-px w-8 bg-baby-blue/20 dark:bg-sky-500/30"></div>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card vanta-glow p-8 md:p-10 shadow-2xl bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5">
          {/* Error Message */}
          <AuthErrorMessage error={error} />

          {/* Creative Google Sign Up */}
          <button
            onClick={handleGoogleSignup}
            disabled={isLoading}
            className="w-full py-4.5 px-6 bg-slate-50/50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl font-bold text-on-surface dark:text-slate-100 hover:bg-white dark:hover:bg-white/10 hover:border-baby-blue/30 dark:hover:border-sky-500/30 transition-all duration-300 flex items-center justify-center gap-4 mb-8 group/btn shadow-sm hover:shadow-lg hover:shadow-sky-500/5 hover:-translate-y-0.5 disabled:opacity-50"
          >
            <div className="w-8 h-8 flex items-center justify-center bg-white dark:bg-white/10 rounded-full group-hover/btn:scale-110 transition-transform shadow-sm dark:shadow-none border border-slate-100 dark:border-white/10">
              <Globe className="w-5 h-5 text-blue-500" />
            </div>
            <span className="tracking-tight">Sign up with Google</span>
          </button>

          {/* Cinematic Divider */}
          <div className="relative mb-8 flex items-center gap-4">
            <div className="flex-grow h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-white/10 to-slate-200 dark:to-white/10"></div>
            <span className="flex-shrink-0 text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-[0.2em] uppercase">
              Or use Sanctuary Key
            </span>
            <div className="flex-grow h-px bg-gradient-to-l from-transparent via-slate-200 dark:via-white/10 to-slate-200 dark:to-white/10"></div>
          </div>

          {/* Registration Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-baby-blue dark:text-sky-400 uppercase tracking-widest mb-2 px-1">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-14 pr-6 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/30 text-on-surface dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-baby-blue/50 dark:focus:ring-sky-500/50 focus:border-baby-blue/50 dark:focus:border-sky-500/50 transition-all font-medium"
                  required
                />
              </div>
            </div>

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
              <p className="mt-2 text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider px-1">Minimum 8 characters required</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-baby-blue dark:text-sky-400 uppercase tracking-widest mb-2 px-1">
                Confirm Key
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
              disabled={isLoading || isAuthenticating}
              className="w-full py-4.5 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 rounded-2xl font-bold text-lg hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 shadow-xl shadow-baby-blue/20 dark:shadow-sky-500/20 disabled:opacity-50"
            >
              {isLoading || isAuthenticating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Creating Sanctuary...
                </>
              ) : (
                <>
                  Start 14-Day Free Trial
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-10 pt-8 border-t border-slate-100 dark:border-white/5 text-center">
            <p className="text-on-surface-variant dark:text-slate-400 font-medium">
              Already a member?{' '}
              <Link href="/login" className="text-baby-blue dark:text-sky-400 font-bold hover:underline transition-colors ml-1">
                Access Dashboard
              </Link>
            </p>
          </div>

          {/* Terms */}
          <p className="mt-6 text-center text-[10px] text-on-surface-variant dark:text-slate-500 font-bold uppercase tracking-widest leading-relaxed">
            By proceeding, you agree to our{' '}
            <Link href="/terms" className="text-baby-blue dark:text-sky-400 hover:underline">Terms</Link>{' '}
            and{' '}
            <Link href="/privacy" className="text-baby-blue dark:text-sky-400 hover:underline">Privacy</Link>.
          </p>
        </div>

        {/* Back to Home */}
        <div className="mt-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-on-surface-variant dark:text-slate-500 hover:text-baby-blue dark:hover:text-sky-400 transition-colors font-bold">
            <span className="material-symbols-outlined text-sm">west</span>
            Return to Landing Page
          </Link>
        </div>
      </div>
    </div>
  );
}
