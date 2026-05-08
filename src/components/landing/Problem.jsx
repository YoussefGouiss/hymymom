'use client';

import { motion } from 'framer-motion';
import { MessageSquare, Book, Wallet, CloudRain } from 'lucide-react';

const problems = [
  {
    icon: <MessageSquare className="w-6 h-6" />,
    title: "The WhatsApp Maze",
    desc: "Scattered clinical updates, baby photos, and scheduling requests lost in endless chat threads."
  },
  {
    icon: <Book className="w-6 h-6" />,
    title: "The Paper Trail",
    desc: "Handwritten notebooks that aren't where you need them when a client calls with a concern."
  },
  {
    icon: <Wallet className="w-6 h-6" />,
    title: "Payment Fatigue",
    desc: "Awkwardly chasing invoices or losing track of who has paid for which package."
  },
  {
    icon: <CloudRain className="w-6 h-6" />,
    title: "Cognitive Overload",
    desc: "The heavy mental load of keeping every family's story, needs, and recovery details in your head."
  }
];

export default function Problem() {
  return (
    <section className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-16 space-y-4"
        >
          <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface dark:text-white">
            Being a doula is <span className="text-secondary italic">heart-work</span>. <br />
            The admin shouldn't be <span className="text-error/80">hard-work</span>.
          </h2>
          <p className="text-lg text-on-surface-variant dark:text-slate-400">
            You spend your days nurturing new life. But behind the scenes, the chaos of managing a business can lead to burnout.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {problems.map((problem, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="p-8 rounded-[2rem] bg-white dark:bg-white/5 border border-outline-variant/10 hover:border-primary/20 transition-all duration-300 group"
            >
              <div className="w-12 h-12 rounded-2xl bg-secondary/5 text-secondary flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                {problem.icon}
              </div>
              <h3 className="text-xl font-headline font-bold text-on-surface dark:text-white mb-3">
                {problem.title}
              </h3>
              <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed">
                {problem.desc}
              </p>
            </motion.div>
          ))}
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-16 p-10 rounded-[3rem] bg-gradient-to-br from-primary/5 to-tertiary/5 border border-primary/10 text-center"
        >
          <p className="text-xl md:text-2xl font-medium text-on-surface dark:text-slate-200 italic">
            "I used to spend 2 hours every Sunday just trying to remember what happened during my Friday visits. Now, I feel present with my families, knowing the details are safe."
          </p>
          <p className="mt-4 text-sm font-bold uppercase tracking-widest text-primary">— Sarah, Postpartum Doula</p>
        </motion.div>
      </div>
    </section>
  );
}
