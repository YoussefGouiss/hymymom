import { useState } from 'react';
import { Mail, ArrowRight, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

function Newsletter({ source = 'footer' }) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Check if email already exists
      const { data: existing } = await supabase
        .from('newsletter_subscribers')
        .select('id')
        .eq('email', email)
        .single();

      if (existing) {
        setError('This email is already subscribed!');
        setIsLoading(false);
        return;
      }

      // Insert into Supabase
      const { error: insertError } = await supabase
        .from('newsletter_subscribers')
        .insert([
          { 
            email: email, 
            source: source,
            status: 'ACTIVE'
          }
        ]);

      if (insertError) throw insertError;

      setIsSubscribed(true);
    } catch (err) {
      console.error('Newsletter error:', err);
      setError('Failed to subscribe. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubscribed) {
    return (
      <div className="bg-sky-50 dark:bg-sky-900/10 rounded-2xl p-8 border border-sky-100 dark:border-sky-500/20">
        <div className="flex items-center gap-3 text-green-600 dark:text-green-400">
          <CheckCircle className="w-6 h-6" />
          <p className="font-semibold">Thanks for subscribing! Check your inbox for confirmation.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-sky-500 to-violet-500 rounded-3xl p-8 md:p-12 text-white">
      <div className="max-w-2xl mx-auto text-center">
        <h3 className="text-2xl md:text-3xl font-bold mb-4">
          Stay Updated
        </h3>
        <p className="text-sky-100 mb-8">
          Get weekly tips on doula practice management, new features, and exclusive offers.
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-400/30 rounded-xl text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full pl-12 pr-4 py-4 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 whitespace-nowrap"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                Subscribe
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <p className="mt-4 text-sm text-sky-100">
          Join 5,000+ doulas. No spam, unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}

export default Newsletter;
