'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import Modal from '@/components/Modal';

export default function Settings() {
  const { user, setAuthState, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profile, setProfile] = useState({
    name: '',
    bio: '',
    address: '',
    photo_url: '',
    email_notifications_enabled: false
  });

  // Security States
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [passwords, setPasswords] = useState({ new: '', confirm: '', code: '' });
  const [securityStep, setSecurityStep] = useState(1); // 1: Request Code, 2: Reset
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityMessage, setSecurityMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (user) {
      setProfile({
        name: user.name || '',
        bio: user.bio || '',
        address: user.address || '',
        photo_url: user.photo_url || '',
        email_notifications_enabled: user.email_notifications_enabled ?? true
      });
    }
  }, [user]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Upload image to 'avatars' bucket
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfile(prev => ({ ...prev, photo_url: publicUrl }));
      setMessage({ type: 'success', text: 'Logo uploaded! Click update to save permanently.' });
    } catch (error) {
      console.error('Upload error:', error);
      setMessage({ type: 'error', text: 'Upload failed. Ensure "avatars" bucket is public.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeletePhoto = () => {
    setProfile(prev => ({ ...prev, photo_url: '' }));
    setMessage({ type: 'success', text: 'Logo removed! Click update to save permanently.' });
  };

  const handleUpdateProfileDirect = async (updatedProfile) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedProfile)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('user', JSON.stringify(data));
        setAuthState(token, data);
      }
    } catch (error) {
      console.error('Direct update error:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token found');

      console.log('Attempting update via API for user:', user.id);
      
      const response = await fetch('/api/me', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          name: profile.name,
          bio: profile.bio,
          address: profile.address,
          photo_url: profile.photo_url,
          email_notifications_enabled: profile.email_notifications_enabled
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update profile');
      }

      // Update AuthContext state (Local storage and Context)
      localStorage.setItem('user', JSON.stringify(data));
      setAuthState(token, data);
      
      setMessage({ type: 'success', text: 'Profile sanctuary updated successfully!' });
    } catch (error) {
      console.error('Update error:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to update profile' });
    } finally {
      setIsLoading(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
  };

  const handleSendPasswordCode = async () => {
    setSecurityLoading(true);
    setSecurityMessage({ type: '', text: '' });
    try {
      const response = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      
      if (!response.ok) throw new Error('Failed to send verification code');
      
      setSecurityStep(2);
      setSecurityMessage({ type: 'success', text: 'Verification code sent to your email.' });
    } catch (error) {
      setSecurityMessage({ type: 'error', text: error.message });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      setSecurityMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    if (passwords.new.length < 8) {
      setSecurityMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSecurityLoading(true);
    setSecurityMessage({ type: '', text: '' });
    try {
      const response = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: user.email,
          code: passwords.code,
          newPassword: passwords.new
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to reset password');

      setSecurityMessage({ type: 'success', text: 'Password updated successfully!' });
      setTimeout(() => {
        setIsSecurityModalOpen(false);
        setSecurityStep(1);
        setPasswords({ new: '', confirm: '', code: '' });
        setSecurityMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      setSecurityMessage({ type: 'error', text: error.message });
    } finally {
      setSecurityLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const { data: notes } = await supabase.from('notes').select('*');
      const { data: families } = await supabase.from('families').select('*');
      
      const exportData = {
        profile: user,
        families,
        notes,
        exportedAt: new Date().toISOString()
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hymymom-practice-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      setMessage({ type: 'error', text: 'Export failed. Please try again.' });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-12 transition-all duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="font-headline text-4xl md:text-5xl text-on-surface dark:text-white mb-2 font-bold tracking-tight">Practice Profile</h1>
          <p className="text-on-surface-variant dark:text-slate-400 font-medium">Define your professional identity and secure your sanctuary.</p>
        </div>
        {message.text && (
          <div className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest animate-bounce ${message.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
            {message.text}
          </div>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Profile Card & Identity */}
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-surface-container-lowest dark:bg-slate-900 p-10 rounded-[3rem] shadow-xl shadow-primary/5 border border-outline-variant/10 dark:border-white/5">
            <div className="flex items-center gap-6 mb-12">
              <div 
                onClick={() => document.getElementById('logo-upload').click()}
                className="relative group cursor-pointer"
              >
                <div className="w-24 h-24 rounded-3xl bg-primary-container/20 dark:bg-sky-900/30 overflow-hidden border-2 border-primary/10 flex items-center justify-center shadow-inner group-hover:border-primary transition-all">
                  {profile.photo_url ? (
                    <img src={profile.photo_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-symbols-outlined text-4xl text-primary/40">add_a_photo</span>
                  )}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-4 transition-all">
                    <span className="material-symbols-outlined text-white hover:scale-125 transition-transform" title="Upload New">upload</span>
                    {profile.photo_url && (
                      <button 
                        type="button" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeletePhoto();
                        }}
                        className="material-symbols-outlined text-rose-400 hover:text-rose-500 hover:scale-125 transition-all"
                        title="Delete Image"
                      >
                        delete
                      </button>
                    )}
                  </div>
                </div>
                <input 
                  id="logo-upload"
                  type="file" 
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
              <div>
                <h3 className="text-2xl font-headline font-bold text-on-surface dark:text-white">Branding & Identity</h3>
                <p className="text-sm text-on-surface-variant dark:text-slate-500">Click the frame to upload your professional logo.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Professional Name</label>
                  <input 
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    className="w-full p-5 rounded-2xl bg-surface-container-low dark:bg-white/5 border border-outline-variant/10 dark:border-white/5 text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Practice Address</label>
                  <input 
                    type="text"
                    value={profile.address}
                    onChange={(e) => setProfile({...profile, address: e.target.value})}
                    className="w-full p-5 rounded-2xl bg-surface-container-low dark:bg-white/5 border border-outline-variant/10 dark:border-white/5 text-sm font-bold focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                    placeholder="Studio or Business address"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1">Professional Bio</label>
                <textarea 
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  className="w-full p-5 rounded-2xl bg-surface-container-low dark:bg-white/5 border border-outline-variant/10 dark:border-white/5 text-sm font-medium focus:ring-2 focus:ring-primary focus:outline-none resize-none transition-all"
                  placeholder="Tell your clients about your expertise..."
                />
              </div>

              <div className="pt-4">
                <button 
                  type="submit"
                  disabled={isLoading}
                  className="px-10 py-4 bg-primary text-on-primary rounded-full font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined">verified</span>}
                  Update Practice Profile
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Security & Data Sidebar */}
        <div className="space-y-8">
          <section className="bg-surface-container-lowest dark:bg-slate-900 p-8 rounded-[2.5rem] border border-outline-variant/10 dark:border-white/5 space-y-8">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                <span className="material-symbols-outlined">security</span>
              </div>
              <h4 className="font-bold text-on-surface dark:text-white">Security & Alerts</h4>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-5 bg-surface-container-low dark:bg-white/5 rounded-2xl border border-transparent hover:border-primary/20 transition-all group">
                <div className="flex items-center gap-3">
                  <span className={`material-symbols-outlined transition-colors ${profile.email_notifications_enabled ? 'text-primary' : 'text-on-surface-variant/40'}`}>notifications_active</span>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-300">Email Reminders</p>
                    <p className="text-[8px] text-slate-500 uppercase tracking-tighter">24h Visit Alerts</p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={() => {
                    const newVal = !profile.email_notifications_enabled;
                    setProfile({...profile, email_notifications_enabled: newVal});
                    // Proactively save this specific setting
                    handleUpdateProfileDirect({...profile, email_notifications_enabled: newVal});
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${profile.email_notifications_enabled ? 'bg-primary' : 'bg-slate-300 dark:bg-slate-700'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${profile.email_notifications_enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
              <button 
                onClick={() => setIsSecurityModalOpen(true)}
                className="w-full flex items-center justify-between p-5 bg-surface-container-low dark:bg-white/5 rounded-2xl border border-transparent hover:border-primary/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-primary transition-colors">key</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-300">Change Password</span>
                </div>
                <span className="material-symbols-outlined text-sm text-outline-variant/40">arrow_forward</span>
              </button>

              <button 
                onClick={handleExportData}
                className="w-full flex items-center justify-between p-5 bg-surface-container-low dark:bg-white/5 rounded-2xl border border-transparent hover:border-emerald-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-on-surface-variant/40 group-hover:text-emerald-500 transition-colors">download</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-on-surface-variant dark:text-slate-300">Export All Data</span>
                </div>
                <span className="material-symbols-outlined text-sm text-outline-variant/40">arrow_forward</span>
              </button>

              <button 
                onClick={logout}
                className="w-full flex items-center justify-between p-5 bg-rose-500/5 dark:bg-rose-500/10 rounded-2xl border border-transparent hover:border-rose-500/20 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-rose-500 group-hover:scale-110 transition-transform text-lg">logout</span>
                  <span className="text-[10px] font-black uppercase tracking-widest text-rose-600 dark:text-rose-400">Sign Out of Sanctuary</span>
                </div>
                <span className="material-symbols-outlined text-sm text-rose-500/40">chevron_right</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      <Modal isOpen={isSecurityModalOpen} onClose={() => {
        setIsSecurityModalOpen(false);
        setSecurityStep(1);
        setSecurityMessage({ type: '', text: '' });
      }} title="Security Credentials Sanctuary">
        <div className="space-y-6">
          {securityMessage.text && (
            <div className={`p-4 rounded-xl text-xs font-bold text-center ${securityMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-500 border border-rose-500/20'}`}>
              {securityMessage.text}
            </div>
          )}

          {securityStep === 1 ? (
            <div className="space-y-6 text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
                <span className="material-symbols-outlined text-3xl">mail</span>
              </div>
              <div>
                <h4 className="font-bold text-on-surface dark:text-white">Email Verification Required</h4>
                <p className="text-sm text-on-surface-variant dark:text-slate-400 mt-2">To protect your sanctuary, we will send a 6-digit code to <span className="font-bold text-primary">{user?.email}</span>.</p>
              </div>
              <button 
                onClick={handleSendPasswordCode}
                disabled={securityLoading}
                className="w-full py-4 bg-primary text-on-primary font-black uppercase tracking-widest text-xs rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {securityLoading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined text-sm">send</span>}
                Send Verification Code
              </button>
            </div>
          ) : (
            <form onSubmit={handleUpdatePassword} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">6-Digit Verification Code</label>
                  <input 
                    type="text" 
                    required
                    placeholder="000000" 
                    maxLength={6}
                    value={passwords.code}
                    onChange={(e) => setPasswords({...passwords, code: e.target.value})}
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-center text-xl font-bold tracking-[0.5em] focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                  />
                </div>
                <div className="h-px bg-outline-variant/10"></div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">New Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    value={passwords.new}
                    onChange={(e) => setPasswords({...passwords, new: e.target.value})}
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Confirm New Password</label>
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••" 
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({...passwords, confirm: e.target.value})}
                    className="w-full p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all" 
                  />
                </div>
              </div>
              <button 
                type="submit" 
                disabled={securityLoading}
                className="w-full py-4 bg-primary text-on-primary font-black uppercase tracking-widest text-xs rounded-full shadow-lg shadow-primary/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {securityLoading ? <span className="material-symbols-outlined animate-spin">refresh</span> : <span className="material-symbols-outlined text-sm">verified</span>}
                Update Password
              </button>
              <button 
                type="button"
                onClick={() => setSecurityStep(1)}
                className="w-full py-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary transition-colors"
              >
                Back to Request Code
              </button>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
