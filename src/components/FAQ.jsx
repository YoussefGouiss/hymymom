'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "Can I export my data if I decide to leave?",
    answer: "Absolutely. Your data is yours. You can export all client records, visit notes, and financial data as CSV or PDF at any time — even during your free trial. We believe in data portability as a fundamental right."
  },
  {
    question: "Is there a mobile app for visits?",
    answer: "Yes! HymyMom is built mobile-first. Our progressive web app works beautifully on any phone or tablet — no app store download required. Log visits, take voice notes, and access family profiles even without an internet connection. Data syncs automatically when you're back online."
  },
  {
    question: "Does this replace my existing EHR system?",
    answer: "HymyMom complements EHR systems rather than replacing them. While we handle scheduling, visit notes, and client communication beautifully, many doulas use us alongside clinical EHRs for medical records. We offer integrations with popular systems and can discuss your specific workflow needs."
  },
  {
    question: "What if my client doesn't want digital records?",
    answer: "We respect that choice. You can mark any client as 'offline-only' — their data won't sync to our servers and stays local to your device. You can still use all app features and export paper records when needed. Privacy options are available for every family."
  },
  {
    question: "How does the 14-day free trial work?",
    answer: "Sign up with just your email — no credit card required. You'll have full access to all Pro features for 14 days. We'll send you a gentle reminder before it ends. If you love it (we think you will!), upgrade to keep your data. If not, export everything and walk away — no hard feelings."
  },
  {
    question: "Can I customize visit note templates?",
    answer: "Yes, and it's a game-changer. Start with our doula-specific templates (postpartum check-in, lactation support, sleep consultation) and customize them to match your practice style. Create unlimited templates and share them with doula colleagues in our community library."
  },
  {
    question: "Is my clients' data really secure?",
    answer: "Security is our obsession. We use 256-bit encryption (same as banks), are HIPAA-ready, and maintain SOC 2 compliance. Your data is stored on encrypted servers in the US, and we never sell or share client information. You can read our full security whitepaper for complete transparency."
  },
  {
    question: "Can I track my income and payments?",
    answer: "Yes! HymyMom includes a professional Payments Ledger. Record family contributions, track pending balances, and keep a clear audit trail of your practice's revenue. While we don't process credit cards directly yet, our ledger ensures your financial records are organized and ready for tax season."
  }
];

function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-20 md:py-32 bg-surface dark:bg-surface">
      <div className="max-w-4xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 mb-6">
            <HelpCircle className="w-8 h-8 text-primary dark:text-primary" />
          </div>
          <h2 className="text-4xl md:text-5xl font-headline font-bold text-on-surface dark:text-on-surface mb-4">
            Questions? We've Got Answers.
          </h2>
          <p className="text-xl text-on-surface-variant dark:text-on-surface-variant">
            Everything you need to know about HymyMom. Can't find what you're looking for? 
            <Link href="/contact" className="text-primary hover:underline font-semibold ml-1">Chat with our team</Link>.
          </p>
        </div>

        {/* FAQ List */}
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className={`rounded-2xl border transition-all duration-300 ${
                openIndex === index 
                  ? 'border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10' 
                  : 'border-outline-variant/10 dark:border-outline-variant/5 bg-surface dark:bg-surface-container/50 hover:border-outline-variant/20 dark:hover:border-outline-variant/10'
              }`}
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full flex items-center justify-between p-6 text-left"
              >
                <span className={`font-semibold text-lg pr-4 ${
                  openIndex === index 
                    ? 'text-primary dark:text-primary' 
                    : 'text-on-surface dark:text-on-surface'
                }`}>
                  {faq.question}
                </span>
                <ChevronDown 
                  className={`w-6 h-6 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index 
                      ? 'rotate-180 text-primary' 
                      : 'text-on-surface-variant/60'
                  }`} 
                />
              </button>
              
              <div 
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="px-6 pb-6 text-on-surface-variant dark:text-on-surface-variant leading-relaxed">
                  {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Still Have Questions */}
        <div className="mt-16 text-center p-8 bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 rounded-3xl">
          <h3 className="text-xl font-bold text-on-surface dark:text-on-surface mb-2">
            Still have questions?
          </h3>
          <p className="text-on-surface-variant dark:text-on-surface-variant mb-6">
            Book a 15-minute demo with our founder — no sales pressure, just answers.
          </p>
          <button className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-full font-semibold hover:opacity-90 transition-all">
            Book a Free Demo
          </button>
        </div>
      </div>
    </section>
  );
}

export default FAQ;
