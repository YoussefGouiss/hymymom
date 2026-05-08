'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Modal from '@/components/Modal';
import { Search, X, Upload } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

import { validateImage, createPreviewUrl } from '@/utils/imageUtils';

const DELIVERY_TYPES = ['Vaginal', 'C-Section', 'VBAC', 'Pending'];
const FEEDING_PLANS = ['Breastfeeding', 'Formula', 'Pumping', 'Mixed'];
const CARE_STATUSES = ['PENDING', 'ACTIVE', 'GRADUATED'];
const SERVICES_OPTIONS = [
  'Night Support', 'Lactation Counseling', 'Newborn Care',
  'Sibling Adaptation', 'Meal Prep', 'Light Housekeeping',
  'Postpartum Yoga', 'PPA/PPD Emotional Support', 'Sleep Training',
];

const statusColor = (s) => {
  if (s === 'ACTIVE') return 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20';
  if (s === 'GRADUATED') return 'bg-slate-300/20 text-slate-600 dark:text-slate-400 border border-slate-300/20';
  return 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20';
};

const deliveryColor = (d) => {
  if (d === 'C-Section') return 'bg-rose-500/10 text-rose-600 dark:text-rose-400';
  if (d === 'VBAC') return 'bg-violet-500/10 text-violet-600 dark:text-violet-400';
  if (d === 'Vaginal') return 'bg-sky-500/10 text-sky-600 dark:text-sky-400';
  return 'bg-slate-300/20 text-slate-500 dark:text-slate-400';
};

