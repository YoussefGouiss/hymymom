import Link from 'next/link';
import { ArrowLeft, Shield, Lock, Users, Eye, Mail } from 'lucide-react';

export default function PrivacyPage() {
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
            <Shield className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Privacy Policy</h1>
            <p className="text-gray-500 dark:text-slate-400">Last updated: May 8, 2026</p>
          </div>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">1. Introduction</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              At HymyMom, we take your privacy and your clients' sanctuary seriously. This Privacy Policy explains how we 
              collect, use, disclose, and safeguard information when you use our practice 
              management platform designed specifically for postpartum doulas.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2. Information We Collect</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  Account Information
                </h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm">
                  Name, email address, password, and professional profile information you provide when creating an account.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-primary" />
                  Family & Clinical Data
                </h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm">
                  Information about the families you serve, including sensitive clinical notes, breastfeeding logs, 
                  recovery milestones, and visit history.
                </p>
              </div>
              
              <div className="bg-gray-50 dark:bg-slate-800/50 p-4 rounded-xl">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  Platform Usage
                </h3>
                <p className="text-gray-600 dark:text-slate-300 text-sm">
                  Technical data about how you interact with our platform to help us improve the care tools we provide.
                </p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">3. How We Use Your Information</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              We use your information exclusively to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-slate-300 mb-4">
              <li>Maintain your practice management tools</li>
              <li>Securely store clinical records for your families</li>
              <li>Coordinate visit schedules and reminders</li>
              <li>Process payments through our secure ledger</li>
              <li>Improve the platform experience for caregivers</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">4. Data Sanctuary & Security</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              We implement clinical-grade security measures to protect the sacred data of the families you serve:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-slate-300 mb-4">
              <li>256-bit SSL encryption for all data in transit</li>
              <li>Encrypted-at-rest database storage</li>
              <li>Strict access controls and multi-factor authentication options</li>
              <li>Privacy-first architecture designed for sensitive postpartum records</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">5. Data Sharing</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              We do not sell your personal or clinical information. Data is only shared with:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-slate-300 mb-4">
              <li><strong>Secure Infrastructure Partners</strong> — Trusted cloud hosting and database providers</li>
              <li><strong>Legal Compliance</strong> — Only when strictly required by law</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">6. Your Rights & Control</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              Your practice data belongs to you. You have the right to:
            </p>
            <ul className="list-disc pl-6 text-gray-600 dark:text-slate-300 mb-4">
              <li>Access and export your full practice history</li>
              <li>Correct any information on your profile</li>
              <li>Delete your account and all associated family records</li>
              <li>Withdraw consent for data processing at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">7. Contact Us</h2>
            <p className="text-gray-600 dark:text-slate-300 leading-relaxed mb-4">
              If you have questions about this Privacy Policy or your practice data, please reach out to our team:
            </p>
            <div className="flex items-center gap-2 text-primary font-medium">
              <Mail className="w-4 h-4" />
              <a href="mailto:privacy@hymymom.com" className="hover:underline">privacy@hymymom.com</a>
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
              <Link href="/privacy" className="text-sm text-primary font-bold">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-sm text-gray-500 hover:text-primary dark:text-slate-400 dark:hover:text-primary transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
