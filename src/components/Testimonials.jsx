import { useState } from 'react';
import { Quote, Star, ChevronLeft, ChevronRight } from 'lucide-react';

const testimonials = [
  {
    id: 1,
    name: "Sarah Mitchell",
    role: "DONA-Certified Doula",
    location: "Austin, TX",
    image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop&crop=face",
    quote: "HymyMom saved me 10 hours a week. I used to spend Sunday nights organizing my notes and payment records. Now everything is in one place, and I can actually breathe.",
    rating: 5,
    metric: "10+ hrs/week saved"
  },
  {
    id: 2,
    name: "Elena Rodriguez",
    role: "Postpartum Doula",
    location: "Miami, FL",
    image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop&crop=face",
    quote: "My clients love that I can pull up their baby's feeding log in seconds during visits. It makes me look so professional, and the families feel truly cared for.",
    rating: 5,
    metric: "50+ families served"
  },
  {
    id: 3,
    name: "Jessica Chen",
    role: "Birth & Postpartum Doula",
    location: "Seattle, WA",
    image: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop&crop=face",
    quote: "I switched from spreadsheets and was skeptical. Within 3 days, I couldn't imagine going back. The mobile app lets me log visits while I'm still with the family.",
    rating: 5,
    metric: "Doubled client capacity"
  },
  {
    id: 4,
    name: "Amara Williams",
    role: "Certified Lactation Consultant",
    location: "Portland, OR",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    quote: "The PDF reports feature is a game-changer. I can send professional visit summaries to pediatricians, and they actually take my referrals seriously now.",
    rating: 5,
    metric: "3x more referrals"
  }
];

function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-surface to-primary/5 dark:from-surface dark:to-primary/5">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 dark:bg-primary/10 text-primary dark:text-primary font-semibold text-xs uppercase tracking-widest mb-4">
            Trusted by 2,500+ Doulas
          </span>
          <h2 className="text-4xl md:text-5xl font-headline font-bold text-on-surface dark:text-on-surface mb-4">
            Loved by Birth Workers
          </h2>
          <p className="text-xl text-on-surface-variant dark:text-on-surface-variant max-w-2xl mx-auto">
            Join the community of professional doulas who've reclaimed their time and elevated their practice.
          </p>
        </div>

        {/* Desktop Grid */}
        <div className="hidden lg:grid lg:grid-cols-3 gap-8">
          {testimonials.slice(0, 3).map((testimonial) => (
            <TestimonialCard key={testimonial.id} testimonial={testimonial} />
          ))}
        </div>

        {/* Mobile Carousel */}
        <div className="lg:hidden relative">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div key={testimonial.id} className="w-full flex-shrink-0 px-4">
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
          </div>

          {/* Carousel Controls */}
          <div className="flex justify-center gap-2 mt-8">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === activeIndex 
                    ? 'bg-primary w-6' 
                    : 'bg-on-surface-variant/20'
                }`}
              />
            ))}
          </div>

          <button 
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 w-12 h-12 bg-surface dark:bg-surface-container-high rounded-full shadow-lg flex items-center justify-center text-on-surface-variant dark:text-on-surface-variant hover:bg-primary/5 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button 
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 w-12 h-12 bg-surface dark:bg-surface-container-high rounded-full shadow-lg flex items-center justify-center text-on-surface-variant dark:text-on-surface-variant hover:bg-primary/5 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        {/* Stats Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <StatItem value="2,500+" label="Active Doulas" />
          <StatItem value="50,000+" label="Families Supported" />
          <StatItem value="4.9/5" label="Average Rating" />
          <StatItem value="98%" label="Retention Rate" />
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ testimonial }) {
  return (
    <div className="bg-surface dark:bg-surface-container/80 rounded-3xl p-8 shadow-xl border border-outline-variant/10 dark:border-outline-variant/5 hover:shadow-2xl transition-shadow duration-300 relative group">
      <Quote className="absolute top-6 right-6 w-10 h-10 text-primary/10 dark:text-primary/20" />
      
      {/* Rating */}
      <div className="flex gap-1 mb-4">
        {[...Array(testimonial.rating)].map((_, i) => (
          <Star key={i} className="w-5 h-5 fill-amber-400 text-amber-400" />
        ))}
      </div>

      {/* Quote */}
      <blockquote className="text-on-surface-variant dark:text-on-surface-variant leading-relaxed mb-6 text-lg">
        "{testimonial.quote}"
      </blockquote>

      {/* Author */}
      <div className="flex items-center gap-4">
        <img 
          src={testimonial.image} 
          alt={testimonial.name}
          className="w-14 h-14 rounded-full object-cover ring-4 ring-primary/10 dark:ring-primary/20"
        />
        <div>
          <h4 className="font-bold text-on-surface dark:text-on-surface">{testimonial.name}</h4>
          <p className="text-sm text-on-surface-variant/60 dark:text-on-surface-variant/60">{testimonial.role}</p>
          <p className="text-xs text-primary font-medium">{testimonial.location}</p>
        </div>
      </div>

      {/* Metric Badge */}
      <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary/5 dark:bg-primary/20 rounded-full">
        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        <span className="text-sm font-semibold text-primary dark:text-primary">{testimonial.metric}</span>
      </div>
    </div>
  );
}

function StatItem({ value, label }) {
  return (
    <div className="group">
      <div className="text-3xl md:text-4xl font-bold text-primary dark:text-primary mb-1">
        {value}
      </div>
      <div className="text-sm text-on-surface-variant dark:text-on-surface-variant font-medium">
        {label}
      </div>
    </div>
  );
}

export default Testimonials;
