'use client';

import { useState, useEffect, Suspense, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';


function AuthCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { setAuthState } = useAuth();
  const [status, setStatus] = useState('processing');
  const [message, setMessage] = useState('Completing your sign in...');
  const authProcessed = useRef(false);

  useEffect(() => {
    const handleAuth = async () => {
      if (authProcessed.current) return;
      authProcessed.current = true;

      try {
        console.log('Auth callback started. Full URL:', window.location.href);
        const errorParam = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (errorParam || errorDescription) {
          console.error('OAuth error from URL params:', errorParam, errorDescription);
          setStatus('error');
          setMessage('Authentication failed');
          setTimeout(() => router.push('/login'), 3000);
          return;
        }

        // Check for code in URL params
        const code = searchParams.get('code');
        console.log('URL Search Params:', JSON.stringify(Object.fromEntries(searchParams.entries())));

        // If we have a code, exchange it for session
        if (code) {
          console.log('Exchanging code for session:', code.substring(0, 5) + '...');
          
          const { data: exchangeData, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Code exchange error:', JSON.stringify(exchangeError));
            setStatus('error');
            setMessage('Failed to complete sign in');
            setTimeout(() => router.push('/login'), 3000);
            return;
          }

          if (exchangeData?.session) {
            console.log('Session created from code exchange:', exchangeData.session.user.email);
            
            // Call our API to create user and get custom token
            console.log('Calling callback API with token:', exchangeData.session.access_token.substring(0, 10) + '...');
            const response = await fetch('/api/auth/google/callback', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${exchangeData.session.access_token}`
              },
              body: JSON.stringify({
                userId: exchangeData.session.user.id,
                email: exchangeData.session.user.email,
                name: exchangeData.session.user.user_metadata?.full_name || exchangeData.session.user.user_metadata?.name || 'Google User'
              })
            });

            console.log('Callback API response status:', response.status);
            let result;
            try {
              result = await response.json();
            } catch (e) {
              console.error('Failed to parse callback API response JSON');
              result = { error: 'Invalid JSON response' };
            }
            console.log('Callback API result:', JSON.stringify(result));

            if (!response.ok || !result.token) {
              console.error('Callback API error details:', JSON.stringify({
                status: response.status,
                statusText: response.statusText,
                result: result
              }));
              setStatus('error');
              setMessage('Failed to complete sign in');
              setTimeout(() => router.push('/login'), 3000);
              return;
            }

            setAuthState(result.token, result.user);

            console.log('User authenticated:', result.user?.email);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            const storedToken = localStorage.getItem('token');
            if (!storedToken) {
              setStatus('error');
              setMessage('Failed to save session');
              setTimeout(() => router.push('/login'), 3000);
              return;
            }
            
            setStatus('success');
            setMessage('Welcome! Redirecting to dashboard...');
            
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 1000);
            return;
          }
        }

        // Fallback: Check for Supabase session in URL hash
        const hash = window.location.hash;
        console.log('Checking URL hash:', hash ? hash.substring(0, 20) + '...' : 'none');
        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        
        console.log('Has access token from hash:', !!accessToken);

        if (accessToken) {
          console.log('Setting session from hash access token');
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('Session error from setSession:', JSON.stringify(sessionError));
            setStatus('error');
            setMessage('Failed to set session');
            setTimeout(() => router.push('/login'), 3000);
            return;
          }

          if (session) {
            console.log('Session set successfully from hash. Calling callback API...');
            const response = await fetch('/api/auth/google/callback', {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({
                userId: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Google User'
              })
            });

            console.log('Calling callback API (hash) with status:', response.status);
            let result;
            try {
              result = await response.json();
            } catch (e) {
              console.error('Failed to parse callback API (hash) response JSON');
              result = { error: 'Invalid JSON response' };
            }
            console.log('Callback API (hash) result:', JSON.stringify(result));

            if (!response.ok || !result.token) {
              console.error('Callback API (hash) error details:', JSON.stringify({
                status: response.status,
                statusText: response.statusText,
                result: result
              }));
              setStatus('error');
              setMessage('Failed to complete sign in');
              setTimeout(() => router.push('/login'), 3000);
              return;
            }

            setAuthState(result.token, result.user);

            console.log('User authenticated (hash):', result.user?.email);
            
            await new Promise(resolve => setTimeout(resolve, 500));
            
            setStatus('success');
            setMessage('Welcome! Redirecting to dashboard...');
            
            setTimeout(() => {
              window.location.href = '/dashboard';
            }, 1000);
            return;
          }
        }

        // Last fallback: try existing session
        console.log('No code or hash token. Checking for existing session...');
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('Found existing session:', session.user.email);
          
          const response = await fetch('/api/auth/google/callback', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({
              userId: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'Google User'
            })
          });

          console.log('Calling callback API (session) with status:', response.status);
          let result;
          try {
            result = await response.json();
          } catch (e) {
            console.error('Failed to parse callback API (session) response JSON');
            result = { error: 'Invalid JSON response' };
          }
          console.log('Callback API (session) result:', JSON.stringify(result));

          if (result.token) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            document.cookie = `token=${result.token}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
            
            setStatus('success');
            setMessage('Welcome! Redirecting to dashboard...');
            setTimeout(() => window.location.href = '/dashboard', 1000);
            return;
          }
        }

        console.log('No session found. Final fallback. URL:', window.location.href);
        setStatus('error');
        setMessage('No session found. Please try again.');
        setTimeout(() => router.push('/login'), 3000);
      } catch (err) {
        console.error('Auth callback outer catch:', err);
        setStatus('error');
        setMessage('Authentication failed. Please try again.');
        setTimeout(() => router.push('/login'), 3000);
      }
    };

    const timeoutId = setTimeout(handleAuth, 300);
    return () => clearTimeout(timeoutId);
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white dark:from-[#030712] dark:to-[#0f172a]">
      <div className="text-center p-8 max-w-md">
        {status === 'processing' && (
          <>
            <Loader2 className="w-16 h-16 text-sky-500 animate-spin mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{message}</h2>
            <p className="text-gray-500 dark:text-slate-400">Completing sign in...</p>
          </>
        )}
        
        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">{message}</h2>
          </>
        )}
        
        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Oops!</h2>
            <p className="text-gray-500 dark:text-slate-400 mb-6">{message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 to-white dark:from-[#030712] dark:to-[#0f172a]">
        <Loader2 className="w-12 h-12 text-sky-500 animate-spin" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  );
}