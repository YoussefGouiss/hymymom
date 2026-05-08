import { Shield, Lock, Award, Star, Users, CheckCircle } from 'lucide-react';

const badges = [
  { icon: Shield, label: "HIPAA Ready", description: "Healthcare data standards" },
  { icon: Lock, label: "256-bit Encryption", description: "Bank-level security" },
  { icon: Award, label: "SOC 2 Certified", description: "Enterprise security" },
  { icon: Star, label: "4.9/5 Rating", description: "From 500+ reviews" },
];

const trustedBy = [
  "DONA International",
  "CAPPA",
  "Birth Arts International",
  "Childbirth Educators"
];

function TrustBadges() {
  return (
    <section className="py-12 bg-surface dark:bg-surface border-y border-outline-variant/10 dark:border-outline-variant/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Security Badges */}
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 mb-12">
          {badges.map((badge, index) => (
            <div key={index} className="flex items-center gap-3 group">
              <div className="w-12 h-12 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <badge.icon className="w-6 h-6 text-primary dark:text-primary" />
              </div>
              <div>
                <p className="font-bold text-on-surface dark:text-on-surface text-sm">{badge.label}</p>
                <p className="text-xs text-on-surface-variant dark:text-on-surface-variant">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trusted By Section */}
        <div className="text-center">
          <p className="text-sm font-semibold text-on-surface-variant/60 dark:text-on-surface-variant/60 uppercase tracking-widest mb-6">
            Trusted by certified doulas from
          </p>
          <div className="flex flex-wrap justify-center items-center gap-6 md:gap-12 opacity-60">
            {trustedBy.map((org, index) => (
              <div 
                key={index}
                className="flex items-center gap-2 text-on-surface dark:text-on-surface font-semibold text-sm md:text-base"
              >
                <CheckCircle className="w-4 h-4 text-green-500" />
                {org}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default TrustBadges;
