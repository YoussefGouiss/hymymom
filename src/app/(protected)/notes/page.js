'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Modal from '@/components/Modal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

const NOTE_TYPES = ['General', 'Medical', 'Emotional', 'Follow-up', 'Urgent', 'Business'];

const CATEGORY_STYLES = {
  General: { 
    bg: 'bg-[#d7e8ff] dark:bg-blue-950/40', 
    text: 'text-blue-900 dark:text-blue-200',
    icon: 'sticky_note_2',
    rotate: '-rotate-1',
    border: 'border-blue-200/50 dark:border-blue-500/20'
  },
  Business: { 
    bg: 'bg-[#fce4ec] dark:bg-rose-950/40', 
    text: 'text-rose-900 dark:text-rose-200',
    icon: 'payments',
    rotate: 'rotate-1',
    border: 'border-rose-200/50 dark:border-rose-500/20'
  },
  Medical: { 
    bg: 'bg-[#e0f2f1] dark:bg-emerald-950/40', 
    text: 'text-emerald-900 dark:text-emerald-200',
    icon: 'clinical_notes',
    rotate: '-rotate-1',
    border: 'border-emerald-200/50 dark:border-emerald-500/20'
  },
  Emotional: { 
    bg: 'bg-[#f3e5f5] dark:bg-purple-950/40', 
    text: 'text-purple-900 dark:text-purple-200',
    icon: 'volunteer_activism',
    rotate: 'rotate-1',
    border: 'border-purple-200/50 dark:border-purple-500/20'
  },
  'Follow-up': { 
    bg: 'bg-[#fff3e0] dark:bg-orange-950/40', 
    text: 'text-orange-900 dark:text-orange-200',
    icon: 'notifications_active',
    rotate: 'rotate-1',
    border: 'border-orange-200/50 dark:border-orange-500/20'
  },
  Urgent: { 
    bg: 'bg-rose-100 dark:bg-rose-900/40', 
    text: 'text-rose-700 dark:text-rose-200',
    icon: 'priority_high',
    rotate: '-rotate-1',
    border: 'border-rose-300/50 dark:border-rose-500/40'
  },
};

