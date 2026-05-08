"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Modal from '@/components/Modal';
import { useAuth } from '@/context/AuthContext';

export default function VisitsHistoryPage() {
  const [visits, setVisits] = useState([]);
  const [familiesMap, setFamiliesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, visitId: null });
  const itemsPerPage = 6;
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch families to map names (Optimized: only fetch ID and Name)
      const { data: families } = await supabase
        .from('families')
        .select('id, mother_name')
        .eq('user_id', user?.id);
        
      const famMap = {};
      families?.forEach(f => famMap[f.id] = f);
      setFamiliesMap(famMap);

      // 2. Fetch all visits for this user
      const { data: visitsData } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', user?.id)
        .order('scheduled_date', { ascending: false });
      
      setVisits(visitsData || []);
    } catch (err) {
      console.error('Error loading history', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setDeleteConfirm({ open: true, visitId: id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirm.visitId;
    if (!id) return;

    setDeleteConfirm({ open: false, visitId: null });
    const { error } = await supabase.from('visits').delete().eq('id', id);
    if (error) {
      console.error('Error deleting visit', error);
    } else {
      setVisits(visits.filter(v => v.id !== id));
    }
  };

  // Stats calculation
  const stats = {
    total: visits.length,
    completed: visits.filter(v => v.status === 'COMPLETED').length,
    scheduled: visits.filter(v => v.status === 'SCHEDULED').length,
    cancelled: visits.filter(v => v.status === 'CANCELLED').length,
  };

  const filteredVisits = visits.filter(v => {
    const familyName = familiesMap[v.family_id]?.mother_name?.toLowerCase() || '';
    const matchesSearch = familyName.includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || v.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredVisits.length / itemsPerPage);
  const currentVisits = filteredVisits.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface dark:bg-[#020617]">
         <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-[#020617] text-on-surface dark:text-slate-100 p-8 md:p-12 transition-colors">
      <div className="max-w-[1600px] mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <Link href="/visits" className="text-sky-400 hover:text-sky-300 flex items-center gap-2 mb-4 text-sm font-bold uppercase tracking-widest transition-colors">
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              Back to Dashboard
            </Link>
            <h1 className="text-4xl font-headline font-bold text-on-surface dark:text-white tracking-tight">Clinical Ledger</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mt-2">Manage and archive all care sessions across your sanctuary.</p>
          </div>
        </header>

        {/* Stats Section: High-End Editorial Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {[
            { label: 'Activity', title: 'Total Logs', value: stats.total, color: 'sky', icon: 'history', bg: 'bg-sky-500/10', text: 'text-sky-500' },
            { label: 'Results', title: 'Completed', value: stats.completed, color: 'emerald', icon: 'check_circle', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
            { label: 'Schedule', title: 'Upcoming', value: stats.scheduled, color: 'amber', icon: 'pending_actions', bg: 'bg-amber-500/10', text: 'text-amber-500' },
            { label: 'Void', title: 'Cancelled', value: stats.cancelled, color: 'rose', icon: 'cancel', bg: 'bg-rose-500/10', text: 'text-rose-500' },
          ].map((s, i) => (
            <div key={i} className="group relative overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/5">
              {/* Glow Background Decor */}
              <div className={`absolute top-0 right-0 w-32 h-32 ${s.bg} rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform`}></div>
              
              <div className="flex items-center gap-4 mb-8 relative">
                <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.text} shadow-sm border border-white/20`}>
                  <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{s.label}</span>
              </div>
              
              <div className="relative">
                <div className={`text-6xl font-noto-serif font-black ${s.text} mb-2 leading-none tracking-tighter`}>
                  {s.value}
                </div>
                <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 opacity-80">
                  {s.title}
                </div>
              </div>
              
              {/* Minimal Progress Decor */}
              <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50 dark:bg-white/5">
                <div className={`h-full ${s.text.replace('text', 'bg')} opacity-20`} style={{ width: '40%' }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Premium Filter Control Panel */}
        <div className="bg-surface-container/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2rem] p-6 mb-10 border border-outline-variant/10 dark:border-slate-800/50 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center gap-6">
            {/* Search Input */}
            <div className="relative flex-1 w-full">
              <span className="material-symbols-outlined absolute left-5 top-1/2 -translate-y-1/2 text-sky-500 dark:text-sky-400">search</span>
              <input 
                type="text" 
                placeholder="Search by mother's name..."
                className="w-full pl-14 pr-6 py-4 bg-surface dark:bg-slate-950 border border-outline-variant/20 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-sky-500/30 outline-none transition-all text-on-surface dark:text-white font-medium placeholder:text-on-surface-variant/40 dark:placeholder:text-slate-600"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Status Tabs/Select */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="flex items-center gap-2 mr-2">
                <span className="material-symbols-outlined text-sky-500 text-sm">filter_list</span>
                <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 dark:text-slate-500">Filter Status</span>
              </div>
              <div className="flex bg-surface dark:bg-slate-950 p-1 rounded-xl border border-outline-variant/20 dark:border-slate-800 w-full sm:w-auto overflow-x-auto no-scrollbar">
                {['ALL', 'SCHEDULED', 'COMPLETED', 'CANCELLED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status);
                      setCurrentPage(1);
                    }}
                    className={`px-5 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                      statusFilter === status 
                        ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/20' 
                        : 'text-on-surface-variant/60 dark:text-slate-500 hover:text-sky-500'
                    }`}
                  >
                    {status === 'ALL' ? 'Everything' : status}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Clinical Ledger Grid (Replacing Table) */}
        <div className="relative z-10">
          {currentVisits.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 bg-surface-container/50 dark:bg-slate-900/50 border border-outline-variant/10 dark:border-slate-800 rounded-[2.5rem] text-center px-6 backdrop-blur-xl">
              <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center text-sky-500 mb-6">
                <span className="material-symbols-outlined text-4xl">history_toggle_off</span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface dark:text-white mb-2">No Records Found</h3>
              <p className="text-on-surface-variant dark:text-slate-400 max-w-md">No care sessions match your current filters or search criteria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {currentVisits.map(v => (
                <div key={v.id} className="group relative bg-surface-container/40 dark:bg-slate-900/40 hover:bg-surface-container/60 dark:hover:bg-slate-900/60 border border-outline-variant/10 dark:border-slate-800 hover:border-sky-500/30 rounded-[2rem] p-8 transition-all duration-500 backdrop-blur-xl overflow-hidden">
                  {/* Decorative corner accent */}
                  <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br opacity-10 blur-2xl -mr-12 -mt-12 group-hover:opacity-20 transition-opacity ${
                    v.status === 'COMPLETED' ? 'from-emerald-500 to-transparent' : 
                    v.status === 'SCHEDULED' ? 'from-sky-500 to-transparent' : 'from-rose-500 to-transparent'
                  }`}></div>

                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-on-surface dark:text-white mb-1">
                        {familiesMap[v.family_id]?.mother_name || 'Deleted Family'}
                      </h3>
                      <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400/80 font-bold text-[10px] uppercase tracking-widest">
                        <span className="material-symbols-outlined text-xs">event</span>
                        {new Date(v.scheduled_date).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                      </div>
                    </div>
                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${
                      v.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20' : 
                      v.status === 'SCHEDULED' ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-500/20' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    }`}>
                      {v.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="bg-surface-container-highest dark:bg-white/5 p-4 rounded-2xl border border-outline-variant/10 dark:border-white/5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/60 dark:text-slate-500 mb-1">Session Time</p>
                      <p className="text-sm font-bold text-on-surface dark:text-slate-200">
                        {new Date(v.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="bg-surface-container-highest dark:bg-white/5 p-4 rounded-2xl border border-outline-variant/10 dark:border-white/5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/60 dark:text-slate-500 mb-1">Focus Area</p>
                      <p className="text-sm font-bold text-on-surface dark:text-slate-200 truncate">{v.focus_area || 'General Visit'}</p>
                    </div>
                  </div>

                  {/* Clinical Notes Section */}
                  {v.notes && (
                    <div className="mb-8 p-5 bg-sky-500/5 dark:bg-sky-500/10 rounded-2xl border-l-4 border-sky-500/30">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="material-symbols-outlined text-[14px] text-sky-500">clinical_notes</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-sky-600 dark:text-sky-400">Clinical Observations</span>
                      </div>
                      <p className="text-sm text-on-surface-variant dark:text-slate-300 italic leading-relaxed line-clamp-3">
                        "{v.notes}"
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-6 border-t border-outline-variant/10 dark:border-white/5">
                    <div className="flex items-center gap-2">
                       <div className="w-8 h-8 rounded-full bg-sky-500/10 flex items-center justify-center">
                          <span className="material-symbols-outlined text-xs text-sky-500">hourglass_top</span>
                       </div>
                       <span className="text-xs font-bold text-on-surface-variant dark:text-slate-400">{v.duration_hours || '2'}h Duration</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleDelete(v.id)}
                        className="w-10 h-10 rounded-xl bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 transition-all flex items-center justify-center group/btn"
                        title="Purge Record"
                      >
                        <span className="material-symbols-outlined text-lg group-hover/btn:scale-110 transition-transform">delete_forever</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-between items-center bg-surface-container/50 dark:bg-slate-900/50 p-4 rounded-2xl border border-outline-variant/10 dark:border-slate-800">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-6 py-2 bg-surface-container-high dark:bg-slate-800 rounded-full text-sm font-bold text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-highest dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">chevron_left</span>
              Previous
            </button>
            <div className="text-xs font-black uppercase tracking-widest text-on-surface-variant/60 dark:text-slate-500">
              Page {currentPage} of {totalPages}
            </div>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-6 py-2 bg-surface-container-high dark:bg-slate-800 rounded-full text-sm font-bold text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-highest dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              Next
              <span className="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          </div>
        )}
      </div>


      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteConfirm.open} 
        onClose={() => setDeleteConfirm({ open: false, visitId: null })} 
        title="Purge Record?"
      >
        <div className="p-4 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-rose-500 text-4xl">delete_forever</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Permanently?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              This will remove this visit from your clinical ledger forever. This action cannot be undone.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <button
              className="w-full py-4 bg-rose-500 text-white rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/20 active:scale-95 transition-transform"
              onClick={confirmDelete}
            >
              Purge Record
            </button>
            <button
              className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              onClick={() => setDeleteConfirm({ open: false, visitId: null })}
            >
              Keep Record
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
