'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { X, Upload, Search } from 'lucide-react';
import { validateImage, createPreviewUrl } from '@/utils/imageUtils';

const DELIVERY_TYPES = ['Vaginal', 'C-Section', 'VBAC', 'Pending'];
const FEEDING_PLANS = ['Breastfeeding', 'Formula', 'Pumping', 'Mixed'];
const CARE_STATUSES = ['PENDING', 'ACTIVE', 'GRADUATED'];
const SERVICES_OPTIONS = [
  'Night Support', 'Lactation Counseling', 'Newborn Care',
  'Sibling Adaptation', 'Meal Prep', 'Light Housekeeping',
  'Postpartum Yoga', 'PPA/PPD Emotional Support', 'Sleep Training',
];

const quickActions = [
  { title: 'New Family', desc: 'Onboard a new client sanctuary', icon: 'person_add', bgColor: 'bg-primary dark:bg-primary', color: 'text-white dark:text-slate-950', shadow: 'shadow-primary/20' },
  { title: 'Schedule Visit', desc: 'Lock in a home visit date', icon: 'more_time', bgColor: 'bg-tertiary dark:bg-tertiary', color: 'text-white dark:text-slate-950', shadow: 'shadow-tertiary/20' },
  { title: 'Record Payment', desc: 'Track a client investment', icon: 'payments', bgColor: 'bg-secondary dark:bg-secondary', color: 'text-white dark:text-slate-950', shadow: 'shadow-secondary/20' },
];

const DAILY_WISDOM = [
  { quote: "The transition to parenthood is not a sprint, but a sacred unfolding. Rest is not a luxury — it is the foundation of their new world.", author: "Dr. Lillian Thorne", role: "Postpartum Expert" },
  { quote: "Every baby born brings a mother born too. Honor both.", author: "Barbara Katz Rothman", role: "Sociologist & Birth Advocate" },
  { quote: "A doula does not deliver babies. She delivers confidence, calm, and compassion.", author: "Penny Simkin", role: "Pioneer Doula" },
  { quote: "Birth is the epicenter of women's power.", author: "Ani DiFranco", role: "Artist & Mother" },
  { quote: "The way we are with each other is the truest test of what we believe.", author: "Parker J. Palmer", role: "Author & Educator" },
  { quote: "In giving birth to our babies, we may find that we give birth to new possibilities within ourselves.", author: "Myla Kabat-Zinn", role: "Mindfulness Author" },
  { quote: "Motherhood is the greatest thing and the hardest thing. You are doing both at once.", author: "Ricki Lake", role: "Birth Advocate" },
  { quote: "You can't pour from an empty cup. Take care of yourself first.", author: "Unknown Doula Wisdom", role: "Passed through generations" },
  { quote: "Birth is not only about making babies. Birth is about making mothers — strong, competent, capable mothers who trust themselves.", author: "Barbara Katz Rothman", role: "Birth Scholar" },
  { quote: "The most powerful thing a doula can do is listen without judgment and hold space without agenda.", author: "Dr. Lillian Thorne", role: "Postpartum Expert" },
  { quote: "Postpartum is forever. The love you give in the first weeks echoes through a lifetime.", author: "Suzanne Arms", role: "Birth Advocate" },
  { quote: "When a woman feels deeply supported in birth, she learns what she is capable of. That knowledge stays with her always.", author: "Ina May Gaskin", role: "Midwife & Author" },
  { quote: "Caring for mothers is one of the most profound acts of service on earth.", author: "Dr. Lillian Thorne", role: "Postpartum Expert" },
  { quote: "A newborn baby has only three demands: warmth, food, and the knowledge of its mother's presence.", author: "Grantly Dick-Read", role: "Obstetrician" },
];

