'use client';

import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Sarah Jenkins",
    role: "Postpartum Doula",
    content: "HymyMom Pro transformed my practice. I no longer feel overwhelmed by admin, and my clients love the professional reports I share with them.",
    rating: 5
  },
  {
    name: "Maya Rodriguez",
    role: "Newborn Care Specialist",
    content: "The session notes feature is a lifesaver. Being able to quickly pin urgent observations and track recovery trajectory is clinical excellence.",
    rating: 5
  },
  {
    name: "Elena Thompson",
    role: "Lactation Consultant & Doula",
    content: "Simple, beautiful, and secure. It's the digital sanctuary I've been looking for to manage my growing client list without the stress.",
    rating: 5
  }
];

export default function SocialProof() {
  return (
    <section className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface dark:text-white">
            Trusted by <span className="text-primary italic">dedicated doulas</span>.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="p-10 rounded-[3rem] bg-white dark:bg-white/5 border border-outline-variant/10 shadow-xl shadow-primary/5 flex flex-col justify-between">
              <div>
                <div className="flex gap-1 mb-6 text-amber-400">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-current" />
                  ))}
                </div>
                <p className="text-lg text-on-surface-variant dark:text-slate-300 font-medium leading-relaxed italic mb-8">
                  "{t.content}"
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center font-bold text-primary">
                  {t.name.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-on-surface dark:text-white">{t.name}</div>
                  <div className="text-xs text-slate-400 uppercase tracking-widest">{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