function NoteCarousel({ children }) {
  const scrollRef = React.useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const childrenArray = React.Children.toArray(children);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const index = Math.round(scrollLeft / clientWidth);
      setActiveIndex(index);
    }
  };

  const scrollTo = (index) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      scrollRef.current.scrollTo({ left: index * clientWidth, behavior: 'smooth' });
    }
  };

  return (
    <div className="group space-y-6">
      {/* Scrollable Area */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex gap-8 overflow-x-auto pb-4 scrollbar-hide scroll-smooth snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {childrenArray.map((child, idx) => (
          <div key={idx} className="flex-none w-full lg:w-[450px] snap-start">
            {child}
          </div>
        ))}
      </div>

      {/* Pagination Dots */}
      {childrenArray.length > 1 && (
        <div className="flex justify-center items-center gap-3">
          {childrenArray.map((_, idx) => (
            <button
              key={idx}
              onClick={() => scrollTo(idx)}
              className={`h-1.5 transition-all duration-300 rounded-full ${activeIndex === idx ? 'w-8 bg-primary shadow-lg shadow-primary/20' : 'w-1.5 bg-outline-variant/30 hover:bg-primary/30'}`}
              aria-label={`Go to note ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function NotesPage() {
  const { user } = useAuth();
  const [notes, setNotes] = useState([]);
  const [familiesList, setFamiliesList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedFamily, setSelectedFamily] = useState('All');

  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ family_id: '', type: 'General', content: '', is_pinned: false });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formStep, setFormStep] = useState(1);
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, noteId: null });
  const filterScrollRef = React.useRef(null);

  const scrollFilters = (direction) => {
    if (filterScrollRef.current) {
      const scrollAmount = direction === 'left' ? -150 : 150;
      filterScrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const fetchFamilies = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('families').select('id, mother_name').eq('user_id', user.id);
    setFamiliesList(data || []);
  }, [user]);

  const fetchNotes = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('*, family:families(mother_name)')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      console.log('Notes fetch result:', data);
      if (!error && data) {
        setNotes(data);
      } else if (error) {
        console.error('Fetch error:', error);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFamilies();
    fetchNotes();
  }, [fetchFamilies, fetchNotes]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Sanitize payload: don't send empty family_id if no client is selected
      const payload = { 
        type: formData.type,
        content: formData.content,
        is_pinned: formData.is_pinned,
        user_id: user?.id 
      };
      
      if (formData.family_id) {
        payload.family_id = parseInt(formData.family_id, 10);
      }

      const { error } = await supabase.from('notes').insert([payload]);
      
      if (!error) {
        setModalOpen(false);
        setFormData({ family_id: '', type: 'General', content: '', is_pinned: false });
        fetchNotes();
      } else {
        console.error('Supabase Error:', error);
        setError(error.message);
      }
    } catch (e) {
      console.error('System Error:', e);
      setError('An error occurred while storing your thought.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const togglePin = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('notes')
        .update({ is_pinned: !currentStatus })
        .eq('id', id);
      if (!error) {
        setNotes(notes.map(n => n.id === id ? { ...n, is_pinned: !currentStatus } : n));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteClick = (id) => {
    setDeleteConfirm({ open: true, noteId: id });
  };

  const confirmDelete = async () => {
    const id = deleteConfirm.noteId;
    if (!id) return;
    
    setDeleteConfirm({ open: false, noteId: null });
    try {
      const { error } = await supabase.from('notes').delete().eq('id', id);
      if (!error) {
        setNotes(notes.filter(n => n.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const filteredNotes = useMemo(() => {
    return notes.filter(n => {
      const matchesSearch = n.content.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (n.family?.mother_name || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesType = activeFilter === 'All' || n.type === activeFilter;
      const matchesFamily = selectedFamily === 'All' || String(n.family_id) === String(selectedFamily);
      return matchesSearch && matchesType && matchesFamily;
    });
  }, [notes, searchQuery, activeFilter, selectedFamily]);

  const pinnedNotes = useMemo(() => filteredNotes.filter(n => n.is_pinned), [filteredNotes]);
  const otherNotes = useMemo(() => filteredNotes.filter(n => !n.is_pinned), [filteredNotes]);

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20 transition-all duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
        <div>
          <h1 className="text-4xl md:text-5xl font-headline font-bold text-slate-900 dark:text-white mb-2 tracking-tight">Creative Sanctuary</h1>
          <p className="text-lg text-slate-500 font-medium">Capture your insights and clinical observations</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative group">
            <input 
              type="text" 
              placeholder="Search your notes..." 
              className="pl-12 pr-6 py-3.5 md:py-4 bg-surface-container-low dark:bg-slate-900 border border-outline-variant/10 dark:border-white/5 rounded-2xl text-sm focus:ring-2 focus:ring-primary focus:outline-none w-full md:w-64 transition-all group-hover:shadow-lg"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">search</span>
          </div>
          <button onClick={() => { setError(''); setFormStep(1); setModalOpen(true); }} className="bg-primary text-on-primary px-6 py-3 md:px-8 md:py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 transition-all flex items-center gap-3 active:scale-95">
            <span className="material-symbols-outlined">add_circle</span>
            New Note
          </button>
        </div>
      </div>

      {/* Filter Bar - Cleaned up to match original desktop look */}
      <div className="bg-surface-container-low/50 dark:bg-slate-900/30 p-4 lg:p-2 lg:pl-6 rounded-[2rem] backdrop-blur-xl border border-outline-variant/5">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4 lg:gap-8">
          {/* Type Filters - Functional arrows on mobile/tablet, wrapping on laptop */}
          <div className="relative group/filters w-full lg:w-auto">
            <div 
              ref={filterScrollRef}
              className="flex items-center gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 no-scrollbar snap-x snap-mandatory flex-nowrap lg:flex-wrap"
            >
              {['All', ...NOTE_TYPES].map(type => (
                <button
                  key={type}
                  onClick={() => setActiveFilter(type)}
                  className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap snap-start ${activeFilter === type ? 'bg-primary text-on-primary shadow-lg shadow-primary/20 scale-105' : 'text-on-surface-variant hover:bg-surface-container dark:bg-white/5'}`}
                >
                  {type}
                </button>
              ))}
            </div>
            
            {/* Functional Mobile/Tablet Arrows */}
            <button 
              type="button"
              onClick={() => scrollFilters('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center pr-1 pointer-events-auto lg:hidden bg-gradient-to-l from-surface-container-low dark:from-slate-900 to-transparent w-12 h-full z-10"
            >
               <span className="material-symbols-outlined text-sm text-primary animate-pulse ml-auto bg-white/20 dark:bg-black/20 rounded-full p-1 shadow-sm">chevron_right</span>
            </button>
            <button 
              type="button"
              onClick={() => scrollFilters('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center pl-1 pointer-events-auto lg:hidden bg-gradient-to-r from-surface-container-low dark:from-slate-900 to-transparent w-8 h-full z-10"
            >
               <span className="material-symbols-outlined text-sm text-primary/40 bg-white/20 dark:bg-black/20 rounded-full p-1 shadow-sm">chevron_left</span>
            </button>
          </div>

          <div className="hidden lg:block h-6 w-px bg-outline-variant/20 mx-2"></div>

          {/* Family Filter Dropdown */}
          <div className="relative group w-full lg:w-auto lg:min-w-[180px]">
            <select 
              value={selectedFamily}
              onChange={(e) => setSelectedFamily(e.target.value)}
              className="appearance-none w-full bg-surface-container dark:bg-white/5 lg:bg-transparent pl-4 pr-10 py-3 lg:py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest text-on-surface-variant focus:outline-none cursor-pointer group-hover:text-primary transition-colors border border-outline-variant/10 lg:border-none"
            >
              <option value="All">All Families</option>
              {familiesList.map(f => (
                <option key={f.id} value={f.id}>{f.mother_name}</option>
              ))}
            </select>
            <span className="material-symbols-outlined absolute right-4 lg:right-2 top-1/2 -translate-y-1/2 text-lg pointer-events-none text-outline-variant/40 group-hover:text-primary transition-colors">unfold_more</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-40">
           <span className="material-symbols-outlined animate-spin text-5xl text-primary/30">refresh</span>
        </div>
      ) : (
        <div className="space-y-12 md:space-y-16 lg:space-y-20">
          {/* Section: Pinned Observations (Top Priority) */}
          {pinnedNotes.length > 0 && (
            <section className="space-y-8">
              <div className="flex items-center gap-3 text-primary">
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Always Present</span>
                <div className="h-px flex-1 bg-gradient-to-r from-primary/20 to-transparent ml-4"></div>
              </div>
              
              <div className="space-y-6 md:space-y-8 lg:space-y-10">
                {/* Pinned Family Notes - Vertical Stack */}
                {pinnedNotes.filter(n => n.family_id).map(note => (
                  <NoteCard key={note.id} note={note} onTogglePin={togglePin} onDelete={handleDeleteClick} />
                ))}

                {/* Pinned Standalone Notes - Carousel */}
                {pinnedNotes.filter(n => !n.family_id).length > 0 && (
                  <NoteCarousel>
                    {pinnedNotes.filter(n => !n.family_id).map(note => (
                      <NoteCard key={note.id} note={note} onTogglePin={togglePin} onDelete={handleDeleteClick} />
                    ))}
                  </NoteCarousel>
                )}
              </div>
            </section>
          )}

          {/* Section: General Practice Notes (Sticky-Note Board) */}
          <section className="space-y-8">
            <div className="flex items-end justify-between border-b border-outline-variant/10 pb-6">
              <div>
                <h3 className="font-headline text-3xl text-on-surface">The Creative Workspace</h3>
                <p className="text-on-surface-variant text-sm mt-1">General practice wisdom, business ideas, and daily reminders.</p>
              </div>
            </div>
            
            <NoteCarousel>
              {/* Quick Add Placeholder (Now First) */}
              <div 
                onClick={() => { setError(''); setFormStep(1); setModalOpen(true); }}
                className="border-2 border-dashed border-outline-variant/30 rounded-[1.5rem] md:rounded-[2rem] p-6 md:p-10 flex flex-col items-center justify-center gap-4 hover:bg-surface-container-low transition-all cursor-pointer group min-h-[280px] md:min-h-[320px] w-full"
              >
                <div className="w-16 h-16 rounded-full bg-surface-container-high group-hover:bg-primary/10 flex items-center justify-center transition-all group-hover:scale-110">
                  <span className="material-symbols-outlined text-3xl text-on-surface-variant group-hover:text-primary">add</span>
                </div>
                <span className="text-sm font-black uppercase tracking-widest text-on-surface-variant group-hover:text-primary">New Digital Note</span>
              </div>

              {/* Standalone Unpinned Notes */}
              {filteredNotes.filter(n => !n.family_id && !n.is_pinned).map((note) => (
                <NoteCard key={note.id} note={note} onTogglePin={togglePin} onDelete={handleDeleteClick} />
              ))}
            </NoteCarousel>
          </section>

          {/* Section: Family-Specific Notes (Editorial Layout) */}
          <section className="space-y-8">
            <div className="flex items-end justify-between border-b border-outline-variant/10 pb-6">
              <div>
                <h3 className="font-headline text-3xl text-on-surface">The Family Registry</h3>
                <p className="text-on-surface-variant text-sm mt-1">Private observations and critical details for your current families.</p>
              </div>
            </div>

            <div className="space-y-6 md:space-y-8 lg:space-y-10">
              {filteredNotes.filter(n => n.family_id && !n.is_pinned).map(note => (
                <NoteCard key={note.id} note={note} onTogglePin={togglePin} onDelete={handleDeleteClick} />
              ))}
            </div>
          </section>
        </div>
      )}

      {/* New Note Modal */}
      <Modal isOpen={modalOpen} onClose={() => { setModalOpen(false); setError(''); }} title={formStep === 1 ? "Categorize Thought" : "Capture Details"}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Step Indicator */}
          <div className="flex items-center gap-2 mb-4">
            <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${formStep >= 1 ? 'bg-primary' : 'bg-outline-variant/20'}`}></div>
            <div className={`h-1 flex-1 rounded-full transition-all duration-500 ${formStep >= 2 ? 'bg-primary' : 'bg-outline-variant/20'}`}></div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}

          {formStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <p className="text-[11px] md:text-xs text-primary font-medium leading-relaxed">
                  <span className="font-black uppercase tracking-widest mr-2">Pro Tip:</span>
                  Associate this thought with a client to keep your clinical timeline organized.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Client Association</label>
                  <select 
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    value={formData.family_id}
                    onChange={e => setFormData({...formData, family_id: e.target.value})}
                  >
                    <option value="">General Thought (No Client)</option>
                    {familiesList.map(f => <option key={f.id} value={f.id}>{f.mother_name}</option>)}
                  </select>
                </div>

                <div className="space-y-3">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Classification</label>
                  <div className="grid grid-cols-2 gap-2">
                    {NOTE_TYPES.map(type => (
                      <button 
                        type="button" 
                        key={type}
                        onClick={() => setFormData({...formData, type})}
                        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase border transition-all flex items-center justify-between ${formData.type === type ? 'bg-primary text-white border-transparent shadow-lg shadow-primary/20' : 'bg-surface-container dark:bg-white/5 border-outline-variant/10 text-on-surface-variant hover:border-primary/50'}`}
                      >
                        {type}
                        {formData.type === type && <span className="material-symbols-outlined text-xs">check_circle</span>}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                type="button"
                onClick={() => setFormStep(2)}
                className="w-full py-5 bg-primary text-on-primary font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center gap-3 shadow-xl shadow-primary/20 active:scale-95 transition-all"
              >
                Continue to Content
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          )}

          {formStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">The Observation</label>
                  <textarea 
                    rows={5} 
                    required 
                    autoFocus
                    className="w-full p-5 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none resize-none transition-all"
                    placeholder="Write your clinical insight here..."
                    value={formData.content}
                    onChange={e => setFormData({...formData, content: e.target.value})}
                  />
                </div>

                <div className="flex items-center gap-3 p-4 rounded-2xl bg-surface-container dark:bg-white/5 border border-outline-variant/10 cursor-pointer hover:bg-primary/5 transition-all" onClick={() => setFormData({...formData, is_pinned: !formData.is_pinned})}>
                  <input type="checkbox" checked={formData.is_pinned} onChange={() => {}} className="w-5 h-5 accent-primary" />
                  <div className="flex-1">
                    <p className="text-xs font-bold text-on-surface">Pin Observation</p>
                    <p className="text-[10px] text-on-surface-variant/60 uppercase font-black tracking-tighter">Keep at the top of your workspace</p>
                  </div>
                  <span className={`material-symbols-outlined ${formData.is_pinned ? 'text-primary' : 'text-slate-300'}`}>push_pin</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  type="submit" 
                  disabled={isSubmitting} 
                  className="w-full py-5 bg-primary text-on-primary font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl shadow-primary/20 active:scale-95 transition-all"
                >
                  {isSubmitting ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : 'Finalize Note'}
                </button>
                <button 
                  type="button"
                  onClick={() => setFormStep(1)}
                  className="w-full py-3 text-slate-400 font-black uppercase tracking-widest text-[10px] hover:text-primary transition-colors"
                >
                  Go Back
                </button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteConfirm.open} 
        onClose={() => setDeleteConfirm({ open: false, noteId: null })} 
        title="Purge Thought?"
      >
        <div className="p-4 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-rose-500 text-4xl">delete_sweep</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Delete Permanently?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              This will remove this observation from your workspace forever.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <button
              className="w-full py-4 bg-rose-500 text-white rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/20 active:scale-95 transition-transform"
              onClick={confirmDelete}
            >
              Purge Note
            </button>
            <button
              className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              onClick={() => setDeleteConfirm({ open: false, noteId: null })}
            >
              Keep Note
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function NoteCard({ note, onTogglePin, onDelete }) {
  const style = CATEGORY_STYLES[note.type] || CATEGORY_STYLES.General;
  const isFamilyNote = !!note.family_id;

  if (!isFamilyNote) {
    // STICKY NOTE STYLE for Standalone Notes
    return (
      <div className={`group relative p-6 md:p-8 lg:p-10 rounded-lg shadow-sm transition-all duration-500 hover:rotate-0 hover:shadow-xl cursor-pointer flex flex-col gap-5 md:gap-6 min-h-[280px] md:min-h-[320px] border backdrop-blur-sm ${style.bg} ${style.rotate} ${style.border}`}>
        <div className="flex justify-between items-start">
          <div className={`w-12 h-12 rounded-full bg-white/40 dark:bg-black/20 flex items-center justify-center ${style.text}`}>
            <span className="material-symbols-outlined text-2xl">{style.icon}</span>
          </div>
          <div className="flex items-center gap-1">
             <button onClick={() => onTogglePin(note.id, note.is_pinned)} className={`p-2 rounded-full transition-all ${note.is_pinned ? 'text-primary' : 'text-current/30 hover:text-primary'}`}>
               <span className="material-symbols-outlined text-lg leading-none" style={{ fontVariationSettings: note.is_pinned ? "'FILL' 1" : "" }}>push_pin</span>
             </button>
             <button onClick={() => onDelete(note.id)} className="p-2 rounded-full text-current/30 hover:text-rose-500 transition-all">
               <span className="material-symbols-outlined text-lg leading-none">delete_sweep</span>
             </button>
          </div>
        </div>

        <h4 className={`font-headline text-2xl font-bold ${style.text}`}>{note.type}</h4>
        
        <p className={`flex-1 text-base leading-relaxed font-medium ${style.text}/80 italic`}>
          "{note.content}"
        </p>

        <div className={`pt-6 border-t border-current/10 flex items-center justify-between`}>
          <span className={`text-[10px] font-black uppercase tracking-widest ${style.text}/50`}>
            Updated {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        </div>
      </div>
    );
  }

  // EDITORIAL LAYOUT for Family Notes
  return (
    <div className="group bg-surface-container-lowest dark:bg-slate-900/50 p-6 md:p-10 rounded-[1.5rem] md:rounded-[2.5rem] shadow-lg shadow-primary/5 border border-outline-variant/10 dark:border-white/5 flex flex-col md:flex-row gap-6 md:gap-10 items-start hover:-translate-y-2 transition-all duration-500 backdrop-blur-md">
      <div className="w-full md:w-1/3 space-y-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-3xl bg-secondary-container dark:bg-slate-800 overflow-hidden shadow-inner transform -rotate-3 group-hover:rotate-0 transition-transform border border-white/10">
            {note.family?.photo_url ? (
               <img src={note.family.photo_url} alt={note.family.mother_name} className="w-full h-full object-cover" />
            ) : (
               <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                 <span className="material-symbols-outlined text-3xl">family_restroom</span>
               </div>
            )}
          </div>
          <div>
            <h5 className="font-headline font-bold text-xl text-on-surface dark:text-white">{note.family?.mother_name || 'Family Profile'}</h5>
            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant/60 dark:text-slate-500">Active Client</p>
          </div>
        </div>
        <div className="p-6 bg-surface-container-low dark:bg-white/5 rounded-3xl space-y-3 relative overflow-hidden">
          <div className={`absolute left-0 top-0 bottom-0 w-1 ${style.bg.replace('bg-', 'bg-')}`}></div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary">Private Observation</span>
          <p className="text-sm italic text-on-surface-variant dark:text-slate-300 leading-relaxed">
            "{note.content}"
          </p>
        </div>
      </div>

      <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-10">
        <div className="flex-1 space-y-4">
           <h6 className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/40 dark:text-slate-600">Contextual Details</h6>
           <div className="flex flex-wrap gap-2">
              <span className="px-4 py-2 bg-primary/5 dark:bg-primary/10 rounded-full text-[10px] font-bold text-primary border border-primary/10">#{note.type}</span>
              <span className="px-4 py-2 bg-surface-container-high dark:bg-white/10 rounded-full text-[10px] font-bold text-on-surface-variant dark:text-slate-400">#Observations</span>
           </div>
           <div className="pt-4 flex items-center gap-4">
              <button onClick={() => onTogglePin(note.id, note.is_pinned)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${note.is_pinned ? 'text-primary' : 'text-on-surface-variant/30 hover:text-primary dark:text-slate-600'}`}>
                <span className="material-symbols-outlined text-base leading-none" style={{ fontVariationSettings: note.is_pinned ? "'FILL' 1" : "" }}>push_pin</span>
                {note.is_pinned ? 'Unpin' : 'Pin Note'}
              </button>
              <button onClick={() => onDelete(note.id)} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-on-surface-variant/30 hover:text-rose-500 transition-all dark:text-slate-600">
                <span className="material-symbols-outlined text-base leading-none">delete_sweep</span>
                Delete
              </button>
           </div>
        </div>
        <div className="flex flex-col justify-end items-end min-w-[120px]">
           <div className="text-right">
              <p className="text-[10px] font-black text-on-surface-variant/20 dark:text-slate-700 uppercase tracking-[0.3em] mb-1">Captured</p>
              <p className="text-sm font-headline italic text-on-surface-variant dark:text-slate-400 whitespace-nowrap">
                {new Date(note.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
           </div>
        </div>
      </div>
    </div>
  );
}
