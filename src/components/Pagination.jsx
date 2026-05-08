import React from 'react';

export default function Pagination({ meta, onPageChange }) {
  if (!meta || meta.total === 0 || meta.last_page <= 1) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 px-6 border-t border-surface-container-highest dark:border-slate-800 transition-colors">
      <div className="text-sm font-medium text-on-surface-variant dark:text-slate-400">
        Showing <span className="font-bold text-on-surface dark:text-slate-200">{meta.from || 0}</span> to <span className="font-bold text-on-surface dark:text-slate-200">{meta.to || 0}</span> of <span className="font-bold text-on-surface dark:text-slate-200">{meta.total}</span> entries
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(meta.current_page - 1)}
          disabled={meta.current_page === 1}
          className={`flex items-center justify-center h-10 w-10 rounded-full transition-all ${
            meta.current_page === 1 
              ? 'bg-transparent text-outline-variant dark:text-slate-600 cursor-not-allowed' 
              : 'bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-slate-200 hover:bg-primary/10 hover:text-primary dark:hover:bg-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">chevron_left</span>
        </button>

        {Array.from({ length: meta.last_page }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`h-10 w-10 text-sm font-bold rounded-full transition-all ${
              meta.current_page === page
                ? 'bg-primary dark:bg-sky-500 text-on-primary dark:text-slate-900 shadow-md'
                : 'bg-transparent text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-high dark:hover:bg-slate-800'
            }`}
          >
            {page}
          </button>
        ))}

        <button
          onClick={() => onPageChange(meta.current_page + 1)}
          disabled={meta.current_page === meta.last_page}
          className={`flex items-center justify-center h-10 w-10 rounded-full transition-all ${
            meta.current_page === meta.last_page 
              ? 'bg-transparent text-outline-variant dark:text-slate-600 cursor-not-allowed' 
              : 'bg-surface-container-low dark:bg-slate-800 text-on-surface dark:text-slate-200 hover:bg-primary/10 hover:text-primary dark:hover:bg-slate-700'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">chevron_right</span>
        </button>
      </div>
    </div>
  );
}
