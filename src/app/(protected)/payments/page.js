"use client";

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import Modal from '@/components/Modal';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';

const STATUS_COLORS = {
  PAID: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20',
  PARTIAL: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20',
  OVERDUE: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20',
  UNPAID: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20',
};

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [families, setFamilies] = useState([]);
  const [familiesMap, setFamiliesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  // Modals state
  const [addPaymentModalOpen, setAddPaymentModalOpen] = useState(false);
  const [newLogModalOpen, setNewLogModalOpen] = useState(false);
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [paymentLogs, setPaymentLogs] = useState([]);

  // Form states
  const [paymentForm, setPaymentForm] = useState({
    family_id: '',
    service_name: '',
    total_amount: '',
    due_date: '',
  });

  const [logForm, setLogForm] = useState({
    amount: '',
    note: '',
    created_at: new Date().toISOString().split('T')[0],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();

  const fetchFamilies = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from('families').select('id, mother_name').eq('user_id', user.id);
    if (data) {
      setFamilies(data);
      const map = {};
      data.forEach(f => map[f.id] = f);
      setFamiliesMap(map);
    }
  }, [user]);

  const fetchPayments = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    if (data) {
      // Refresh status logic based on date
      const today = new Date().toISOString().split('T')[0];
      const updated = data.map(p => {
        // If manually cancelled, keep it cancelled
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
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchFamilies();
    fetchPayments();
  }, [fetchFamilies, fetchPayments]);

  const handleCreatePayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const payload = {
      ...paymentForm,
      user_id: user?.id,
      total_amount: parseFloat(paymentForm.total_amount),
      paid_amount: 0,
      remaining_amount: parseFloat(paymentForm.total_amount),
      status: 'UNPAID'
    };

    const { error: insertError } = await supabase.from('payments').insert([payload]);
    if (insertError) {
      setError(insertError.message);
    } else {
      setAddPaymentModalOpen(false);
      setPaymentForm({ family_id: '', service_name: '', total_amount: '', due_date: '' });
      fetchPayments();
    }
    setIsSubmitting(false);
  };

  const handleUpdatePayment = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const { error: updateError } = await supabase
      .from('payments')
      .update({
        service_name: paymentForm.service_name,
        total_amount: parseFloat(paymentForm.total_amount),
        remaining_amount: parseFloat(paymentForm.total_amount) - (editingPayment.paid_amount || 0),
        due_date: paymentForm.due_date,
      })
      .eq('id', editingPayment.id);

    if (updateError) {
      setError(updateError.message);
    } else {
      setAddPaymentModalOpen(false);
      setEditingPayment(null);
      fetchPayments();
    }
    setIsSubmitting(false);
  };

  const handleAddLog = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const amount = parseFloat(logForm.amount);
    
    // 1. Create log
    const { error: logErr } = await supabase.from('payment_logs').insert([{
      payment_id: selectedPayment.id,
      user_id: user?.id,
      amount,
      note: logForm.note,
      created_at: logForm.created_at
    }]);

    if (logErr) {
      setError(logErr.message);
    } else {
      // 2. Update payment record
      const newPaid = (selectedPayment.paid_amount || 0) + amount;
      const newRemaining = Math.max(0, selectedPayment.total_amount - newPaid);
      let newStatus = 'PARTIAL';
      if (newRemaining === 0) newStatus = 'PAID';
      else if (newPaid === 0) newStatus = 'UNPAID';

      const { error: payErr } = await supabase
        .from('payments')
        .update({
          paid_amount: newPaid,
          remaining_amount: newRemaining,
          status: newStatus
        })
        .eq('id', selectedPayment.id);
      
      if (payErr) {
        setError(payErr.message);
      } else {
        setNewLogModalOpen(false);
        setLogForm({ amount: '', note: '', created_at: new Date().toISOString().split('T')[0] });
        fetchPayments();
      }
    }
    setIsSubmitting(false);
  };

  const [showCelebration, setShowCelebration] = useState(false);
  const [celebratedClient, setCelebratedClient] = useState('');

  const markAsPaid = async (payment) => {
    setCelebratedClient(familiesMap[payment.family_id]?.mother_name || 'Client');
    
    const amountToAdd = payment.remaining_amount;
    
    // Log the final payment
    await supabase.from('payment_logs').insert([{
      payment_id: payment.id,
      user_id: user?.id,
      amount: amountToAdd,
      note: 'Auto-balanced to Paid'
    }]);

    const { error: markPaidError } = await supabase
      .from('payments')
      .update({
        paid_amount: payment.total_amount,
        remaining_amount: 0,
        status: 'PAID'
      })
      .eq('id', payment.id);
    
    if (markPaidError) {
      console.error('Mark as paid error:', markPaidError);
    } else {
      window.dispatchEvent(new CustomEvent('show-toast', { 
        detail: { 
          title: 'Payment Verified', 
          message: `The nurturing investment from ${celebratedClient} has been successfully recorded.` 
        } 
      }));
      fetchPayments();
    }
  };

  const deletePayment = async () => {
    if (!selectedPayment) return;
    setIsSubmitting(true);
    
    const { error: delError } = await supabase
      .from('payments')
      .delete()
      .eq('id', selectedPayment.id);
    
    if (delError) {
      setError(delError.message);
    } else {
      setCancelModalOpen(false);
      fetchPayments();
    }
    setIsSubmitting(false);
  };

  const viewHistory = async (payment) => {
    setSelectedPayment(payment);
    const { data } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('payment_id', payment.id)
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false });
    setPaymentLogs(data || []);
    setHistoryModalOpen(true);
  };

  const filteredPayments = payments.filter(p => {
    const familyName = familiesMap[p.family_id]?.mother_name?.toLowerCase() || '';
    const matchesSearch = familyName.includes(searchQuery.toLowerCase());
    
    if (statusFilter === 'ALL') return matchesSearch;
    if (statusFilter === 'PENDING') return matchesSearch && (p.status === 'PARTIAL' || p.status === 'UNPAID');
    return matchesSearch && p.status === statusFilter;
  });

  const stats = {
    totalRevenue: payments.reduce((acc, p) => acc + parseFloat(p.total_amount || 0), 0),
    paidAmount: payments.reduce((acc, p) => acc + parseFloat(p.paid_amount || 0), 0),
    pendingAmount: payments.reduce((acc, p) => acc + parseFloat(p.remaining_amount || 0), 0),
    overdueAmount: payments.filter(p => p.status === 'OVERDUE').reduce((acc, p) => acc + parseFloat(p.remaining_amount || 0), 0),
  };

  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage);
  const currentPayments = filteredPayments.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-surface dark:bg-[#020617]">
        <div className="w-12 h-12 border-4 border-sky-500/20 border-t-sky-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-[#020617] text-on-surface dark:text-slate-100 p-8 md:p-12 transition-colors duration-300 overflow-x-hidden">
      {/* Background Decorative Elements */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 animate-pulse"></div>
      <div className="fixed bottom-0 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] -z-10"></div>

      <div className="max-w-[1400px] mx-auto">
        <header className="mb-8 md:mb-12 flex flex-col md:flex-row justify-between items-end gap-6 relative z-10">
          <div>
            <h1 className="text-4xl md:text-5xl font-headline font-bold text-on-surface dark:text-white tracking-tight">Financial Sanctuary</h1>
            <p className="text-on-surface-variant dark:text-slate-400 mt-2">Archiving the professional value and nurturing revenue of your care.</p>
          </div>
          <button 
            onClick={() => { setError(''); setEditingPayment(null); setPaymentForm({ family_id: '', service_name: '', total_amount: '', due_date: '' }); setAddPaymentModalOpen(true); }}
            className="px-8 py-4 bg-primary dark:bg-primary text-white dark:text-slate-950 rounded-2xl font-bold shadow-xl shadow-primary/20 flex items-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
          >
            <span className="material-symbols-outlined">add_card</span>
            Log Nurturing Revenue
          </button>
        </header>

        {/* Dashboard Stats: High-End Editorial Theme */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 relative z-10">
          {[
            { label: 'Revenue', title: 'Total Revenue', value: stats.totalRevenue, icon: 'payments', color: 'sky', bg: 'bg-sky-500/10', text: 'text-sky-500' },
            { label: 'Treasury', title: 'Paid Amount', value: stats.paidAmount, icon: 'verified', color: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-600' },
            { label: 'Pending', title: 'Pending Balance', value: stats.pendingAmount, icon: 'pending_actions', color: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-500' },
            { label: 'Alerts', title: 'Overdue Treasury', value: stats.overdueAmount, icon: 'warning', color: 'rose', bg: 'bg-rose-500/10', text: 'text-rose-500' },
          ].map((s, idx) => (
            <div key={idx} className="group relative overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/5">
              {/* Glow Background Decor */}
              <div className={`absolute top-0 right-0 w-32 h-32 ${s.bg} rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform`}></div>
              
              <div className="flex items-center gap-4 mb-8 relative">
                <div className={`w-12 h-12 rounded-2xl ${s.bg} flex items-center justify-center ${s.text} shadow-sm border border-white/20`}>
                  <span className="material-symbols-outlined text-2xl">{s.icon}</span>
                </div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{s.label}</span>
              </div>
              
              <div className="relative">
                <div className={`text-5xl font-noto-serif font-black ${s.text} mb-2 leading-none tracking-tighter`}>
                  ${s.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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

        {/* Filters */}
        <div className="bg-surface-container/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-8 mb-12 border border-outline-variant/10 dark:border-slate-800/50 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            <div className="relative flex-1 w-full group">
              <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform">search</span>
              <input 
                type="text" 
                placeholder="Search by client name..."
                className="w-full pl-16 pr-8 py-4 bg-surface dark:bg-slate-950 border border-outline-variant/20 dark:border-slate-800 rounded-2xl focus:ring-4 focus:ring-primary/10 outline-none transition-all text-on-surface dark:text-white font-medium shadow-inner"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex bg-surface dark:bg-slate-950 p-1.5 rounded-2xl border border-outline-variant/20 dark:border-slate-800 w-full sm:w-auto overflow-x-auto no-scrollbar shadow-inner">
              {['ALL', 'PAID', 'PENDING', 'OVERDUE'].map((status) => (
                <button
                  key={status}
                  onClick={() => { setStatusFilter(status); setCurrentPage(1); }}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    statusFilter === status 
                      ? 'bg-primary text-white dark:text-slate-950 shadow-xl shadow-primary/20' 
                      : 'text-on-surface-variant/60 dark:text-slate-500 hover:text-primary'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Payments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {currentPayments.length > 0 ? currentPayments.map((p) => (
            <div 
              key={p.id} 
              className={`group relative bg-surface-container/40 dark:bg-slate-900/40 hover:bg-surface-container/60 dark:hover:bg-slate-900/60 border border-outline-variant/10 dark:border-slate-800/50 rounded-[2.5rem] p-10 transition-all duration-700 backdrop-blur-xl overflow-hidden flex flex-col ${
                p.status === 'PAID' ? 'ring-2 ring-emerald-500/20' : ''
              }`}
            >
              {/* PAID background glow */}
              {p.status === 'PAID' && (
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
              )}              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-on-surface dark:text-white mb-2">{familiesMap[p.family_id]?.mother_name || 'Legacy Client'}</h3>
                  <div className="flex items-center gap-2 text-sky-600 dark:text-sky-400/80 font-bold text-[10px] uppercase tracking-widest">
                    <span className="material-symbols-outlined text-xs">receipt_long</span>
                    {p.service_name}
                  </div>
                </div>
                <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${STATUS_COLORS[p.status]}`}>
                  {p.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-6 mb-10">
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 dark:text-slate-500">Total</p>
                  <p className="text-xl font-bold text-on-surface dark:text-white">${parseFloat(p.total_amount).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 dark:text-slate-500">Paid</p>
                  <p className="text-xl font-bold text-emerald-600 dark:text-emerald-500">${parseFloat(p.paid_amount).toLocaleString()}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] font-black uppercase tracking-widest text-on-surface-variant/40 dark:text-slate-500">Remaining</p>
                  <p className={`text-xl font-bold ${p.remaining_amount > 0 ? 'text-amber-600 dark:text-amber-500' : 'text-on-surface-variant/40'}`}>${parseFloat(p.remaining_amount).toLocaleString()}</p>
                </div>
              </div>

              <div className="mt-auto pt-8 border-t border-outline-variant/10 dark:border-white/5">
                <div className="flex flex-wrap gap-3 items-center">
                  {p.status !== 'PAID' && (
                    <>
                      <button 
                        onClick={() => { setSelectedPayment(p); setNewLogModalOpen(true); }}
                        className="flex-1 py-4 bg-sky-500 dark:bg-sky-500 text-white dark:text-slate-950 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-sky-500/20"
                      >
                        Add Payment
                      </button>
                      <button 
                        onClick={() => markAsPaid(p)}
                        className="px-6 py-4 bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 border border-emerald-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all"
                      >
                        Mark as Paid
                      </button>
                    </>
                  )}
                  <button 
                    onClick={() => { setSelectedPayment(p); setCancelModalOpen(true); }}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-slate-100 dark:bg-white/5 text-slate-400 hover:text-rose-500 transition-all border border-transparent hover:border-rose-500/20"
                    title="Purge Record"
                  >
                    <span className="material-symbols-outlined text-xl">delete_forever</span>
                  </button>
                  <button 
                    onClick={() => viewHistory(p)}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 hover:text-primary transition-colors border border-outline-variant/10"
                    title="Payment History"
                  >
                    <span className="material-symbols-outlined">history</span>
                  </button>
                  <button 
                    onClick={() => { setEditingPayment(p); setPaymentForm({ family_id: p.family_id, service_name: p.service_name, total_amount: p.total_amount, due_date: p.due_date }); setAddPaymentModalOpen(true); }}
                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-surface-container dark:bg-slate-800 text-on-surface-variant dark:text-slate-400 hover:text-primary transition-colors border border-outline-variant/10"
                    title="Edit Record"
                  >
                    <span className="material-symbols-outlined">edit</span>
                  </button>
                </div>
                <div className="mt-6 flex items-center justify-between text-[10px] font-bold text-on-surface-variant/40 dark:text-slate-600 uppercase tracking-widest">
                  <span>Created {new Date(p.created_at).toLocaleDateString()}</span>
                  <span className={p.status === 'OVERDUE' ? 'text-rose-500' : ''}>Due {p.due_date ? new Date(p.due_date).toLocaleDateString() : 'TBD'}</span>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-24 flex flex-col items-center text-center bg-surface-container/20 dark:bg-white/5 rounded-[3rem] border border-outline-variant/10">
              <div className="w-16 h-16 rounded-full bg-surface-container-high dark:bg-white/5 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-3xl text-on-surface-variant/40">payments</span>
              </div>
              <h3 className="text-2xl font-bold text-on-surface dark:text-white mb-2">No Ledger Records</h3>
              <p className="text-sm text-on-surface-variant dark:text-slate-500 max-w-xs">Your financial sanctuary is clear. Add a new payment record to begin tracking.</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-12 h-12 rounded-2xl font-bold transition-all ${currentPage === page ? 'bg-primary text-white dark:text-slate-950 shadow-lg shadow-primary/20' : 'bg-surface-container dark:bg-slate-800 text-on-surface-variant hover:bg-primary/10'}`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Initiation Modal */}
      <Modal 
        isOpen={addPaymentModalOpen} 
        onClose={() => { setAddPaymentModalOpen(false); setEditingPayment(null); }} 
        title={editingPayment ? 'Refine Care Record' : 'Record Nurturing Revenue'}
      >
        <form onSubmit={editingPayment ? handleUpdatePayment : handleCreatePayment} className="space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}
          {!editingPayment && (
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Client Selection</label>
              <select 
                required 
                className="w-full p-4 rounded-2xl border border-outline-variant/20 bg-surface dark:bg-slate-950 text-on-surface dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none appearance-none"
                value={paymentForm.family_id}
                onChange={e => setPaymentForm({...paymentForm, family_id: e.target.value})}
              >
                <option value="">Select a family</option>
                {families.map(f => <option key={f.id} value={f.id}>{f.mother_name}</option>)}
              </select>
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Service Description</label>
            <input 
              type="text" 
              required 
              placeholder="e.g. Postpartum Care Package"
              className="w-full p-4 rounded-2xl border border-outline-variant/20 bg-surface dark:bg-slate-950 text-on-surface dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none"
              value={paymentForm.service_name}
              onChange={e => setPaymentForm({...paymentForm, service_name: e.target.value})}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Total Investment</label>
              <input 
                type="number" 
                required 
                placeholder="0.00"
                className="w-full p-4 rounded-2xl border border-outline-variant/20 bg-surface dark:bg-slate-950 text-on-surface dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none"
                value={paymentForm.total_amount}
                onChange={e => setPaymentForm({...paymentForm, total_amount: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Maturity Date</label>
              <input 
                type="date" 
                required 
                className="w-full p-4 rounded-2xl border border-outline-variant/20 bg-surface dark:bg-slate-950 text-on-surface dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none"
                value={paymentForm.due_date}
                onChange={e => setPaymentForm({...paymentForm, due_date: e.target.value})}
              />
            </div>
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full py-5 bg-primary dark:bg-primary text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl active:scale-95 transition-all disabled:opacity-50"
          >
            {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : (editingPayment ? 'Synchronize Record' : 'Commit to Ledger')}
          </button>
        </form>
      </Modal>

      {/* Add Payment Log Modal */}
      <Modal isOpen={newLogModalOpen} onClose={() => { setNewLogModalOpen(false); setError(''); }} title="Record Contribution">
        <form onSubmit={handleAddLog} className="space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold animate-in fade-in slide-in-from-top-2">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Amount Contributed</label>
            <input 
              type="number" 
              required 
              placeholder="0.00"
              className="w-full p-4 rounded-2xl border border-outline-variant/20 bg-surface dark:bg-slate-950 text-on-surface dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none"
              value={logForm.amount}
              onChange={e => setLogForm({...logForm, amount: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Contribution Date</label>
            <input 
              type="date" 
              required 
              className="w-full p-4 rounded-2xl border border-outline-variant/20 bg-surface dark:bg-slate-950 text-on-surface dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none"
              value={logForm.created_at}
              onChange={e => setLogForm({...logForm, created_at: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Notes / Observations</label>
            <textarea 
              placeholder="Optional notes for this payment..."
              className="w-full p-4 rounded-2xl border border-outline-variant/20 bg-surface dark:bg-slate-950 text-on-surface dark:text-white text-sm font-bold focus:ring-2 focus:ring-primary/50 outline-none min-h-[100px]"
              value={logForm.note}
              onChange={e => setLogForm({...logForm, note: e.target.value})}
            />
          </div>
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full py-4 bg-primary dark:bg-primary text-white dark:text-slate-950 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all flex justify-center items-center"
            >
              {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Finalize Sanctuary Record'}
            </button>
        </form>
      </Modal>

      {/* History Modal */}
      <Modal isOpen={historyModalOpen} onClose={() => setHistoryModalOpen(false)} title="Treasury History">
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
          {paymentLogs.length === 0 ? (
            <p className="text-center py-12 text-on-surface-variant/40 italic">No contributions recorded for this ledger yet.</p>
          ) : (
            <div className="space-y-4">
              {paymentLogs.map(log => (
                <div key={log.id} className="p-6 bg-surface-container/50 dark:bg-white/5 rounded-2xl border border-outline-variant/10 dark:border-white/5">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">+${parseFloat(log.amount).toLocaleString()}</span>
                    <span className="text-[10px] font-black uppercase text-on-surface-variant/40 dark:text-slate-500 tracking-widest">
                      {new Date(log.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {log.note && <p className="text-sm text-on-surface-variant dark:text-slate-400 italic">"{log.note}"</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Success Celebration Modal */}
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
              className="w-full py-4 bg-primary dark:bg-primary text-white dark:text-slate-950 font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl hover:scale-[1.02] active:scale-95 transition-all"
            >
              Return to Ledger
            </button>
          </div>
        </div>
      </Modal>

      {/* Cancellation Confirmation Modal */}
      <Modal isOpen={cancelModalOpen} onClose={() => { setCancelModalOpen(false); setError(''); }} title="">
        <div className="py-8 flex flex-col items-center text-center">
          {error && (
            <div className="w-full p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-xs font-bold mb-6">
              <span className="material-symbols-outlined text-sm">error</span>
              {error}
            </div>
          )}
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center text-rose-500 mb-6">
            <span className="material-symbols-outlined text-4xl">delete_forever</span>
          </div>
          <h2 className="text-2xl font-bold text-on-surface dark:text-white mb-2">Purge Payment Record?</h2>
          <p className="text-sm text-on-surface-variant dark:text-slate-400 max-w-xs mx-auto mb-8">
            This will permanently delete the payment for <span className="font-bold text-on-surface dark:text-white">{familiesMap[selectedPayment?.family_id]?.mother_name}</span>. This action cannot be undone.
          </p>
          <div className="flex gap-3 w-full">
            <button 
              onClick={() => setCancelModalOpen(false)}
              className="flex-1 py-4 bg-surface dark:bg-slate-800 text-on-surface-variant font-bold rounded-2xl border border-outline-variant/10"
            >
              Keep Record
            </button>
            <button 
              onClick={deletePayment}
              disabled={isSubmitting}
              className="flex-1 py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center"
            >
              {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : 'Purge Record'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
