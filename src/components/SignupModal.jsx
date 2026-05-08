'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Mail, ArrowRight, CheckCircle, HeartHandshake, Globe, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function SignupModal({ isOpen, onClose }) {
  const [step, setStep] = useState('email'); // 'email' | 'verify' | 'success'
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, isAuthenticating } = useAuth();
  const router = useRouter();

  // If user is already logged in, redirect them to dashboard if they open the modal
  useEffect(() => {
    if (isOpen && user) {
      // Small delay to let the modal open-transition finish if any
      setTimeout(() => {
        onClose();
        router.push('/dashboard');
      }, 500);
    }
  }, [isOpen, user, router, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setStep('success');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-950/40 dark:bg-slate-950/60 backdrop-blur-md transition-all duration-500" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-md glass-card vanta-glow shadow-2xl overflow-hidden bg-surface/80 dark:bg-surface/60 border border-outline-variant/20 dark:border-outline-variant/5 transition-all duration-500 scale-100 group">
        {/* Cinematic Background Glows (Inside Modal) */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden opacity-50">
          <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/10 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-[0%] right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-[60px]"></div>
        </div>

        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-surface-container-low dark:bg-surface-container-low hover:bg-surface-container-high transition-all z-20 group-hover:rotate-90"
        >
          <X className="w-5 h-5 text-on-surface dark:text-on-surface" />
        </button>

        {/* Content */}
        <div className="relative z-10 p-8 md:p-10 pt-12">
          {user ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 mx-auto mb-6 rounded-[2rem] bg-primary/10 dark:bg-primary/10 flex items-center justify-center border border-primary/20">
                <LayoutDashboard className="w-10 h-10 text-primary dark:text-primary" />
              </div>
              <h2 className="text-3xl font-headline font-bold text-on-surface dark:text-on-surface mb-3">
                Welcome back, {user.name.split(' ')[0]} 
              </h2>
              <p className="text-on-surface-variant dark:text-on-surface-variant font-medium mb-8">
                You're already logged in. Redirecting to your dashboard...
              </p>
              <button
                onClick={() => { onClose(); router.push('/dashboard'); }}
                className="w-full py-5 bg-primary text-slate-950 rounded-2xl font-bold text-lg hover:opacity-90 shadow-xl transition-all flex items-center justify-center gap-3"
              >
                Go to Dashboard
                <ArrowRight className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <>
              {step === 'email' && (
                <>
                  {/* Header */}
                  <div className="text-center mb-10">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-[2rem] bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                      <HeartHandshake className="w-10 h-10 text-white" />
                    </div>
                    <h2 className="text-3xl font-headline font-bold text-on-surface dark:text-on-surface mb-3">
                      Start Your <span className="text-gradient">14-Day Free</span> Trial
                    </h2>
                    <p className="text-on-surface-variant dark:text-on-surface-variant font-medium">
                      No credit card required. Full access to all Pro features.
                    </p>
                  </div>

                  {/* Creative Google Sign Up */}
                  <button
                    onClick={() => {
                      onClose();
                      router.push('/login');
                    }}
                    className="w-full py-4.5 px-6 bg-surface-container-low dark:bg-surface-container-low border border-outline-variant/10 rounded-2xl font-bold text-on-surface dark:text-on-surface hover:bg-surface hover:border-primary/30 transition-all duration-300 flex items-center justify-center gap-4 mb-8 group/btn shadow-sm hover:shadow-lg hover:shadow-primary/5 hover:-translate-y-0.5"
                  >
                    <div className="w-8 h-8 flex items-center justify-center bg-surface dark:bg-surface-container-high rounded-full group-hover/btn:scale-110 transition-transform shadow-sm dark:shadow-none border border-outline-variant/10">
                      <Globe className="w-5 h-5 text-primary" />
                    </div>
                    <span className="tracking-tight">Access with Google</span>
                  </button>

                  {/* Cinematic Divider */}
                  <div className="relative mb-8 flex items-center gap-4">
                    <div className="flex-grow h-px bg-gradient-to-r from-transparent via-outline-variant/10 to-outline-variant/10"></div>
                    <span className="flex-shrink-0 text-[10px] font-bold text-on-surface-variant/40 dark:text-on-surface-variant/40 tracking-[0.2em] uppercase">
                      Or use Sanctuary Key
                    </span>
                    <div className="flex-grow h-px bg-gradient-to-l from-transparent via-outline-variant/10 to-outline-variant/10"></div>
                  </div>

                  {/* Email Register Button */}
                  <button
                    onClick={() => {
                      onClose();
                      router.push('/register');
                    }}
                    className="w-full py-5 px-6 bg-primary text-slate-950 rounded-2xl font-bold text-lg hover:opacity-90 hover:scale-[1.02] active:scale-95 shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3"
                  >
                    Join the Sanctuary
                    <ArrowRight className="w-6 h-6" />
                  </button>

                  {/* Trust Text */}
                  <div className="mt-8 pt-8 border-t border-outline-variant/10 flex items-center justify-center gap-6 text-[10px] font-bold uppercase tracking-widest text-on-surface-variant/60 dark:text-on-surface-variant/60">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      No card needed
                    </span>
                    <span className="flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Cancel anytime
                    </span>
                  </div>
                </>
              )}

              {step === 'success' && (
                <div className="text-center py-10">
                  <div className="w-24 h-24 mx-auto mb-8 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20 shadow-lg shadow-green-500/10">
                    <CheckCircle className="w-12 h-12 text-green-500" />
                  </div>
                  <h2 className="text-3xl font-headline font-bold text-on-surface dark:text-on-surface mb-4">
                    Great! Let's get you set up.
                  </h2>
                  <p className="text-xl text-on-surface-variant dark:text-on-surface-variant mb-10 leading-relaxed">
                    Continue to create your account and start your 14-day free trial.
                  </p>
                  <button
                    onClick={() => {
                      onClose();
                      router.push('/login');
                    }}
                    className="w-full py-5 bg-primary text-slate-950 rounded-2xl font-bold text-lg hover:opacity-90 shadow-xl shadow-primary/20 transition-all flex items-center justify-center gap-3"
                  >
                    Continue to Sanctuary
                    <ArrowRight className="w-6 h-6" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>

        {/* Bottom Decorative Bar */}
        <div className="h-2 w-full bg-gradient-to-r from-primary via-secondary to-tertiary opacity-60" />
      </div>
    </div>
  );
}

export default SignupModal;