export default function Families() {
  const [families, setFamilies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedServices, setSelectedServices] = useState([]);
  
  const { user } = useAuth();
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 4;

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFamily, setEditingFamily] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [customServiceInput, setCustomServiceInput] = useState('');
  const [formErrors, setFormErrors] = useState({});
  const [apiError, setApiError] = useState('');
   const [formData, setFormData] = useState({
     mother_name: '', partner_name: '', baby_name: '',
     birth_date: '', delivery_type: 'Vaginal', feeding_plan: 'Breastfeeding',
     services_needed: '', status: 'PENDING',
   });
   const [isSubmitting, setIsSubmitting] = useState(false);
  const [formStep, setFormStep] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
   const [photoFile, setPhotoFile] = useState(null);
   const [photoPreview, setPhotoPreview] = useState(null);
   const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
   const [photoError, setPhotoError] = useState('');
   const [photoDeleteConfirm, setPhotoDeleteConfirm] = useState({ open: false, familyId: null });

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

     // Validate image
     const validation = validateImage(file);
     if (!validation.valid) {
       setPhotoError(validation.error);
       setPhotoFile(null);
       setPhotoPreview(null);
       return;
     }

     setPhotoError('');
     setPhotoFile(file);
     
     // Create preview
     const preview = createPreviewUrl(file);
     setPhotoPreview(preview);
   };

   const removePhoto = () => {
     setPhotoFile(null);
     setPhotoPreview(null);
     setPhotoError('');
     // Also clear the file input
     const input = document.getElementById('photo-input');
     if (input) input.value = '';
   };

   const uploadPhotoForFamily = async (familyId) => {
     if (!photoFile) return;

     setIsUploadingPhoto(true);
     try {
       const formData = new FormData();
       formData.append('photo', photoFile);

        const response = await fetch(`/api/families/${familyId}/photo`, {
          method: 'POST',
          body: formData,
          headers: {
            'x-user-id': user?.id,
          }
        });

       const data = await response.json();

       if (!response.ok) {
         setPhotoError(data.error || 'Failed to upload photo');
         return false;
       }

       setPhotoFile(null);
       setPhotoPreview(null);
       setPhotoError('');
       return true;
     } catch (error) {
       console.error('Photo upload error:', error);
       setPhotoError(error.message || 'Failed to upload photo');
       return false;
     } finally {
       setIsUploadingPhoto(false);
     }
   };

   const handleDeletePhotoClick = (familyId) => {
     setPhotoDeleteConfirm({ open: true, familyId });
   };

   const confirmDeletePhoto = async () => {
     const familyId = photoDeleteConfirm.familyId;
     if (!familyId) return;

     setPhotoDeleteConfirm({ open: false, familyId: null });
     try {
       const response = await fetch(`/api/families/${familyId}/photo`, {
         method: 'DELETE',
         headers: {
           'x-user-id': user?.id,
         }
       });

       const data = await response.json();

       if (!response.ok) {
         setApiError(data.error || 'Failed to delete photo');
         return;
       }

       fetchFamilies();
     } catch (error) {
       console.error('Photo delete error:', error);
       setApiError('Failed to delete photo');
     }
   };

  const fetchFamilies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/families');
      const data = await response.json();
      
      if (response.ok && data.families) {
        let filtered = data.families;
        if (statusFilter) {
          filtered = filtered.filter(f => f.status === statusFilter);
        }
        if (searchQuery) {
          const lowerQuery = searchQuery.toLowerCase();
          filtered = filtered.filter(f => 
            (f.mother_name && f.mother_name.toLowerCase().includes(lowerQuery)) ||
            (f.partner_name && f.partner_name.toLowerCase().includes(lowerQuery)) ||
            (f.baby_name && f.baby_name.toLowerCase().includes(lowerQuery))
          );
        }
        setFamilies(filtered);
      } else {
        setFamilies([]);
      }
    } catch (e) { 
      console.error('Error fetching families:', e); 
      setFamilies([]);
    }
    finally { setIsLoading(false); }
  }, [statusFilter, searchQuery, user]);

  useEffect(() => { 
    if (user) {
      fetchFamilies();
      setCurrentPage(1);
    }

    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [statusFilter, searchQuery, fetchFamilies, user]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFamilies();
  };

   const openModal = (family = null) => {
     if (family) {
       setEditingFamily(family);
       const services = family.services_needed ? family.services_needed.split(', ').filter((s) => s) : [];
       setSelectedServices(services);
       setFormData({
         mother_name: family.mother_name || '',
         partner_name: family.partner_name || '',
         baby_name: family.baby_name || '',
         phone: family.phone || '',
         email: family.email || '',
         address: family.address || '',
         birth_date: family.birth_date || '',
         delivery_type: family.delivery_type || 'Vaginal',
         feeding_plan: family.feeding_plan || 'Breastfeeding',
         services_needed: family.services_needed || '',
         status: family.status || 'PENDING',
       });
     } else {
       setEditingFamily(null);
       setSelectedServices([]);
       setFormData({
         mother_name: '', partner_name: '', baby_name: '',
         phone: '', email: '', address: '',
         birth_date: '', delivery_type: 'Vaginal', feeding_plan: 'Breastfeeding',
         services_needed: '', status: 'PENDING',
       });
     }
     setCustomServiceInput('');
     setFormErrors({});
     setApiError('');
     setPhotoFile(null);
     setPhotoPreview(null);
     setPhotoError('');
     setFormStep(1);
     setModalOpen(true);
   };

    const validateStep = (step) => {
      const errors = {};
      
      if (step === 1) {
        if (!formData.mother_name?.trim()) {
          errors.mother_name = "Mother's name is required";
        } else if (formData.mother_name.length < 2) {
          errors.mother_name = "Name must be at least 2 characters";
        }
        if (formData.baby_name && formData.baby_name.length > 100) errors.baby_name = "Too long";
        if (formData.partner_name && formData.partner_name.length > 100) errors.partner_name = "Too long";
      }
      
      if (step === 2) {
        if (!formData.birth_date?.trim()) {
          errors.birth_date = "Birth date is required to track recovery";
        } else if (formData.birth_date) {
          const birthDate = new Date(formData.birth_date);
          const today = new Date();
          if (birthDate > today) {
            errors.birth_date = "Birth date cannot be in the future";
          }
          const twoYearsAgo = new Date();
          twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
          if (birthDate < twoYearsAgo) {
            errors.birth_date = "Birth date seems too far in the past";
          }
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

     // Validate mother's name (required)
     if (!formData.mother_name?.trim()) {
       errors.mother_name = "Mother's name is required";
     } else if (formData.mother_name.length < 2) {
       errors.mother_name = "Name must be at least 2 characters";
     } else if (formData.mother_name.length > 100) {
       errors.mother_name = "Name must be less than 100 characters";
     }

     // Validate birth date (required)
     if (!formData.birth_date?.trim()) {
       errors.birth_date = "Birth date is required to track recovery";
     } else if (formData.birth_date) {
       const birthDate = new Date(formData.birth_date);
       const today = new Date();
       if (birthDate > today) {
         errors.birth_date = "Birth date cannot be in the future";
       }
       // Check if birth date is reasonable (not more than 2 years ago)
       const twoYearsAgo = new Date();
       twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
       if (birthDate < twoYearsAgo) {
         errors.birth_date = "Birth date seems too far in the past";
       }
     }

     // Validate delivery type
     if (!formData.delivery_type?.trim()) {
       errors.delivery_type = "Delivery type is required";
     }

     // Validate feeding plan
     if (!formData.feeding_plan?.trim()) {
       errors.feeding_plan = "Feeding plan is required";
     }

     // Validate baby name if provided
     if (formData.baby_name && formData.baby_name.length > 100) {
       errors.baby_name = "Baby name must be less than 100 characters";
     }

     // Validate partner name if provided
     if (formData.partner_name && formData.partner_name.length > 100) {
       errors.partner_name = "Partner name must be less than 100 characters";
     }

     setFormErrors(errors);
     return errors;
   };

   const handleSubmit = async (e) => {
     e.preventDefault();
     setFormErrors({});
     setApiError('');
     
     // Validate form
     const errors = validateForm();
     if (Object.keys(errors).length > 0) {
       // Jump to the first step with an error
       if (errors.mother_name || errors.partner_name || errors.phone || errors.email || errors.address) setFormStep(1);
       else if (errors.birth_date) setFormStep(2);
       else if (errors.delivery_type || errors.feeding_plan) setFormStep(4);
       else if (errors.status) setFormStep(5);
       return;
     }
     
     setIsSubmitting(true);
     const payload = { 
       ...formData,
       name: formData.mother_name,
       services_needed: selectedServices.join(', ') 
     };
     
     try {
       let familyId;
       if (editingFamily?.id) {
         const res = await fetch(`/api/families/${editingFamily.id}`, {
           method: 'PUT',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
         });
         const data = await res.json();
         console.log('Update response:', res.status, data);
         
         if (!res.ok) {
           const errMsg = data.error || 'Failed to update family. Please try again.';
           setApiError(errMsg);
           setIsSubmitting(false);
           return;
         }
         familyId = editingFamily.id;
       } else {
         const res = await fetch('/api/families', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(payload)
         });
         const data = await res.json();
         if (!res.ok) {
           setApiError(data.error || 'Failed to create family. Please try again.');
           setIsSubmitting(false);
           return;
         }
         familyId = data.family.id;
       }
       
       // Upload photo if one was selected
       if (photoFile && familyId) {
         const photoUploadSuccess = await uploadPhotoForFamily(familyId);
         if (!photoUploadSuccess && photoError) {
           setApiError(`Family created but photo upload failed: ${photoError}`);
         }
       }
       
       setModalOpen(false);
       setFormErrors({});
       setApiError('');
        fetchFamilies();
        window.dispatchEvent(new CustomEvent('show-toast', { 
          detail: { 
            title: editingFamily ? 'Profile Refined' : 'Sanctuary Registration', 
            message: `${formData.mother_name} has been successfully ${editingFamily ? 'updated' : 'welcomed'} to your registry.` 
          } 
        }));
     } catch (e) { 
       console.error(e);
       setApiError(e.message || 'An unexpected error occurred. Please try again.');
     }
     finally { setIsSubmitting(false); }
   };

  const handleDelete = async (id) => {
    setConfirmDelete(false);
    
    try {
      const res = await fetch(`/api/families/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      
      if (!res.ok) {
        setApiError(data.error || 'Failed to delete family');
        return;
      }
      
      fetchFamilies();
    } catch (e) { 
      console.error(e);
      setApiError('Error deleting family. Please try again.');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
  };

  return (
    <div className="space-y-10 transition-colors duration-300 relative">
      <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none z-0 animate-pulse"></div>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 relative z-10">
        <div>
          <h2 className="font-headline text-3xl md:text-4xl lg:text-5xl font-bold text-on-surface dark:text-white tracking-tight mb-2 transition-colors">Sanctuary Registry</h2>
          <p className="text-sm md:text-base text-on-surface-variant dark:text-on-surface-variant font-medium max-w-lg">Nurturing the sacred transition of families within your professional care.</p>
        </div>
        <button onClick={() => openModal()} className="bg-primary dark:bg-primary text-white dark:text-slate-950 px-8 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 dark:shadow-primary/20 flex items-center gap-2 hover:opacity-90 hover:scale-[1.02] active:scale-95 transition-all">
          <span className="material-symbols-outlined text-xl">person_add</span>
          Welcome New Family
        </button>
      </div>

      {/* Premium Filter Control Panel */}
      <div className="bg-surface-container/50 dark:bg-slate-900/40 backdrop-blur-xl rounded-[2.5rem] p-6 md:p-8 mb-8 md:mb-12 border border-outline-variant/10 dark:border-slate-800/50 shadow-lg relative z-10 w-full">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-8">
          {/* Search Input */}
          <div className="relative flex-1 w-full group">
            <span className="material-symbols-outlined absolute left-6 top-1/2 -translate-y-1/2 text-primary group-focus-within:scale-110 transition-transform">search</span>
            <input 
              type="text" 
              placeholder="Search by mother, partner, or baby name..."
              className="w-full pl-16 pr-8 py-3.5 md:py-4.5 bg-surface dark:bg-slate-950 border border-outline-variant/20 dark:border-slate-800 rounded-3xl focus:ring-4 focus:ring-primary/10 outline-none transition-all text-on-surface dark:text-white font-medium placeholder:text-on-surface-variant/40 dark:placeholder:text-slate-600 shadow-inner"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
            <div className="flex items-center gap-2 px-2">
              <span className="material-symbols-outlined text-primary/40 text-lg">filter_alt</span>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-on-surface-variant/60 dark:text-slate-500">Registry Status</span>
            </div>
            <div className="flex bg-surface dark:bg-slate-950 p-1.5 rounded-2xl border border-outline-variant/20 dark:border-slate-800 w-full sm:w-auto overflow-x-auto no-scrollbar shadow-inner">
              <button
                onClick={() => {
                  setStatusFilter('');
                  setCurrentPage(1);
                }}
                className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  statusFilter === '' 
                    ? 'bg-primary text-white dark:text-slate-950 shadow-xl shadow-primary/20 scale-[1.02]' 
                    : 'text-on-surface-variant/60 dark:text-slate-500 hover:text-primary'
                }`}
              >
                Everything
              </button>
              {CARE_STATUSES.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setCurrentPage(1);
                  }}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    statusFilter === status 
                      ? 'bg-primary text-white dark:text-slate-950 shadow-xl shadow-primary/20 scale-[1.02]' 
                      : 'text-on-surface-variant/60 dark:text-slate-500 hover:text-primary'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
            
            {/* Clear Button */}
            {(searchQuery || statusFilter) && (
              <button 
                onClick={clearFilters}
                className="p-4 rounded-2xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all flex items-center justify-center border border-transparent hover:border-red-200 dark:hover:border-red-500/20"
                title="Clear Filters"
              >
                <span className="material-symbols-outlined">filter_alt_off</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Family Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingFamily ? 'Refine Family Profile' : 'Sanctuary Registration'}>
        <form onSubmit={handleSubmit} className="space-y-5 max-h-[70vh] overflow-y-auto pr-1">
          {/* Progress Indicator */}
          {!editingFamily && (
            <div className="flex gap-2 mb-8 px-1">
              {[1, 2, 3, 4, 5, 6].map(s => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${s <= formStep ? 'bg-baby-blue dark:bg-sky-500 shadow-[0_0_8px_rgba(137,207,240,0.5)]' : 'bg-slate-200 dark:bg-white/5'}`} />
              ))}
            </div>
          )}
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
          <div className={!editingFamily && formStep !== 1 ? 'hidden' : 'block'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Mother's Name *</label>
                <input 
                  type="text"
                  className={`w-full p-3 rounded-xl border transition-all bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:outline-none ${formErrors.mother_name ? 'border-red-500 dark:border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-white/10 focus:ring-baby-blue dark:focus:ring-sky-500'}`}
                  value={formData.mother_name} 
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
                  value={formData.partner_name} 
                  onChange={e => setFormData({...formData, partner_name: e.target.value})} 
                  placeholder="Optional" 
                />
                {formErrors.partner_name && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{formErrors.partner_name}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Phone Number</label>
                <input 
                  type="tel" 
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-baby-blue dark:focus:ring-sky-500 focus:outline-none transition-all" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div>
                <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Email Address</label>
                <input 
                  type="email" 
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-baby-blue dark:focus:ring-sky-500 focus:outline-none transition-all" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  placeholder="sarah@example.com"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Home Address</label>
              <textarea 
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-white/10 bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:ring-baby-blue dark:focus:ring-sky-500 focus:outline-none transition-all min-h-[80px]" 
                value={formData.address} 
                onChange={e => setFormData({...formData, address: e.target.value})} 
                placeholder="123 Sanctuary Way, Peace City..."
              />
            </div>
            
            <div className="mt-4">
              <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Baby's Name</label>
              <input 
                type="text"
                className={`w-full p-3 rounded-xl border transition-all bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:outline-none ${formErrors.baby_name ? 'border-red-500 dark:border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-white/10 focus:ring-baby-blue dark:focus:ring-sky-500'}`}
                value={formData.baby_name} 
                onChange={e => setFormData({...formData, baby_name: e.target.value})} 
                placeholder="Optional / Pending" 
              />
              {formErrors.baby_name && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{formErrors.baby_name}</p>}
            </div>

            {!editingFamily && formStep === 1 && (
              <button type="button" onClick={() => validateStep(1) && setFormStep(2)} className="w-full mt-8 py-4 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                Continue <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            )}
          </div>

          {/* —— STEP 2: TIMING —— */}
          <div className={!editingFamily && formStep !== 2 ? 'hidden' : 'block mt-6'}>
            <label className="block text-xs mb-1.5 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Birth Date</label>
            <input 
              type="date" 
              className={`w-full p-3 rounded-xl border transition-all bg-surface dark:bg-white/5 dark:text-white text-sm focus:ring-2 focus:outline-none ${formErrors.birth_date ? 'border-red-500 dark:border-red-500 focus:ring-red-500/50' : 'border-slate-200 dark:border-white/10 focus:ring-baby-blue dark:focus:ring-sky-500'}`}
              value={formData.birth_date} 
              onChange={e => setFormData({...formData, birth_date: e.target.value})} 
            />
            {formErrors.birth_date && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{formErrors.birth_date}</p>}

            {!editingFamily && formStep === 2 && (
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setFormStep(1)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold rounded-2xl">Back</button>
                <button type="button" onClick={() => validateStep(2) && setFormStep(3)} className="flex-[2] py-4 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-bold rounded-2xl shadow-lg">Confirm Date</button>
              </div>
            )}
          </div>

          {/* —— STEP 3: PHOTO —— */}
          <div className={!editingFamily && formStep !== 3 ? 'hidden' : 'block mt-8'}>
            <label className="block text-xs mb-2 font-bold uppercase tracking-widest text-on-surface-variant dark:text-slate-400">Profile Photo</label>
            
            {photoError && (
              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
                <p className="text-xs text-red-600 dark:text-red-400">{photoError}</p>
              </div>
            )}

            {photoPreview ? (
              <div className="mb-4 relative inline-block">
                <img src={photoPreview} alt="Preview" className="h-40 w-40 rounded-2xl object-cover border-4 border-baby-blue dark:border-sky-500 shadow-xl" />
                <button type="button" onClick={removePhoto} className="absolute -top-3 -right-3 p-2 bg-red-500 text-white rounded-full shadow-lg"><X className="w-5 h-5" /></button>
              </div>
            ) : (
              <label className="block p-10 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-2xl hover:border-baby-blue dark:hover:border-sky-500 transition-all cursor-pointer bg-slate-50/50 dark:bg-white/5 text-center">
                <input id="photo-input" type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                <Upload className="w-10 h-10 mx-auto text-slate-400 mb-2" />
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Upload Photo</p>
                <p className="text-[10px] text-slate-500 mt-1 uppercase">Max 5MB • JPG, PNG, WebP, GIF</p>
              </label>
            )}

            {!editingFamily && formStep === 3 && (
              <div className="flex flex-col gap-3 mt-8">
                <button type="button" onClick={() => setFormStep(4)} className="w-full py-4 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-bold rounded-2xl shadow-lg">Continue with Photo</button>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setFormStep(2)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold rounded-2xl text-sm">Back</button>
                  <button type="button" onClick={() => { removePhoto(); setFormStep(4); }} className="flex-1 py-4 text-slate-500 dark:text-slate-400 font-bold text-sm">Skip for now</button>
                </div>
              </div>
            )}
          </div>

          {/* —— STEP 4: CLINICAL —— */}
          <div className={!editingFamily && formStep !== 4 ? 'hidden' : 'block mt-6'}>
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
                {formErrors.delivery_type && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{formErrors.delivery_type}</p>}
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
                {formErrors.feeding_plan && <p className="text-xs text-red-500 dark:text-red-400 mt-1">{formErrors.feeding_plan}</p>}
              </div>
            </div>

            {!editingFamily && formStep === 4 && (
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setFormStep(3)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold rounded-2xl">Back</button>
                <button type="button" onClick={() => validateStep(4) && setFormStep(5)} className="flex-[2] py-4 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-bold rounded-2xl shadow-lg">Next Step</button>
              </div>
            )}
          </div>

          {/* —— STEP 6: SERVICES —— */}
          <div className={!editingFamily && formStep !== 6 ? 'hidden' : 'block mt-6'}>
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
          </div>

          {/* —— STEP 5: ADMINISTRATIVE —— */}
          <div className={!editingFamily && formStep !== 5 ? 'hidden' : 'block mt-6'}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            </div>

            {!editingFamily && formStep === 5 && (
              <div className="flex gap-3 mt-8">
                <button type="button" onClick={() => setFormStep(4)} className="flex-1 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold rounded-2xl">Back</button>
                <button type="button" onClick={() => setFormStep(6)} className="flex-[2] py-4 bg-baby-blue dark:bg-sky-500 text-white dark:text-slate-950 font-bold rounded-2xl shadow-lg">Save & Next</button>
              </div>
            )}
          </div>

          <div className={`pt-6 flex gap-3 ${!editingFamily && formStep !== 6 ? 'hidden' : 'flex'}`}>
            {!editingFamily && (
              <button type="button" onClick={() => setFormStep(5)} className="px-6 py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 font-bold rounded-2xl">Back</button>
            )}
            <button type="submit" disabled={isSubmitting} className="flex-1 py-4 bg-baby-blue dark:bg-sky-500 hover:opacity-90 text-white dark:text-slate-950 font-bold rounded-2xl transition-all flex justify-center items-center shadow-xl disabled:opacity-50 active:scale-95">
              {isSubmitting ? <span className="material-symbols-outlined animate-spin">refresh</span> : editingFamily ? 'Update Family Profile' : 'Complete Setup'}
            </button>
            {editingFamily && (
              <button 
                type="button" 
                onClick={() => setConfirmDelete(true)} 
                className="px-5 py-4 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 font-bold rounded-xl transition-colors flex items-center" 
                title="Delete Family"
              >
                <span className="material-symbols-outlined">delete</span>
              </button>
            )}
          </div>
        </form>
      </Modal>

      {/* Global Delete Confirmation Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-md px-4" onClick={() => setConfirmDelete(false)}>
          <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-10 shadow-2xl max-w-sm w-full border border-slate-100 dark:border-white/5 animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mx-auto mb-6">
                <span className="material-symbols-outlined text-4xl text-rose-500">warning</span>
              </div>
              <h3 className="text-2xl font-headline font-black text-slate-800 dark:text-white mb-3">Release Family?</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                You are about to permanently remove <span className="font-bold text-slate-800 dark:text-white">{editingFamily?.mother_name || 'this family'}</span> from your sanctuary. This action cannot be reversed.
              </p>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => handleDelete(editingFamily?.id)} 
                  className="w-full py-4 bg-rose-500 text-white font-bold rounded-2xl shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all active:scale-95"
                >
                  Confirm Deletion
                </button>
                <button 
                  onClick={() => setConfirmDelete(false)} 
                  className="w-full py-4 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 font-bold rounded-2xl hover:bg-slate-100 transition-all"
                >
                  Keep Sanctuary
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Families Grid (Replacing Table) */}
      <div className="relative z-10">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-container/50 dark:bg-surface-container/30 backdrop-blur-xl rounded-[2.5rem] border border-outline-variant/10">
            <span className="material-symbols-outlined animate-spin text-5xl text-primary mb-4">refresh</span>
            <p className="text-on-surface-variant font-medium">Gathering your families...</p>
          </div>
        ) : families.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-surface-container/50 dark:bg-surface-container/30 backdrop-blur-xl rounded-[2.5rem] border border-outline-variant/10 text-center px-6">
            <span className="material-symbols-outlined text-6xl text-primary/20 mb-6">groups</span>
            <h3 className="text-2xl font-bold text-on-surface mb-2">No Families Found</h3>
            <p className="text-on-surface-variant max-w-md">
              {searchQuery || statusFilter 
                ? "We couldn't find any families matching your current filters." 
                : "Your sanctuary is waiting for its first family. Add a new profile to begin."}
            </p>
            {(searchQuery || statusFilter) && (
              <button onClick={clearFilters} className="mt-6 text-primary font-bold hover:underline">Clear all filters</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 md:gap-8">
            {families.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((f) => (
              <div key={f.id} className="@container group relative bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl hover:shadow-primary/5 hover:border-primary/20 transition-all duration-500 flex flex-col overflow-hidden h-auto">
                
                {/* Status & Management Float */}
                <div className="absolute top-6 right-6 z-20 flex flex-col items-end gap-3">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm backdrop-blur-md border ${
                    f.status === 'ACTIVE' 
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' 
                      : f.status === 'GRADUATED' 
                        ? 'bg-slate-100 text-slate-500 border-slate-200' 
                        : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                  }`}>
                    {f.status}
                  </span>
                  
                  <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                    <button 
                      onClick={() => openModal(f)}
                      className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-primary shadow-sm hover:shadow-md transition-all"
                      title="Edit Profile"
                    >
                      <span className="material-symbols-outlined text-base">edit</span>
                    </button>
                    <button 
                      onClick={() => { setEditingFamily(f); setConfirmDelete(true); }}
                      className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border border-slate-100 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-rose-500 shadow-sm hover:shadow-md transition-all"
                      title="Delete Family"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="p-8 pb-6 relative z-10 flex-1">
                  <div className="flex flex-col gap-6">
                    {/* Identity Section */}
                    <div className="flex items-center gap-6">
                      <div className="relative">
                        {f.photo_url ? (
                          <div className="relative">
                            <img src={f.photo_url} alt={f.mother_name} className="h-20 w-20 rounded-[1.75rem] object-cover shadow-xl ring-4 ring-slate-50 dark:ring-slate-800" />
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 shadow-md ${f.status === 'ACTIVE' ? 'bg-emerald-500' : f.status === 'GRADUATED' ? 'bg-slate-300' : 'bg-amber-500'}`}></div>
                          </div>
                        ) : (
                          <div className="relative">
                            <div className={`h-20 w-20 rounded-[1.75rem] flex items-center justify-center font-headline font-bold text-2xl shadow-lg ${f.status === 'GRADUATED' ? 'bg-slate-50 text-slate-300' : 'bg-primary/5 text-primary border border-primary/5'}`}>
                              {(f.mother_name || '?').substring(0, 2).toUpperCase()}
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 shadow-md ${f.status === 'ACTIVE' ? 'bg-emerald-500' : f.status === 'GRADUATED' ? 'bg-slate-300' : 'bg-amber-500'}`}></div>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="text-3xl font-headline font-black text-slate-900 dark:text-white truncate tracking-tight lowercase">{f.mother_name}</h3>
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                          <span className="material-symbols-outlined text-sm">child_care</span>
                          <p className="text-xs font-bold uppercase tracking-widest truncate">Baby {f.baby_name || 'arij'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contact Bar */}
                    <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                      {f.phone && (
                        <a href={`tel:${f.phone}`} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all text-primary">
                          <span className="material-symbols-outlined text-sm">call</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">Call</span>
                        </a>
                      )}
                      <div className="w-px h-4 bg-slate-200 dark:bg-white/10"></div>
                      {f.email && (
                        <a href={`mailto:${f.email}`} className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all text-slate-500">
                          <span className="material-symbols-outlined text-sm">mail</span>
                          <span className="text-[10px] font-black uppercase tracking-widest">Email</span>
                        </a>
                      )}
                    </div>

                    {/* High-Contrast Metrics Box */}
                    <div className="grid grid-cols-2 gap-px bg-slate-100 dark:bg-white/5 rounded-[2rem] overflow-hidden border border-slate-100 dark:border-white/5">
                      <div className="bg-white dark:bg-slate-900 p-5 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Delivery</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{f.delivery_type || 'Vaginal'}</p>
                      </div>
                      <div className="bg-white dark:bg-slate-900 p-5 space-y-1">
                        <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Feeding</p>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200">{f.feeding_plan || 'Breastfeeding'}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Final Action Button */}
                <div className="p-8 pt-0">
                  <Link 
                    href={`/families/${f.id}`} 
                    className="w-full py-5 bg-slate-950 dark:bg-primary text-white dark:text-slate-950 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] flex items-center justify-center gap-4 shadow-xl hover:shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all group/btn"
                  >
                    Enter Sanctuary
                    <span className="material-symbols-outlined text-xl transition-transform group-hover/btn:translate-x-2">arrow_right_alt</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {families.length > itemsPerPage && (
          <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-6 px-10 py-6 bg-surface-container/50 dark:bg-surface-container/30 backdrop-blur-xl rounded-[2.5rem] border border-outline-variant/10 shadow-xl">
            <div className="text-sm font-medium text-on-surface-variant">
              Showing <span className="text-on-surface font-bold">{((currentPage - 1) * itemsPerPage) + 1}</span> to <span className="text-on-surface font-bold">{Math.min(currentPage * itemsPerPage, families.length)}</span> of <span className="text-on-surface font-bold">{families.length}</span> families
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-surface dark:bg-white/5 border border-outline-variant/10 text-on-surface-variant hover:text-primary disabled:opacity-30 transition-all"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              
              <div className="flex gap-2">
                {Array.from({ length: Math.ceil(families.length / itemsPerPage) }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-12 h-12 rounded-2xl font-bold text-sm transition-all ${
                      currentPage === page 
                        ? 'bg-primary dark:bg-primary text-white dark:text-slate-950 shadow-lg shadow-primary/20' 
                        : 'bg-surface dark:bg-white/5 border border-outline-variant/10 text-on-surface-variant hover:bg-primary/5'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(families.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(families.length / itemsPerPage)}
                className="w-12 h-12 rounded-2xl flex items-center justify-center bg-surface dark:bg-white/5 border border-outline-variant/10 text-on-surface-variant hover:text-primary disabled:opacity-30 transition-all"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Analytics Summary: High-End Editorial Theme */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 relative z-10">
        {[
          { label: 'Overview', title: 'Total Families', value: families.length, icon: 'groups', color: 'primary', bg: 'bg-primary/5', text: 'text-primary' },
          { label: 'Waitlist', title: 'Pending Support', value: families.filter(f => f.status === 'PENDING').length, icon: 'pending_actions', color: 'amber', bg: 'bg-amber-500/10', text: 'text-amber-500' },
          { label: 'Active', title: 'Families in Care', value: families.filter(f => f.status === 'ACTIVE').length, icon: 'verified', color: 'emerald', bg: 'bg-emerald-500/10', text: 'text-emerald-500' },
          { label: 'Completed', title: 'Graduated', value: families.filter(f => f.status === 'GRADUATED').length, icon: 'school', color: 'sky', bg: 'bg-sky-500/10', text: 'text-sky-500' }
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/5">
            {/* Glow Background Decor */}
            <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg} rounded-full blur-3xl -mr-16 -mt-16 group-hover:scale-110 transition-transform`}></div>
            
            <div className="flex items-center gap-4 mb-8 relative">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} flex items-center justify-center ${stat.text} shadow-sm border border-white/20`}>
                <span className="material-symbols-outlined text-2xl">{stat.icon}</span>
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{stat.label}</span>
            </div>
            
            <div className="relative">
              <div className={`text-6xl font-noto-serif font-black ${stat.text} mb-2 leading-none tracking-tighter`}>
                {stat.value}
              </div>
              <div className="text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 opacity-80">
                {stat.title}
              </div>
            </div>
            
            {/* Minimal Progress Decor */}
            <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-50 dark:bg-white/5">
              <div className={`h-full ${stat.text.replace('text', 'bg')} opacity-20`} style={{ width: '40%' }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
