'use client';

import { motion } from 'framer-motion';
import { 
  Users, CreditCard, FileText, Calendar, 
  Bell, LayoutDashboard 
} from 'lucide-react';

const features = [
  {
    icon: <Users className="w-8 h-8" />,
    title: "Client Management",
    desc: "Comprehensive family profiles with medical history, contact details, and personal preferences.",
    color: "bg-blue-50 text-blue-500"
  },
  {
    icon: <CreditCard className="w-8 h-8" />,
    title: "Payment Tracking",
    desc: "Log contributions, monitor pending balances, and keep a clean financial audit trail.",
    color: "bg-purple-50 text-purple-500"
  },
  {
    icon: <FileText className="w-8 h-8" />,
    title: "Session Notes",
    desc: "Capture clinical observations, breastfeeding logs, and emotional check-ins in one organized place.",
    color: "bg-amber-50 text-amber-500"
  },
  {
    icon: <Calendar className="w-8 h-8" />,
    title: "Scheduling",
    desc: "Visual visit calendar to coordinate your week and ensure no family is left unsupported.",
    color: "bg-green-50 text-green-500"
  },
  {
    icon: <Bell className="w-8 h-8" />,
    title: "Smart Reminders",
    desc: "Automatic prompts for follow-ups, clinical check-ins, and administrative tasks.",
    color: "bg-rose-50 text-rose-500"
  },
  {
    icon: <LayoutDashboard className="w-8 h-8" />,
    title: "Simple Dashboard",
    desc: "A bird's-eye view of your entire practice, highlighting priorities and upcoming visits.",
    color: "bg-cyan-50 text-cyan-500"
  }
];

export default function Features() {
  return (
    <section id="features" className="py-24 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-20 space-y-4"
        >
          <h2 className="text-4xl md:text-5xl font-headline font-bold text-on-surface dark:text-white">
            Everything your <span className="text-primary italic">thriving practice</span> needs.
          </h2>
          <p className="text-lg text-on-surface-variant dark:text-slate-400">
            Powerful tools designed for the unique workflow of postpartum support.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, i) => (
            <motion.div 
              key={i} 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              viewport={{ once: true }}
              className="group p-10 rounded-[2.5rem] bg-white dark:bg-white/5 border border-outline-variant/10 hover:border-primary/30 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
            >
              <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform`}>
                {feature.icon}
              </div>
              <h3 className="text-2xl font-headline font-bold text-on-surface dark:text-white mb-4">
                {feature.title}
              </h3>
              <p className="text-on-surface-variant dark:text-slate-400 leading-relaxed font-medium">
                {feature.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
