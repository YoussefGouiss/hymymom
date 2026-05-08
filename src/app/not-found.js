'use client';

import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      {/* Decorative background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/10 dark:bg-sky-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="relative z-10 space-y-8 animate-in fade-in zoom-in duration-700">
        <div className="relative inline-block">
          <div className="w-40 h-40 rounded-[3rem] bg-surface-container-high dark:bg-white/5 flex items-center justify-center">
            <span className="material-symbols-outlined text-7xl text-primary/40 dark:text-sky-500/30">explore_off</span>
          </div>
          <div className="absolute -top-4 -right-4 w-12 h-12 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg animate-bounce">
            <span className="material-symbols-outlined font-bold">question_mark</span>
          </div>
        </div>

        <div className="space-y-4 max-w-md mx-auto">
          <h1 className="text-6xl md:text-8xl font-headline font-black text-primary/20 dark:text-white/5 leading-none">
            404
          </h1>
          <h2 className="text-3xl font-headline font-bold text-on-surface dark:text-white tracking-tight">
            Lost in the Sanctuary?
          </h2>
          <p className="text-on-surface-variant dark:text-slate-400 font-medium leading-relaxed">
            Even the most peaceful journeys have unexpected turns. This specific path doesn't seem to exist in your clinical landscape.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
          <Link 
            href="/dashboard" 
            className="px-10 py-4 bg-primary dark:bg-sky-500 text-on-primary dark:text-slate-950 font-black uppercase tracking-[0.2em] text-xs rounded-full shadow-2xl shadow-primary/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">home</span>
            Return to Dashboard
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="px-10 py-4 bg-surface-container dark:bg-white/5 text-on-surface-variant dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-xs rounded-full border border-outline-variant/10 dark:border-white/10 hover:bg-surface-container-high transition-all"
          >
            Go Back
          </button>
        </div>

        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600 pt-10">
          HymyMom Pro • Professional Postpartum Intelligence
        </p>
      </div>
    </div>
  );
}
