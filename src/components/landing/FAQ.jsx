'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "How does the 2-month launch offer work?",
    answer: "During our initial launch, you get full access to every feature for 2 months completely free. No credit card is required to sign up. After 2 months, you'll have the option to continue with our standard plan."
  },
  {
    question: "Is my clients' data really secure?",
    answer: "Security is our top priority. We use industry-standard 256-bit encryption (the same level used by banks) to protect all sensitive data. We are committed to maintaining clinical privacy standards for all your families."
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer: "Yes, you can cancel your subscription whenever you like from your settings page. You'll continue to have access to your account until the end of your current billing period."
  },
  {
    question: "Can I export my data if I leave?",
    answer: "Absolutely. Your data belongs to you. You can export all your client records, session notes, and financial data as a CSV or PDF file at any time."
  },
  {
    question: "Do you have a mobile app?",
    answer: "HymyMom is a fully responsive web application. You can access it from any smartphone or tablet browser, and it will function perfectly during your home visits."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-transparent">
      <div className="max-w-4xl mx-auto px-6 md:px-12">
        <div className="text-center mb-16 space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
            <HelpCircle className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-3xl md:text-5xl font-headline font-bold text-on-surface dark:text-white">
            Common <span className="text-primary italic">Questions</span>.
          </h2>
          <p className="text-lg text-on-surface-variant dark:text-slate-400">
            Everything you need to know about the platform.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, i) => (
            <div 
              key={i} 
              className={`rounded-3xl border transition-all duration-300 ${
                openIndex === i 
                  ? 'border-primary/30 bg-primary/5 dark:bg-primary/10' 
                  : 'border-outline-variant/10 bg-white dark:bg-white/5'
              }`}
            >
              <button
                onClick={() => toggleFaq(i)}
                className="w-full flex items-center justify-between p-8 text-left"
              >
                <span className={`text-lg font-bold ${openIndex === i ? 'text-primary' : 'text-on-surface dark:text-white'}`}>
                  {faq.question}
                </span>
                <ChevronDown className={`w-6 h-6 transition-transform duration-300 ${openIndex === i ? 'rotate-180 text-primary' : 'text-on-surface-variant'}`} />
              </button>
              
              <div className={`overflow-hidden transition-all duration-300 ${openIndex === i ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-8 pb-8 text-on-surface-variant dark:text-slate-300 font-medium leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
