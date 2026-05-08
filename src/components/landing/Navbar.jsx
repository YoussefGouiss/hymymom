'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Menu, X, LogOut, LayoutDashboard } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import ThemeToggle from '@/components/ThemeToggle';

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    // Check current auth status
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    // 1. Sign out from Supabase
    await supabase.auth.signOut();
    
    // 2. Clear custom storage items used in the app
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // 3. Clear custom cookies
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Lax';
    
    // 4. Reset local state and redirect
    setUser(null);
    setIsMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 dark:bg-[#030712]/80 backdrop-blur-md py-4 shadow-sm border-b border-outline-variant/10' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <span className="text-2xl font-headline font-bold text-on-surface dark:text-white">
            HymyMom
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">How it Works</Link>
          <Link href="#pricing" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">Pricing</Link>
          <Link href="#faq" className="text-sm font-medium text-on-surface-variant hover:text-primary transition-colors">FAQ</Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          {!isLoading && (
            <>
              {user ? (
                <>
                  <Link href="/dashboard" className="flex items-center gap-2 px-5 py-2 text-sm font-semibold text-on-surface hover:text-primary transition-colors">
                    <LayoutDashboard className="w-4 h-4" />
                    Dashboard
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-6 py-2.5 bg-sky-400 text-white hover:bg-sky-500 rounded-full text-sm font-bold shadow-lg shadow-sky-200 dark:shadow-none hover:scale-105 active:scale-95 transition-all"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="px-5 py-2 text-sm font-semibold text-on-surface hover:text-primary transition-colors">
                    Log in
                  </Link>
                  <Link 
                    href="/register" 
                    className="px-6 py-2.5 bg-primary text-white rounded-full text-sm font-bold shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
                  >
                    Start Free Trial
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center gap-4">
          <ThemeToggle />
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 text-on-surface dark:text-white"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white dark:bg-slate-900 border-b border-outline-variant/10 py-6 px-6 flex flex-col gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <Link href="#features" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Features</Link>
          <Link href="#how-it-works" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">How it Works</Link>
          <Link href="#pricing" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Pricing</Link>
          <Link href="#faq" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">FAQ</Link>
          <hr className="border-outline-variant/10 my-2" />
          
          {user ? (
            <>
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium flex items-center gap-2">
                <LayoutDashboard className="w-5 h-5" />
                Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="w-full py-4 bg-sky-400 text-white rounded-2xl text-center font-bold flex items-center justify-center gap-2 hover:bg-sky-500 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                Log out
              </button>
            </>
          ) : (
            <>
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="text-lg font-medium">Log in</Link>
              <Link href="/register" onClick={() => setIsMobileMenuOpen(false)} className="w-full py-4 bg-primary text-white rounded-2xl text-center font-bold">
                Start Free Trial
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
