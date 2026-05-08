'use client';

import React, { useState, useRef, useEffect } from 'react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function TopAppBar() {
  const { logout, user } = useAuth();
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      // Basic search redirection or logic
      console.log('Searching for:', searchQuery);
      // router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm h-16 md:h-20 flex justify-between items-center px-4 md:px-8 lg:px-12 border-b border-outline-variant/20 pl-4 md:pl-24 lg:pl-28 transition-all duration-300">
      <div className="flex items-center gap-4">
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('open-mobile-menu'))}
          className="lg:hidden p-2 rounded-xl hover:bg-primary/10 text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-2xl">menu</span>
        </button>
        <div className="hidden md:block">
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Sanctuary</p>
          <h2 className="text-xl font-headline font-bold text-on-surface dark:text-white">HymyMom Pro for Postpartum</h2>
        </div>
      </div>
      
      <div className="flex items-center gap-4 md:gap-8">

        
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle />
          
          <div className="h-10 w-px bg-outline-variant/20 mx-2 hidden md:block"></div>

          {/* Profile Section with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button 
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-surface-container dark:hover:bg-white/5 transition-all active:scale-95 border border-transparent hover:border-outline-variant/20"
            >
              <div className="h-10 w-10 rounded-xl bg-primary-container flex items-center justify-center overflow-hidden border border-primary/20 shadow-inner">
                {user?.photo_url ? (
                  <img 
                    src={user.photo_url} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="material-symbols-outlined text-primary text-2xl">person</span>
                )}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-xs font-black text-on-surface dark:text-white leading-none">{user?.mother_name || user?.name || 'Practitioner'}</p>
                <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-tighter">Pro Doula</p>
              </div>
              <span className={`material-symbols-outlined text-primary/60 dark:text-primary/50 transition-transform duration-300 ${dropdownOpen ? 'rotate-180' : ''}`}>expand_more</span>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 mt-3 w-56 bg-surface dark:bg-slate-900 rounded-[1.5rem] shadow-2xl border border-outline-variant/20 dark:border-white/10 p-2 z-[60] animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                <div className="p-4 border-b border-outline-variant/10 mb-2 md:hidden">
                  <p className="text-xs font-black text-on-surface dark:text-white leading-none">{user?.name || 'Practitioner'}</p>
                  <p className="text-[10px] font-bold text-primary mt-1 uppercase tracking-tighter">Pro Doula</p>
                </div>
                <Link 
                  href="/settings"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-primary/10 text-on-surface-variant hover:text-primary transition-all group"
                >
                  <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">settings</span>
                  <span className="text-sm font-bold">Account Settings</span>
                </Link>
                <button 
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-all group text-left"
                >
                  <span className="material-symbols-outlined text-xl group-hover:scale-110 transition-transform">logout</span>
                  <span className="text-sm font-bold">Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
