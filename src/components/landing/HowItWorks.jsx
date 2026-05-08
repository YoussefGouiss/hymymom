'use client';

import { UserPlus, Users, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: <UserPlus className="w-10 h-10" />,
    title: "Create your account",
    desc: "Sign up in seconds. No credit card required to start your 2 months of free access during our initial launch."
  },
  {
    icon: <Users className="w-10 h-10" />,
    title: "Add your clients",
    desc: "Import or manually add your current families and their recovery details."
  },
  {
    icon: <Sparkles className="w-10 h-10" />,
    title: "Manage with ease",
    desc: "Log visits, track payments, and breathe easier with everything in one place."
  }
];

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-transparent relative overflow-hidden">
      {/* Decorative line connecting steps */}
      <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/20 to-transparent hidden lg:block -translate-y-1/2"></div>

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-headline font-bold text-on-surface dark:text-white">
            Your path to <span className="text-primary italic">simplicity</span>.
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-12 lg:gap-20">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center text-center space-y-6">
              <div className="w-24 h-24 rounded-full bg-primary/10 text-primary flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl relative">
                {step.icon}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-bold text-sm">
                  {i + 1}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-2xl font-headline font-bold text-on-surface dark:text-white">
                  {step.title}
                </h3>
                <p className="text-on-surface-variant dark:text-slate-400 font-medium">
                  {step.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
