'use client';

import React, { useState, useEffect, use, useMemo } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const DELIVERY_TYPES = ['Vaginal', 'C-Section', 'VBAC', 'Pending'];
const FEEDING_PLANS = ['Breastfeeding', 'Formula', 'Pumping', 'Mixed'];
const CARE_STATUSES = ['PENDING', 'ACTIVE', 'GRADUATED'];
const SERVICES_OPTIONS = [
  'Night Support', 'Lactation Counseling', 'Newborn Care',
  'Sibling Adaptation', 'Meal Prep', 'Light Housekeeping',
  'Postpartum Yoga', 'PPA/PPD Emotional Support', 'Sleep Training',
];
const FOCUS_AREAS = [
  'General Postpartum', 'Lactation Support', 'Newborn Sleep Training',
  'C-Section Recovery', 'PPA/PPD Emotional Support', 'Sibling Adaptation',
];
const NOTE_TYPES = ['General', 'Clinical', 'Emotional', 'Feeding Log', 'Sleep Log', 'PPA/PPD Flag'];
const MOOD_OPTIONS = [
  { value: 'happy', label: 'Radiant', color: 'sky' },
  { value: 'neutral', label: 'Balanced', color: 'sky' },
  { value: 'low', label: 'Resting', color: 'sky' },
];
const BABY_FEEDING_TYPES = ['breastfeeding', 'formula', 'mixed'];

const MOOD_LABELS = { happy: 'Radiant', neutral: 'Balanced', low: 'Resting' };
const MOOD_COLORS = { happy: 'text-cyan-400', neutral: 'text-sky-400', low: 'text-slate-400' };
const MOOD_BG_COLORS = { happy: 'bg-cyan-500', neutral: 'bg-sky-500', low: 'bg-slate-500' };

const PAYMENT_STATUS_COLORS = {
  PAID: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  PARTIAL: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  OVERDUE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  UNPAID: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
};

