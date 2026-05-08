import { UserPlus, ClipboardList, FileText, ArrowRight } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: "Import or Add Families",
    description: "Set up your client roster in under 2 minutes. Import from CSV, sync your calendar, or add families one by one.",
    time: "2 min setup",
    color: "from-sky-400 to-sky-500"
  },
  {
    icon: ClipboardList,
    title: "Log Visits on the Go",
    description: "Our mobile-first design lets you document sessions while you're still with the family. Voice-to-text, templates, and offline mode included.",
    time: "30 sec / visit",
    color: "from-violet-400 to-violet-500"
  },
  {
    icon: FileText,
    title: "Master Your Ledger",
    description: "Keep your practice profitable with a professional payments ledger. Track family contributions, monitor pending balances, and stay organized for tax season.",
    time: "Clear audit trail",
    color: "from-emerald-400 to-emerald-500"
  }
];

function HowItWorks() {
  return (
    <section className="py-24 md:py-32 bg-cloud-white dark:bg-[#030712] relative overflow-hidden section-unified transition-colors duration-300">
      {/* Background Accents */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-baby-blue/5 dark:bg-sky-500/5 rounded-full blur-[120px]"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-[120px]"></div>

      <div className="max-w-7xl mx-auto px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-20 space-y-4">
          <span className="inline-block px-4 py-1.5 rounded-full bg-baby-blue/10 dark:bg-sky-500/10 text-baby-blue dark:text-sky-400 font-bold text-xs uppercase tracking-widest transition-colors mb-2">
            The Flow
          </span>
          <h2 className="text-4xl md:text-6xl font-headline font-bold text-on-surface dark:text-on-surface mb-4 tracking-tight">
            From Chaos to <span className="text-gradient">Calm</span>
          </h2>
          <p className="text-xl text-on-surface-variant dark:text-on-surface-variant max-w-2xl mx-auto leading-relaxed">
            No complex onboarding. No learning curve. Just immediate relief from your admin headache.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-10 relative">
          {/* Enhanced Connection Lines (Desktop) */}
          <div className="hidden md:block absolute top-[15%] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-transparent via-baby-blue/20 dark:via-sky-500/20 to-transparent"></div>

          {steps.map((step, index) => (
            <div key={index} className="relative group">
              {/* Step Card */}
              <div className="glass-card vanta-glow p-10 shadow-2xl bg-surface/80 dark:bg-surface/40 border border-outline-variant/50 dark:border-outline-variant/5 group-hover:border-primary/30 transition-all duration-500 h-full flex flex-col items-center text-center">
                {/* Step Number Badge */}
                <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-10 h-10 rounded-xl bg-surface dark:bg-surface border border-primary/20 dark:border-primary/30 flex items-center justify-center text-primary dark:text-primary font-bold text-lg shadow-lg dark:shadow-[0_0_15px_rgba(137,207,240,0.2)] group-hover:scale-110 transition-transform">
                  {index + 1}
                </div>

                {/* Icon with Ambient Glow */}
                <div className="relative mb-8 mt-4">
                  <div className={`absolute inset-0 bg-gradient-to-br ${step.color} blur-2xl opacity-10 dark:opacity-20 group-hover:opacity-30 dark:group-hover:opacity-40 transition-opacity`}></div>
                  <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${step.color} flex items-center justify-center relative z-10 shadow-2xl group-hover:rotate-6 transition-transform`}>
                    <step.icon className="w-10 h-10 text-white" />
                  </div>
                </div>

                {/* Content */}
                <h3 className="text-2xl font-headline font-bold text-on-surface dark:text-on-surface mb-4">
                  {step.title}
                </h3>
                <p className="text-on-surface-variant dark:text-on-surface-variant leading-relaxed mb-8 flex-grow">
                  {step.description}
                </p>

                {/* Time Badge - Premium Version */}
                <div className="flex items-center gap-3 px-5 py-2.5 bg-primary/5 dark:bg-primary/5 border border-primary/10 dark:border-primary/10 rounded-full group-hover:border-primary/30 dark:group-hover:border-primary/30 transition-colors">
                  <div className={`w-2 h-2 rounded-full bg-primary dark:bg-primary animate-pulse`} />
                  <span className="text-xs font-bold uppercase tracking-wider text-primary dark:text-primary">
                    {step.time}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-20">
          <div className="glass-card p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-6 bg-primary/5 dark:bg-primary/5 border border-primary/10 max-w-4xl mx-auto shadow-sm dark:shadow-none">
            <div className="flex items-center gap-4 px-6 text-center md:text-left">
              <span className="material-symbols-outlined text-primary dark:text-primary">bolt</span>
              <p className="text-lg text-on-surface dark:text-on-surface">
                <span className="font-bold text-primary dark:text-primary">Pro tip:</span> Most doulas are fully set up during their first coffee break.
              </p>
            </div>
            <button className="w-full md:w-auto inline-flex items-center justify-center gap-3 px-10 py-4 bg-primary dark:bg-primary text-white dark:text-slate-950 rounded-full font-bold hover:opacity-90 transition-all shadow-lg shadow-primary/20 dark:shadow-primary/20 active:scale-95">
              Start Your Free Trial
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;
