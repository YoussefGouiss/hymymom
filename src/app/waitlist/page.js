'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Sparkles, CheckCircle, Loader2, Mail, ArrowRight, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function WaitlistPage() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [interest, setInterest] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [position, setPosition] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('waitlist_signups')
        .select('id, position')
        .eq('email', email)
        .single();

      if (existing) {
        setPosition(existing.position);
        setIsJoined(true);
        setIsLoading(false);
        return;
      }

      // Get current count for position
      const { count } = await supabase
        .from('waitlist_signups')
        .select('*', { count: 'exact', head: true });

      const newPosition = (count || 0) + 1;

      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('waitlist_signups')
        .insert([
          { 
            name: name,
            email: email,
            source: 'waitlist_page',
            position: newPosition,
            status: 'PENDING'
          }
        ]);

      if (insertError) throw insertError;

      setPosition(newPosition);
      setIsJoined(true);
    } catch (err) {
      console.error('Waitlist error:', err);
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isJoined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 dark:from-[#030712] dark:via-[#0a0f1e] dark:to-[#0f172a] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            You're on the List! 🎉
          </h2>
          <p className="text-gray-600 dark:text-slate-300 mb-4">
            Thanks for your interest! We'll notify you as soon as the Elite plan is available.
          </p>
          {position && (
            <div className="bg-sky-50 dark:bg-sky-900/20 rounded-xl p-4 mb-6">
              <p className="text-sky-700 dark:text-sky-300 font-semibold">
                Your position: #{position}
              </p>
              <p className="text-sm text-sky-600 dark:text-sky-400 mt-1">
                {position > 1 ? `${position - 1} people ahead of you` : 'You\'re first in line!'}
              </p>
            </div>
          )}
          <div className="flex flex-col gap-3">
            <Link 
              href="/" 
              className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-sky-500 text-white rounded-full font-semibold hover:bg-sky-600 transition-colors"
            >
              Back to Home
            </Link>
            <Link 
              href="/register" 
              className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-sky-500 text-sky-500 rounded-full font-semibold hover:bg-sky-50 dark:hover:bg-sky-900/20 transition-colors"
            >
              Join the Sanctuary Now
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-violet-50 dark:from-[#030712] dark:via-[#0a0f1e] dark:to-[#0f172a]">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/5">
        <div className="max-w-4xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-headline font-bold italic text-sky-500">
              Hymymom Pro
            </Link>
            <Link 
              href="/" 
              className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-sky-500 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/20 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-violet-500" />
            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">Coming Soon</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Join the Elite Waitlist
          </h1>
          <p className="text-xl text-gray-600 dark:text-slate-300 max-w-lg mx-auto">
            Be the first to access advanced automation features, client portals, and business intelligence tools.
          </p>
        </div>

        {/* Benefits */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          {[
            { icon: '🤖', title: 'AI Automation', desc: 'Smart workflows' },
            { icon: '👥', title: 'Client Portal', desc: 'Self-service access' },
            { icon: '📊', title: 'Analytics', desc: 'Growth insights' },
          ].map((benefit, index) => (
            <div key={index} className="bg-white dark:bg-slate-900 rounded-2xl p-6 text-center shadow-sm border border-gray-100 dark:border-white/5">
              <div className="text-3xl mb-2">{benefit.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{benefit.title}</h3>
              <p className="text-sm text-gray-500 dark:text-slate-400">{benefit.desc}</p>
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl p-8 border border-gray-100 dark:border-white/5">
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                What interests you most?
              </label>
              <select
                value={interest}
                onChange={(e) => setInterest(e.target.value)}
                className="w-full px-4 py-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                required
              >
                <option value="">Select an option</option>
                <option value="automation">Automated Session Reports</option>
                <option value="portal">Client-Facing Portal</option>
                <option value="analytics">Business Analytics Suite</option>
                <option value="white-label">White-Label Options</option>
                <option value="all">All Elite Features</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 bg-gradient-to-r from-sky-500 to-violet-500 text-white rounded-xl font-bold text-lg hover:opacity-90 transition-opacity flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Joining...
                </>
              ) : (
                <>
                  Join Waitlist
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-slate-400">
            No spam, ever. Unsubscribe anytime.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-slate-800 py-8 mt-12">
        <div className="max-w-4xl mx-auto px-6 text-center text-gray-500 dark:text-slate-400 text-sm">
          © 2024 Hymymom Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
