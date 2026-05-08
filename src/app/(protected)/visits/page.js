"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

export default function GlobalVisitsDashboard() {
  const [visits, setVisits] = useState([]);
  const [familiesMap, setFamiliesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const { user } = useAuth();
  
  // Modals state
  const [addVisitModalOpen, setAddVisitModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [completionModalOpen, setCompletionModalOpen] = useState(false);
  const [completingVisitId, setCompletingVisitId] = useState(null);
  const [completionNote, setCompletionNote] = useState('');
  const [rescheduleVisit, setRescheduleVisit] = useState(null);
  const [newDate, setNewDate] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState({ open: false, visitId: null });

  // Add Visit Form State (Matching Family Profile)
  const [visitStep, setVisitStep] = useState(1);
  const [visitForm, setVisitForm] = useState({
    family_id: '',
    scheduled_date: '',
    duration_hours: '2',
    focus_area: 'General Postpartum',
    status: 'SCHEDULED'
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Load families
      const { data: families, error: famErr } = await supabase
        .from('families')
        .select('id, mother_name, partner_name, baby_name')
        .eq('user_id', user?.id);
      if (famErr) throw famErr;
      
      const famMap = {};
      families?.forEach((f) => (famMap[f.id] = f));
      setFamiliesMap(famMap);

      // Load visits
      const { data: visitsData, error: visitErr } = await supabase
        .from('visits')
        .select('*')
        .eq('user_id', user?.id)
        .order('scheduled_date', { ascending: true });
      if (visitErr) throw visitErr;
      
      setVisits(visitsData || []);
    } catch (err) {
      console.error('Data load error', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddVisit = async (e) => {
    e.preventDefault();
    if (!visitForm.family_id || !visitForm.scheduled_date) return;

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('visits')
        .insert([{ ...visitForm, user_id: user?.id }]);
      
      if (error) throw error;
      
      setAddVisitModalOpen(false);
      setVisitForm({
        family_id: '',
        scheduled_date: '',
        duration_hours: '2',
        focus_area: 'General Postpartum',
        status: 'SCHEDULED'
      });
      setVisitStep(1);
      await fetchData();
    } catch (err) {
      console.error('Add visit error', err);
    } finally {
      setUpdating(false);
    }
  };

  const updateStatus = async (visitId, newStatus) => {
    if (newStatus === 'COMPLETED') {
      setCompletingVisitId(visitId);
      setCompletionNote('');
      setCompletionModalOpen(true);
      return;
    }
    setUpdating(true);
    const { error } = await supabase.from('visits').update({ status: newStatus }).eq('id', visitId);
    if (error) console.error('Status update error', error);
    await fetchData();
    setUpdating(false);
  };

  const confirmCompletion = async (withNote = true) => {
    if (!completingVisitId) return;
    setUpdating(true);
    const updateData = { status: 'COMPLETED' };
    if (withNote && completionNote.trim()) {
      updateData.notes = completionNote;
    }
    
    const { error } = await supabase.from('visits').update(updateData).eq('id', completingVisitId);
    if (error) console.error('Completion error', error);
    await fetchData();
    setCompletionModalOpen(false);
    setCompletingVisitId(null);
    setUpdating(false);
  };

  const handleReschedule = (visit) => {
    setRescheduleVisit(visit);
    setNewDate(visit.scheduled_date.slice(0, 16)); // Format for datetime-local
    setRescheduleModalOpen(true);
  };

  const confirmReschedule = async () => {
    if (!newDate || !rescheduleVisit) return;
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('visits')
        .update({ scheduled_date: newDate })
        .eq('id', rescheduleVisit.id);
      if (error) throw error;
      await fetchData();
    } catch (err) {
      console.error('Reschedule error', err);
    } finally {
      setRescheduleModalOpen(false);
      setUpdating(false);
    }
  };

  const handleDeleteVisit = (visitId) => {
    setDeleteConfirm({ open: true, visitId });
  };

  const confirmDelete = async () => {
    const visitId = deleteConfirm.visitId;
    if (!visitId) return;

    setDeleteConfirm({ open: false, visitId: null });
    
    const card = document.getElementById(`visit-${visitId}`);
    if (card) {
      card.style.transform = 'translateX(50px)';
      card.style.opacity = '0';
      card.style.pointerEvents = 'none';
    }

    setUpdating(true);
    try {
      const { error } = await supabase
        .from('visits')
        .delete()
        .eq('id', visitId);
      
      if (error) throw error;
      
      setTimeout(async () => {
        await fetchData();
        setUpdating(false);
      }, 400);
    } catch (err) {
      console.error('Delete visit error', err);
      if (card) {
        card.style.transform = 'none';
        card.style.opacity = '1';
        card.style.pointerEvents = 'auto';
      }
      setUpdating(false);
    }
  };

  // Helper to group visits
  const todayStr = new Date().toDateString();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toDateString();

  const upcomingVisits = visits.filter(v => v.status === 'SCHEDULED' || v.status === 'IN_PROGRESS');
  const pastVisits = visits.filter(v => v.status === 'COMPLETED').reverse().slice(0, 3);

  const todayVisits = upcomingVisits.filter(v => new Date(v.scheduled_date).toDateString() === todayStr);
  const tomorrowVisits = upcomingVisits.filter(v => new Date(v.scheduled_date).toDateString() === tomorrowStr);
  const otherUpcoming = upcomingVisits.filter(v => {
    const d = new Date(v.scheduled_date).toDateString();
    return d !== todayStr && d !== tomorrowStr;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#0ea5e9]/20 border-t-[#0ea5e9] rounded-full animate-spin"></div>
          <span className="text-[#0ea5e9] font-bold">Curating your sanctuary...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="visits-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .visits-container {
          --cal-primary: #0ea5e9;
          --cal-on-primary: #ffffff;
          --cal-surface: #f8fafc;
          --cal-on-surface: #0f172a;
          --cal-surface-container-low: #f1f5f9;
          --cal-surface-container-high: #e2e8f0;
          --cal-surface-container-highest: #cbd5e1;
          --cal-surface-container-lowest: #ffffff;
          --cal-primary-container: #e0f2fe;
          --cal-on-primary-container: #0369a1;
          --cal-secondary-container: #f0f9ff;
          --cal-on-secondary-container: #0ea5e9;
          --cal-tertiary-container: #ecfeff;
          --cal-on-tertiary-container: #0891b2;
          --cal-tertiary: #0891b2;
          --cal-on-surface-variant: #64748b;
          --cal-outline: #94a3b8;
          --cal-outline-variant: #e2e8f0;

          color: var(--cal-on-surface);
          background-color: var(--cal-surface);
          transition: all 0.5s ease;
          min-height: 100vh;
          margin: -2rem;
          padding: 2rem;
        }

        .dark .visits-container {
          --cal-primary: #38bdf8;
          --cal-on-primary: #082f49;
          --cal-surface: #020617;
          --cal-on-surface: #f1f5f9;
          --cal-surface-container-low: #0f172a;
          --cal-surface-container-high: #1e293b;
          --cal-surface-container-highest: #334155;
          --cal-surface-container-lowest: #0a0f18;
          --cal-primary-container: #0c4a6e;
          --cal-on-primary-container: #bae6fd;
          --cal-secondary-container: #0f172a;
          --cal-on-secondary-container: #38bdf8;
          --cal-tertiary-container: #164e63;
          --cal-on-tertiary-container: #22d3ee;
          --cal-tertiary: #22d3ee;
          --cal-on-surface-variant: #94a3b8;
          --cal-outline: #475569;
          --cal-outline-variant: #1e293b;
        }

        .text-cal-primary { color: var(--cal-primary); }
        .bg-cal-primary { background-color: var(--cal-primary); }
        .text-cal-variant { color: var(--cal-on-surface-variant); }
        .bg-cal-surface-low { background-color: var(--cal-surface-container-low); }
        .bg-cal-surface-lowest { background-color: var(--cal-surface-container-lowest); }

        .visit-card-transition {
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Baby Blue Calendar Picker Icon */
        input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(48%) sepia(79%) saturate(2476%) hue-rotate(170deg) brightness(101%) contrast(101%);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .dark input[type="datetime-local"]::-webkit-calendar-picker-indicator {
          filter: invert(73%) sepia(61%) saturate(2853%) hue-rotate(174deg) brightness(103%) contrast(97%);
        }
        input[type="datetime-local"]::-webkit-calendar-picker-indicator:hover {
          transform: scale(1.1);
        }
      `}} />

      <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-end gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-headline text-cal-primary font-bold mb-2 tracking-tight">Your Sanctuary Schedule</h1>
          <p className="text-cal-variant font-medium text-base md:text-lg">
            Managing {upcomingVisits.length} nurturing visits ahead
          </p>
        </div>
        <button 
          onClick={() => setAddVisitModalOpen(true)}
          className="px-6 py-3 bg-cal-primary text-cal-on-primary rounded-full font-bold flex items-center gap-2 shadow-lg shadow-sky-500/20 hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined">add_circle</span>
          Schedule New Visit
        </button>
      </header>

      <div className="grid grid-cols-12 gap-8 lg:gap-12">
        <section className="col-span-12 lg:col-span-4 lg:sticky lg:top-28">
          <div className="bg-cal-surface-low p-6 md:p-8 rounded-xl border border-[var(--cal-outline-variant)]/10">
            <MiniCalendar visits={visits} familiesMap={familiesMap} />
            <div className="mt-10 p-6 bg-[var(--cal-surface-container-lowest)]/50 rounded-lg border border-[var(--cal-outline-variant)]/10">
              <h4 className="text-sm font-bold uppercase tracking-wider text-[var(--cal-outline)] mb-4">Focus of the Day</h4>
              <p className="text-cal-variant italic">
                {todayVisits.length > 0 
                  ? `"${todayVisits[0].focus_area || 'A calm presence today is the best gift you can offer.'}"`
                  : '"Every breath is a new beginning. Enjoy a moment of peace today."'}
              </p>
            </div>
          </div>
        </section>

        <section className="col-span-12 lg:col-span-8 space-y-12">
          {/* Today */}
          <div>
            <div className="flex items-center gap-4 mb-8">
              <span className="h-px flex-1 bg-[var(--cal-surface-container-highest)]"></span>
              <h2 className="text-sm font-bold text-[var(--cal-outline)] uppercase tracking-[0.2em]">Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</h2>
              <span className="h-px flex-1 bg-[var(--cal-surface-container-highest)]"></span>
            </div>
            <div className="space-y-6">
              {todayVisits.length > 0 ? (
                todayVisits.map(v => (
                  <VisitCard 
                    key={v.id} 
                    visit={v} 
                    family={familiesMap[v.family_id]} 
                    onReschedule={handleReschedule}
                    onComplete={() => updateStatus(v.id, 'COMPLETED')}
                    onDelete={() => handleDeleteVisit(v.id)}
                  />
                ))
              ) : (
                <p className="text-center text-[var(--cal-outline)] italic py-8">No visits scheduled for today.</p>
              )}
            </div>
          </div>

          {/* Upcoming */}
          {(tomorrowVisits.length > 0 || otherUpcoming.length > 0) && (
            <div>
              <div className="flex items-center gap-4 mb-8">
                <span className="h-px flex-1 bg-[var(--cal-surface-container-highest)]"></span>
                <h2 className="text-sm font-bold text-[var(--cal-outline)] uppercase tracking-[0.2em]">Upcoming</h2>
                <span className="h-px flex-1 bg-[var(--cal-surface-container-highest)]"></span>
              </div>
              <div className="space-y-6">
                {[...tomorrowVisits, ...otherUpcoming].map(v => (
                  <VisitCard 
                    key={v.id} 
                    visit={v} 
                    family={familiesMap[v.family_id]} 
                    onReschedule={handleReschedule}
                    onComplete={() => updateStatus(v.id, 'COMPLETED')}
                    onDelete={() => handleDeleteVisit(v.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Care Moments */}
          {pastVisits.length > 0 && (
            <div className="bg-cal-surface-low rounded-xl p-10 mt-16 border border-[var(--cal-outline-variant)]/10">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-headline text-[var(--cal-on-surface)] font-bold">Past Care Moments</h2>
                <div className="text-right">
                  <span className="text-4xl font-bold text-cal-primary">
                    {visits.filter(v => v.status === 'COMPLETED').reduce((acc, v) => acc + (v.duration_hours || 0), 0)}
                  </span>
                  <span className="text-sm font-bold text-[var(--cal-outline)] block uppercase tracking-wider">Total Hours Logged</span>
                </div>
              </div>
              <div className="space-y-4">
                {pastVisits.map(v => (
                  <PastVisitItem key={v.id} visit={v} family={familiesMap[v.family_id]} />
                ))}
              </div>
              <Link 
                href="/visits/history"
                className="w-full mt-8 py-4 text-cal-primary font-bold text-sm uppercase tracking-widest hover:bg-[var(--cal-primary-container)]/30 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                See All Visits
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Link>
            </div>
          )}
        </section>
      </div>

      {/* —— NEW VISIT MODAL (MATCHING FAMILY PROFILE) —— */}
      <Modal 
        isOpen={addVisitModalOpen} 
        onClose={() => { setAddVisitModalOpen(false); setVisitStep(1); }} 
        title="Schedule New Visit"
      >
        <form onSubmit={handleAddVisit} className="space-y-6">
          <div className="flex gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${visitStep >= s ? 'bg-sky-500' : 'bg-slate-800'}`}></div>
            ))}
          </div>

          {visitStep === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Select Family</label>
                  <div className="relative text-sky-500 dark:text-sky-400">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2">group</span>
                    <select 
                      required 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all appearance-none"
                      value={visitForm.family_id}
                      onChange={e => setVisitForm({...visitForm, family_id: e.target.value})}
                    >
                      <option value="">Select a family</option>
                      {Object.values(familiesMap).map(f => (
                        <option key={f.id} value={f.id}>{f.mother_name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Arrival Time</label>
                  <div className="relative text-sky-500 dark:text-sky-400">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2">calendar_today</span>
                    <input 
                      type="datetime-local" 
                      required 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all"
                      value={visitForm.scheduled_date}
                      onChange={e => setVisitForm({...visitForm, scheduled_date: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Duration</label>
                  <div className="relative text-sky-500 dark:text-sky-400">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2">schedule</span>
                    <select 
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all appearance-none"
                      value={visitForm.duration_hours}
                      onChange={e => setVisitForm({...visitForm, duration_hours: e.target.value})}
                    >
                      {['1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '8'].map(h => <option key={h} value={h}>{h} Hours</option>)}
                    </select>
                  </div>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => (visitForm.family_id && visitForm.scheduled_date) ? setVisitStep(2) : null}
                className="w-full py-5 bg-sky-500 text-slate-950 font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl active:scale-95 transition-transform disabled:opacity-50"
                disabled={!visitForm.family_id || !visitForm.scheduled_date}
              >
                Next: Care Focus <span className="material-symbols-outlined text-sm ml-2">arrow_forward</span>
              </button>
            </div>
          )}

          {visitStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Primary Care Focus</label>
                <div className="grid grid-cols-1 gap-2">
                  {['General Postpartum', 'Lactation Support', 'Newborn Sleep Training', 'C-Section Recovery', 'PPA/PPD Emotional Support', 'Sibling Adaptation'].map(area => (
                    <button 
                      type="button" 
                      key={area} 
                      onClick={() => setVisitForm({...visitForm, focus_area: area})}
                      className={`px-4 py-4 rounded-2xl text-xs font-bold border transition-all text-left flex items-center justify-between ${visitForm.focus_area === area ? 'bg-sky-500 text-slate-950 border-transparent shadow-lg shadow-sky-500/20' : 'border-slate-800 text-slate-500 hover:border-sky-500/30'}`}
                    >
                      {area}
                      {visitForm.focus_area === area && <span className="material-symbols-outlined text-sm text-sky-500 dark:text-sky-400">check_circle</span>}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setVisitStep(1)} className="flex-1 py-5 bg-slate-900 text-slate-400 font-bold rounded-full text-xs uppercase tracking-widest border border-slate-800">Back</button>
                <button type="submit" disabled={updating} className="flex-[2] py-5 bg-sky-500 text-slate-950 font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl active:scale-95 transition-transform">
                  {updating ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Confirm Schedule'}
                </button>
              </div>
            </div>
          )}
        </form>
      </Modal>

      {/* Reschedule Modal */}
      <Modal isOpen={rescheduleModalOpen} onClose={() => setRescheduleModalOpen(false)} title="Reschedule Visit">
        <div className="space-y-6 p-2">
          <label className="block text-sm font-bold text-cal-primary uppercase tracking-wider mb-2">New Date & Time</label>
          <input
            type="datetime-local"
            className="w-full px-4 py-3 rounded-xl bg-white border border-[var(--cal-primary-container)] text-[var(--cal-on-surface)] focus:ring-2 focus:ring-[var(--cal-primary)]/20 outline-none transition-all"
            value={newDate}
            onChange={e => setNewDate(e.target.value)}
          />
          <button
            className="w-full py-4 bg-cal-primary text-cal-on-primary rounded-full font-bold shadow-lg shadow-[#0ea5e9]/20 hover:opacity-90 transition-all disabled:opacity-50"
            onClick={confirmReschedule}
            disabled={updating}
          >
            {updating ? 'Updating...' : 'Save Changes'}
          </button>
        </div>
      </Modal>

      {/* Completion Modal */}
      <Modal isOpen={completionModalOpen} onClose={() => setCompletionModalOpen(false)} title="Visit Summary">
        <div className="space-y-6 p-2">
          <p className="text-cal-variant text-sm">
            Wonderful! You've completed another session. Would you like to add any clinical notes or observations for this visit?
          </p>
          <div>
            <label className="block text-xs font-bold text-cal-variant uppercase mb-2">Clinical Notes (Optional)</label>
            <textarea
              className="w-full p-4 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-cal-primary focus:outline-none min-h-[120px]"
              placeholder="Enter session details, baby's mood, mother's recovery status..."
              value={completionNote}
              onChange={e => setCompletionNote(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-3">
            <button
              className="w-full py-4 bg-cal-primary text-cal-on-primary rounded-full font-bold shadow-lg hover:opacity-90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              onClick={() => confirmCompletion(true)}
              disabled={updating}
            >
              {updating ? 'Saving...' : 'Save & Mark Complete'}
            </button>
            <button
              className="w-full py-3 text-cal-variant font-bold text-sm uppercase tracking-widest hover:bg-slate-100 rounded-full transition-colors"
              onClick={() => confirmCompletion(false)}
              disabled={updating}
            >
              Skip for now
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={deleteConfirm.open} 
        onClose={() => setDeleteConfirm({ open: false, visitId: null })} 
        title="Cancel Visit?"
      >
        <div className="p-4 text-center space-y-6">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-rose-500 text-4xl">event_busy</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Are you sure?</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              This will permanently remove this visit from your schedule. This action cannot be undone.
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-4">
            <button
              className="w-full py-4 bg-rose-500 text-white rounded-full font-black uppercase tracking-widest text-xs shadow-lg shadow-rose-500/20 active:scale-95 transition-transform"
              onClick={confirmDelete}
            >
              Confirm Cancellation
            </button>
            <button
              className="w-full py-3 text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              onClick={() => setDeleteConfirm({ open: false, visitId: null })}
            >
              Keep Visit
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function VisitCard({ visit, family, onReschedule, onComplete, onDelete }) {
  const date = new Date(visit.scheduled_date);
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  const isNight = date.getHours() >= 18 || date.getHours() < 6;

  return (
    <div id={`visit-${visit.id}`} className="group bg-cal-surface-lowest p-6 md:p-8 rounded-[20px] md:rounded-[24px] shadow-sm hover:shadow-xl hover:shadow-[#0ea5e9]/5 transition-all duration-500 flex flex-col md:flex-row gap-6 md:gap-8 items-start relative overflow-hidden border border-[var(--cal-outline-variant)]/5 visit-card-transition">
      <div className={`absolute left-0 top-0 bottom-0 w-2 ${isNight ? 'bg-[var(--cal-tertiary)]' : 'bg-cal-primary'}`}></div>
      <div className="flex flex-col items-center min-w-[80px]">
        <span className={`text-xl font-bold ${isNight ? 'text-[var(--cal-tertiary)]' : 'text-cal-primary'}`}>{time}</span>
        <span className="text-sm text-[var(--cal-outline)] font-medium">{visit.duration_hours || '—'} Hours</span>
      </div>
      <div className="flex-1 w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-2 gap-2">
          <h3 className="text-xl md:text-2xl font-bold font-headline text-[var(--cal-on-surface)]">
            {family?.mother_name ? `The ${family.mother_name.split(' ')[0]} Family` : 'Unknown Family'}
          </h3>
          <div className="flex gap-2">
            <span className="px-4 py-1 bg-[var(--cal-secondary-container)] text-[var(--cal-on-secondary-container)] text-[10px] font-bold rounded-full uppercase tracking-widest h-fit">
              {visit.status}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap gap-3 mb-4">
          <span className="text-sm font-medium text-[var(--cal-tertiary)] px-3 py-1 bg-[var(--cal-tertiary-container)]/30 rounded-md">
            [{visit.focus_area || 'General Visit'}]
          </span>
        </div>

        {/* Visit Notes Display */}
        {visit.notes && (
          <div className="mb-6 p-4 bg-[var(--cal-surface-container-low)] rounded-xl border-l-4 border-cal-primary/30">
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-sm text-cal-primary">clinical_notes</span>
              <span className="text-[10px] font-black uppercase tracking-widest text-cal-variant">Clinical Notes</span>
            </div>
            <p className="text-sm text-[var(--cal-on-surface)] italic leading-relaxed">
              "{visit.notes}"
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-6">
          <button onClick={() => onReschedule(visit)} className="text-sky-500 dark:text-sky-400 text-sm font-bold hover:text-cal-primary transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">schedule</span>
            Reschedule
          </button>
          
          <button onClick={onDelete} className="text-red-500/60 dark:text-red-400/40 text-sm font-bold hover:text-red-500 dark:hover:text-red-400 transition-colors flex items-center gap-1">
            <span className="material-symbols-outlined text-lg">delete_sweep</span>
            Cancel
          </button>

          <button onClick={onComplete} className="text-emerald-600 text-sm font-bold hover:text-emerald-700 transition-colors flex items-center gap-1 ml-auto">
            <span className="material-symbols-outlined text-lg">check_circle</span>
            Mark Complete
          </button>
        </div>
      </div>
    </div>
  );
}

function PastVisitItem({ visit, family }) {
  const date = new Date(visit.scheduled_date);
  return (
    <div className="flex justify-between items-center p-5 bg-[var(--cal-surface-container-lowest)] rounded-lg group hover:bg-[var(--cal-primary-container)]/10 transition-colors border border-[var(--cal-outline-variant)]/10">
      <div className="flex gap-6 items-center">
        <div className="w-12 h-12 rounded-full bg-[var(--cal-primary)]/10 flex items-center justify-center text-cal-primary">
          <span className="material-symbols-outlined">family_restroom</span>
        </div>
        <div>
          <p className="font-bold text-[var(--cal-on-surface)]">{family?.mother_name || 'Family'}</p>
          <p className="text-xs text-[var(--cal-outline)] font-medium">
            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} • {visit.focus_area || 'Care'}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="font-bold text-cal-primary">+{visit.duration_hours || 0}h</p>
        <p className="text-xs text-cal-variant font-medium">Completed</p>
      </div>
    </div>
  );
}

function MiniCalendar({ visits, familiesMap }) {
  const [curr, setCurr] = useState(new Date());
  const [hoveredDay, setHoveredDay] = useState(null);
  const year = curr.getFullYear();
  const month = curr.getMonth();
  const monthName = curr.toLocaleString('default', { month: 'long' });
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));

  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-8">
        <h3 className="font-headline text-2xl text-[var(--cal-on-surface)] font-semibold">{monthName} {year}</h3>
        <div className="flex gap-2">
          <button onClick={() => setCurr(new Date(year, month - 1, 1))} className="p-2 hover:bg-[var(--cal-surface-container-high)] rounded-full transition-colors"><span className="material-symbols-outlined">chevron_left</span></button>
          <button onClick={() => setCurr(new Date(year, month + 1, 1))} className="p-2 hover:bg-[var(--cal-surface-container-high)] rounded-full transition-colors"><span className="material-symbols-outlined">chevron_right</span></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-y-4 text-center">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
          <div key={`weekday-${i}`} className="text-xs font-bold text-[var(--cal-outline)] uppercase tracking-widest">{d}</div>
        ))}
        {days.map((d, i) => {
          if (!d) return <div key={`empty-${i}`} className="py-2"></div>;
          const isToday = d.toDateString() === new Date().toDateString();
          const dayVisits = visits.filter(v => new Date(v.scheduled_date).toDateString() === d.toDateString());
          const hasScheduled = dayVisits.some(v => v.status === 'SCHEDULED' || v.status === 'IN_PROGRESS');
          const hasCompleted = dayVisits.some(v => v.status === 'COMPLETED');
          return (
            <div key={`day-${d.toISOString()}`} className="relative py-2 font-medium flex flex-col items-center justify-center cursor-default group" onMouseEnter={() => setHoveredDay(d.toISOString())} onMouseLeave={() => setHoveredDay(null)}>
              <span className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isToday ? 'bg-[var(--cal-primary)] text-white font-bold shadow-lg shadow-sky-500/20' : 'text-[var(--cal-on-surface)] group-hover:bg-[var(--cal-surface-container-high)]'}`}>{d.getDate()}</span>
              <div className="flex gap-1 mt-1 h-1">
                {hasScheduled && <span className="w-1 h-1 bg-sky-400 rounded-full"></span>}
                {hasCompleted && <span className="w-1 h-1 bg-emerald-400 rounded-full"></span>}
              </div>
              {hoveredDay === d.toISOString() && dayVisits.length > 0 && (
                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 dark:border-slate-700/50 p-4 rounded-[20px] shadow-2xl z-[100] text-left animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--cal-primary)]">{d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}</span>
                  </div>
                  <div className="space-y-3">
                    {dayVisits.map(v => (
                      <div key={v.id} className="group/item relative pl-3 border-l-2 border-[var(--cal-primary)]/20 hover:border-[var(--cal-primary)] transition-colors">
                        <p className="text-[12px] font-bold text-[var(--cal-on-surface)] leading-none mb-1">{familiesMap[v.family_id]?.mother_name?.split(' ')[0] || 'Family'}</p>
                        <div className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-[10px] ${v.status === 'COMPLETED' ? 'text-emerald-500' : 'text-sky-500'}`}>{v.status === 'COMPLETED' ? 'verified' : 'pending'}</span>
                          <span className="text-[9px] font-bold text-[var(--cal-outline)] uppercase tracking-wider">{v.focus_area?.split(' ')[0] || 'Care'} • {v.duration_hours || 0}h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="absolute top-full left-1/2 -translate-x-1/2 w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[8px] border-t-white/90 dark:border-t-slate-900/90"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
