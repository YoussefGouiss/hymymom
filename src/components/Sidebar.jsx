'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { 
  LayoutDashboard, Users, Calendar, CreditCard, 
  NotebookPen, Plus, LogOut, Loader2 
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { name: 'Families', icon: Users, path: '/families' },
  { name: 'Visits', icon: Calendar, path: '/visits' },
  { name: 'Payments', icon: CreditCard, path: '/payments' },
  { name: 'Notes', icon: NotebookPen, path: '/notes' },
];

export default function Sidebar() {
  const { logout, isLoggingOut, isLoading } = useAuth();
  const pathname = usePathname();

  const handleLogout = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('Logout clicked');
    await logout();
  };

  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-mobile-menu', handleOpen);
    return () => window.removeEventListener('open-mobile-menu', handleOpen);
  }, []);

  if (isLoading) {
    return (
      <aside className="h-screen w-24 lg:w-64 fixed left-0 top-0 border-r border-outline-variant/10 bg-cloud-white dark:bg-surface hidden lg:flex flex-col py-6 gap-2 z-40">
        <div className="px-6 mb-8 mt-16">
          <h2 className="font-headline text-xl text-primary font-bold italic">HymyMom Pro</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </aside>
    );
  }

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] lg:hidden animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div className={`fixed inset-y-0 left-0 w-80 bg-white dark:bg-slate-900 z-[101] lg:hidden transform transition-transform duration-500 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full py-10 px-6">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="font-headline text-2xl text-primary font-bold italic">HymyMom Pro</h2>
              <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold mt-1">Mobile Sanctuary</p>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-500"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <nav className="flex-1 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.path}
                onClick={() => setIsOpen(false)}
                className={`flex items-center gap-4 px-6 py-4 rounded-[1.5rem] transition-all duration-300 ${
                    pathname === item.path
                      ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20'
                      : 'text-primary/60 dark:text-primary/50 hover:text-primary hover:bg-primary/5'
                  }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-lg font-medium">{item.name}</span>
              </Link>
            ))}
          </nav>

          <div className="mt-auto pt-10 border-t border-outline-variant/10">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center gap-4 px-6 py-4 rounded-[1.5rem] text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all font-bold"
            >
              <LogOut className="w-6 h-6" />
              <span className="text-lg">Sign Out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Full Screen Logout Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-10 flex flex-col items-center gap-6 shadow-2xl transform scale-100 animate-in zoom-in-95 duration-300">
            <div className="relative">
              <Loader2 className="w-16 h-16 animate-spin text-red-500" />
              <div className="absolute inset-0 w-16 h-16 rounded-full border-4 border-red-200 dark:border-red-900/30 animate-pulse"></div>
            </div>
            <div className="text-center">
              <p className="text-xl font-bold text-gray-800 dark:text-white">Signing you out</p>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-2">Destroying your session...</p>
            </div>
            <div className="w-48 h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-red-500 animate-progress rounded-full"></div>
            </div>
          </div>
        </div>
      )}
      
      <aside className="h-screen w-20 lg:w-24 fixed left-0 top-0 border-r border-outline-variant/20 bg-white dark:bg-slate-900 hidden md:flex flex-col py-10 gap-6 z-40 transition-all duration-300 shadow-xl">
        <div className="px-6 mb-8 mt-16 overflow-hidden">
          <h2 className="font-headline text-xl text-primary font-bold italic whitespace-nowrap opacity-0 transition-opacity">HymyMom Pro</h2>
          <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold whitespace-nowrap opacity-0 transition-opacity">The Ethereal Sanctuary</p>
        </div>
        <nav className="flex-1 px-2 flex flex-col gap-1">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.path}
              className={`flex items-center justify-center px-4 py-4 mx-2 my-1 rounded-[1.25rem] transition-all duration-300 ${
                  pathname === item.path
                    ? 'bg-primary text-white font-bold shadow-lg shadow-primary/20'
                    : 'text-slate-400 hover:text-primary hover:bg-slate-50 dark:hover:bg-white/5'
                }`}
              title={item.name}
            >
            <item.icon className={`w-6 h-6 transition-all ${
                pathname === item.path ? 'scale-110' : 'group-hover:scale-110'
              }`} />
            </Link>
          ))}
        </nav>
        <div className="px-4 mt-auto pb-8">
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Version 1.0.0</p>
        </div>
      </aside>
    </>
  );
}