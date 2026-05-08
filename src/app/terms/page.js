import Link from 'next/link';
import { ArrowLeft, FileText, Mail } from 'lucide-react';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-cloud-white dark:bg-[#030712] transition-colors duration-300">
      {/* Header */}
      <header className="bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-white/5 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-headline font-bold text-primary">
              HymyMom
            </Link>
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Terms of Service</h1>
            <p className="text-gray-500 dark:text-slate-400">Last updated: May 8, 2026</p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              By accessing or using HymyMom, you agree to be bound by these Terms of Service. 
              As a platform designed for caregivers, we expect all users to maintain professional 
              and ethical standards while using our tools.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Description of Service</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              HymyMom is a practice management platform specifically tailored for postpartum doulas. 
              Our initial launch provides founding members with tools for:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-slate-300 mb-4">
              <li>Comprehensive Family/Client Management</li>
              <li>Secure Clinical Note-taking & Visit Logs</li>
              <li>Professional Scheduling & Coordination</li>
              <li>Practice Financials & Payment Tracking</li>
              <li>Automated Reminders & Follow-ups</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. User Accounts & Security</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              You are responsible for maintaining the confidentiality of your credentials and for all activities 
              under your account. Given the sensitive nature of postpartum care, we strongly encourage 
              the use of secure passwords and regular security check-ins.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Initial Launch Offer</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              As part of our initial launch, founding members receive **2 months of full access** to the 
              platform completely free. No credit card is required to begin this trial period.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Professional Responsibility</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              As a doula, you are solely responsible for the data you collect and the care you provide. 
              HymyMom provides the tools, but you must ensure you have proper consent from the families 
              you serve and that your documentation meets professional standards.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. Data Ownership</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              Your data belongs to you. You can export your client records and session notes at any time. 
              If you choose to leave the platform, we provide easy tools to take your practice with you.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">7. Termination</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              We reserve the right to suspend accounts that violate professional ethics or engage 
              in activities that compromise the security of the platform and its users.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">8. Contact Us</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              For questions regarding these terms, please reach out to our founding team:
            </p>
            <div className="flex items-center gap-2 text-primary font-medium">
              <Mail className="w-4 h-4" />
              <a href="mailto:support@hymymom.com" className="hover:underline">support@hymymom.com</a>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-8 transition-colors duration-300">
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-gray-500 dark:text-slate-400 text-sm font-medium">
              © {new Date().getFullYear()} HymyMom. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-primary font-bold">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