function analyzeRecoveryLogs(logs) {
  const alerts = [];
  
  if (!logs || logs.length === 0) {
    return { alerts: [], latestLog: null };
  }
  
  const sortedLogs = [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  const latestLog = sortedLogs[0];
  
  if (latestLog.sleep_hours !== null && latestLog.sleep_hours < 4) {
    alerts.push({ type: 'critical', message: 'Mother getting less than 4 hours of sleep', priority: 'high' });
  } else if (latestLog.sleep_hours !== null && latestLog.sleep_hours < 6) {
    alerts.push({ type: 'warning', message: 'Sleep below recommended levels', priority: 'medium' });
  }
  
  if (latestLog.pain_level !== null && latestLog.pain_level >= 7) {
    alerts.push({ type: 'critical', message: `High pain level: ${latestLog.pain_level}/10`, priority: 'high' });
  } else if (latestLog.pain_level !== null && latestLog.pain_level >= 5) {
    alerts.push({ type: 'warning', message: `Moderate pain level: ${latestLog.pain_level}/10`, priority: 'medium' });
  }
  
  if (latestLog.mood === 'low') {
    const consecutiveLowLogs = [];
    for (let i = 0; i < sortedLogs.length; i++) {
      if (sortedLogs[i].mood === 'low') {
        consecutiveLowLogs.push(sortedLogs[i]);
      } else {
        break;
      }
    }
    if (consecutiveLowLogs.length >= 2) {
      alerts.push({ type: 'critical', message: `${consecutiveLowLogs.length} consecutive days with low mood`, priority: 'high' });
    }
  }
  
  if (latestLog.baby_sleep_hours !== null && latestLog.baby_sleep_hours < 10) {
    alerts.push({ type: 'warning', message: `Baby sleep: ${latestLog.baby_sleep_hours} hours (below 10)`, priority: 'medium' });
  }
  
  if (latestLog.baby_diapers !== null && latestLog.baby_diapers < 4) {
    alerts.push({ type: 'warning', message: `Diaper count: ${latestLog.baby_diapers} (below 4)`, priority: 'medium' });
  }
  
  if (latestLog.baby_feeding_issues && latestLog.baby_feeding_issues.trim()) {
    alerts.push({ type: 'warning', message: 'Feeding issue reported', priority: 'medium' });
  }
  
  return { alerts, latestLog };
}

function statusStyle(s) {
  if (s === 'ACTIVE') return 'bg-primary dark:bg-sky-500 text-on-primary dark:text-slate-950';
  if (s === 'GRADUATED') return 'bg-secondary text-on-secondary';
  return 'bg-amber-500 text-white';
}

export default function FamilyProfile({ params }) {
  const { id } = use(params);
  const { user } = useAuth();

  const [family, setFamily] = useState(null);
  const [visits, setVisits] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [notes, setNotes] = useState([]);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Unified confirmation state
  const [confirmConfig, setConfirmConfig] = useState({ 
    open: false, 
    type: null, 
    id: null, 
    title: '', 
    message: '',
    confirmText: 'Delete',
    icon: 'delete'
  });

  // Edit modal
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({});
  const [selectedServices, setSelectedServices] = useState([]);
  const [isSaving, setIsSaving] = useState(false);

  // Quick-add modals
  const [visitModalOpen, setVisitModalOpen] = useState(false);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [invoiceModalOpen, setInvoiceModalOpen] = useState(false);
  const [recoveryModalOpen, setRecoveryModalOpen] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [activeLines, setActiveLines] = useState({ momSleep: true, babySleep: true, mood: true });

  const [visitForm, setVisitForm] = useState({ family_id: id, scheduled_date: '', duration_hours: '2', focus_area: 'General Postpartum', status: 'SCHEDULED', notes: '' });
  const [editingVisitId, setEditingVisitId] = useState(null);
  const [visitStep, setVisitStep] = useState(1);
  const [recoveryStep, setRecoveryStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [noteForm, setNoteForm] = useState({ family_id: id, type: 'General', content: '', is_flagged: false });
  const [paymentForm, setPaymentForm] = useState({ family_id: id, service_name: '', total_amount: '', paid_amount: '', due_date: '', status: 'UNPAID' });
  const [invoiceForm, setInvoiceForm] = useState({ family_id: id, amount: '', description: '', due_date: '', status: 'PENDING' });
  const [recoveryForm, setRecoveryForm] = useState({
    family_id: id,
    date: new Date().toISOString().split('T')[0],
    mood: '',
    sleep_hours: '',
    pain_level: 0,
    baby_feeding_type: 'breastfeeding',
    baby_feeding_issues: '',
    baby_sleep_hours: '',
    notes: '',
  });
  const [recoveryLogs, setRecoveryLogs] = useState([]);
  const [profile, setProfile] = useState(null);
  const [isPosting, setIsPosting] = useState(false);
  const [editingLogId, setEditingLogId] = useState(null);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [historySearch, setHistorySearch] = useState('');

  // Photo upload state
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoError, setPhotoError] = useState('');
  const [apiError, setApiError] = useState('');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportNote, setReportNote] = useState('');

  // Payment management state
  const [editingPayment, setEditingPayment] = useState(null);
  const [paymentLogModalOpen, setPaymentLogModalOpen] = useState(false);
  const [paymentLogForm, setPaymentLogForm] = useState({ amount: '', note: '', created_at: new Date().toISOString().split('T')[0] });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentLogs, setPaymentLogs] = useState([]);
  const [paymentHistoryModalOpen, setPaymentHistoryModalOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedClient, setCelebratedClient] = useState('');

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (user) {
      loadAll();
      fetchProfile();
    }
  }, [id, user]);

  const fetchProfile = async () => {
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();
    if (data) setProfile(data);
  };

  const loadAll = async () => {
    setIsLoading(true);
    try {
      const [famRes, visRes, invRes, notRes, recRes, payRes] = await Promise.all([
        supabase.from('families').select('*').eq('id', id).single(),
        supabase.from('visits').select('*').eq('family_id', id),
        supabase.from('invoices').select('*').eq('family_id', id),
        supabase.from('notes').select('*').eq('family_id', id),
        supabase.from('recovery_logs').select('*').eq('family_id', id).order('date', { ascending: false }),
        supabase.from('payments').select('*').eq('family_id', id).order('created_at', { ascending: false }),
      ]);
      
      if (famRes.data) setFamily(famRes.data);
      setVisits(visRes.data || []);
      setInvoices(invRes.data || []);
      setNotes(notRes.data || []);
      setRecoveryLogs(recRes.data || []);
      
      // Process payments with status logic
      if (payRes.data) {
        const today = new Date().toISOString().split('T')[0];
        const updated = payRes.data.map(p => {
          if (p.status === 'CANCELLED') return p;
          let status = p.status;
          if (p.remaining_amount > 0 && p.due_date && p.due_date < today) {
            status = 'OVERDUE';
          } else if (p.remaining_amount === 0) {
            status = 'PAID';
          } else if (p.paid_amount > 0) {
            status = 'PARTIAL';
          } else {
            status = 'UNPAID';
          }
          return { ...p, status };
        });
        setPayments(updated);
      } else {
        setPayments([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Recovery Analytics Logic
  const recoveryAnalytics = useMemo(() => {
    // 1. Sort logs chronologically
    const sortedLogs = [...recoveryLogs].sort((a, b) => new Date(a.date) - new Date(b.date));

    // 2. Group logs by date — average numeric fields, use most recent mood/notes
    const grouped = {};
    const moodScale = { happy: 3, neutral: 2, low: 1 };
    sortedLogs.forEach(log => {
      const key = log.date; // 'YYYY-MM-DD'
      if (!grouped[key]) {
        grouped[key] = { logs: [] };
      }
      grouped[key].logs.push(log);
    });

    const avg = (arr, fn) => {
      const vals = arr.map(fn).filter(v => v !== null && v !== undefined && !isNaN(v));
      return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
    };

    // Build one aggregated point per day
    const data = Object.entries(grouped).map(([dateKey, { logs }]) => {
      const d = new Date(dateKey);
      // Use most recent log's mood and notes (last in sorted order)
      const latest = logs[logs.length - 1];
      const avgMoodScore = avg(logs, l => moodScale[l.mood] || 0);
      const roundedMood = Math.round(avgMoodScore);
      const moodLabel = roundedMood === 3 ? 'Radiant' : roundedMood === 2 ? 'Balanced' : 'Resting';

      return {
        id: latest.id,
        date: dateKey,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        dayLetter: d.toLocaleDateString('en-US', { weekday: 'short' }).charAt(0),
        momSleep: parseFloat(avg(logs, l => parseFloat(l.sleep_hours || 0)).toFixed(1)),
        babySleep: parseFloat(avg(logs, l => parseFloat(l.baby_sleep_hours || 0)).toFixed(1)),
        momMood: avgMoodScore,
        moodLabel,
        babyFeedingType: latest.baby_feeding_type,
        babyDiapers: Math.round(avg(logs, l => l.baby_diapers || 0)),
        notes: latest.notes,
        logCount: logs.length, // track how many were merged
        hasLog: true
      };
    });

    // 3. Independent Scale Normalization (0-100 for SVG coordinates)
    const normalizedData = data.map((d, i) => {
      const maxDays = Math.max(1, data.length - 1);
      return {
        ...d,
        x: data.length === 1 ? 50 : (i / maxDays) * 100,
        // Mom Sleep: 0-12h scale
        yMomSleep: 100 - (Math.min(12, d.momSleep) / 12) * 100,
        // Baby Sleep: 0-20h scale
        yBabySleep: 100 - (Math.min(20, d.babySleep) / 20) * 100,
        // Mood: 0-3 scale
        yMood: 100 - (d.momMood / 3) * 100
      };
    });

    const stats = {
      avgMomSleep: data.length ? (data.reduce((acc, d) => acc + d.momSleep, 0) / data.length).toFixed(1) : 0,
      avgBabySleep: data.length ? (data.reduce((acc, d) => acc + d.babySleep, 0) / data.length).toFixed(1) : 0,
      moodStability: data.length > 1 ? (100 - (data.reduce((acc, d, i) => i > 0 ? acc + Math.abs(d.momMood - data[i-1].momMood) : acc, 0) / (data.length - 1) * 33)).toFixed(0) : 100
    };

    return { chartData: normalizedData, rawData: data, stats };
  }, [recoveryLogs, family]);

  const { alerts, latestLog } = useMemo(() => analyzeRecoveryLogs(recoveryLogs), [recoveryLogs]);

  useEffect(() => { loadAll(); }, [id]);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setPhotoError('');
    setIsUploadingPhoto(true);

    try {
      // Validate file type
      const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedMimes.includes(file.type)) {
        setPhotoError('Please upload a valid image file (JPEG, PNG, WebP, or GIF)');
        setIsUploadingPhoto(false);
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setPhotoError('Image size must be less than 5MB');
        setIsUploadingPhoto(false);
        return;
      }

      const formData = new FormData();
      formData.append('photo', file);

      const response = await fetch(`/api/families/${id}/photo`, {
        method: 'POST',
        body: formData,
        headers: {
          'x-user-id': user?.id,
        },
      });

      if (!response.ok) {
        const error = await response.json();
        setPhotoError(error.error || 'Failed to upload photo');
      } else {
        await loadAll();
        setPhotoError('');
      }
    } catch (error) {
      setPhotoError(error.message || 'Failed to upload photo');
      console.error(error);
    } finally {
      setIsUploadingPhoto(false);
      // Reset the input
      e.target.value = '';
    }
  };

  const deletePhoto = async () => {
    setConfirmConfig({
      open: true,
      type: 'photo',
      title: 'Delete Profile Photo?',
      message: 'This will permanently remove the profile photo from storage and the family record.',
      confirmText: 'Remove Photo',
      icon: 'image_not_supported'
    });
  };

  const handleConfirmAction = async () => {
    const { type, id: actionId } = confirmConfig;
    setConfirmConfig(prev => ({ ...prev, open: false }));

    if (type === 'photo') {
      if (isUploadingPhoto) return;
      setIsUploadingPhoto(true);
      try {
        const response = await fetch(`/api/families/${id}/photo`, {
          method: 'DELETE',
          headers: {
            'x-user-id': user?.id,
          },
        });

        if (!response.ok) {
          const error = await response.json();
          setPhotoError(error.error || 'Failed to delete photo');
        } else {
          await loadAll();
          setPhotoError('');
        }
      } catch (error) {
        setPhotoError(error.message || 'Failed to delete photo');
      } finally {
        setIsUploadingPhoto(false);
      }
    } else if (type === 'log') {
      try {
        const { error } = await supabase.from('recovery_logs').delete().eq('id', actionId);
        if (error) throw error;
        await loadAll();
      } catch (e) {
        console.error(e);
      }
    } else if (type === 'family') {
      try {
        const res = await fetch(`/api/families/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete family');
        router.push('/families');
      } catch (e) {
        console.error(e);
        setApiError('Error deleting family. This sanctuary could not be released.');
      }
    } else if (type === 'visit') {
      try {
        const { error } = await supabase.from('visits').delete().eq('id', actionId);
        if (error) throw error;
        await loadAll();
      } catch (e) {
        console.error(e);
      }
    } else if (type === 'payment') {
      try {
        const { error } = await supabase.from('payments').delete().eq('id', actionId);
        if (error) throw error;
        await loadAll();
      } catch (e) {
        console.error(e);
        setApiError('Error purging record. This financial identity could not be released.');
      }
    }
  };

  const openEdit = () => {
    setEditData({ ...family });
    setSelectedServices(family?.services_needed ? family.services_needed.split(', ').filter(Boolean) : []);
    setEditOpen(true);
  };

  const toggleService = (svc) => setSelectedServices(prev => prev.includes(svc) ? prev.filter(s => s !== svc) : [...prev, svc]);

  const saveEdit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      // Clean payload for update
      const { id: famId, user_id, created_at, ...updateableData } = editData;
      const payload = { 
        ...updateableData, 
        name: editData.mother_name, // Sync name column
        services_needed: selectedServices.join(', ') 
      };

      const response = await fetch(`/api/families/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-id': user?.id
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to update family');
      }

      setEditOpen(false);
      loadAll();
    } catch (e) {
      console.error(e);
      setApiError(e.message || 'Error updating family details.');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditVisit = (v) => {
    setVisitForm({
      family_id: id,
      scheduled_date: v.scheduled_date ? new Date(v.scheduled_date).toISOString().slice(0, 16) : '',
      duration_hours: v.duration_hours || '2',
      focus_area: v.focus_area || 'General Postpartum',
      status: v.status || 'SCHEDULED',
      notes: v.notes || ''
    });
    setEditingVisitId(v.id);
    setVisitStep(1);
    setVisitModalOpen(true);
  };

  const postVisit = async (e) => {
    e.preventDefault(); setIsPosting(true);
    try {
      if (editingVisitId) {
        const { error } = await supabase.from('visits').update(visitForm).eq('id', editingVisitId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('visits').insert([{ ...visitForm, user_id: user?.id }]);
        if (error) throw error;
      }
      setVisitModalOpen(false); 
      setEditingVisitId(null);
      loadAll();
    } catch (e) { 
      console.error("Visit Error:", e); 
      setApiError(e.message || 'An error occurred while saving the visit.');
    } finally { 
      setIsPosting(false); 
    }
  };

  const postNote = async (e) => {
    e.preventDefault(); setIsPosting(true);
    try {
      const payload = { 
        ...noteForm, 
        user_id: user?.id,
        is_flagged: noteForm.type === 'PPA/PPD Flag' ? true : noteForm.is_flagged 
      };
      const { error } = await supabase.from('notes').insert([payload]);
      if (!error) { setNoteModalOpen(false); loadAll(); }
    } catch (e) { console.error(e); } finally { setIsPosting(false); }
  };

  const postInvoice = async (e) => {
    e.preventDefault(); setIsPosting(true);
    try {
      const { error } = await supabase.from('invoices').insert([{ ...invoiceForm, user_id: user?.id }]);
      if (!error) { setInvoiceModalOpen(false); loadAll(); }
    } catch (e) { console.error(e); } finally { setIsPosting(false); }
  };

  const postPayment = async (e) => {
    e.preventDefault(); setIsPosting(true);
    try {
      const total = parseFloat(paymentForm.total_amount || 0);
      const paid = parseFloat(paymentForm.paid_amount || 0);
      const remaining = total - paid;
      const payload = { 
        ...paymentForm, 
        user_id: user?.id,
        total_amount: total,
        paid_amount: paid,
        remaining_amount: remaining,
        status: remaining <= 0 ? 'PAID' : (paid > 0 ? 'PARTIAL' : 'UNPAID')
      };
      const { error } = await supabase.from('payments').insert([payload]);
      if (!error) { setPaymentModalOpen(false); loadAll(); }
    } catch (e) { console.error(e); } finally { setIsPosting(false); }
  };

  const updatePayment = async (e) => {
    e.preventDefault(); setIsPosting(true);
    try {
      const total = parseFloat(paymentForm.total_amount);
      const remaining = total - parseFloat(editingPayment.paid_amount || 0);
      const { error } = await supabase.from('payments').update({
        service_name: paymentForm.service_name,
        total_amount: total,
        remaining_amount: remaining,
        due_date: paymentForm.due_date,
        status: remaining <= 0 ? 'PAID' : (editingPayment.paid_amount > 0 ? 'PARTIAL' : 'UNPAID')
      }).eq('id', editingPayment.id);
      if (!error) { setPaymentModalOpen(false); setEditingPayment(null); loadAll(); }
    } catch (e) { console.error(e); } finally { setIsPosting(false); }
  };

  const addPaymentLog = async (e) => {
    e.preventDefault(); setIsPosting(true);
    try {
      const amount = parseFloat(paymentLogForm.amount);
      const { error: logErr } = await supabase.from('payment_logs').insert([{
        payment_id: selectedPayment.id,
        user_id: user?.id,
        amount,
        note: paymentLogForm.note,
        created_at: paymentLogForm.created_at
      }]);
      if (logErr) throw logErr;
      
      const newPaid = (selectedPayment.paid_amount || 0) + amount;
      const newRemaining = Math.max(0, selectedPayment.total_amount - newPaid);
      let newStatus = 'PARTIAL';
      if (newRemaining === 0) newStatus = 'PAID';
      else if (newPaid === 0) newStatus = 'UNPAID';

      const { error: payErr } = await supabase.from('payments').update({
        paid_amount: newPaid,
        remaining_amount: newRemaining,
        status: newStatus
      }).eq('id', selectedPayment.id);
      
      if (payErr) throw payErr;
      setPaymentLogModalOpen(false);
      setPaymentLogForm({ amount: '', note: '', created_at: new Date().toISOString().split('T')[0] });
      loadAll();
    } catch (e) { console.error(e); } finally { setIsPosting(false); }
  };

  const markPaymentAsPaid = async (payment) => {
    try {
      const amountToAdd = payment.remaining_amount;
      
      // Log the final payment
      await supabase.from('payment_logs').insert([{
        payment_id: payment.id,
        user_id: user?.id,
        amount: amountToAdd,
        note: 'Auto-balanced to Paid'
      }]);

      const { error } = await supabase.from('payments').update({
        paid_amount: payment.total_amount,
        remaining_amount: 0,
        status: 'PAID'
      }).eq('id', payment.id);
      
      if (!error) {
        setCelebratedClient(family?.mother_name || 'Client');
        setShowCelebration(true);
        loadAll();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deletePayment = async (paymentId) => {
    setConfirmConfig({
      open: true,
      type: 'payment',
      id: paymentId,
      title: 'Purge Archive?',
      message: 'This will permanently remove this payment from the financial history.',
      confirmText: 'Purge Record',
      icon: 'auto_delete'
    });
  };

  const openEditPayment = (payment) => {
    setPaymentForm({
      family_id: id,
      service_name: payment.service_name,
      total_amount: payment.total_amount.toString(),
      paid_amount: payment.paid_amount,
      due_date: payment.due_date,
      status: payment.status
    });
    setEditingPayment(payment);
    setPaymentModalOpen(true);
  };

  const openAddLog = (payment) => {
    setSelectedPayment(payment);
    setPaymentLogForm({ amount: '', note: '', created_at: new Date().toISOString().split('T')[0] });
    setPaymentLogModalOpen(true);
  };

  const fetchPaymentLogs = async (paymentId) => {
    const { data } = await supabase.from('payment_logs').select('*').eq('payment_id', paymentId).order('created_at', { ascending: false });
    setPaymentLogs(data || []);
    setPaymentHistoryModalOpen(true);
  };

  const openNewRecovery = () => {
    setRecoveryForm({
      family_id: id,
      date: new Date().toISOString().split('T')[0],
      mood: 'happy',
      sleep_hours: '',
      pain_level: 0,
      notes: '',
      baby_sleep_hours: '',
      baby_diapers: '',
      baby_feeding_type: 'breastfeeding',
      baby_feeding_issues: ''
    });
    setEditingLogId(null);
    setRecoveryModalOpen(true);
  };

  const openEditLog = (log) => {
    setRecoveryForm({
      family_id: id,
      date: log.date,
      mood: log.mood,
      sleep_hours: log.sleep_hours,
      pain_level: log.pain_level,
      notes: log.notes,
      baby_sleep_hours: log.baby_sleep_hours,
      baby_diapers: log.baby_diapers,
      baby_feeding_type: log.baby_feeding_type,
      baby_feeding_issues: log.baby_feeding_issues
    });
    setEditingLogId(log.id);
    setRecoveryModalOpen(true);
  };

  const handleSubmitRecovery = async (e) => {
    e.preventDefault();
    setIsPosting(true);
    try {
      const payload = {
        family_id: id,
        date: recoveryForm.date,
        mood: recoveryForm.mood || null,
        sleep_hours: recoveryForm.sleep_hours ? parseFloat(recoveryForm.sleep_hours) : null,
        pain_level: recoveryForm.pain_level ? parseInt(recoveryForm.pain_level) : null,
        baby_feeding_type: recoveryForm.baby_feeding_type ? recoveryForm.baby_feeding_type.toLowerCase() : null,
        baby_feeding_issues: recoveryForm.baby_feeding_issues || null,
        baby_sleep_hours: recoveryForm.baby_sleep_hours ? parseFloat(recoveryForm.baby_sleep_hours) : null,
        baby_diapers: recoveryForm.baby_diapers ? parseInt(recoveryForm.baby_diapers) : null,
        notes: recoveryForm.notes || null,
      };

      if (editingLogId) {
        const { error } = await supabase
          .from('recovery_logs')
          .update(payload)
          .eq('id', editingLogId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('recovery_logs')
          .insert([payload]);
        if (error) throw error;
      }
      
      await loadAll();
      setRecoveryModalOpen(false);
      setEditingLogId(null);
    } catch (error) {
      console.error(error);
      setApiError('Error processing recovery log entry.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    // Logic handled by confirmConfig
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined animate-spin text-5xl text-primary dark:text-sky-400">refresh</span>
          <p className="text-on-surface-variant dark:text-slate-400 font-medium">Loading family profile...</p>
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <div className="flex items-center justify-center py-40">
        <div className="text-center space-y-4">
          <span className="material-symbols-outlined text-5xl text-rose-400">error</span>
          <p className="text-on-surface dark:text-slate-200 font-bold text-xl">Family not found</p>
          <Link href="/families" className="text-primary dark:text-sky-400 text-sm font-bold">← Back to Families</Link>
        </div>
      </div>
    );
  }

  
  const generateReportPDF = async () => {
    if (!family) return;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const dateStr = new Date().toLocaleDateString();
    
    // Helper to load images for PDF
    const loadImage = (url) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = url;
      });
    };

    // —— PREMIUM HEADER ——
    // Background Header Bar (Sky Blue)
    doc.setFillColor(14, 165, 233); 
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    let logoData = null;
    if (user?.photo_url) {
      logoData = await loadImage(user.photo_url);
    }

    if (logoData) {
      doc.addImage(logoData, 'PNG', 14, 8, 15, 15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(255, 255, 255);
      doc.text(user?.name || 'HymyMom Pro', 32, 18);
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(28);
      doc.setTextColor(255, 255, 255);
      doc.text(user?.name || 'HymyMom Pro', 14, 22);
    }
    
    const reportMonth = new Date().toLocaleString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${reportMonth} - POSTPARTUM RECOVERY & CLINICAL SUMMARY`, 14, 32);
    
    // Top-Right Context
    doc.setFontSize(9);
    doc.text(`REPORT ID: ${String(family.id).substring(0, 8).toUpperCase()}`, pageWidth - 14, 20, { align: 'right' });
    doc.text(`ISSUED: ${dateStr}`, pageWidth - 14, 26, { align: 'right' });
    doc.text('CONFIDENTIAL CLINICAL DATA', pageWidth - 14, 32, { align: 'right' });

    // —— SECTION 0: CUSTOM NOTE (NEW) ——
    if (reportNote) {
      doc.setTextColor(15, 23, 42);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bolditalic');
      doc.text('Provider Personal Note:', 14, 55);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(10);
      const splitNote = doc.splitTextToSize(reportNote, pageWidth - 28);
      doc.text(splitNote, 14, 62);
    }

    // —— SECTION 1: IDENTITY ——
    let currentY = reportNote ? 62 + (doc.splitTextToSize(reportNote, pageWidth - 28).length * 5) + 10 : 55;
    
    doc.setTextColor(15, 23, 42); 
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Family Clinical Identity', 14, currentY);
    doc.setDrawColor(14, 165, 233);
    doc.setLineWidth(0.5);
    doc.line(14, currentY + 2, 40, currentY + 2);

    autoTable(doc, {
      startY: currentY + 6,
      head: [['Metric', 'Clinical Value']],
      body: [
        ['Mother\'s Name', family.mother_name || '—'],
        ['Partner\'s Name', family.partner_name || '—'],
        ['Newborn Identity', family.baby_name || '—'],
        ['Birth Date', family.birth_date || '—'],
        ['Recovery Phase', `${postPartumWeeks} Weeks Postpartum`],
        ['Clinical Delivery', family.delivery_type || '—'],
        ['Nutritional Plan', family.feeding_plan || '—'],
        ['Care Status', family.status],
      ],
      theme: 'striped',
      headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 9, cellPadding: 3 },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
    });

    // —— SECTION 2: CLINICAL VISITS (NEW/IMPROVED) ——
    currentY = doc.lastAutoTable.finalY + 12;
    if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Clinical Support Agenda', 14, currentY);
    doc.line(14, currentY + 2, 40, currentY + 2);
    
    const visitRows = visits.sort((a,b) => new Date(b.scheduled_date) - new Date(a.scheduled_date)).map(v => [
      new Date(v.scheduled_date).toLocaleDateString(),
      v.focus_area || 'General Care',
      `${v.duration_hours}h`,
      v.status,
      v.notes ? v.notes.substring(0, 50) + '...' : '—'
    ]);

    autoTable(doc, {
      startY: currentY + 6,
      head: [['Date', 'Focus Area', 'Dur.', 'Status', 'Observation Snippet']],
      body: visitRows,
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    // —— SECTION 3: RECOVERY METRICS ——
    currentY = doc.lastAutoTable.finalY + 12;
    if (currentY > pageHeight - 40) { doc.addPage(); currentY = 20; }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Recent Recovery Analytics', 14, currentY);
    doc.line(14, currentY + 2, 40, currentY + 2);
    
    const last10Logs = recoveryLogs.slice(0, 10).map(log => [
      new Date(log.date).toLocaleDateString(),
      log.mood ? log.mood.toUpperCase() : '—',
      `${log.sleep_hours || 0}h`,
      `${log.pain_level || 0}/10`,
      `${log.baby_sleep_hours || 0}h`,
      log.notes ? log.notes.substring(0, 40) + '...' : '—'
    ]);

    autoTable(doc, {
      startY: currentY + 6,
      head: [['Date', 'Mood', 'Mom Sleep', 'Pain', 'Baby Sleep', 'Recovery Note']],
      body: last10Logs,
      theme: 'grid',
      headStyles: { fillColor: [14, 165, 233], textColor: [255, 255, 255] },
      styles: { fontSize: 8, cellPadding: 2 },
    });

    // —— FOOTER ——
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text(`${user?.name || 'HymyMom Pro'} - Clinical Summary - Page ${i} of ${pageCount}`, 14, pageHeight - 15);
      doc.text(user?.address || '', 14, pageHeight - 10);
      doc.text(`Secure clinical record. | HymyMom Platform`, pageWidth - 14, pageHeight - 10, { align: 'right' });
    }

    const fileMonth = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }).replace(' ', '_');
    doc.save(`${family.mother_name.replace(/\s+/g, '_')}_${fileMonth}_Clinical_Report.pdf`);
    setReportModalOpen(false);
  };
  const displayName = family.mother_name || family.name || 'Unknown';
  const babyName = family.baby_name;
  const postPartumWeeks = family.birth_date ? Math.floor((new Date() - new Date(family.birth_date)) / (1000 * 60 * 60 * 24 * 7)) : null;

  const newbornTracker = [
    { label: 'Feeding Plan', value: family.feeding_plan || '—', icon: 'baby_changing_station' },
    { label: 'Delivery Type', value: family.delivery_type || '—', icon: 'healing' },
  ];

  const pendingInvoicesValue = invoices.filter(i => i.status === 'PENDING').reduce((s, i) => s + parseFloat(i.amount || 0), 0) + 
                               payments.reduce((s, p) => s + parseFloat(p.remaining_amount || 0), 0);
  const paidInvoicesValue = invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + parseFloat(i.amount || 0), 0) + 
                            payments.reduce((s, p) => s + parseFloat(p.paid_amount || 0), 0);
  const totalVisitsCount = visits.length;
  const flaggedNotes = notes.filter(n => n.is_flagged);

  return (
    <div className="max-w-6xl mx-auto space-y-12 transition-colors duration-300">

      {/* Back link */}
      <Link href="/families" className="inline-flex items-center gap-2 text-sm font-bold text-on-surface-variant dark:text-slate-400 hover:text-primary dark:hover:text-sky-400 transition-colors">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to Families
      </Link>

      {/* Profile Header */}
      <section className="relative p-8 rounded-xl bg-gradient-to-br from-primary-container/30 to-surface-container-low dark:from-slate-900 dark:to-slate-800 border border-outline-variant/10 dark:border-white/5 flex flex-col md:flex-row items-center md:items-end gap-8 overflow-hidden transition-colors duration-300">
        <div className="relative group">
          {family.photo_url ? (
            <>
              <img src={family.photo_url} alt={displayName} className="w-32 h-32 md:w-40 md:h-40 rounded-xl shadow-xl border-4 border-surface-container-lowest dark:border-slate-800 object-cover" />
              <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-[2px]">
                <label className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center cursor-pointer transition-colors" title="Update Photo">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} className="hidden" />
                  <span className="material-symbols-outlined text-white text-xl">camera_alt</span>
                </label>
                <button 
                  onClick={(e) => { e.preventDefault(); deletePhoto(); }} 
                  disabled={isUploadingPhoto}
                  className="w-10 h-10 rounded-full bg-rose-500/40 hover:bg-rose-500/60 flex items-center justify-center transition-colors"
                  title="Delete Photo"
                >
                  <span className="material-symbols-outlined text-white text-xl">delete</span>
                </button>
              </div>
              {isUploadingPhoto && (
                <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-white text-4xl animate-spin">refresh</span>
                </div>
              )}
            </>
          ) : (
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-xl bg-surface-container-low dark:bg-slate-800 flex flex-col items-center justify-center border-4 border-surface-container-lowest dark:border-slate-800 group relative">
              <span className="material-symbols-outlined text-5xl text-on-surface-variant dark:text-slate-500">person</span>
              <div className="absolute inset-0 rounded-xl bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-[2px]">
                <label className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center cursor-pointer transition-colors">
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={isUploadingPhoto} className="hidden" />
                  <span className="material-symbols-outlined text-white text-xl">camera_alt</span>
                </label>
              </div>
              {isUploadingPhoto && (
                <div className="absolute inset-0 rounded-xl flex items-center justify-center bg-black/50 backdrop-blur-sm">
                  <span className="material-symbols-outlined text-white text-4xl animate-spin">refresh</span>
                </div>
              )}
            </div>
          )}
          <div className={`absolute -bottom-2 -right-2 rounded-full px-4 py-1 text-sm font-bold shadow-md ${statusStyle(family.status)}`}>{family.status}</div>
        </div>
        {photoError && (
          <div className="fixed top-4 right-4 max-w-sm bg-rose-500/10 border border-rose-400/30 text-rose-600 dark:text-rose-400 p-4 rounded-lg text-sm font-medium flex items-center gap-3 animate-in">
            <span className="material-symbols-outlined text-sm">error</span>
            {photoError}
            <button onClick={() => setPhotoError('')} className="ml-auto">
              <span className="material-symbols-outlined text-sm">close</span>
            </button>
          </div>
        )}
        <div className="flex-1 text-center md:text-left space-y-2 relative z-10">
          <h1 className="font-headline text-4xl md:text-5xl text-on-surface dark:text-slate-100 font-bold tracking-tight transition-colors">
            {displayName} {babyName ? `& Baby ${babyName}` : ''}
          </h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <span className="px-4 py-1.5 bg-surface-container-lowest dark:bg-slate-900 text-primary dark:text-sky-400 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors">
              <span className="material-symbols-outlined text-sm">calendar_month</span>
              {postPartumWeeks !== null ? `${postPartumWeeks} weeks postpartum` : 'Birth date TBD'}
            </span>
            {family.phone && (
              <a 
                href={`tel:${family.phone}`}
                className="px-4 py-1.5 bg-surface-container-lowest dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm">call</span>
                {family.phone}
              </a>
            )}
            {family.email && (
              <a 
                href={`mailto:${family.email}`}
                className="px-4 py-1.5 bg-surface-container-lowest dark:bg-slate-900 text-on-surface-variant/70 dark:text-slate-400 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span className="material-symbols-outlined text-sm">mail</span>
                {family.email}
              </a>
            )}
            {family.partner_name && (
              <span className="px-4 py-1.5 bg-surface-container-lowest dark:bg-slate-900 text-tertiary dark:text-indigo-400 rounded-full text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors">
                <span className="material-symbols-outlined text-sm">person</span>
                Partner: {family.partner_name}
              </span>
            )}
          </div>

          <div className="flex flex-wrap justify-center md:justify-start gap-3 pt-2">
            <button 
              onClick={() => setReportModalOpen(true)} 
              className="px-5 py-3 bg-surface-container dark:bg-white/5 hover:bg-surface-container-high dark:hover:bg-white/10 text-on-surface dark:text-white rounded-full font-bold shadow-sm transition-all flex items-center gap-2 text-sm border border-outline-variant/10 dark:border-white/20"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              Download Report (PDF)
            </button>
            <button onClick={openEdit} className="px-5 py-3 bg-primary dark:bg-sky-500 text-on-primary dark:text-slate-950 rounded-full font-bold shadow-md hover:opacity-90 transition-all flex items-center gap-2 text-sm">
              <span className="material-symbols-outlined text-sm">edit</span>
              Edit Profile
            </button>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary-container/20 dark:bg-sky-500/10 rounded-full blur-3xl -z-0"></div>
      </section>

      {/* Tab System */}
      <div className="overflow-x-auto no-scrollbar pb-2">
        <div className="flex gap-2 min-w-max p-1 bg-surface-container-low dark:bg-slate-900/50 rounded-full w-max transition-colors">
          {[
            ['dashboard', 'Dashboard'], 
            ['visits', 'Visits & Schedule'], 
            ['admin', 'Payment'], 
            ['recovery', 'Recovery']
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-8 py-3 rounded-full font-bold text-sm transition-all ${activeTab === key ? 'bg-surface-container-lowest dark:bg-slate-800 text-primary dark:text-sky-400 shadow-sm' : 'text-on-surface-variant dark:text-slate-400 hover:bg-surface-container-highest dark:hover:bg-slate-800'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Top Level Health Alerts & Next Action */}
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Alerts Card */}
            <div className={`p-6 rounded-[2rem] border transition-all ${alerts.length > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`material-symbols-outlined ${alerts.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                  {alerts.length > 0 ? 'clinical_notes' : 'verified_user'}
                </span>
                <h3 className={`text-sm font-black uppercase tracking-widest ${alerts.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {alerts.length > 0 ? 'Clinical Alerts' : 'Status: Optimal'}
                </h3>
              </div>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.slice(0, 2).map((alert, idx) => (
                    <div key={idx} className="flex gap-2 text-xs font-bold text-rose-700 dark:text-rose-400">
                      <span>•</span>
                      <span>{alert.message}</span>
                    </div>
                  ))}
                  {alerts.length > 2 && <div className="text-[10px] font-bold text-rose-500/70">+{alerts.length - 2} more alerts...</div>}
                </div>
              ) : (
                <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400/80 leading-relaxed">
                  Recovery metrics are within normal parameters. No immediate clinical action required.
                </p>
              )}
            </div>

            {/* Next Strategy Card */}
            <div className="p-6 rounded-[2rem] bg-sky-500/10 border border-sky-500/20">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-sky-600">event_upcoming</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-sky-700">Next Strategy</h3>
              </div>
              {visits.filter(v => v.status === 'SCHEDULED').length > 0 ? (
                <div>
                  <div className="text-xl font-bold text-sky-900 dark:text-sky-100">
                    {new Date(visits.filter(v => v.status === 'SCHEDULED')[0].scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs font-bold text-sky-600/70 uppercase tracking-widest mt-1">
                    {visits.filter(v => v.status === 'SCHEDULED')[0].focus_area}
                  </div>
                </div>
              ) : (
                <p className="text-xs font-medium text-sky-700 dark:text-sky-400/80 italic">No upcoming sessions scheduled.</p>
              )}
            </div>

            {/* Financial Health Card */}
            <div className="p-6 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20">
              <div className="flex items-center gap-3 mb-4">
                <span className="material-symbols-outlined text-indigo-600">account_balance_wallet</span>
                <h3 className="text-sm font-black uppercase tracking-widest text-indigo-700">Financial Ledger</h3>
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <div className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">${pendingInvoicesValue.toLocaleString()}</div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-indigo-600/70 mt-1">Pending Balance</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-indigo-600">${paidInvoicesValue.toLocaleString()}</div>
                  <div className="text-[9px] font-black uppercase tracking-widest text-indigo-500/50">Total Paid</div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="md:col-span-1 lg:col-span-8 space-y-8">
              <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900/50 border border-outline-variant/10 dark:border-white/5 shadow-xl shadow-primary/5">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <h2 className="font-headline text-2xl font-bold text-on-surface dark:text-white">Daily Recovery Timeline</h2>
                    <p className="text-sm text-on-surface-variant dark:text-slate-400">Reviewing the last {Math.min(7, recoveryLogs.length)} pulses.</p>
                  </div>
                  <button onClick={() => setRecoveryModalOpen(true)} className="text-xs font-black uppercase tracking-widest text-primary hover:underline">Log Pulse +</button>
                </div>
                <div className="space-y-4">
                  {recoveryLogs.length > 0 ? (
                    recoveryLogs.slice(0, 5).map((log) => (
                      <div key={log.id} className="flex items-center gap-6 p-4 rounded-2xl bg-surface-container-low/50 dark:bg-slate-800/30 border border-outline-variant/5">
                        <div className="w-12 text-center">
                          <div className="text-[10px] font-black text-slate-400">{new Date(log.date).toLocaleDateString(undefined, { weekday: 'short' })}</div>
                          <div className="text-lg font-bold text-primary dark:text-sky-400">{new Date(log.date).toLocaleDateString(undefined, { day: 'numeric' })}</div>
                        </div>
                        <div className="flex-1 grid grid-cols-2 gap-4 border-l border-outline-variant/10 pl-6">
                          <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Mood</div>
                            <div className="text-sm font-bold text-on-surface dark:text-slate-200">{MOOD_LABELS[log.mood]}</div>
                          </div>
                          <div>
                            <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Sleep</div>
                            <div className="text-sm font-bold text-on-surface dark:text-slate-200">{log.sleep_hours}h</div>
                          </div>
                        </div>
                        <div className="hidden md:block text-right">
                          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500 mb-1">Baby</div>
                          <div className="text-sm font-bold text-sky-600/70">{log.baby_sleep_hours}h</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center">
                      <span className="material-symbols-outlined text-5xl text-slate-300 dark:text-slate-700 mb-4">analytics</span>
                      <p className="text-sm text-slate-500 italic">No recovery pulses recorded yet.</p>
                    </div>
                  )}
                </div>
                <div className="mt-8 pt-8 border-t border-outline-variant/10 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary dark:text-sky-400">{recoveryAnalytics.stats.avgMomSleep}h</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Avg Sleep</div>
                  </div>
                  <div className="text-center border-x border-outline-variant/10">
                    <div className="text-2xl font-bold text-primary dark:text-sky-400">{recoveryAnalytics.stats.moodStability}%</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Mood</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary dark:text-sky-400">{recoveryAnalytics.stats.avgBabySleep}h</div>
                    <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">Baby</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-1 lg:col-span-4 space-y-8">
              <div className="p-8 rounded-[2.5rem] bg-sky-500/5 border border-sky-500/10 flex flex-col items-center text-center group">
                <div className="w-24 h-24 rounded-full bg-sky-500/10 flex items-center justify-center mb-6">
                  <span className="material-symbols-outlined text-5xl text-sky-500">{alerts.length > 0 ? 'clinical_notes' : 'health_metrics'}</span>
                </div>
                <h4 className="text-lg font-bold text-sky-900 dark:text-sky-100 mb-2">Sanctuary Guardian</h4>
                <p className="text-xs text-sky-700/70 dark:text-sky-400/60 font-medium">
                  {alerts.length > 0 ? "Monitoring recovery alerts." : "The sanctuary is peaceful."}
                </p>
              </div>
              <div className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-900/50 border border-outline-variant/10 shadow-xl">
                <h3 className="font-headline text-lg font-bold mb-6 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary">child_care</span>
                  Infant Profile
                </h3>
                <div className="space-y-4">
                  {[
                    { label: 'Baby Name', value: family.baby_name || 'Pending', icon: 'badge' },
                    { label: 'Feeding Plan', value: family.feeding_plan || 'TBD', icon: 'baby_changing_station' },
                    { label: 'Delivery', value: family.delivery_type || 'Unknown', icon: 'healing' },
                    { label: 'Birth Date', value: family.birth_date ? new Date(family.birth_date).toLocaleDateString() : 'TBD', icon: 'calendar_today' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-3 p-3 bg-surface-container-low/50 rounded-2xl">
                      <span className="material-symbols-outlined text-primary/60 text-lg">{item.icon}</span>
                      <div>
                        <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">{item.label}</div>
                        <div className="text-sm font-bold text-on-surface dark:text-white">{item.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: Visits & Schedule */}
      {activeTab === 'visits' && (
        <div className="space-y-12">
          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="font-headline text-3xl font-bold text-on-surface dark:text-white">Clinical Agenda</h2>
              <p className="text-sm text-on-surface-variant dark:text-slate-400">Manage upcoming support strategies and session archives.</p>
            </div>
            <button onClick={() => {
              setVisitForm({ family_id: id, scheduled_date: '', duration_hours: '2', focus_area: 'General Postpartum', status: 'SCHEDULED', notes: '' });
              setEditingVisitId(null);
              setVisitStep(1);
              setVisitModalOpen(true);
            }} className="bg-baby-blue text-white dark:text-slate-950 px-8 py-4 rounded-full font-bold text-sm shadow-xl hover:opacity-90 transition-all flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">more_time</span>
              Schedule Care Session
            </button>
          </div>

          {/* SECTION 1: Upcoming Care Strategy (The Reminders) */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-baby-blue">Upcoming Strategy</h3>
               <div className="h-px flex-1 bg-gradient-to-r from-baby-blue/30 to-transparent"></div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {visits.filter(v => v.status === 'SCHEDULED').length === 0 ? (
                <div className="col-span-full py-12 px-8 rounded-3xl bg-white/5 border border-dashed border-white/10 text-center">
                  <p className="text-slate-500 font-medium italic">No upcoming care sessions scheduled for this agenda.</p>
                </div>
              ) : (
                visits.filter(v => v.status === 'SCHEDULED').sort((a,b) => new Date(a.scheduled_date) - new Date(b.scheduled_date)).map(v => (
                  <div key={v.id} className="group relative glass-card p-6 rounded-3xl border border-white/10 hover:border-baby-blue/40 transition-all duration-500 hover:-translate-y-1 shadow-2xl shadow-black/20 overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-baby-blue/5 rounded-full blur-2xl -mr-12 -mt-12 group-hover:bg-baby-blue/10 transition-colors"></div>
                    
                    <div className="flex justify-between items-start mb-6">
                      <div className="w-12 h-12 rounded-2xl bg-baby-blue/10 flex items-center justify-center text-baby-blue">
                        <span className="material-symbols-outlined">event</span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-black text-baby-blue uppercase tracking-widest">{new Date(v.scheduled_date).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                        <div className="text-xl font-headline font-bold text-on-surface dark:text-white">
                          {new Date(v.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 mb-8">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500 mb-1">Care Focus</p>
                        <p className="text-sm font-bold text-on-surface dark:text-slate-200">{v.focus_area || 'General Support'}</p>
                      </div>
                      <div className="bg-surface-container-highest dark:bg-white/5 p-4 rounded-2xl border border-outline-variant/10 dark:border-white/5 transition-colors">
                        <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant/60 dark:text-slate-500 mb-1">Expected Duration</p>
                        <p className="text-sm font-bold text-on-surface dark:text-slate-200">{v.duration_hours} Hours</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          setVisitForm({ ...v, status: 'COMPLETED', scheduled_date: new Date(v.scheduled_date).toISOString().slice(0, 16) });
                          setEditingVisitId(v.id);
                          setVisitModalOpen(true);
                        }}
                        className="flex-1 py-3 bg-primary dark:bg-baby-blue text-on-primary dark:text-slate-950 rounded-xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-primary/20 dark:shadow-baby-blue/20"
                      >
                        Complete Session
                      </button>
                      <button onClick={() => openEditVisit(v)} className="p-3 bg-surface-container dark:bg-white/5 hover:bg-surface-container-high dark:hover:bg-white/10 rounded-xl border border-outline-variant/10 dark:border-white/5 transition-all text-on-surface-variant dark:text-slate-400 hover:text-on-surface dark:hover:text-white">
                        <span className="material-symbols-outlined text-sm">settings</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* SECTION 2: Clinical Session Archive (Redesigned as Cards) */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-on-surface-variant/60 dark:text-slate-500">Clinical Session Archive</h3>
               <div className="h-px flex-1 bg-gradient-to-r from-outline-variant/30 dark:from-slate-500/20 to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              {visits.filter(v => v.status !== 'SCHEDULED').sort((a,b) => new Date(b.scheduled_date) - new Date(a.scheduled_date)).map(v => (
                <div key={v.id} className="group relative bg-surface-container/40 dark:bg-white/5 hover:bg-surface-container/60 dark:hover:bg-white/[0.08] border border-outline-variant/10 dark:border-white/5 hover:border-sky-500/20 rounded-[2rem] p-8 transition-all duration-500 backdrop-blur-xl overflow-hidden">
                  {/* Status Indicator Bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${v.status === 'COMPLETED' ? 'bg-emerald-500/50' : 'bg-rose-500/50'}`}></div>
                  
                  <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Date & Meta */}
                    <div className="lg:w-48">
                      <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400 font-bold text-[10px] uppercase tracking-widest mb-2">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        {new Date(v.scheduled_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <h4 className="text-xl font-bold text-on-surface dark:text-white mb-1">{v.duration_hours}h Session</h4>
                      <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${v.status === 'COMPLETED' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' : 'bg-rose-500/10 text-rose-600 dark:text-rose-500'}`}>
                        {v.status}
                      </span>
                    </div>

                    {/* Focus & Notes */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {v.focus_area || 'General Care'}
                        </span>
                      </div>
                      <div className="bg-surface-container dark:bg-black/20 p-6 rounded-2xl border border-outline-variant/10 dark:border-white/5 italic">
                        <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed">
                          {v.notes || 'No narrative recorded for this archive session.'}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col gap-2 w-full lg:w-auto">
                      <button onClick={() => openEditVisit(v)} className="flex-1 lg:w-12 lg:h-12 py-3 lg:py-0 rounded-2xl bg-surface-container dark:bg-white/5 hover:bg-sky-500/10 text-on-surface-variant dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 border border-outline-variant/10 dark:border-white/5 transition-all flex items-center justify-center" title="Edit Session">
                        <span className="material-symbols-outlined text-xl">edit</span>
                      </button>
                      <button 
                        onClick={() => setConfirmConfig({
                          open: true,
                          type: 'visit',
                          id: v.id,
                          title: 'Purge Archive?',
                          message: 'This will permanently remove this session from the clinical history.',
                          confirmText: 'Purge Record',
                          icon: 'auto_delete'
                        })}
                        className="flex-1 lg:w-12 lg:h-12 py-3 lg:py-0 rounded-2xl bg-surface-container dark:bg-white/5 hover:bg-rose-500/10 text-on-surface-variant dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-500 border border-outline-variant/10 dark:border-white/5 transition-all flex items-center justify-center"
                        title="Delete Session"
                      >
                        <span className="material-symbols-outlined text-xl">delete</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB: Payment */}
      {activeTab === 'admin' && (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="font-headline text-3xl font-bold text-on-surface dark:text-slate-100">Payments & Financials</h2>
              <p className="text-on-surface-variant dark:text-slate-400 text-sm mt-1">Manage investment packages and clinical billing history.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  setPaymentForm({ family_id: id, service_name: '', total_amount: '', paid_amount: '0', due_date: '', status: 'UNPAID' });
                  setPaymentModalOpen(true);
                }} 
                className="bg-primary dark:bg-sky-500 text-on-primary dark:text-slate-950 px-6 py-4 rounded-2xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">payments</span>
                Record Payment
              </button>
            </div>
          </div>

          {/* Payment Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {payments.length === 0 ? (
              <div className="col-span-full py-20 bg-surface-container-low dark:bg-slate-900/30 rounded-[2.5rem] border-2 border-dashed border-outline-variant/10 flex flex-col items-center justify-center text-center">
                <div className="w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center mb-4 text-primary">
                  <span className="material-symbols-outlined text-4xl">payments</span>
                </div>
                <p className="text-on-surface-variant dark:text-slate-400 font-medium italic">No payments recorded for this clinical sanctuary.</p>
              </div>
            ) : (
              payments.map(pay => (
                <div key={pay.id} className="glass-card p-7 rounded-[2rem] border border-outline-variant/10 relative overflow-hidden group hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500">
                  <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-10 -mr-12 -mt-12 transition-colors ${pay.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                  
                  <div className="flex justify-between items-start mb-6 relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-surface-container dark:bg-white/5 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">package_2</span>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${PAYMENT_STATUS_COLORS[pay.status] || PAYMENT_STATUS_COLORS.UNPAID}`}>
                      {pay.status}
                    </span>
                  </div>

                  <h4 className="text-lg font-bold text-on-surface dark:text-white mb-1 truncate">{pay.service_name}</h4>
                  <p className="text-[10px] text-on-surface-variant/60 dark:text-slate-500 font-bold uppercase tracking-widest mb-6">
                    Due {pay.due_date ? new Date(pay.due_date).toLocaleDateString() : 'TBD'}
                  </p>

                  <div className="space-y-4 pt-4 border-t border-outline-variant/10">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-[9px] font-black text-on-surface-variant/40 dark:text-slate-500 uppercase tracking-widest mb-1">Total Package</p>
                        <p className="text-xl font-bold text-on-surface dark:text-white">${parseFloat(pay.total_amount).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black text-on-surface-variant/40 dark:text-slate-500 uppercase tracking-widest mb-1">Paid</p>
                        <p className="text-lg font-bold text-emerald-500">${parseFloat(pay.paid_amount).toLocaleString()}</p>
                      </div>
                    </div>
                    
                    <div className="w-full h-1.5 bg-surface-container dark:bg-white/5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${pay.status === 'PAID' ? 'bg-emerald-500' : (pay.status === 'OVERDUE' ? 'bg-rose-500' : 'bg-amber-500')}`} 
                        style={{ width: `${Math.min(100, (pay.paid_amount / pay.total_amount) * 100)}%` }}
                      ></div>
                    </div>

                    {pay.remaining_amount > 0 && (
                      <div className={`flex justify-between items-center p-3 rounded-xl border ${pay.status === 'OVERDUE' ? 'bg-rose-500/5 border-rose-500/10' : 'bg-amber-500/5 border-amber-500/10'}`}>
                         <span className={`text-[10px] font-bold uppercase tracking-widest ${pay.status === 'OVERDUE' ? 'text-rose-600' : 'text-amber-600'}`}>Balance Due</span>
                         <span className={`text-sm font-black ${pay.status === 'OVERDUE' ? 'text-rose-600' : 'text-amber-600'}`}>${parseFloat(pay.remaining_amount).toLocaleString()}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap items-center gap-3 mt-8">
                      <button 
                        onClick={() => openAddLog(pay)}
                        className="bg-sky-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-sky-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center whitespace-nowrap"
                      >
                        Add Payment
                      </button>
                      
                      {pay.status !== 'PAID' && (
                        <button 
                          onClick={() => markPaymentAsPaid(pay)}
                          className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center whitespace-nowrap"
                        >
                          Mark as Paid
                        </button>
                      )}

                      <div className="flex gap-2 ml-auto">
                        <button 
                          onClick={() => deletePayment(pay.id)}
                          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container dark:bg-white/5 text-slate-400 hover:text-rose-500 border border-outline-variant/10 dark:border-white/5 transition-all"
                          title="Purge Record"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                        <button 
                          onClick={() => fetchPaymentLogs(pay.id)}
                          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container dark:bg-white/5 text-on-surface-variant dark:text-slate-400 hover:text-primary border border-outline-variant/10 dark:border-white/5 transition-all"
                          title="Payment History"
                        >
                          <span className="material-symbols-outlined text-xl">history</span>
                        </button>
                        <button 
                          onClick={() => openEditPayment(pay)}
                          className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container dark:bg-white/5 text-on-surface-variant dark:text-slate-400 hover:text-primary border border-outline-variant/10 dark:border-white/5 transition-all"
                          title="Edit Record"
                        >
                          <span className="material-symbols-outlined text-xl">edit</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          
        </div>
      )}

      {/* TAB: Recovery */}
      {activeTab === 'recovery' && (
        <div className="space-y-10 animate-in fade-in zoom-in-95 duration-1000">
          {/* Header Section with Glass Aura */}
          <div className="relative p-10 rounded-[3rem] overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-transparent opacity-50 group-hover:opacity-80 transition-opacity duration-1000"></div>
            <div className="absolute inset-0 backdrop-blur-3xl bg-surface-container dark:bg-slate-900/40 border border-outline-variant/10 dark:border-white/5"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="h-px w-8 bg-sky-500"></span>
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-sky-500">Clinical Narrative</span>
                </div>
                <h2 className="font-headline text-5xl font-bold text-on-surface dark:text-white leading-tight">
                  Maternal <span className="text-gradient">Recovery</span>
                </h2>
                <p className="text-on-surface-variant dark:text-slate-400 mt-4 max-w-lg font-medium leading-relaxed">
                  A high-fidelity perspective on the postpartum transition, blending clinical precision with empathetic care.
                </p>
              </div>
              <button 
                onClick={openNewRecovery} 
                className="px-12 py-5 bg-on-surface dark:bg-sky-500 text-surface dark:text-slate-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all shadow-[0_20px_50px_rgba(56,189,248,0.3)] dark:shadow-none flex items-center gap-3"
              >
                <span className="material-symbols-outlined text-xl">add_notes</span>
                Initialize Daily Log
              </button>
            </div>
          </div>


          {(() => {
            const last7Days = recoveryAnalytics.chartData.slice(-7);
            const lastDay = last7Days[last7Days.length - 1];
            
            if (!lastDay) {
              return (
                <div className="mt-16 bg-surface-container dark:bg-slate-900/40 p-16 text-center border-dashed border-sky-500/20 rounded-3xl animate-in fade-in zoom-in-95 duration-1000">
                  <div className="w-20 h-20 bg-sky-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="material-symbols-outlined text-4xl text-sky-500">analytics</span>
                  </div>
                  <h3 className="text-2xl font-headline font-bold text-on-surface dark:text-white mb-2">No Recovery Data Logged</h3>
                  <p className="text-on-surface-variant dark:text-sky-200/50 max-w-md mx-auto leading-relaxed">
                    Once you start logging daily recovery data, this section will transform into a clinical-grade analytics suite with maternal and newborn sleep insights.
                  </p>
                  <button onClick={() => setRecoveryModalOpen(true)} className="mt-8 px-8 py-3 bg-sky-500 text-white rounded-full font-bold shadow-lg hover:opacity-90 transition-all flex items-center gap-2 mx-auto">
                    <span className="material-symbols-outlined">add_circle</span>
                    Log First Entry
                  </button>
                </div>
              );
            }

            const maxMomSleep = last7Days.length > 0 ? Math.max(...last7Days.map(d => d.momSleep)) : 0;
            const stability = recoveryAnalytics.stats.moodStability;

            // Clinical logic helpers
            const getMoodStatus = (s) => s > 85 ? { label: 'Optimal', color: 'bg-sky-500/10 text-sky-400 border-sky-500/20' } : s > 70 ? { label: 'Steady', color: 'bg-sky-400/10 text-sky-300 border-sky-400/20' } : { label: 'Fluctuating', color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
            const moodStatus = getMoodStatus(stability);

            const getNewbornInsight = (d) => {
              const babyName = family?.baby_name || 'The baby';
              const base = `${babyName} is currently ${d.babyFeedingType || 'stabilizing'}. `;
              if (d.babySleep < 11) return base + `Shorter sleep cycles and lower rest blocks detected in the last 24-hour cycle.`;
              if (d.babyDiapers && d.babyDiapers < 5) return base + "Metabolic indicators (diaper output) are currently below the optimal physiological range.";
              if (d.babySleep > 15) return base + `Excellent restorative rest achieved. ${babyName}'s newborn state is stabilizing into healthy circadian rhythms.`;
              return base + "Restorative cycles are currently within healthy clinical parameters.";
            };

            const getMaternalInsight = (d) => {
              if (d.momSleep < 5) return "Maternal rest is currently below the recommended clinical recovery threshold.";
              if (d.momMood < 2) return "Observed emotional fluctuations indicate a need for increased psychological monitoring.";
              if (d.momSleep >= 7 && d.momMood >= 3) return "Optimal recovery day. Both restorative sleep and emotional stability targets have been achieved.";
              return "Sustained stability. Maternal energy reserves and emotional markers are maintaining a healthy baseline.";
            };

            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 mt-16">
                
                {/* Maternal Mood Chart (Line) */}
                <div className="md:col-span-8 bg-surface-container dark:bg-slate-900/50 rounded-lg p-8 shadow-sm border border-outline-variant/10 overflow-hidden">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-display text-2xl text-on-surface font-bold dark:text-white">
                        Maternal Mood <span className="text-on-surface-variant/60 font-normal text-sm ml-2">{new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>
                      </h3>
                      <p className="text-on-surface-variant text-sm dark:text-sky-200/50">7-Day Emotional Trajectory</p>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${moodStatus.color}`}>
                      <span className="material-symbols-outlined text-sm">analytics</span>
                      <span>{moodStatus.label}</span>
                    </div>
                  </div>
                  
                  <div className="relative h-64 flex items-end justify-between gap-2 px-2">
                    <div className="absolute left-0 right-0 top-0 bottom-8 flex flex-col justify-between text-[9px] text-on-surface-variant/30 dark:text-sky-200/20 pointer-events-none uppercase font-black tracking-[0.2em] z-0">
                      <div className="border-b border-outline-variant/10 dark:border-white/5 pb-1">Elevated</div>
                      <div className="border-b border-outline-variant/10 dark:border-white/5 pb-1">Steady</div>
                      <div className="border-b border-outline-variant/10 dark:border-white/5 pb-1">Reflective</div>
                      <div className="pb-1">Resting</div>
                    </div>

                    <svg className="absolute inset-0 w-full h-full overflow-visible z-10" preserveAspectRatio="none" viewBox="0 0 100 100">
                      {last7Days.length >= 2 && (() => {
                        const maxDays = last7Days.length - 1;
                        let d = `M 0,${last7Days[0].yMood}`;
                        for (let i = 0; i < last7Days.length - 1; i++) {
                          const x1 = (i / maxDays) * 100;
                          const x2 = ((i + 1) / maxDays) * 100;
                          const cp1x = x1 + (x2 - x1) * 0.5;
                          d += ` C ${cp1x},${last7Days[i].yMood} ${cp1x},${last7Days[i+1].yMood} ${x2},${last7Days[i+1].yMood}`;
                        }
                        return <path d={d} fill="none" stroke="#0ea5e9" strokeWidth="1.5" strokeLinecap="round" />;
                      })()}
                    </svg>

                    <div className="flex justify-between w-full mt-auto pt-4 text-[10px] font-black text-on-surface-variant/40 dark:text-sky-200/60 uppercase tracking-widest z-20">
                       {last7Days.map((d, i) => (
                         <span key={i}>{d.dayLetter}</span>
                       ))}
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-outline-variant/10 dark:border-white/5 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-sky-500/10 text-sky-500">
                        <span className="material-symbols-outlined text-sm">history</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-sky-400 tracking-widest mb-1">Last Log Status</p>
                        <p className="text-xs text-on-surface dark:text-white font-medium">"{lastDay.notes || 'Routine day'}"</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-500">
                        <span className="material-symbols-outlined text-sm">summarize</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-cyan-500 tracking-widest mb-1">Daily Summary</p>
                        <p className="text-xs text-on-surface-variant dark:text-sky-400 font-bold">
                          {lastDay.momSleep > 6 && lastDay.momMood > 2 
                            ? "Optimal recovery day. Both sleep and mood targets were met." 
                            : "Recovery in progress. Emotional stability was maintained despite shorter sleep blocks."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Maternal Sleep Insight Card: Weekly Recovery Summary */}
                <div 
                  className="md:col-span-4 rounded-3xl bg-sky-500 text-white p-8 flex flex-col justify-between shadow-xl shadow-sky-200/20 border border-white/10 relative overflow-hidden group"
                  style={{ 
                    backgroundImage: `linear-gradient(rgba(14, 165, 233, 0.85), rgba(14, 165, 233, 0.95)), url('/baby_leo_sleeping_1777475740108.png')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  }}
                >
                  <div className="relative z-10 space-y-6">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                      <span className="material-symbols-outlined text-2xl text-white">insights</span>
                    </div>
                    <h3 className="font-display text-2xl font-bold leading-tight">Weekly Recovery Summary</h3>
                    <div className="space-y-4">
                      <p className="opacity-95 text-sm font-medium leading-relaxed">
                        {(() => {
                          const totalHours = last7Days.reduce((acc, d) => acc + parseFloat(d.momSleep), 0).toFixed(1);
                          const avgMood = (last7Days.reduce((acc, d) => acc + d.momMood, 0) / last7Days.length).toFixed(1);
                          
                          return `Over the last 7 days, you have achieved a total of ${totalHours} hours of restorative sleep. Your emotional stability has remained ${stability > 80 ? 'exceptionally high' : 'consistent'} with an average mood score of ${avgMood}/3.`;
                        })()}
                      </p>
                    </div>
                  </div>
                  
                  <div className="relative z-10 mt-8 pt-6 border-t border-white/20">
                    <div className="flex justify-between items-center text-xs font-black uppercase tracking-widest opacity-80">
                       <span>Total Weekly Rest</span>
                       <span>{last7Days.reduce((acc, d) => acc + parseFloat(d.momSleep), 0).toFixed(1)}h</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/20 rounded-full mt-3 overflow-hidden backdrop-blur-sm">
                       <div className="h-full bg-white transition-all duration-1000" style={{ width: `${Math.min(100, (last7Days.reduce((acc, d) => acc + parseFloat(d.momSleep), 0) / 56) * 100)}%` }}></div>
                    </div>
                  </div>
                </div>

                {/* Maternal Sleep (Bar Chart) */}
                <div className="md:col-span-6 bg-surface-container dark:bg-slate-900/50 rounded-lg p-8 shadow-sm border border-outline-variant/10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-display text-xl text-on-surface font-bold dark:text-white">Maternal Sleep</h3>
                      <p className="text-on-surface-variant text-sm dark:text-sky-200/50">Nightly Recovery Logs</p>
                    </div>
                    <p className="text-xs font-bold text-sky-500">Peak: {maxMomSleep}h</p>
                  </div>
                  <div className="flex items-end justify-center h-48 gap-6 px-2">
                    {last7Days.map((d, i) => {
                      const height = (Math.min(12, d.momSleep) / 12) * 100;
                      const isMax = d.momSleep === maxMomSleep;
                      return (
                        <div key={i} className="flex flex-col items-center gap-2 h-full justify-end">
                          <div className={`w-12 ${isMax ? 'bg-sky-400 shadow-[0_0_15px_rgba(56,189,248,0.4)]' : 'bg-surface-container-high dark:bg-sky-900/30 hover:bg-sky-200'} rounded-t-full transition-all group relative`} style={{ height: `${height}%` }}>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-on-surface text-surface text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30">
                              {d.momSleep}h
                            </div>
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${isMax ? 'text-sky-500' : 'text-on-surface-variant/40 dark:text-sky-200/40'}`}>{d.dayLetter}</span>
                        </div>
                      );
                    })}
                  </div>
                    <div className="mt-6 p-4 rounded-xl bg-sky-500/5 border border-sky-500/10">
                      <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1">Analysis & Action</p>
                      <p className="text-[11px] text-on-surface-variant dark:text-sky-200/50 leading-relaxed">
                        {getMaternalInsight(lastDay)}
                      </p>
                    </div>
                </div>

                {/* Newborn Sleep (Area Chart) */}
                <div className="md:col-span-6 bg-surface-container dark:bg-slate-900/50 rounded-lg p-8 shadow-sm border border-outline-variant/10">
                  <div className="flex justify-between items-start mb-8">
                    <div>
                      <h3 className="font-display text-xl text-on-surface font-bold dark:text-white">Newborn Sleep</h3>
                      <p className="text-on-surface-variant text-sm dark:text-sky-200/50">Infant Cycle Consistency</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-medium">
                      <div className="flex items-center gap-1 text-sky-600 dark:text-sky-300"><span className="w-2 h-2 rounded-full bg-sky-500"></span> Deep</div>
                      <div className="flex items-center gap-1 text-sky-400 dark:text-sky-200"><span className="w-2 h-2 rounded-full bg-sky-300"></span> REM</div>
                    </div>
                  </div>
                  <div className="relative h-48 w-full overflow-hidden">
                    <svg className="absolute bottom-0 w-full h-full" preserveAspectRatio="none" viewBox="0 0 100 100">
                      {/* Day 1: Single styled area blip to avoid empty display */}
                      {last7Days.length === 1 && (() => {
                        const h = (last7Days[0].babySleep / 20) * 100;
                        return (
                          <>
                            <rect x="47.5" y={100 - h} width="5" height={h} className="fill-sky-400/20" />
                            <rect x="48.5" y={100 - h + 5} width="3" height={h - 5} className="fill-sky-500/30" />
                          </>
                        );
                      })()}

                      {/* Day 2+: Clinical Area Chart Path */}
                      {last7Days.length >= 2 && (() => {
                        const maxDays = last7Days.length - 1;
                        const getAreaPath = (offset, intensity) => {
                          let d = `M 0,100 L 0,${100 - (last7Days[0].babySleep / 20 * 100 * intensity) - offset}`;
                          for (let i = 0; i < last7Days.length - 1; i++) {
                            const x1 = (i / maxDays) * 100;
                            const x2 = ((i + 1) / maxDays) * 100;
                            const y1 = 100 - (last7Days[i].babySleep / 20 * 100 * intensity) - offset;
                            const y2 = 100 - (last7Days[i+1].babySleep / 20 * 100 * intensity) - offset;
                            const cp1x = x1 + (x2 - x1) * 0.5;
                            d += ` C ${cp1x},${y1} ${cp1x},${y2} ${x2},${y2}`;
                          }
                          d += ` L 100,100 Z`;
                          return d;
                        };
                        return (
                          <>
                            <path d={getAreaPath(0, 0.8)} className="fill-sky-400/20 dark:fill-sky-400/10 transition-colors" />
                            <path d={getAreaPath(5, 0.6)} className="fill-sky-500/30 dark:fill-sky-500/20 transition-colors" />
                          </>
                        );
                      })()}
                    </svg>
                  </div>
                  <div className="mt-8 flex justify-between items-center text-sm border-b border-outline-variant/10 pb-4 mb-4">
                    <p className="text-on-surface-variant/70 font-medium dark:text-sky-200/60">Last Night: <span className="text-sky-500 font-bold">{lastDay.babySleep} hrs</span></p>
                    <p className="text-on-surface-variant/70 font-medium dark:text-sky-200/60">Trend: <span className={lastDay.babySleep > recoveryAnalytics.stats.avgBabySleep ? 'text-green-500' : 'text-amber-500'}>{lastDay.babySleep > recoveryAnalytics.stats.avgBabySleep ? 'Improving' : 'Stalled'}</span></p>
                  </div>
                    <div className="p-4 rounded-xl bg-sky-500/5 border border-sky-500/10">
                      <p className="text-[10px] font-bold text-sky-500 uppercase tracking-widest mb-1">Newborn Support Guide</p>
                      <p className="text-[11px] text-on-surface-variant dark:text-sky-200/50 leading-relaxed">
                        {getNewbornInsight(lastDay)}
                      </p>
                    </div>
                </div>
              </div>
            );
          })()}
          <div className="space-y-12 pt-10">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
               <div className="flex items-center gap-6 flex-1">
                  <h3 className="font-headline text-4xl font-bold text-on-surface dark:text-white">Historical <span className="text-gradient">Registry</span></h3>
                  <div className="h-px flex-1 bg-gradient-to-r from-sky-500/30 to-transparent"></div>
               </div>
               
               <div className="flex items-center gap-4">
                  <div className="relative group">
                    <input 
                      type="text"
                      placeholder="Search registry..."
                      value={historySearch}
                      onChange={(e) => setHistorySearch(e.target.value)}
                      className="pl-10 pr-4 py-2 bg-surface-container border border-outline-variant/10 dark:border-white/10 rounded-full text-xs text-on-surface dark:text-white focus:ring-2 focus:ring-sky-500 transition-all w-48 group-hover:w-64"
                    />
                    <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-on-surface-variant/50 dark:text-slate-500">search</span>
                  </div>
                  
                  <button 
                    onClick={() => setShowAllHistory(!showAllHistory)}
                    className="flex items-center gap-2 px-4 py-2 bg-sky-500/10 hover:bg-sky-500/20 text-sky-500 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    <span className="material-symbols-outlined text-sm">{showAllHistory ? 'unfold_less' : 'history'}</span>
                    {showAllHistory ? 'Collapse' : 'View Archive'}
                  </button>
               </div>
            </div>

            <div className="grid grid-cols-1 gap-12 relative before:absolute before:left-[-2rem] before:top-0 before:bottom-0 before:w-px before:bg-gradient-to-b before:from-sky-500 before:to-transparent">
              {recoveryLogs.length === 0 ? (
                <div className="p-20 bg-surface-container text-center border-dashed border-outline-variant/20 dark:border-white/10">
                  <p className="text-xl font-headline font-bold text-on-surface-variant dark:text-slate-500">No archival data found. The narrative begins with the first log.</p>
                </div>
              ) : (
                (() => {
                  const filtered = recoveryLogs.filter(log => 
                    new Date(log.date).toLocaleDateString().includes(historySearch) || 
                    (log.notes && log.notes.toLowerCase().includes(historySearch.toLowerCase()))
                  );
                  const displayLogs = showAllHistory ? filtered : filtered.slice(0, 3);
                  
                  return displayLogs.map((log) => (
                    <div key={log.id} className="relative group animate-in fade-in slide-in-from-left-4 duration-500">
                    <div className="absolute left-[-2.3rem] top-2 w-3 h-3 rounded-full bg-sky-500 shadow-[0_0_15px_rgba(56,189,248,0.8)] ring-4 ring-on-surface-variant/10"></div>
                    
                    <div className="bg-surface-container/50 dark:bg-slate-900/50 p-10 hover:border-sky-500/40 border border-outline-variant/10 rounded-3xl transition-all duration-700 hover:translate-x-2">
                      <div className="flex flex-col lg:flex-row gap-10">
                        <div className="lg:w-48">
                          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-sky-600 dark:text-sky-500 mb-2">Timestamp</p>
                          <h4 className="font-headline text-xl font-bold text-on-surface dark:text-white">
                            {new Date(log.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </h4>
                          <p className="text-xs font-bold text-on-surface-variant/60 dark:text-slate-500 uppercase mt-1">{new Date(log.date).toLocaleDateString('en-US', { weekday: 'long' })}</p>
                        </div>

                        <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-8">
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-on-surface-variant/60 dark:text-slate-500 uppercase tracking-widest">Mood</p>
                            <p className={`font-bold ${MOOD_COLORS[log.mood]}`}>{MOOD_LABELS[log.mood]}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-on-surface-variant/60 dark:text-slate-500 uppercase tracking-widest">Sleep</p>
                            <p className="font-bold text-on-surface dark:text-white">{log.sleep_hours}h</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-on-surface-variant/60 dark:text-slate-500 uppercase tracking-widest">Pain</p>
                            <p className="font-bold text-on-surface dark:text-white">{log.pain_level}/10</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-xs font-bold text-on-surface-variant/60 dark:text-slate-500 uppercase tracking-widest">Baby Sleep</p>
                            <p className="font-bold text-on-surface dark:text-white">{log.baby_sleep_hours}h</p>
                          </div>
                        </div>

                        <div className="lg:w-80 flex flex-col gap-4">
                          <div className="bg-surface-container dark:bg-black/20 p-6 rounded-2xl border border-outline-variant/10 dark:border-white/5 relative overflow-hidden flex-1">
                             <div className="absolute top-0 right-0 p-2 opacity-10">
                                <span className="material-symbols-outlined text-4xl text-sky-500">sticky_note</span>
                             </div>
                             <p className="text-sm font-medium text-on-surface-variant dark:text-slate-400 leading-relaxed italic">
                               {log.notes || "No clinical observations documented for this period."}
                             </p>
                          </div>
                          
                          <div className="flex gap-2">
                             <button 
                               onClick={() => openEditLog(log)}
                               className="flex-1 py-3 bg-surface-container dark:bg-white/5 hover:bg-sky-500/10 border border-outline-variant/10 dark:border-white/5 hover:border-sky-500/30 text-on-surface-variant dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 rounded-xl transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest"
                             >
                               <span className="material-symbols-outlined text-sm">edit</span>
                               Edit
                             </button>
                             <button 
                                onClick={() => setConfirmConfig({
                                  open: true,
                                  type: 'log',
                                  id: log.id,
                                  title: 'Delete Recovery Log?',
                                  message: 'This will permanently remove this daily log entry from the registry.',
                                  confirmText: 'Delete Log',
                                  icon: 'history'
                                })}
                                className="px-4 py-3 bg-surface-container dark:bg-white/5 hover:bg-rose-500/10 border border-outline-variant/10 dark:border-white/5 hover:border-rose-500/30 text-on-surface-variant dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-500 rounded-xl transition-all flex items-center justify-center"
                              >
                                <span className="material-symbols-outlined text-sm">delete</span>
                              </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ));
              })()
            )}
            </div>
          </div>
        </div>
      )}

      {/* —— EDIT FAMILY MODAL —— */}
      <Modal isOpen={editOpen} onClose={() => { setEditOpen(false); setApiError(''); }} title="Edit Family Profile">
        <form onSubmit={saveEdit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {apiError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {apiError}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Mother's Name *</label>
              <input 
                type="text" required 
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                value={editData.mother_name || ''} 
                onChange={e => setEditData({...editData, mother_name: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Partner's Name</label>
              <input 
                type="text" 
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                value={editData.partner_name || ''} 
                onChange={e => setEditData({...editData, partner_name: e.target.value})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Phone Number</label>
              <input 
                type="tel" 
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                value={editData.phone || ''} 
                onChange={e => setEditData({...editData, phone: e.target.value})} 
              />
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Email Address</label>
              <input 
                type="email" 
                className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                value={editData.email || ''} 
                onChange={e => setEditData({...editData, email: e.target.value})} 
              />
            </div>
          </div>

          <div>
            <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Home Address</label>
            <textarea 
              className="w-full p-3 rounded-xl border border-outline-variant/30 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all min-h-[80px]" 
              value={editData.address || ''} 
              onChange={e => setEditData({...editData, address: e.target.value})} 
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Baby's Name</label>
              <input className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={editData.baby_name || ''} onChange={e => setEditData({...editData, baby_name: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Birth Date</label>
              <div className="relative">
                <input type="date" className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none custom-date-input" value={editData.birth_date || ''} onChange={e => setEditData({...editData, birth_date: e.target.value})} />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none text-xl">event</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Delivery Type</label>
              <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-[#0f172a] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={editData.delivery_type || ''} onChange={e => setEditData({...editData, delivery_type: e.target.value})}>
                {DELIVERY_TYPES.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Feeding Plan</label>
              <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-[#0f172a] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={editData.feeding_plan || ''} onChange={e => setEditData({...editData, feeding_plan: e.target.value})}>
                {FEEDING_PLANS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs mb-2 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Services</label>
            <div className="flex flex-wrap gap-2">
              {SERVICES_OPTIONS.map(svc => (
                <button type="button" key={svc} onClick={() => toggleService(svc)} className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${selectedServices.includes(svc) ? 'bg-primary text-on-primary border-transparent' : 'border-slate-300 dark:border-white/10 text-on-surface-variant dark:text-slate-400 hover:border-primary'}`}>
                  {svc}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Care Status</label>
              <select className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-[#0f172a] dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none" value={editData.status || ''} onChange={e => setEditData({...editData, status: e.target.value})}>
                {CARE_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="pt-4 flex gap-3">
            <button type="submit" disabled={isSaving} className="flex-1 py-4 bg-primary hover:opacity-90 text-on-primary font-bold rounded-xl flex justify-center items-center shadow-lg">
              {isSaving ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Save Changes'}
            </button>
            <button 
              type="button" 
              onClick={() => {
                setEditOpen(false);
                setConfirmConfig({
                  open: true,
                  type: 'family',
                  title: 'Delete Family Profile?',
                  message: 'This will permanently remove all care logs, visits, and clinical notes for this family. This action is irreversible.',
                  confirmText: 'Delete Everything',
                  icon: 'heart_broken'
                });
              }} 
              className="px-5 py-4 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 rounded-xl transition-all flex items-center justify-center shadow-sm"
              title="Delete Family"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </form>
      </Modal>
      
      {/* —— BEAUTIFUL CONFIRMATION MODAL —— */}
      <Modal isOpen={confirmConfig.open} onClose={() => { setConfirmConfig(prev => ({ ...prev, open: false })); setApiError(''); }} hideHeader>
        <div className="p-8 text-center">
          {apiError && (
            <div className="mb-6 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold">
              <span className="material-symbols-outlined text-sm">error</span>
              {apiError}
            </div>
          )}
          <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${confirmConfig.type === 'family' ? 'bg-rose-500/10 text-rose-500' : 'bg-amber-500/10 text-amber-500'} animate-bounce-subtle`}>
            <span className="material-symbols-outlined text-4xl">{confirmConfig.icon}</span>
          </div>
          
          <h3 className="font-headline text-3xl font-bold text-on-surface dark:text-white mb-3">
            {confirmConfig.title}
          </h3>
          
          <p className="text-on-surface-variant dark:text-slate-400 text-sm leading-relaxed mb-10 max-w-[280px] mx-auto">
            {confirmConfig.message}
          </p>
          
          <div className="flex flex-col gap-3">
            <button 
              onClick={handleConfirmAction}
              className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded-2xl transition-all shadow-lg shadow-rose-500/20 active:scale-95"
            >
              {confirmConfig.confirmText}
            </button>
            <button 
              onClick={() => setConfirmConfig(prev => ({ ...prev, open: false }))}
              className="w-full py-4 bg-white/5 hover:bg-white/10 text-on-surface-variant dark:text-slate-300 font-bold rounded-2xl transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>

      {/* —— SCHEDULE VISIT MODAL —— */}
      <Modal isOpen={visitModalOpen} onClose={() => { setVisitModalOpen(false); setEditingVisitId(null); setVisitStep(1); setApiError(''); }} title={editingVisitId ? "Clinical Session Update" : "Session Planning"}>
        <form onSubmit={postVisit} className="space-y-6">
          {apiError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {apiError}
            </div>
          )}
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-6">
            {[1, 2].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${visitStep >= s ? 'bg-baby-blue dark:bg-sky-500' : 'bg-white/10'}`}></div>
            ))}
          </div>

          {/* —— NEW VISIT FLOW —— */}
          {!editingVisitId && (
            <>
              {visitStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="p-4 rounded-2xl bg-baby-blue/10 dark:bg-sky-500/5 border border-baby-blue/20 dark:border-sky-500/10">
                    <p className="text-[11px] text-baby-blue dark:text-sky-400 font-medium leading-relaxed">
                      <span className="font-black uppercase tracking-widest mr-2">Step 1:</span>
                      Define your arrival and duration for this care session.
                    </p>
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Arrival Time</label>
                      <div className="relative">
                        <input type="datetime-local" required className="w-full pl-4 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-baby-blue dark:focus:ring-sky-500 focus:outline-none transition-all custom-date-input" value={visitForm.scheduled_date} onChange={e => setVisitForm({...visitForm, scheduled_date: e.target.value})} />
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none">calendar_today</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Duration</label>
                      <div className="relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-sky-400">schedule</span>
                        <select className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-baby-blue dark:focus:ring-sky-500 focus:outline-none transition-all appearance-none" value={visitForm.duration_hours} onChange={e => setVisitForm({...visitForm, duration_hours: e.target.value})}>
                          {['1', '1.5', '2', '2.5', '3', '3.5', '4', '5', '6', '8'].map(h => <option key={h} value={h}>{h} Hours</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                  <button type="button" onClick={() => visitForm.scheduled_date ? setVisitStep(2) : null} className="w-full py-5 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl shadow-baby-blue/20 dark:shadow-sky-500/20 active:scale-95 transition-transform">
                    Next: Care Focus <span className="material-symbols-outlined text-sm ml-2">arrow_forward</span>
                  </button>
                </div>
              )}

              {visitStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Primary Care Focus</label>
                    <div className="grid grid-cols-1 gap-2">
                      {FOCUS_AREAS.map(area => (
                        <button type="button" key={area} onClick={() => setVisitForm({...visitForm, focus_area: area})}
                          className={`px-4 py-4 rounded-2xl text-xs font-bold border transition-all text-left flex items-center justify-between ${visitForm.focus_area === area ? 'bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 border-transparent shadow-lg shadow-baby-blue/20 dark:shadow-sky-500/20' : 'border-white/5 text-slate-500 hover:border-baby-blue/30 dark:hover:border-sky-500/30'}`}>
                          {area}
                          {visitForm.focus_area === area && <span className="material-symbols-outlined text-sm text-sky-400">check_circle</span>}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setVisitStep(1)} className="flex-1 py-5 bg-white/5 text-slate-400 font-bold rounded-full text-xs uppercase tracking-widest">Back</button>
                    <button type="submit" disabled={isPosting} className="flex-[2] py-5 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl shadow-baby-blue/20 dark:shadow-sky-500/20 active:scale-95 transition-transform">
                      {isPosting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Schedule Visit'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {/* —— UPDATE VISIT FLOW —— */}
          {editingVisitId && (
            <>
              {visitStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Session Outcome</label>
                      <div className="grid grid-cols-2 gap-2">
                        {['SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED'].map(s => (
                          <button type="button" key={s} onClick={() => setVisitForm({...visitForm, status: s})}
                            className={`px-3 py-4 rounded-2xl text-[10px] font-black uppercase tracking-tight border transition-all text-center ${visitForm.status === s ? 'bg-emerald-500 text-white border-transparent' : 'border-white/5 text-slate-500 hover:border-emerald-500/30'}`}>
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Refined Focus</label>
                      <select className="w-full px-4 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-baby-blue dark:focus:ring-sky-500 focus:outline-none transition-all appearance-none" value={visitForm.focus_area} onChange={e => setVisitForm({...visitForm, focus_area: e.target.value})}>
                        {FOCUS_AREAS.map(area => <option key={area} value={area}>{area}</option>)}
                      </select>
                    </div>
                  </div>
                  <button type="button" onClick={() => setVisitStep(2)} className="w-full py-5 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl active:scale-95 transition-transform">
                    Next: Clinical Notes <span className="material-symbols-outlined text-sm ml-2">arrow_forward</span>
                  </button>
                </div>
              )}

              {visitStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Clinical Narrative</label>
                    <textarea rows={8} className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-baby-blue dark:focus:ring-sky-500 focus:outline-none resize-none transition-all" value={visitForm.notes} onChange={e => setVisitForm({...visitForm, notes: e.target.value})} placeholder="Document detailed clinical observations..." />
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => setVisitStep(1)} className="flex-1 py-5 bg-white/5 text-slate-400 font-bold rounded-full text-xs uppercase tracking-widest">Back</button>
                    <button type="submit" disabled={isPosting} className="flex-[2] py-5 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl active:scale-95 transition-transform">
                      {isPosting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Save Archive'}
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </form>
      </Modal>

      {/* —— LOG NOTE MODAL —— */}
      <Modal isOpen={noteModalOpen} onClose={() => { setNoteModalOpen(false); setApiError(''); }} title="Log Care Note">
        <form onSubmit={postNote} className="space-y-5">
          {apiError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {apiError}
            </div>
          )}
          <div>
            <label className="block text-xs mb-2 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Note Type</label>
            <div className="flex flex-wrap gap-2">
              {NOTE_TYPES.map(type => (
                <button type="button" key={type} onClick={() => setNoteForm({...noteForm, type})}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${noteForm.type === type ? 'bg-primary text-on-primary border-transparent' : 'border-slate-300 dark:border-white/10 text-on-surface-variant dark:text-slate-400 hover:border-primary'}`}>
                  {type === 'PPA/PPD Flag' ? 'FLAG: ' : ''}{type}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Note Content *</label>
            <textarea rows={5} required className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none" value={noteForm.content} onChange={e => setNoteForm({...noteForm, content: e.target.value})} placeholder="Document clinical observations, feeding patterns, emotional state..." />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-rose-500/5 border border-rose-400/20">
            <input type="checkbox" id="flag_n" className="w-4 h-4 accent-rose-500" checked={noteForm.is_flagged} onChange={e => setNoteForm({...noteForm, is_flagged: e.target.checked})} />
            <label htmlFor="flag_n" className="text-sm font-bold text-rose-600 dark:text-rose-400 cursor-pointer">Flag for PPA/PPD priority review</label>
          </div>
          <button type="submit" disabled={isPosting} className="w-full py-4 bg-primary hover:opacity-90 text-on-primary font-bold rounded-xl flex justify-center items-center shadow-lg">
            {isPosting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Save Note Securely'}
          </button>
        </form>
      </Modal>

      {/* —— RECORD PAYMENT MODAL —— */}
      <Modal isOpen={paymentModalOpen} onClose={() => { setPaymentModalOpen(false); setApiError(''); }} title="Record Package Investment">
        <form onSubmit={postPayment} className="space-y-6">
          {apiError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {apiError}
            </div>
          )}
          <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 mb-2">
            <p className="text-[11px] text-primary dark:text-sky-400 font-medium leading-relaxed">
              <span className="font-black uppercase tracking-widest mr-2">Financial Note:</span>
              Recording a package investment creates a permanent tracking record for this family's care layer.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Investment Package / Service</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-sky-400">package_2</span>
                <input 
                  type="text" 
                  required 
                  placeholder="e.g. Full Postpartum Support Package"
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                  value={paymentForm.service_name} 
                  onChange={e => setPaymentForm({...paymentForm, service_name: e.target.value})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Total Amount ($)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-sky-400">attach_money</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                    value={paymentForm.total_amount} 
                    onChange={e => setPaymentForm({...paymentForm, total_amount: e.target.value})} 
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Initial Paid ($)</label>
                <div className="relative">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-sky-400">account_balance_wallet</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                    value={paymentForm.paid_amount} 
                    onChange={e => setPaymentForm({...paymentForm, paid_amount: e.target.value})} 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Expected Completion / Due Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full pl-4 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all custom-date-input" 
                  value={paymentForm.due_date} 
                  onChange={e => setPaymentForm({...paymentForm, due_date: e.target.value})} 
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none">event</span>
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isPosting} 
            className="w-full py-5 bg-primary text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4"
          >
            {isPosting ? <span className="material-symbols-outlined animate-spin">refresh</span> : editingPayment ? 'Update Investment Record' : 'Finalize Investment Record'}
          </button>
        </form>
      </Modal>

      {/* —— ADD PAYMENT LOG MODAL —— */}
      <Modal isOpen={paymentLogModalOpen} onClose={() => { setPaymentLogModalOpen(false); setApiError(''); }} title="Record Payment">
        <form onSubmit={addPaymentLog} className="space-y-6">
          {apiError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {apiError}
            </div>
          )}
          <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/10 mb-2">
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium leading-relaxed">
              <span className="font-black uppercase tracking-widest mr-2">Payment Note:</span>
              Recording a payment of <span className="font-bold">${selectedPayment?.remaining_amount?.toLocaleString() || 0}</span> will mark this invoice as paid.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Payment Amount ($)</label>
              <div className="relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-sky-400">attach_money</span>
                <input 
                  type="number" 
                  step="0.01" 
                  required 
                  max={selectedPayment?.remaining_amount}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                  value={paymentLogForm.amount} 
                  onChange={e => setPaymentLogForm({...paymentLogForm, amount: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Payment Date</label>
              <div className="relative">
                <input 
                  type="date" 
                  className="w-full pl-4 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all custom-date-input" 
                  value={paymentLogForm.created_at} 
                  onChange={e => setPaymentLogForm({...paymentLogForm, created_at: e.target.value})} 
                />
                <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none">event</span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Note (Optional)</label>
              <textarea 
                className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all resize-none" 
                rows={3}
                placeholder="e.g. Payment via bank transfer..."
                value={paymentLogForm.note} 
                onChange={e => setPaymentLogForm({...paymentLogForm, note: e.target.value})}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isPosting} 
            className="w-full py-5 bg-primary text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl shadow-primary/20 active:scale-95 transition-all mt-4"
          >
            {isPosting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Record Payment'}
          </button>
        </form>
      </Modal>

      {/* —— PAYMENT HISTORY MODAL —— */}
      <Modal isOpen={paymentHistoryModalOpen} onClose={() => { setPaymentHistoryModalOpen(false); setPaymentLogs([]); }} title="Payment History">
        <div className="space-y-4">
          {paymentLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500 italic">
              No payment history recorded.
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {paymentLogs.map(log => (
                <div key={log.id} className="flex justify-between items-center p-4 bg-surface-container-low dark:bg-white/5 rounded-2xl border border-outline-variant/10 dark:border-white/5">
                  <div>
                    <div className="text-sm font-bold text-on-surface dark:text-white">${parseFloat(log.amount).toLocaleString()}</div>
                    <div className="text-[10px] text-slate-500">{new Date(log.created_at).toLocaleDateString()}</div>
                    {log.note && <div className="text-[10px] text-slate-400 mt-1">{log.note}</div>}
                  </div>
                  <span className="material-symbols-outlined text-emerald-500">check_circle</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* —— CREATE INVOICE MODAL —— */}
      <Modal isOpen={invoiceModalOpen} onClose={() => { setInvoiceModalOpen(false); setApiError(''); }} title="Create Invoice">
        <form onSubmit={postInvoice} className="space-y-4">
          {apiError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {apiError}
            </div>
          )}
          <div>
            <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Service Description</label>
            <input className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-secondary focus:outline-none" value={invoiceForm.description} onChange={e => setInvoiceForm({...invoiceForm, description: e.target.value})} placeholder="e.g. Week 2 Postpartum Care Package" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Amount (USD) *</label>
              <input type="number" step="0.01" required className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-secondary focus:outline-none" value={invoiceForm.amount} onChange={e => setInvoiceForm({...invoiceForm, amount: e.target.value})} />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Due Date</label>
              <div className="relative">
                <input type="date" className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-secondary focus:outline-none custom-date-input" value={invoiceForm.due_date} onChange={e => setInvoiceForm({...invoiceForm, due_date: e.target.value})} />
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none text-xl">event</span>
              </div>
            </div>
          </div>
          <button type="submit" disabled={isPosting} className="w-full py-4 bg-secondary hover:opacity-90 text-on-secondary font-bold rounded-xl flex justify-center items-center shadow-lg mt-2">
            {isPosting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Issue Invoice'}
          </button>
        </form>
      </Modal>

      {/* —— DAILY RECOVERY LOG MODAL —— */}
      <Modal isOpen={recoveryModalOpen} onClose={() => { setRecoveryModalOpen(false); setEditingLogId(null); setRecoveryStep(1); setApiError(''); }} title={editingLogId ? "Update Clinical Entry" : "Log Daily Recovery Entry"}>
        <form onSubmit={handleSubmitRecovery} className="space-y-6">
          {apiError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {apiError}
            </div>
          )}
          {/* Progress Indicator */}
          <div className="flex gap-2 mb-8">
            {[1, 2, 3].map(s => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${recoveryStep >= s ? 'bg-primary dark:bg-sky-500 shadow-[0_0_10px_rgba(14,165,233,0.3)]' : 'bg-surface-container-highest dark:bg-white/5'}`}></div>
            ))}
          </div>

          {/* STEP 1: Clinical Timeline */}
          {recoveryStep === 1 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col items-center text-center p-6 bg-primary/5 rounded-[2rem] border border-primary/10">
                <h3 className="font-headline text-xl font-bold text-on-surface dark:text-white mb-2">Clinical Timeline</h3>
                <p className="text-xs text-on-surface-variant dark:text-slate-400 max-w-[240px]">Select the date for this recovery snapshot. Accuracy helps track trajectories.</p>
              </div>
              
              <div className="space-y-2">
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Log Date</label>
                <div className="relative">
                  <input type="date" required className="w-full pl-4 pr-12 py-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all custom-date-input" value={recoveryForm.date} onChange={e => setRecoveryForm({...recoveryForm, date: e.target.value})} />
                  <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-sky-400 pointer-events-none">calendar_today</span>
                </div>
              </div>

              <button type="button" onClick={() => setRecoveryStep(2)} className="w-full py-5 bg-primary dark:bg-sky-500 text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl active:scale-95 transition-transform">
                Next: Mother Wellness <span className="material-symbols-outlined text-sm ml-2">arrow_forward</span>
              </button>
            </div>
          )}

          {/* STEP 2: Mother Wellness */}
          {recoveryStep === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/10">
                <div className="w-10 h-10 rounded-xl bg-baby-blue/10 dark:bg-sky-500/10 flex items-center justify-center text-baby-blue dark:text-sky-400">
                  <span className="material-symbols-outlined text-sky-400">spa</span>
                </div>
                <h3 className="font-headline text-xl font-bold text-on-surface dark:text-white">Mother Wellness</h3>
              </div>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500 mb-4 text-center md:text-left">Daily Mood Reflection</label>
                  <div className="grid grid-cols-3 gap-3">
                    {MOOD_OPTIONS.map(opt => (
                      <button type="button" key={opt.value} onClick={() => setRecoveryForm({...recoveryForm, mood: opt.value})}
                        className={`group py-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${recoveryForm.mood === opt.value ? `bg-sky-500/10 border-sky-400 shadow-[0_0_15px_rgba(137,207,240,0.1)]` : 'border-outline-variant/10 dark:border-white/5 bg-white dark:bg-slate-950/50 grayscale opacity-60 hover:grayscale-0 hover:opacity-100'}`}>
                        <span className={`material-symbols-outlined text-3xl ${recoveryForm.mood === opt.value ? `text-sky-400` : 'text-sky-400'}`}>
                          {opt.value === 'happy' ? 'sentiment_very_satisfied' : opt.value === 'neutral' ? 'sentiment_neutral' : 'sentiment_very_dissatisfied'}
                        </span>
                        <span className={`text-[10px] font-black uppercase tracking-widest ${recoveryForm.mood === opt.value ? `text-sky-400` : 'text-sky-400'}`}>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">Sleep Duration</label>
                    <div className="relative">
                      <input type="number" step="0.5" min="0" max="24" className="w-full p-4 rounded-xl border border-outline-variant/20 dark:border-white/10 bg-white dark:bg-slate-950 dark:text-white text-lg font-bold focus:ring-2 focus:ring-baby-blue focus:outline-none transition-all pr-12" value={recoveryForm.sleep_hours} onChange={e => setRecoveryForm({...recoveryForm, sleep_hours: e.target.value})} placeholder="0.0" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">hrs</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">Pain Intensity</label>
                    <div className="relative">
                      <input type="number" min="0" max="10" className="w-full p-4 rounded-xl border border-outline-variant/20 dark:border-white/10 bg-white dark:bg-slate-950 dark:text-white text-lg font-bold focus:ring-2 focus:ring-baby-blue focus:outline-none transition-all pr-12" value={recoveryForm.pain_level} onChange={e => setRecoveryForm({...recoveryForm, pain_level: parseInt(e.target.value) || 0})} />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">/10</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">Clinical Observations</label>
                  <textarea rows={3} className="w-full p-4 rounded-xl border border-outline-variant/20 dark:border-white/10 bg-white dark:bg-slate-950 dark:text-white text-sm font-medium focus:ring-2 focus:ring-baby-blue focus:outline-none resize-none transition-all" value={recoveryForm.notes} onChange={e => setRecoveryForm({...recoveryForm, notes: e.target.value})} placeholder="Document physical and emotional recovery progress..." />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setRecoveryStep(1)} className="flex-1 py-5 bg-white/5 text-slate-400 font-bold rounded-full text-xs uppercase tracking-widest">Back</button>
                <button type="button" onClick={() => setRecoveryStep(3)} className="flex-[2] py-5 bg-primary dark:bg-sky-500 text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl active:scale-95 transition-transform">
                  Next: Newborn Patterns <span className="material-symbols-outlined text-sm ml-2">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Newborn Patterns */}
          {recoveryStep === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/10">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
                  <span className="material-symbols-outlined text-sky-400">child_care</span>
                </div>
                <h3 className="font-headline text-xl font-bold text-on-surface dark:text-white">Newborn Patterns</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500 mb-4">Feeding Method</label>
                  <div className="flex flex-wrap gap-2">
                    {BABY_FEEDING_TYPES.map(ft => (
                      <button type="button" key={ft} onClick={() => setRecoveryForm({...recoveryForm, baby_feeding_type: ft})}
                        className={`px-6 py-3 rounded-full text-xs font-bold border-2 transition-all capitalize ${recoveryForm.baby_feeding_type === ft ? 'bg-sky-500 dark:bg-sky-500 text-white border-transparent shadow-lg shadow-sky-500/20' : 'border-outline-variant/10 dark:border-white/5 bg-white dark:bg-slate-950/50 text-on-surface-variant dark:text-slate-400 hover:border-sky-500/30'}`}>
                        {ft}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">Feeding Issues & Milestones</label>
                  <input className="w-full p-4 rounded-xl border border-outline-variant/20 dark:border-white/10 bg-white dark:bg-slate-950 dark:text-white text-sm font-medium focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all" value={recoveryForm.baby_feeding_issues} onChange={e => setRecoveryForm({...recoveryForm, baby_feeding_issues: e.target.value})} placeholder="e.g. Latching, reflux, first smile..." />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-500">Baby Sleep</label>
                    <div className="relative">
                      <input type="number" step="0.5" min="0" max="24" className="w-full p-4 rounded-xl border border-outline-variant/20 dark:border-white/10 bg-white dark:bg-slate-950 dark:text-white text-lg font-bold focus:ring-2 focus:ring-sky-500 focus:outline-none transition-all pr-12" value={recoveryForm.baby_sleep_hours} onChange={e => setRecoveryForm({...recoveryForm, baby_sleep_hours: e.target.value})} placeholder="0.0" />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 uppercase">hrs</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setRecoveryStep(2)} className="flex-1 py-5 bg-white/5 text-slate-400 font-bold rounded-full text-xs uppercase tracking-widest">Back</button>
                <button 
                  type="submit" 
                  disabled={isPosting} 
                  className="flex-[2] py-5 bg-emerald-500 text-white font-black uppercase tracking-widest text-xs rounded-full flex justify-center items-center shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform"
                >
                  {isPosting ? <span className="material-symbols-outlined animate-spin text-2xl">refresh</span> : (
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined">{editingLogId ? 'save_as' : 'save'}</span>
                      {editingLogId ? 'Update Record' : 'Finalize Log'}
                    </div>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </Modal>
      {/* —— CLINICAL REPORT CUSTOMIZER MODAL —— */}
      <Modal isOpen={reportModalOpen} onClose={() => setReportModalOpen(false)} title="Export Clinical Report">
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-primary/5 border border-primary/10">
            <div className="flex items-center gap-4 mb-4">
              {user?.photo_url ? (
                <img src={user.photo_url} className="w-12 h-12 rounded-lg object-cover border border-white/20" alt="Brand Logo" />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">business</span>
                </div>
              )}
              <div>
                <h4 className="text-sm font-bold text-on-surface dark:text-white">{user?.name || 'HymyMom Pro'}</h4>
                <p className="text-[10px] text-on-surface-variant/70 dark:text-slate-400 font-medium uppercase tracking-widest">Practitioner Branding</p>
              </div>
            </div>
            <p className="text-[11px] text-on-surface-variant dark:text-slate-400 leading-relaxed">
              This report will be branded with your professional identity as defined in your settings.
            </p>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Practitioner's Summary / Personal Note</label>
            <textarea 
              rows={5} 
              className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none resize-none transition-all" 
              value={reportNote} 
              onChange={e => setReportNote(e.target.value)} 
              placeholder="Add a custom note or recovery summary for the client..." 
            />
            <p className="text-[10px] text-slate-400 italic mt-1">This note will appear prominently at the beginning of the PDF report.</p>
          </div>

          <div className="pt-4 flex gap-3">
            <button onClick={() => setReportModalOpen(false)} className="flex-1 py-4 bg-white/5 text-slate-400 font-bold rounded-2xl text-xs uppercase tracking-widest">Cancel</button>
            <button 
              onClick={generateReportPDF} 
              className="flex-[2] py-4 bg-primary dark:bg-sky-500 text-on-primary dark:text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl flex justify-center items-center shadow-xl active:scale-95 transition-all"
            >
              <span className="material-symbols-outlined text-sm mr-2">picture_as_pdf</span>
              Finalize & Download PDF
            </button>
          </div>
        </div>
      </Modal>
      {/* —— SUCCESS CELEBRATION MODAL —— */}
      <Modal isOpen={showCelebration} onClose={() => setShowCelebration(false)} title="">
        <div className="py-12 flex flex-col items-center text-center">
          <div className="relative mb-8">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce">
              <span className="material-symbols-outlined text-5xl text-white">check</span>
            </div>
            {/* Decorative particles (simulated) */}
            <div className="absolute -top-4 -left-4 w-4 h-4 bg-amber-400 rounded-full animate-ping"></div>
            <div className="absolute -bottom-4 -right-4 w-3 h-3 bg-sky-400 rounded-full animate-ping delay-300"></div>
            <div className="absolute top-1/2 -right-8 w-2 h-2 bg-emerald-400 rounded-full animate-ping delay-700"></div>
          </div>
          
          <h2 className="text-3xl font-headline font-bold text-on-surface dark:text-white mb-4">Payment Balanced!</h2>
          <p className="text-on-surface-variant dark:text-slate-400 max-w-xs mx-auto leading-relaxed">
            The treasury for <span className="text-primary font-bold">{celebratedClient}</span> has been successfully balanced.
          </p>
          
          <div className="mt-10 w-full">
            <button 
              onClick={() => setShowCelebration(false)}
              className="w-full py-4 bg-primary dark:bg-sky-500 text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Return to Ledger
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
