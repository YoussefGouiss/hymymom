'use client';

import { motion } from 'framer-motion';
import { CheckCircle2, ShieldCheck, Heart, Sparkles } from 'lucide-react';

const solutions = [
  {
    title: "Centralized Sanctuary",
    desc: "A single, secure place for every client interaction. No more searching through old messages or notebooks.",
    icon: <ShieldCheck className="w-6 h-6" />
  },
  {
    title: "Clinical Clarity",
    desc: "Detailed session notes and recovery tracking that help you provide high-quality, professional care.",
    icon: <Sparkles className="w-6 h-6" />
  },
  {
    title: "Effortless Business",
    desc: "One-click invoice tracking and payment logging so you can focus on support, not spreadsheets.",
    icon: <CheckCircle2 className="w-6 h-6" />
  },
  {
    title: "Peace of Mind",
    desc: "End-to-end encryption ensures your families' privacy is protected to the highest clinical standards.",
    icon: <Heart className="w-6 h-6" />
  }
];

export default function Solution() {
  return (
    <section className="py-24 bg-transparent overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="relative order-2 lg:order-1"
          >
             {/* Simple UI Mockup visual */}
             <div className="relative glass-panel p-6 shadow-2xl rounded-[2.5rem] border border-primary/20">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h4 className="text-xl font-bold dark:text-white">Active Families</h4>
                    <p className="text-xs text-slate-400">4 families under your care</p>
                  </div>
                  <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                    <Heart className="w-5 h-5 text-primary" />
                  </div>
                </div>
                
                <div className="space-y-4">
                  {[
                    { name: "The Miller Family", status: "Session Today", color: "bg-primary" },
                    { name: "Sarah & Leo", status: "Payment Pending", color: "bg-tertiary" },
                    { name: "The Thompson Twins", status: "Follow-up required", color: "bg-secondary" }
                  ].map((family, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-surface-container-low dark:bg-white/5 rounded-2xl border border-outline-variant/10">
                      <div className={`w-3 h-12 ${family.color} rounded-full`}></div>
                      <div>
                        <div className="font-bold text-sm dark:text-white">{family.name}</div>
                        <div className="text-xs text-slate-400">{family.status}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Floating "Success" badge */}
                <div className="absolute -top-6 -right-6 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-xl border border-primary/20 flex items-center gap-3 animate-float">
                   <div className="w-8 h-8 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                   </div>
                   <div className="text-xs font-bold dark:text-white">Payment Received</div>
                </div>
             </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="space-y-8 order-1 lg:order-2"
          >
            <h2 className="text-4xl md:text-5xl font-headline font-bold text-on-surface dark:text-white leading-tight">
              A digital sanctuary <br />
              <span className="text-primary italic">for your practice.</span>
            </h2>
            <p className="text-lg text-on-surface-variant dark:text-slate-400">
              HymyMom isn't just a tool; it's a partner in your postpartum care. We've automated the friction so you can focus on what matters most: the family.
            </p>

            <div className="grid sm:grid-cols-2 gap-6 pt-4">
              {solutions.map((item, i) => (
                <div key={i} className="space-y-2">
                  <div className="flex items-center gap-3 text-primary">
                    {item.icon}
                    <h4 className="font-bold dark:text-white">{item.title}</h4>
                  </div>
                  <p className="text-sm text-on-surface-variant dark:text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
