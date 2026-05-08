'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, MessageSquare, Send, CheckCircle, Loader2, Phone, MapPin } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('contact_submissions')
        .insert([
          {
            name: formData.name,
            email: formData.email,
            subject: formData.subject,
            message: formData.message,
            status: 'NEW'
          }
        ]);

      if (insertError) throw insertError;

      setIsSent(true);
    } catch (err) {
      console.error('Contact form error:', err);
      setError('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (isSent) {
    return (
      <div className="min-h-screen bg-surface dark:bg-surface flex items-center justify-center px-4 transition-colors duration-300">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-3xl font-bold text-on-surface dark:text-on-surface mb-4">
            Message Sent!
          </h2>
          <p className="text-on-surface-variant dark:text-on-surface-variant mb-8">
            Thanks for reaching out. We'll get back to you within 24 hours.
          </p>
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-full font-semibold hover:opacity-90 transition-all"
          >
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface dark:bg-surface transition-colors duration-300">
      {/* Header */}
      <header className="bg-surface dark:bg-surface border-b border-outline-variant/10 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-headline font-bold italic text-primary">
              Hymymom Pro
            </Link>
            <Link 
              href="/" 
              className="flex items-center gap-2 text-on-surface-variant dark:text-on-surface-variant hover:text-primary transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24">
          {/* Contact Info */}
          <div>
            <h1 className="text-5xl lg:text-6xl font-bold text-on-surface dark:text-on-surface mb-6">
              Get in Touch
            </h1>
            <p className="text-lg lg:text-xl text-on-surface-variant dark:text-on-surface-variant mb-12 leading-relaxed">
              Have questions about Hymymom Pro? We'd love to hear from you. 
              Send us a message and we'll respond as soon as possible.
            </p>

            <div className="space-y-10">
              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Mail className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-on-surface dark:text-on-surface mb-1">Email Us</h3>
                  <p className="text-on-surface-variant dark:text-on-surface-variant text-base">
                    <a href="mailto:support@hymymom.pro" className="hover:text-primary transition-colors">
                      support@hymymom.pro
                    </a>
                  </p>
                  <p className="text-on-surface-variant/50 dark:text-on-surface-variant/50 text-sm mt-1">
                    We aim to respond within 24 hours
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-on-surface dark:text-on-surface mb-1">Schedule a Call</h3>
                  <p className="text-on-surface-variant dark:text-on-surface-variant text-base">
                    <a href="#" className="hover:text-primary transition-colors">
                      Book a demo
                    </a>
                  </p>
                  <p className="text-on-surface-variant/50 dark:text-on-surface-variant/50 text-sm mt-1">
                    15-minute intro call
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-7 h-7 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-on-surface dark:text-on-surface mb-1">Office Hours</h3>
                  <p className="text-on-surface-variant dark:text-on-surface-variant text-base">
                    Monday - Friday
                  </p>
                  <p className="text-on-surface-variant/50 dark:text-on-surface-variant/50 text-sm mt-1">
                    9:00 AM - 6:00 PM EST
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-surface-container-low dark:bg-surface-container-low rounded-[2rem] shadow-2xl p-8 lg:p-12 border border-outline-variant/10 transition-colors duration-300">
            {error && (
              <div className="mb-8 p-5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-2xl">
                <p className="text-base font-medium text-red-700 dark:text-red-400">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6 lg:space-y-8">
              <div className="grid lg:grid-cols-2 gap-6 lg:gap-8">
                <div>
                  <label className="block text-base font-semibold text-on-surface-variant dark:text-on-surface-variant mb-3">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Jane Doe"
                    className="w-full px-5 py-4 text-lg rounded-2xl border border-outline-variant/20 bg-surface dark:bg-surface text-on-surface dark:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-base font-semibold text-on-surface-variant dark:text-on-surface-variant mb-3">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="you@example.com"
                    className="w-full px-5 py-4 text-lg rounded-2xl border border-outline-variant/20 bg-surface dark:bg-surface text-on-surface dark:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold text-on-surface-variant dark:text-on-surface-variant mb-3">
                  Subject
                </label>
                <select
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  className="w-full px-5 py-4 text-lg rounded-2xl border border-outline-variant/20 bg-surface dark:bg-surface text-on-surface dark:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
                  required
                >
                  <option value="">Select a topic</option>
                  <option value="general">General Inquiry</option>
                  <option value="support">Technical Support</option>
                  <option value="billing">Billing Question</option>
                  <option value="partnership">Partnership</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-base font-semibold text-on-surface-variant dark:text-on-surface-variant mb-3">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help you?"
                  rows={6}
                  className="w-full px-5 py-4 text-lg rounded-2xl border border-outline-variant/20 bg-surface dark:bg-surface text-on-surface dark:text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-5 bg-primary text-white rounded-2xl font-bold text-xl hover:opacity-90 hover:scale-[1.02] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-primary/20"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-6 h-6 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    Send Message
                    <Send className="w-6 h-6" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface dark:bg-surface border-t border-outline-variant/10 py-12 mt-20 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 text-center text-on-surface-variant/50 text-base">
          © 2024 Hymymom Pro. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
