import React, { useEffect, useState } from 'react';

export default function Modal({ isOpen, onClose, title, children }) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setTimeout(() => setShow(false), 300);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center p-4 transition-all duration-500 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
      <div 
        className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-md transition-opacity"
        onClick={onClose}
      ></div>
      <div 
        className={`relative w-full max-w-lg md:max-w-2xl lg:max-w-3xl glass-card vanta-glow shadow-2xl overflow-hidden bg-white/90 dark:bg-slate-900/60 border border-slate-200 dark:border-white/5 p-6 md:p-10 transform transition-all duration-500 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-8'}`}
      >
        {/* Cinematic Background Glows */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-30">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[0%] right-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[60px]"></div>
        </div>

        <button 
          onClick={onClose}
          className="absolute top-6 right-6 w-10 h-10 flex items-center justify-center rounded-full bg-slate-100/50 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 transition-all z-20"
        >
          <span className="material-symbols-outlined text-on-surface-variant dark:text-slate-400">close</span>
        </button>

        <div className="relative z-10">
          {title && (
            <h2 className="text-3xl font-headline font-bold text-on-surface dark:text-white mb-6">
              {title}
            </h2>
          )}
          <div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
