'use client';
import { useState } from 'react';
import { X, Crown, CheckCircle, Loader2, Mail, ArrowRight, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

function WaitlistModal({ isOpen, onClose, source = 'modal' }) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('waitlist_signups')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        setError('You\'re already on the waitlist!');
        setIsLoading(false);
        return;
      }

      // Get current count for position
      const { count } = await supabase
        .from('waitlist_signups')
        .select('*', { count: 'exact', head: true });

      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('waitlist_signups')
        .insert([
          { 
            name: name,
            email: email,
            source: source,
            position: (count || 0) + 1,
            status: 'PENDING'
          }
        ]);

      if (insertError) throw insertError;

      setIsJoined(true);
    } catch (err) {
      console.error('Waitlist error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsJoined(false);
    setEmail('');
    setName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-md transition-all duration-500" 
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg glass-card vanta-glow shadow-2xl overflow-hidden bg-surface/80 dark:bg-surface/60 border border-outline-variant/20 dark:border-outline-variant/5 transition-all duration-500 scale-100 group">
        {/* Cinematic Background Glows (Inside Modal) */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-50">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[0%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[60px]"></div>
        </div>

        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low dark:bg-surface-container-low hover:bg-surface-container-high transition-all z-20 group-hover:rotate-90"
        >
          <X className="w-5 h-5 text-on-surface dark:text-on-surface" />
        </button>

        {/* Content */}
        <div className="relative z-10 p-8 md:p-10 pt-12">
          {!isJoined ? (
            <>
              {/* Header */}
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 dark:bg-primary/10 rounded-full mb-6 border border-primary/20 group-hover:scale-105 transition-transform">
                  <Crown className="w-4 h-4 text-primary" />
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Elite Access</span>
                </div>
                <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface dark:text-on-surface mb-4">
                  Join the <span className="text-gradient">Elite Waitlist</span>
                </h2>
                <p className="text-on-surface-variant dark:text-on-surface-variant text-lg leading-relaxed max-w-sm mx-auto">
                  Be the first to harness AI automation, client portals, and clinical-grade analytics.
                </p>
              </div>

                  {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 mb-10">
                {[
                  { icon: '🤖', label: 'AI Reports' },
                  { icon: '👥', label: 'Client Portal' },
                  { icon: '📊', label: 'Analytics' },
                ].map((item, idx) => (
                  <div key={idx} className="text-center p-4 bg-surface-container-low dark:bg-surface-container-low rounded-2xl border border-outline-variant/10 transition-all group/item hover:border-primary/30 hover:bg-surface hover:-translate-y-1">
                    <div className="text-3xl mb-2 group-hover/item:scale-125 transition-transform">{item.icon}</div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant/60 dark:text-on-surface-variant/60">{item.label}</p>
                  </div>
                ))}
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-3">
                  <span className="material-symbols-outlined text-red-500 text-xl">error_outline</span>
                  <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative group/input">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 group-focus-within/input:text-primary transition-colors" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your Professional Name"
                    className="w-full pl-14 pr-6 py-4.5 rounded-2xl border border-outline-variant/10 bg-surface-container-low dark:bg-surface-container-low text-on-surface dark:text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all font-medium"
                    required
                  />
                </div>

                <div className="relative group/input">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-on-surface-variant/40 group-focus-within/input:text-primary transition-colors" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@practice.com"
                    className="w-full pl-14 pr-6 py-4.5 rounded-2xl border border-outline-variant/10 bg-surface-container-low dark:bg-surface-container-low text-on-surface dark:text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary/50 transition-all font-medium"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-5 bg-primary text-slate-950 rounded-2xl font-bold text-lg hover:opacity-90 hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-6 h-6 animate-spin" />
                      Securing Spot...
                    </>
                  ) : (
                    <>
                      Secure Early Access
                      <ArrowRight className="w-6 h-6" />
                    </>
                  )}
                </button>
              </form>

              <p className="mt-8 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/40 dark:text-on-surface-variant/40">
                <span className="material-symbols-outlined text-[14px] align-middle mr-2">verified_user</span>
                Founding Member Privilege • No Spam
              </p>
            </>
          ) : (
            <div className="text-center py-12">
              <div className="w-24 h-24 mx-auto mb-8 rounded-[2rem] bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-lg shadow-green-500/10 group-hover:rotate-12 transition-transform">
                <CheckCircle className="w-12 h-12 text-green-500" />
              </div>
              <h2 className="text-3xl md:text-4xl font-headline font-bold text-on-surface dark:text-on-surface mb-4">
                You're In, <span className="text-gradient">{name.split(' ')[0] || 'Doula'}!</span> 🎉
              </h2>
              <p className="text-xl text-on-surface-variant dark:text-on-surface-variant mb-10 leading-relaxed">
                Welcome to the future of postpartum care. We'll notify you as soon as Elite spots open.
              </p>
              <button
                onClick={handleClose}
                className="px-12 py-5 bg-primary text-slate-950 rounded-2xl font-bold text-lg hover:opacity-90 hover:scale-[1.05] shadow-xl shadow-primary/20 transition-all active:scale-95"
              >
                Return to Sanctuary
              </button>
            </div>
          )}
        </div>

        {/* Bottom Decorative Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-primary via-secondary to-tertiary opacity-60" />
      </div>
    </div>
  );
}

export default WaitlistModal;
