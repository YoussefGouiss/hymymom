'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import TopAppBar from './TopAppBar';

export default function Layout({ children }) {
  const pathname = usePathname();
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const handleShowToast = (e) => {
      setToast(e.detail);
      setTimeout(() => setToast(null), 4000);
    };
    window.addEventListener('show-toast', handleShowToast);
    return () => window.removeEventListener('show-toast', handleShowToast);
  }, []);

  const navItems = [
    { name: 'Home', icon: 'dashboard', path: '/dashboard' },
    { name: 'Families', icon: 'family_restroom', path: '/families' },
    { name: 'Money', icon: 'payments', path: '/payments' },
    { name: 'Notes', icon: 'description', path: '/notes' },
    { name: 'Settings', icon: 'settings', path: '/settings' },
  ];

  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <TopAppBar />
      <main className="md:ml-20 lg:ml-24 pt-16 md:pt-20 lg:pt-24 pb-8 md:pb-12 px-4 md:px-8 lg:px-12 min-h-screen transition-all duration-300">
        <div className="w-full">
          {children}
        </div>
      </main>

      {/* Global Success Toast: Sanctuary Heartbeat */}
      {toast && (
        <div className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-bottom-10 duration-500">
          <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl px-8 py-5 rounded-[2rem] shadow-2xl border border-primary/20 dark:border-white/10 flex items-center gap-5 min-w-[320px]">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
              <span className="material-symbols-outlined text-2xl animate-bounce-subtle">check_circle</span>
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-primary mb-0.5">{toast.title || 'Success'}</p>
              <p className="text-sm font-bold text-slate-700 dark:text-white">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="ml-auto text-slate-400 hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
          {/* Progress Bar Decor */}
          <div className="absolute bottom-0 left-8 right-8 h-1 bg-primary/20 rounded-full overflow-hidden">
            <div className="h-full bg-primary w-full origin-left animate-[progress_4s_linear]" />
          </div>
        </div>
      )}
      
      {/* BottomNavBar (Mobile Only) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-outline-variant/10 flex justify-around items-center px-4 z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] transition-colors duration-300">
        {navItems.map((item) => {
          const isActive = pathname === item.path;
          return (
            <Link
              key={item.name}
              href={item.path}
              className={`flex flex-col items-center gap-1 transition-all duration-300 ${
                isActive ? 'text-primary scale-110' : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}>
                {item.icon}
              </span>
              <span className="text-[10px] font-bold">{item.name}</span>
            </Link>
          );
        })}
      </nav>



      <style jsx global>{`
        @keyframes progress {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
}
