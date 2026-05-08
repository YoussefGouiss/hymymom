import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full bg-surface-container-low dark:bg-slate-800 text-on-surface hover:ring-2 ring-primary/20 transition-all active:scale-95 flex items-center justify-center group"
      aria-label="Toggle Night Theme"
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12" />
      ) : (
        <Moon className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12" />
      )}
    </button>
  );
}
