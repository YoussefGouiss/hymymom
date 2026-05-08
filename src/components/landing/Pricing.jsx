'use client';

import { Check, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const plans = [
  {
    name: "Founding Member",
    price: "0",
    desc: "Join our initial launch and elevate your doula practice.",
    features: [
      "Unlimited Client Management",
      "Clinical Session Notes",
      "Visual Visit Scheduling",
      "Financial Ledger & Payment Tracking",
      "Automated Reminders",
      "Intelligent Practice Dashboard",
      "End-to-end Privacy & Security"
    ],
    cta: "Claim Your 2 Months Free",
    popular: true
  }
];

import { useAuth } from '@/context/AuthContext';

export default function Pricing() {
  const { user, isLoading: authLoading } = useAuth();
  
  return (
    <section id="pricing" className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
          <h2 className="text-4xl md:text-5xl font-headline font-bold text-on-surface dark:text-white">
            Simple, <span className="text-primary italic">heart-centered</span> access.
          </h2>
          <p className="text-lg text-on-surface-variant dark:text-slate-400">
            Be part of our initial launch and experience the system designed to elevate every postpartum doula service.
          </p>
        </div>

        <div className="max-w-lg mx-auto">
          {plans.map((plan, i) => (
            <div 
              key={i} 
              className="relative p-10 rounded-[3rem] border transition-all duration-500 bg-white dark:bg-slate-900 border-primary shadow-2xl z-10"
            >
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-white px-6 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">
                Initial Launch Offer
              </div>

              <div className="mb-8">
                <h3 className="text-2xl font-headline font-bold mb-2 text-on-surface dark:text-white">
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-on-surface dark:text-white">
                    ${plan.price}
                  </span>
                  <span className="text-sm font-medium text-on-surface-variant dark:text-slate-500">
                    / 2 months free
                  </span>
                </div>
                <p className="mt-4 text-sm font-medium text-on-surface-variant dark:text-slate-400">
                  {plan.desc}
                </p>
              </div>

              <ul className="space-y-4 mb-10">
                {plan.features.map((feature, j) => (
                  <li key={j} className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 bg-primary/10 text-primary">
                      <Check className="w-3 h-3" />
                    </div>
                    <span className="text-sm font-medium text-on-surface-variant dark:text-slate-300">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {!authLoading && (
                <Link 
                  href={user ? "/dashboard" : "/register"} 
                  className="block w-full py-5 rounded-full font-bold text-center transition-all bg-primary text-white shadow-xl shadow-primary/20 hover:scale-105 active:scale-95"
                >
                  {user ? "Go to Dashboard" : plan.cta}
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
