'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const API_URL = '/api';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      // First, check localStorage for existing session
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (storedToken && storedUser) {
        try {
          const tokenParts = storedToken.split('.');
          if (tokenParts.length >= 2) {
            const payload = JSON.parse(atob(tokenParts[1]));
            
            if (payload.exp > Math.floor(Date.now() / 1000)) {
              setToken(storedToken);
              setUser(JSON.parse(storedUser));
              setIsLoading(false);
              return;
            }
          }
        } catch (e) {
          console.log('Token validation failed:', e);
        }
        
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      
      setIsLoading(false);
    };
    
    initAuth();

    // Listen for Supabase auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      
      if (event === 'SIGNED_OUT') {
        // Clear local state on sign out
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setIsAuthenticating(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        const customError = new Error(data.message || 'Login failed');
        customError.status = response.status;
        throw customError;
      }

      const newToken = data.token;
      const userData = data.user;

      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
      
      setToken(newToken);
      setUser(userData);
      
      window.location.href = '/dashboard';
    } catch (error) {
      throw error;
    } finally {
      setIsAuthenticating(false);
    }
  };

  const loginWithGoogle = async () => {
    setIsAuthenticating(true);
    try {
      const response = await fetch(`${API_URL}/auth/google`);
      
      if (!response.ok) {
        throw new Error('Failed to get Google OAuth URL');
      }
      
      const data = await response.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No OAuth URL received');
      }
    } catch (error) {
      console.error('Google login error:', error);
      setIsAuthenticating(false);
      throw error;
    }
  };

  const logout = async () => {
    if (isLoggingOut) return;
    
    const currentToken = token;
    const currentUser = user;
    
    setIsLoggingOut(true);
    
    try {
      // 1. Call logout API to clear server-side token state
      if (currentToken) {
        try {
          const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${currentToken}`
            },
            body: JSON.stringify({ 
              userId: currentUser?.id,
              token: currentToken 
            })
          });
          
          console.log('Logout API response:', response.ok ? 'success' : 'failed');
        } catch (apiError) {
          console.log('API logout error, continuing with client cleanup:', apiError);
        }
      }
      
      // 2. Clear local storage immediately (prevents re-validation with expired token)
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // 3. Clear cookies
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'supabase-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      // 4. Update local state
      setToken(null);
      setUser(null);
      
      // 5. Sign out from Supabase (clears session in browser)
      try {
        await supabase.auth.signOut();
      } catch (e) {
        console.log('Supabase signOut error (expected if already logged out):', e);
      }
      
      // 6. Brief delay to allow UI to show success state
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // 7. Redirect to home page
      window.location.href = '/';
    } catch (error) {
      console.error('Logout error:', error);
      
      // Ensure cleanup happens even on error
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      
      window.location.href = '/';
    } finally {
      setIsLoggingOut(false);
    }
  };

  const setAuthState = (newToken, userData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    
    document.cookie = `token=${newToken}; path=/; max-age=${7 * 24 * 60 * 60}; SameSite=Lax`;
    
    setToken(newToken);
    setUser(userData);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      isLoading, 
      isAuthenticating,
      isLoggingOut,
      login, 
      loginWithGoogle,
      logout, 
      setAuthState
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}