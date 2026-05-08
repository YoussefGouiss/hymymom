'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

export default function FinalCTA() {
  const { user, isLoading: authLoading } = useAuth();
  
  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto rounded-[4rem] bg-gradient-to-br from-primary to-tertiary p-12 md:p-24 relative overflow-hidden text-center text-white">
        {/* Background glow */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-3xl"></div>
        
        <div className="relative z-10 space-y-10">
          
          <h2 className="text-4xl md:text-6xl font-headline font-bold leading-tight max-w-3xl mx-auto">
            Ready to reclaim your <span className="italic">peace of mind?</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/80 max-w-2xl mx-auto font-medium">
            Start managing your doula business with ease today. Join the community of professionals elevating postpartum care.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-4">
            {!authLoading && (
              <Link 
                href={user ? "/dashboard" : "/register"} 
                className="px-12 py-5 bg-white text-primary rounded-full font-bold text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {user ? "Go to Dashboard" : "Get Started for Free"}
                <ArrowRight className="w-6 h-6" />
              </Link>
            )}
          </div>
          
          <p className="text-white/60 text-sm font-medium tracking-widest uppercase">
            2 months free • No credit card required
          </p>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>
      </div>
    </section>
  );
}
