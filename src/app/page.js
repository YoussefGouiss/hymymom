'use client';

import Navbar from '@/components/landing/Navbar';
import Hero from '@/components/landing/Hero';
import GlobalBackground from '@/components/landing/GlobalBackground';
import Problem from '@/components/landing/Problem';
import Solution from '@/components/landing/Solution';
import Features from '@/components/landing/Features';
import HowItWorks from '@/components/landing/HowItWorks';
import SocialProof from '@/components/landing/SocialProof';
import Pricing from '@/components/landing/Pricing';
import FinalCTA from '@/components/landing/FinalCTA';
import FAQ from '@/components/landing/FAQ';
import Footer from '@/components/landing/Footer';
import ScrollToTop from '@/components/landing/ScrollToTop';

export default function LandingPage() {
  return (
    <div className="bg-transparent text-on-surface dark:text-white font-sans selection:bg-primary/30 transition-colors duration-500 relative overflow-x-hidden">
      <GlobalBackground />
      <Navbar />
      <ScrollToTop />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <Features />
        <HowItWorks />
        <SocialProof />
        <Pricing />
        <FinalCTA />
        <FAQ />
      </main>
      <Footer />
      
      {/* Global CSS for floating animations and smooth scrolling */}
      <style jsx global>{`
        :root {
          --primary-rgb: 56, 189, 248; /* sky-400 */
        }
        
        html {
          scroll-behavior: smooth;
        }

        body {
          background-image: url("https://grainy-gradients.vercel.app/noise.svg");
          background-repeat: repeat;
          background-size: 200px;
          background-attachment: fixed;
        }

        :global(.dark) body {
          background-image: none;
        }
        
        /* Custom Scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(var(--primary-rgb), 0.2);
          border-radius: 20px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--primary-rgb), 0.4);
        }

        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-in {
          animation-fill-mode: forwards;
        }
      `}</style>
    </div>
  );
}