export default function Dashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState([
    { label: 'Active Families', value: '0', icon: 'groups', color: 'text-primary', trend: '+2 this month', path: '/families' },
    { label: 'Visits This Week', value: '0', icon: 'calendar_month', color: 'text-tertiary', trend: 'Next: Tomorrow', path: '/visits' },
    { label: 'Pending Revenue', value: '$0', icon: 'account_balance_wallet', color: 'text-secondary', trend: '3 invoices', path: '/payments' },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [familiesList, setFamiliesList] = useState([]);
  const [upcomingVisits, setUpcomingVisits] = useState([]);
  const [recentNotes, setRecentNotes] = useState([]);
  
  // Modal states
  const [modalTarget, setModalTarget] = useState(null);
  const [formData, setFormData] = useState({
    status: 'PENDING',
    mother_name: '', partner_name: '', baby_name: '',
    phone: '', email: '', address: '',
    delivery_type: 'Vaginal',
    feeding_plan: 'Breastfeeding',
    duration_hours: '2',
    focus_area: 'General Postpartum'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
  
  // Photo states (for parity)
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoError, setPhotoError] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [selectedServices, setSelectedServices] = useState([]);

  // Add Note modal
  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [noteType, setNoteType] = useState(null); // 'general' | 'family'
  const [noteForm, setNoteForm] = useState({ content: '', family_id: '', type: 'General' });
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteError, setNoteError] = useState('');

  const NOTE_TYPES = ['General', 'Clinical', 'Emotional', 'Feeding', 'Sleep', 'Business'];

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!noteForm.content.trim()) { setNoteError('Please write something.'); return; }
    if (noteType === 'family' && !noteForm.family_id) { setNoteError('Please select a family.'); return; }
    setNoteSubmitting(true);
    setNoteError('');
    try {
      const { error } = await supabase.from('notes').insert([{
        content: noteForm.content,
        type: noteForm.type,
        user_id: user?.id,
        family_id: noteType === 'family' ? noteForm.family_id : null,
        is_pinned: false,
      }]);
      if (error) throw error;
      setAddNoteOpen(false);
      setNoteType(null);
      setNoteForm({ content: '', family_id: '', type: 'General' });
      router.push('/notes');
    } catch (err) {
      setNoteError(err.message || 'Failed to save note.');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [familiesRes, visitsRes, invoicesRes, notesRes] = await Promise.all([
        supabase.from('families').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
        supabase.from('visits').select('*, families(mother_name)').eq('user_id', user.id).order('scheduled_date', { ascending: true }),
        supabase.from('payments').select('*').eq('user_id', user.id),
        supabase.from('notes').select('*, families(mother_name)').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3)
      ]);
      
      const families = familiesRes.data || [];
      const visits = visitsRes.data || [];
      const invoices = invoicesRes.data || [];
      const notes = notesRes.data || [];

      setFamiliesList(families);
      setRecentNotes(notes);

      // Filter upcoming visits (including today)
      const now = new Date();
      const todayStart = new Date();
      todayStart.setHours(0,0,0,0);

      const upcoming = visits
        .filter(v => new Date(v.scheduled_date) >= todayStart)
        .slice(0, 3);
      setUpcomingVisits(upcoming);

      const activeFamilies = families.filter(f => f.status === 'ACTIVE').length;
      const weeklyVisits = visits.filter(v => {
        const d = new Date(v.scheduled_date);
        const startOfWeek = new Date();
        startOfWeek.setDate(now.getDate() - now.getDay());
        return d >= startOfWeek;
      }).length;

      const pendingValue = invoices
          .filter(inv => inv.status !== 'PAID' && inv.status !== 'CANCELLED')
          .reduce((sum, inv) => sum + parseFloat(inv.remaining_amount || 0), 0);

      setStats([
        { label: 'Active Families', value: activeFamilies.toString(), icon: 'groups', color: 'text-primary', trend: `${families.length} total`, path: '/families' },
        { label: 'Visits Scheduled', value: weeklyVisits.toString(), icon: 'calendar_month', color: 'text-tertiary', trend: `${upcoming.length} upcoming`, path: '/visits' },
        { label: 'Pending Revenue', value: `$${pendingValue.toLocaleString()}`, icon: 'account_balance_wallet', color: 'text-secondary', trend: `${invoices.filter(i => i.status !== 'PAID').length} invoices`, path: '/payments' },
      ]);
    } catch (e) {
      console.error(e);
      setApiError(e.message || 'Error updating family details.');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  const toggleService = (svc) => {
    setSelectedServices(prev =>
      prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]
    );
  };

  const addCustomService = () => {
    const trimmed = customServiceInput.trim();
    if (trimmed && !selectedServices.includes(trimmed)) {
      setSelectedServices(prev => [...prev, trimmed]);
      setCustomServiceInput('');
    }
  };

  const removeService = (svc) => {
    setSelectedServices(prev => prev.filter(s => s !== svc));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validation = validateImage(file);
    if (!validation.valid) {
      setPhotoError(validation.error);
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }
    setPhotoError('');
    setPhotoFile(file);
    setPhotoPreview(createPreviewUrl(file));
  };

  const removePhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setPhotoError('');
    const input = document.getElementById('photo-input');
    if (input) input.value = '';
  };

  const validateStep = (step) => {
    const errors = {};
    if (step === 1) {
      if (!formData.mother_name?.trim()) errors.mother_name = "Mother's name is required";
      else if (formData.mother_name.length < 2) errors.mother_name = "Name must be at least 2 characters";
    }
    if (step === 2) {
      if (!formData.birth_date?.trim()) {
        errors.birth_date = "Birth date is required to track recovery";
      } else {
        const birthDate = new Date(formData.birth_date);
        const today = new Date();
        if (birthDate > today) errors.birth_date = "Birth date cannot be in the future";
      }
    }
    if (step === 4) {
      if (!formData.delivery_type?.trim()) errors.delivery_type = "Required";
      if (!formData.feeding_plan?.trim()) errors.feeding_plan = "Required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.mother_name?.trim()) errors.mother_name = "Mother's name is required";
    if (!formData.birth_date?.trim()) errors.birth_date = "Birth date is required";
    if (!formData.delivery_type?.trim()) errors.delivery_type = "Required";
    if (!formData.feeding_plan?.trim()) errors.feeding_plan = "Required";
    setFormErrors(errors);
    return errors;
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setApiError('');
    
    try {
      if (modalTarget === 'New Family') {
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
          if (errors.mother_name) setFormStep(1);
          else if (errors.birth_date) setFormStep(2);
          else if (errors.delivery_type || errors.feeding_plan) setFormStep(4);
          setIsSubmitting(false);
          return;
        }

        const payload = {
          mother_name: formData.mother_name,
          partner_name: formData.partner_name,
          baby_name: formData.baby_name,
          phone: formData.phone,
          email: formData.email,
          address: formData.address,
          birth_date: formData.birth_date,
          delivery_type: formData.delivery_type,
          feeding_plan: formData.feeding_plan,
          status: formData.status,
          name: formData.mother_name,
          services_needed: selectedServices.join(', ')
        };

        const res = await fetch('/api/families', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-user-id': user?.id
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to create family');
        
        // Handle photo upload if exists (parity with families page)
        if (photoFile && data.family?.id) {
          const photoFormData = new FormData();
          photoFormData.append('photo', photoFile);
          await fetch(`/api/families/${data.family.id}/photo`, {
            method: 'POST',
            body: photoFormData,
            headers: { 'x-user-id': user?.id }
          });
        }
      } 
      else if (modalTarget === 'Schedule Visit') {
        const payload = {
          family_id: formData.family_id,
          scheduled_date: formData.scheduled_date,
          duration_hours: formData.duration_hours,
          focus_area: formData.focus_area
        };

        const { error } = await supabase.from('visits').insert([payload]);
        if (error) throw error;
      } 
      else if (modalTarget === 'Record Payment') {
        const payload = {
          family_id: formData.family_id,
          total_amount: parseFloat(formData.amount),
          remaining_amount: parseFloat(formData.amount) - parseFloat(formData.paid_amount || 0),
          paid_amount: parseFloat(formData.paid_amount || 0),
          status: parseFloat(formData.paid_amount || 0) >= parseFloat(formData.amount) ? 'PAID' : 'UNPAID',
          due_date: formData.due_date,
          service_name: formData.service_name
        };

        const { error } = await supabase.from('payments').insert([payload]);
        if (error) throw error;
      }

      // Success cleanup
      const actionTitle = modalTarget;
      setModalTarget(null);

      // Success Toast: Sanctuary Heartbeat
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          title: 'Action Successful', 
          message: `Your request for "${actionTitle}" has been archived in the sanctuary.` 
        } 
      }));
      setFormData({
        status: 'PENDING',
        mother_name: '', partner_name: '', baby_name: '',
        phone: '', email: '', address: '',
        delivery_type: 'Vaginal',
        feeding_plan: 'Breastfeeding',
        duration_hours: '2',
        focus_area: 'General Postpartum'
      });
      setSelectedServices([]);
      setFormStep(1);
      setFormErrors({});
      fetchData();
    } catch (error) {
      setApiError(error.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="space-y-6 md:space-y-10 lg:space-y-16 animate-in fade-in duration-700">
      {/* Hero Section: Responsive Architectural Variant */}
      <section className="
        relative overflow-hidden rounded-[2rem] md:rounded-[2.5rem] lg:rounded-[3rem] 
        bg-white dark:bg-slate-900 
        p-6 md:p-8 lg:p-12
        border border-slate-100 dark:border-white/5 shadow-2xl shadow-primary/5
      ">
        {/* Abstract Background Decor */}
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-primary/5 to-transparent pointer-events-none"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-tertiary/10 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          <div className="lg:col-span-7 text-center md:text-left">
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mb-6 lg:mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Practice Active
              </div>
              <div className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">calendar_today</span>
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </div>
              <div className="px-3 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                <span className="material-symbols-outlined text-xs">task_alt</span>
                {upcomingVisits.length} Visits This Week
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-7xl font-headline font-bold text-slate-900 dark:text-white mb-6 lg:mb-10 tracking-tight leading-[1.05]">
              {getGreeting()}, <br className="hidden lg:block"/>
              <span className="text-primary italic font-serif pr-2">{user?.name?.split(' ')[0] || 'Doula'}</span>
            </h1>

            <div className="flex flex-col md:flex-row items-center md:items-start gap-4">
              <p className="text-base lg:text-lg text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed">
                Your sanctuary is ready. {upcomingVisits.length > 0 ? (
                  <>You are supporting <span className="text-slate-900 dark:text-white font-bold">{upcomingVisits[0].families?.mother_name?.split(' ')[0] || 'your next client'}</span> today.</>
                ) : (
                  <>Your schedule is clear for reflection and rest today.</>
                )}
              </p>
            </div>
          </div>
          
          <div className="lg:col-span-5 relative">
            {upcomingVisits.length > 0 ? (
              <div className="relative group transition-all duration-500 hover:scale-[1.02]">
                <div className="absolute -inset-4 bg-gradient-to-tr from-primary/20 to-tertiary/20 rounded-[2.5rem] blur-2xl opacity-50 group-hover:opacity-80 transition-opacity"></div>
                <div className="relative bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-100 dark:border-white/10 shadow-xl overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-[10px] font-black uppercase tracking-[0.2em] text-primary bg-primary/10 px-3 py-1 rounded-full">Next Appointment</div>
                    <div className="text-xs font-bold text-slate-400">{new Date(upcomingVisits[0].scheduled_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-white shadow-lg shadow-primary/20">
                      <span className="material-symbols-outlined text-2xl">family_restroom</span>
                    </div>
                    <div>
                      <h4 className="text-xl font-bold text-slate-900 dark:text-white">
                        {upcomingVisits[0].families?.mother_name ? `Family ${upcomingVisits[0].families.mother_name.split(' ').pop()}` : 'Scheduled Visit'}
                      </h4>
                      <p className="text-xs text-slate-500 font-medium">{upcomingVisits[0].focus_area || 'Postpartum Support'}</p>
                    </div>
                  </div>

                  <button 
                    onClick={() => router.push('/visits')}
                    className="w-full py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary dark:hover:bg-primary dark:hover:text-white transition-all"
                  >
                    Manage Visit
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 dark:bg-white/5 border border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] p-10 text-center">
                <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <span className="material-symbols-outlined text-slate-300 text-3xl">event_busy</span>
                </div>
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">No more visits today</h4>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grid Strategy: Mobile (1), Tablet (2), Desktop (3) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
        {stats.map((stat, i) => (
          <div key={i} className="group p-5 md:p-6 lg:p-8 bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 dark:border-white/5 shadow-sm hover:shadow-xl transition-all duration-500">
            <div className="flex justify-between items-start mb-4 md:mb-6">
              <div className={`w-10 md:w-12 h-10 md:h-12 rounded-xl md:rounded-2xl ${stat.color.replace('text-', 'bg-')}/10 flex items-center justify-center ${stat.color}`}>
                <span className="material-symbols-outlined text-xl md:text-2xl">{stat.icon}</span>
              </div>
              <div className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label.split(' ')[1]} {stat.label.split(' ')[0]}</div>
            </div>
            <div className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-1 md:mb-2">{isLoading ? '...' : stat.value}</div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] md:text-xs font-bold text-slate-500">{stat.label}</div>
              <Link href={stat.path} className="text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest flex items-center gap-1 hover:underline">
                View <span className="material-symbols-outlined text-[10px] md:text-xs">arrow_forward</span>
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Reorganizing Sections for Tablet Efficiency */}
      <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        <section className="md:col-span-1 lg:col-span-2 bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] p-5 md:p-6 lg:p-8 border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined">calendar_today</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upcoming Visits</h3>
                <p className="text-xs text-slate-500 font-medium">You have {upcomingVisits.length} visits scheduled this week.</p>
              </div>
            </div>
            <Link href="/visits" className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:underline">
              Full Schedule <span className="material-symbols-outlined text-xs">arrow_forward</span>
            </Link>
          </div>
          
          <div className="space-y-2">
            {upcomingVisits.length > 0 ? upcomingVisits.map((visit, i) => (
              <div key={i} className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all group cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-white/5">
                <div className="flex items-center gap-4 md:gap-8 flex-1">
                  <div className="hidden sm:block w-20 md:w-24 text-[9px] md:text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 md:px-3 py-1 rounded-full text-center">
                    {new Date(visit.scheduled_date).toDateString() === new Date().toDateString() ? 'TODAY' : 'UPCOMING'}
                  </div>
                  <div className="flex-1 font-bold text-slate-700 dark:text-slate-300 text-sm md:text-base truncate">
                    {visit.families?.mother_name ? `Family ${visit.families.mother_name.split(' ').pop()}` : 'Family Registry'}
                  </div>
                  <div className="hidden md:block w-32 text-xs md:text-sm text-slate-500 font-medium">{new Date(visit.scheduled_date).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</div>
                  <div className="flex-1 text-xs md:text-sm text-slate-500 font-medium truncate">Postpartum Check-in</div>
                </div>
                <div className="flex items-center gap-2 md:gap-4 ml-4">
                  <div className="hidden xs:block text-[9px] md:text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-3 md:px-4 py-1 md:py-1.5 rounded-full">OK</div>
                  <span className="material-symbols-outlined text-slate-300 group-hover:text-primary transition-colors">chevron_right</span>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-slate-400 italic text-sm">No upcoming visits scheduled.</div>
            )}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] p-5 md:p-6 lg:p-8 border border-slate-100 dark:border-white/5 shadow-sm h-full">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">psychology</span>
              Quick Thoughts
            </h3>
            <Link href="/notes" className="text-[10px] font-black uppercase tracking-widest text-primary hover:underline">Notebook</Link>
          </div>
          <div className="space-y-4">
            {recentNotes.slice(0, 2).map((note, i) => (
              <div key={i} className="p-4 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-white/5 group hover:bg-white dark:hover:bg-slate-800 transition-all">
                <div className="text-[9px] font-black uppercase tracking-widest text-primary mb-2">Observation</div>
                <p className="text-xs md:text-sm text-slate-600 dark:text-slate-400 line-clamp-3 mb-3 leading-relaxed">{note.content}</p>
                <div className="text-[9px] font-bold text-slate-400">{new Date(note.created_at).toLocaleDateString()}</div>
              </div>
            ))}
          </div>
          
          {/* Wisdom Card: Daily Quote System */}
          {(() => {
            const dayOfYear = Math.floor((new Date() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
            const wisdom = DAILY_WISDOM[dayOfYear % DAILY_WISDOM.length];
            return (
              <div className="mt-8 relative p-6 rounded-[2rem] bg-baby-blue text-white overflow-hidden shadow-lg shadow-baby-blue/20">
                <div className="absolute top-3 right-4 opacity-10">
                  <span className="material-symbols-outlined text-6xl">format_quote</span>
                </div>
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full -translate-x-10 translate-y-10" />
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="material-symbols-outlined text-sm text-white/60">calendar_today</span>
                    <h4 className="text-[9px] font-black uppercase tracking-widest opacity-60">Wisdom of the Day</h4>
                  </div>
                  <p className="italic text-sm font-headline leading-relaxed mb-5">
                    &ldquo;{wisdom.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white">
                      <span className="material-symbols-outlined text-base">person</span>
                    </div>
                    <div>
                      <div className="font-black text-[11px]">{wisdom.author}</div>
                      <div className="text-[9px] opacity-60">{wisdom.role}</div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </section>
      </div>
      
      {/* Quick Actions: Horizontal Rail */}
      <section className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2rem] lg:rounded-[2.5rem] p-6 md:p-8 border border-slate-100 dark:border-white/5 shadow-sm">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500 mb-10 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm text-primary">bolt</span>
          Quick Actions
        </h3>
        <div className="flex justify-around items-center">
          {[
            { label: 'Add Family', icon: 'group_add', color: 'bg-primary/10 text-primary', action: 'New Family' },
            { label: 'Schedule Visit', icon: 'calendar_add_on', color: 'bg-primary/10 text-primary', action: 'Schedule Visit' },
            { label: 'Add Note', icon: 'edit_note', color: 'bg-primary/10 text-primary', action: 'Add Note' },
            { label: 'Record Payment', icon: 'payments', color: 'bg-primary/10 text-primary', action: 'Record Payment' },
          ].map((act, i) => (
            <button 
              key={i} 
              onClick={() => act.action === 'Add Note' ? setAddNoteOpen(true) : setModalTarget(act.action)}
              className="flex flex-col items-center gap-4 lg:gap-5 group transition-all"
            >
              <div className={`w-14 h-14 lg:w-20 lg:h-20 rounded-2xl lg:rounded-3xl ${act.color} flex items-center justify-center shadow-sm group-hover:scale-110 group-active:scale-95 transition-all duration-300`}>
                <span className="material-symbols-outlined text-2xl lg:text-4xl">{act.icon}</span>
              </div>
              <div className="text-[10px] lg:text-xs font-bold text-slate-500 dark:text-slate-400 group-hover:text-primary transition-colors">{act.label}</div>
              <span className="material-symbols-outlined text-primary/30 text-sm opacity-0 group-hover:opacity-100 transition-opacity">arrow_downward</span>
            </button>
          ))}
        </div>
      </section>

      {/* Bottom Reminder Banner */}
      <section className="bg-sky-50 dark:bg-sky-900/20 rounded-[2.5rem] p-6 flex items-center justify-between border border-sky-100 dark:border-sky-500/10">
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 flex items-center justify-center text-sky-500 shadow-sm">
            <span className="material-symbols-outlined">notifications</span>
          </div>
          <div>
            <h4 className="font-bold text-slate-900 dark:text-white">Self-care reminder</h4>
            <p className="text-sm text-slate-500 font-medium">You can't pour from an empty cup. Take time for yourself today.</p>
          </div>
        </div>
        <button className="px-6 py-2.5 bg-sky-500 text-white rounded-full font-bold text-sm flex items-center gap-2 hover:bg-sky-600 transition-all shadow-lg shadow-sky-500/20">
          Take a breath <span className="material-symbols-outlined text-sm">favorite</span>
        </button>
      </section>

      {/* ── Add Note Modal ── */}
      <Modal isOpen={addNoteOpen} onClose={() => { setAddNoteOpen(false); setNoteType(null); setNoteForm({ content: '', family_id: '', type: 'General' }); setNoteError(''); }} title="Add a Note">
        <div className="space-y-6 p-1">

          {/* Step 1 — pick type */}
          {!noteType && (
            <div className="space-y-4">
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Choose the type of note you want to create:</p>
              <div className="grid grid-cols-2 gap-4">
                {/* General Note */}
                <button
                  onClick={() => setNoteType('general')}
                  className="group flex flex-col items-center gap-4 p-6 rounded-[1.5rem] border-2 border-slate-100 dark:border-white/10 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/5 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-emerald-500">edit_note</span>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-900 dark:text-white text-sm">General Note</p>
                    <p className="text-[11px] text-slate-500 mt-1">Standalone thought or observation</p>
                  </div>
                </button>

                {/* Family Note */}
                <button
                  onClick={() => setNoteType('family')}
                  className="group flex flex-col items-center gap-4 p-6 rounded-[1.5rem] border-2 border-slate-100 dark:border-white/10 hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/5 transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-2xl bg-indigo-100 dark:bg-indigo-500/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-3xl text-indigo-500">family_restroom</span>
                  </div>
                  <div className="text-center">
                    <p className="font-black text-slate-900 dark:text-white text-sm">Family Note</p>
                    <p className="text-[11px] text-slate-500 mt-1">Linked to a specific family</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Step 2 — write the note */}
          {noteType && (
            <form onSubmit={handleAddNote} className="space-y-5">
              {/* Back button */}
              <button type="button" onClick={() => { setNoteType(null); setNoteError(''); }} className="flex items-center gap-1 text-[11px] font-black uppercase tracking-widest text-slate-400 hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-sm">arrow_back</span> Back
              </button>

              {/* Family picker — only for family notes */}
              {noteType === 'family' && (
                <div>
                  <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Select Family</label>
                  <select
                    value={noteForm.family_id}
                    onChange={e => setNoteForm({ ...noteForm, family_id: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none"
                    required
                  >
                    <option value="">Choose a family…</option>
                    {familiesList.map(f => (
                      <option key={f.id} value={f.id}>{f.mother_name}{f.partner_name ? ` & ${f.partner_name}` : ''}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Note type */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Category</label>
                <div className="flex flex-wrap gap-2">
                  {NOTE_TYPES.map(t => (
                    <button
                      type="button"
                      key={t}
                      onClick={() => setNoteForm({ ...noteForm, type: t })}
                      className={`px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest transition-all ${
                        noteForm.type === t ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'bg-slate-100 dark:bg-white/5 text-slate-500 hover:bg-primary/10 hover:text-primary'
                      }`}
                    >{t}</button>
                  ))}
                </div>
              </div>

              {/* Content */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2">Note Content</label>
                <textarea
                  rows={5}
                  placeholder={noteType === 'family' ? 'Write your clinical observation…' : 'Write your thought or idea…'}
                  className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none"
                  value={noteForm.content}
                  onChange={e => setNoteForm({ ...noteForm, content: e.target.value })}
                  required
                />
              </div>

              {noteError && <p className="text-xs text-rose-500 font-bold">{noteError}</p>}

              <button
                type="submit"
                disabled={noteSubmitting}
                className="w-full py-4 bg-primary text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-2"
              >
                {noteSubmitting ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">save</span>}
                {noteSubmitting ? 'Saving…' : 'Save Note'}
              </button>
            </form>
          )}
        </div>
      </Modal>

      <Modal isOpen={!!modalTarget} onClose={() => { setModalTarget(null); setFormData({ status: 'PENDING', mother_name: '', partner_name: '', baby_name: '', phone: '', email: '', address: '', delivery_type: 'Vaginal', feeding_plan: 'Breastfeeding', duration_hours: '2', focus_area: 'General Postpartum' }); setSelectedServices([]); setFormStep(1); setFormErrors({}); setApiError(''); }} title={modalTarget === 'New Family' ? 'New Family Profile' : modalTarget}>
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[85vh] overflow-y-auto no-scrollbar pr-1">
          {/* API Error Alert */}
          {apiError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl p-4 flex gap-3 items-start">
              <div className="flex-shrink-0 flex items-center justify-center w-6 h-6 rounded-full bg-red-200 dark:bg-red-800/50">
                <span className="text-red-600 dark:text-red-400 font-bold text-lg">!</span>
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-700 dark:text-red-300">Error</p>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{apiError}</p>
              </div>
              <button
                type="button"
                onClick={() => setApiError('')}
                className="flex-shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-300"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {modalTarget === 'New Family' && (
            <div className="space-y-5">
              {/* Progress Indicator */}
              <div className="flex gap-2 mb-8 px-1">
                {[1, 2, 3, 4, 5, 6].map(s => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= formStep ? 'bg-baby-blue dark:bg-sky-500 shadow-[0_0_8px_rgba(137,207,240,0.5)]' : 'bg-slate-200 dark:bg-white/5'}`} />
                ))}
              </div>

              {/* Validation Errors Summary */}
              {Object.keys(formErrors).length > 0 && (
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300 mb-2">Please fix the following errors:</p>
                  <ul className="space-y-1">
                    {Object.entries(formErrors).map(([field, error]) => (
                      <li key={field} className="text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                        <span className="text-lg leading-none">•</span>
                        <span>{error}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* —— STEP 1: IDENTITY —— */}
              <div className={formStep !== 1 ? 'hidden' : 'block'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Mother's Name *</label>
                    <input 
                      type="text"
                      className={`w-full p-3 rounded-xl border transition-all bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:outline-none ${formErrors.mother_name ? 'border-red-500 dark:border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-white/10 focus:ring-baby-blue dark:focus:ring-sky-500'}`}
                      value={formData.mother_name || ''} 
                      onChange={e => setFormData({...formData, mother_name: e.target.value})} 
                      placeholder="e.g. Sarah Jenkins" 
                    />
                    {formErrors.mother_name && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{formErrors.mother_name}</p>}
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Partner's Name</label>
                    <input 
                      type="text"
                      className={`w-full p-3 rounded-xl border transition-all bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:outline-none ${formErrors.partner_name ? 'border-red-500 dark:border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-white/10 focus:ring-baby-blue dark:focus:ring-sky-500'}`}
                      value={formData.partner_name || ''} 
                      onChange={e => setFormData({...formData, partner_name: e.target.value})} 
                      placeholder="Optional" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Phone Number</label>
                    <input 
                      type="tel" 
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-baby-blue dark:focus:ring-sky-500 focus:outline-none transition-all" 
                      value={formData.phone || ''} 
                      onChange={e => setFormData({...formData, phone: e.target.value})} 
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Email Address</label>
                    <input 
                      type="email" 
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-baby-blue dark:focus:ring-sky-500 focus:outline-none transition-all" 
                      value={formData.email || ''} 
                      onChange={e => setFormData({...formData, email: e.target.value})} 
                      placeholder="sarah@example.com"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Home Address</label>
                  <textarea 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-baby-blue dark:focus:ring-sky-500 focus:outline-none transition-all min-h-[80px]" 
                    value={formData.address || ''} 
                    onChange={e => setFormData({...formData, address: e.target.value})} 
                    placeholder="123 Sanctuary Way, Peace City..."
                  />
                </div>
                
                <div className="mt-4">
                  <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Baby's Name</label>
                  <input 
                    type="text"
                    className={`w-full p-3 rounded-xl border transition-all bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:outline-none ${formErrors.baby_name ? 'border-red-500 dark:border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-white/10 focus:ring-baby-blue dark:focus:ring-sky-500'}`}
                    value={formData.baby_name || ''} 
                    onChange={e => setFormData({...formData, baby_name: e.target.value})} 
                    placeholder="Optional / Pending" 
                  />
                </div>

                <button type="button" onClick={() => validateStep(1) && setFormStep(2)} className="w-full mt-8 py-4 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                  Continue <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>

              {/* —— STEP 2: TIMING —— */}
              <div className={formStep !== 2 ? 'hidden' : 'block mt-6'}>
                <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Birth Date</label>
                <input 
                  type="date" 
                  className={`w-full p-3 rounded-xl border transition-all bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:outline-none ${formErrors.birth_date ? 'border-red-500 dark:border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-white/10 focus:ring-baby-blue dark:focus:ring-sky-500'}`}
                  value={formData.birth_date || ''} 
                  onChange={e => setFormData({...formData, birth_date: e.target.value})} 
                />
                {formErrors.birth_date && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{formErrors.birth_date}</p>}

                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={() => setFormStep(1)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold rounded-2xl">Back</button>
                  <button type="button" onClick={() => validateStep(2) && setFormStep(3)} className="flex-[2] py-4 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-bold rounded-2xl shadow-lg">Confirm Date</button>
                </div>
              </div>

              {/* —— STEP 3: PHOTO —— */}
              <div className={formStep !== 3 ? 'hidden' : 'block mt-8'}>
                <label className="block text-xs mb-2 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Profile Photo</label>
                
                {photoPreview ? (
                  <div className="mb-4 relative inline-block text-center w-full">
                    <img src={photoPreview} alt="Preview" className="h-40 w-40 rounded-2xl object-cover border-4 border-baby-blue dark:border-sky-500 shadow-xl mx-auto" />
                    <button type="button" onClick={removePhoto} className="absolute top-0 right-1/2 translate-x-24 p-2 bg-red-500 text-white rounded-full shadow-lg"><X className="w-5 h-5" /></button>
                  </div>
                ) : (
                  <label className="block p-10 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl hover:border-baby-blue dark:hover:border-sky-500 transition-all cursor-pointer bg-slate-50/50 dark:bg-white/5 text-center">
                    <input id="photo-input" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                    <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Upload Photo</p>
                    <p className="text-[10px] text-slate-500 mt-1 uppercase">Max 5MB • JPG, PNG, WebP</p>
                  </label>
                )}

                <div className="flex flex-col gap-3 mt-8">
                  <button type="button" onClick={() => setFormStep(4)} className="w-full py-4 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-bold rounded-2xl shadow-lg">Continue</button>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setFormStep(2)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold rounded-2xl text-sm">Back</button>
                    <button type="button" onClick={() => { removePhoto(); setFormStep(4); }} className="flex-1 py-4 text-slate-500 dark:text-slate-400 font-bold text-sm">Skip for now</button>
                  </div>
                </div>
              </div>

              {/* —— STEP 4: CLINICAL —— */}
              <div className={formStep !== 4 ? 'hidden' : 'block mt-6'}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Delivery Type</label>
                    <select 
                      className={`w-full p-3 rounded-xl border transition-all bg-surface dark:bg-[#0f172a] dark:text-white text-sm focus:ring-2 focus:outline-none ${formErrors.delivery_type ? 'border-red-500 dark:border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-white/10 focus:ring-baby-blue dark:focus:ring-sky-500'}`}
                      value={formData.delivery_type} 
                      onChange={e => setFormData({...formData, delivery_type: e.target.value})}
                    >
                      {DELIVERY_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Feeding Plan</label>
                    <select 
                      className={`w-full p-3 rounded-xl border transition-all bg-surface dark:bg-[#0f172a] dark:text-white text-sm focus:ring-2 focus:outline-none ${formErrors.feeding_plan ? 'border-red-500 dark:border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-white/10 focus:ring-baby-blue dark:focus:ring-sky-500'}`}
                      value={formData.feeding_plan} 
                      onChange={e => setFormData({...formData, feeding_plan: e.target.value})}
                    >
                      {FEEDING_PLANS.map(f => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={() => setFormStep(3)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold rounded-2xl">Back</button>
                  <button type="button" onClick={() => validateStep(4) && setFormStep(5)} className="flex-[2] py-4 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-bold rounded-2xl shadow-lg">Next Step</button>
                </div>
              </div>

              {/* —— STEP 5: ADMINISTRATIVE —— */}
              <div className={formStep !== 5 ? 'hidden' : 'block mt-6'}>
                <div>
                  <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Care Status</label>
                  <select 
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-[#0f172a] dark:text-white text-sm focus:ring-2 focus:ring-baby-blue dark:focus:ring-sky-500 focus:outline-none transition-all" 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value})}
                  >
                    {CARE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={() => setFormStep(4)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold rounded-2xl">Back</button>
                  <button type="button" onClick={() => setFormStep(6)} className="flex-[2] py-4 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-bold rounded-2xl shadow-lg">Save & Next</button>
                </div>
              </div>

              {/* —— STEP 6: SERVICES —— */}
              <div className={formStep !== 6 ? 'hidden' : 'block mt-6'}>
                <label className="block text-xs mb-2 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Services Needed</label>
                
                {/* Predefined Services */}
                <div className="mb-4">
                  <p className="text-xs text-on-surface-variant dark:text-slate-500 mb-2 font-semibold">Quick Select:</p>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES_OPTIONS.map(svc => (
                      <button type="button" key={svc} onClick={() => toggleService(svc)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedServices.includes(svc) ? 'bg-baby-blue dark:bg-sky-500 text-white border-baby-blue dark:border-sky-500' : 'border-slate-300 dark:border-white/10 text-on-surface-variant dark:text-slate-400 hover:border-baby-blue hover:text-baby-blue dark:hover:border-sky-500 dark:hover:text-sky-400'}`}>
                        {svc}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom Service Input */}
                <div className="mb-3">
                  <p className="text-xs text-on-surface-variant dark:text-slate-500 mb-2 font-semibold">Add Custom Service:</p>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={customServiceInput}
                      onChange={(e) => setCustomServiceInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addCustomService();
                        }
                      }}
                      placeholder="e.g. Mental Health..."
                      className="flex-1 p-2.5 rounded-lg border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-baby-blue dark:focus:ring-sky-500 focus:outline-none transition-all"
                    />
                    <button 
                      type="button"
                      onClick={addCustomService}
                      className="px-4 py-2.5 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-bold rounded-lg hover:opacity-90 transition-all text-sm"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Selected Services Display */}
                {selectedServices.length > 0 && (
                  <div>
                    <p className="text-xs text-on-surface-variant dark:text-slate-500 mb-2 font-semibold">Selected ({selectedServices.length}):</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedServices.map(svc => (
                        <div 
                          key={svc} 
                          className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-baby-blue/10 text-baby-blue border border-baby-blue/20"
                        >
                          <span>{svc}</span>
                          <button
                            type="button"
                            onClick={() => removeService(svc)}
                            className="ml-1 hover:opacity-70 transition-opacity text-sm"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-3 mt-8">
                  <button type="button" onClick={() => setFormStep(5)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold rounded-2xl">Back</button>
                  <button type="submit" disabled={isSubmitting} className="flex-[2] py-4 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-bold rounded-2xl shadow-xl active:scale-95 transition-all flex justify-center items-center gap-3">
                    {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Complete Setup'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* —— SCHEDULE NEW VISIT (FULL PARITY) —— */}
          {modalTarget === 'Schedule Visit' && (
            <div className="space-y-6">
              <div className="flex gap-2 mb-6">
                {[1, 2].map(s => (
                  <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${formStep >= s ? 'bg-tertiary' : 'bg-outline-variant/30'}`}></div>
                ))}
              </div>

              {formStep === 1 && (
                <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Select Family</label>
                      <div className="relative text-tertiary">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2">group</span>
                        <select 
                          required 
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-outline-variant/30 bg-surface dark:bg-white/5 text-sm font-bold focus:ring-2 focus:ring-tertiary focus:outline-none transition-all appearance-none"
                          value={formData.family_id || ''}
                          onChange={e => setFormData({...formData, family_id: e.target.value})}
                        >
                          <option value="">Select a family</option>
                          {familiesList.map(f => (
                            <option key={f.id} value={f.id}>{f.mother_name || f.name}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Arrival Time</label>
                      <div className="relative text-tertiary">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2">calendar_today</span>
                        <input 
                          type="datetime-local" required 
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-outline-variant/30 bg-surface dark:bg-white/5 text-sm font-bold focus:ring-2 focus:ring-tertiary focus:outline-none transition-all"
                          value={formData.scheduled_date || ''}
                          onChange={e => setFormData({...formData, scheduled_date: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Visit Duration</label>
                      <div className="relative text-tertiary">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2">schedule</span>
                        <select 
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-outline-variant/30 bg-surface dark:bg-white/5 text-sm font-bold focus:ring-2 focus:ring-tertiary focus:outline-none transition-all appearance-none"
                          value={formData.duration_hours}
                          onChange={e => setFormData({...formData, duration_hours: e.target.value})}
                        >
                          {['1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '8'].map(h => <option key={h} value={h}>{h} Hours</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (formData.family_id && formData.scheduled_date) {
                        setFormStep(2);
                        setApiError('');
                      } else {
                        setApiError('Please select a family and arrival time to continue.');
                      }
                    }}
                    className="w-full py-5 bg-tertiary text-on-tertiary font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl active:scale-95 transition-transform disabled:opacity-50"
                    disabled={!formData.family_id || !formData.scheduled_date}
                  >
                    Next: Care Focus <span className="material-symbols-outlined text-sm ml-2">arrow_forward</span>
                  </button>
                </div>
              )}

              {formStep === 2 && (
                <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Primary Care Focus</label>
                    <div className="grid grid-cols-1 gap-2">
                      {['General Postpartum', 'Lactation Support', 'Newborn Sleep Training', 'C-Section Recovery', 'PPA/PPD Emotional Support', 'Sibling Adaptation'].map(area => (
                        <button 
                          type="button" key={area} 
                          onClick={() => setFormData({...formData, focus_area: area})}
                          className={`px-4 py-4 rounded-2xl text-xs font-bold border transition-all text-left flex items-center justify-between ${formData.focus_area === area ? 'bg-tertiary text-on-tertiary border-transparent shadow-lg shadow-tertiary/20' : 'border-outline-variant/30 text-slate-500 hover:border-tertiary/30'}`}
                        >
                          {area}
                          {formData.focus_area === area && <span className="material-symbols-outlined text-sm">check_circle</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setFormStep(1)} className="flex-1 py-5 bg-surface-container text-on-surface-variant font-bold rounded-full text-xs uppercase tracking-widest border border-outline-variant/30">Back</button>
                    <button type="submit" disabled={isSubmitting} className="flex-[2] py-5 bg-tertiary text-on-tertiary font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl active:scale-95 transition-transform">
                      {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Lock in Schedule'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* —— RECORD PAYMENT (FULL PARITY) —— */}
          {modalTarget === 'Record Payment' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Client Selection</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-sky-400">person</span>
                  <select 
                    required 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-outline-variant/30 bg-surface dark:bg-white/5 text-sm font-bold focus:ring-2 focus:ring-sky-500/50 outline-none appearance-none"
                    value={formData.family_id || ''}
                    onChange={e => setFormData({...formData, family_id: e.target.value})}
                  >
                    <option value="">Select a family</option>
                    {familiesList.map(f => <option key={f.id} value={f.id}>{f.mother_name || f.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Service / Package Name</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-sky-400">package_2</span>
                  <input 
                    type="text" required 
                    placeholder="e.g. Full Postpartum Support Package"
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-outline-variant/30 bg-surface dark:bg-white/5 text-sm font-bold focus:ring-2 focus:ring-sky-500/50 outline-none"
                    value={formData.service_name || ''}
                    onChange={e => setFormData({...formData, service_name: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Total Amount ($)</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-sky-400">attach_money</span>
                    <input 
                      type="number" required placeholder="0.00"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-outline-variant/30 bg-surface dark:bg-white/5 text-sm font-bold focus:ring-2 focus:ring-sky-500/50 outline-none"
                      value={formData.amount || ''}
                      onChange={e => setFormData({...formData, amount: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Initial Paid ($)</label>
                  <div className="relative">
                    <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-sky-400">account_balance_wallet</span>
                    <input 
                      type="number" placeholder="0.00"
                      className="w-full pl-12 pr-4 py-4 rounded-2xl border border-outline-variant/30 bg-surface dark:bg-white/5 text-sm font-bold focus:ring-2 focus:ring-sky-500/50 outline-none"
                      value={formData.paid_amount || ''}
                      onChange={e => setFormData({...formData, paid_amount: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Due Date</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-sky-400">event</span>
                  <input 
                    type="date" required 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-outline-variant/30 bg-surface dark:bg-white/5 text-sm font-bold focus:ring-2 focus:ring-sky-500/50 outline-none"
                    value={formData.due_date || ''}
                    onChange={e => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-6">
                <button 
                  type="submit" disabled={isSubmitting}
                  className="w-full py-5 bg-secondary text-on-secondary font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-secondary/20 active:scale-95 transition-all disabled:opacity-50 flex justify-center items-center gap-3"
                >
                  {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : (
                    <>
                      <span className="material-symbols-outlined text-sm">verified</span>
                      Finalize Payment Record
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

        </form>
      </Modal>
    </div>
  );
}
