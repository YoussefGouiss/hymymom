'use client';

import React, { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';

export default function Hero() {
  const containerRef = useRef(null);
  const { user, isLoading: authLoading } = useAuth();

  // Mouse Parallax Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 25, stiffness: 150 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [mouseX, mouseY]);

  // Parallax transforms for cards
  const card1X = useTransform(smoothMouseX, [-0.5, 0.5], [-12, 12]);
  const card1Y = useTransform(smoothMouseY, [-0.5, 0.5], [-9, 9]);
  const card1Rotate = useTransform(smoothMouseX, [-0.5, 0.5], [-3, 0]);

  const card2X = useTransform(smoothMouseX, [-0.5, 0.5], [-20, 20]);
  const card2Y = useTransform(smoothMouseY, [-0.5, 0.5], [-15, 15]);
  const card2Rotate = useTransform(smoothMouseX, [-0.5, 0.5], [-0.5, 2.5]);

  const card3X = useTransform(smoothMouseX, [-0.5, 0.5], [-16, 16]);
  const card3Y = useTransform(smoothMouseY, [-0.5, 0.5], [-12, 12]);
  const card3Rotate = useTransform(smoothMouseX, [-0.5, 0.5], [-1, 2]);

  const card4X = useTransform(smoothMouseX, [-0.5, 0.5], [-14, 14]);
  const card4Y = useTransform(smoothMouseY, [-0.5, 0.5], [-11, 11]);
  const card4Rotate = useTransform(smoothMouseX, [-0.5, 0.5], [-2.3, 1]);

  return (
    <section ref={containerRef} className="hero relative min-h-screen flex items-center justify-center overflow-hidden bg-transparent text-slate-900 dark:text-[#e8f4f8]">
      <div className="max-w-7xl mx-auto px-12 flex flex-col lg:flex-row items-center gap-12 z-10">
        {/* Left: Text Block */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
          viewport={{ once: true }}
          className="flex-1 max-w-[520px]"
        >
          <div className="eyebrow inline-flex items-center gap-2 px-3.5 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-full text-[11.5px] font-medium tracking-[1.2px] uppercase mb-6 backdrop-blur-md">
            <span className="eyebrow-dot w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span>
            Built for Postpartum Doulas
          </div>

          <h1 className="headline text-[52px] md:text-[64px] font-headline font-bold leading-[1.12] text-slate-900 dark:text-[#e8f4ff] mb-5 tracking-tight">
            Nurturing new life,<br />
            <span className="italic text-primary">without the overwhelm.</span>
          </h1>

          <p className="subhead text-base leading-[1.7] text-slate-600 dark:text-[#b4d2eb]/70 max-w-[420px] mb-9 font-light">
            HymyMom helps you organize clinical notes, track recovery, and manage your practice in one calm space — so you can be fully present for every family.
          </p>

          <div className="cta-row flex items-center gap-4 flex-wrap">
            {!authLoading && (
              <Link 
                href={user ? "/dashboard" : "/register"} 
                className="btn-primary inline-block px-7 py-3.5 bg-gradient-to-br from-primary to-primary-container text-white rounded-full text-[14.5px] font-medium shadow-[0_4px_24px_rgba(var(--primary-rgb),0.3)] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(var(--primary-rgb),0.45)] transition-all"
              >
                {user ? "Enter Sanctuary" : "Start free — 2 months free"}
              </Link>
            )}
          </div>

          <div className="social-proof flex items-center gap-3.5 mt-9">
            <div className="avatars flex -space-x-2">
              {['S', 'M', 'J', 'A'].map((initial, i) => (
                <div key={i} className="avatar w-[30px] h-[30px] rounded-full border-2 border-white dark:border-[#0a0f1e] overflow-hidden" style={{ background: i % 2 === 0 ? 'linear-gradient(135deg,#6ab5e2,#4a90c5)' : 'linear-gradient(135deg,#8ec8f0,#5ba3d9)' }}>
                  <div className="avatar-img w-full h-full flex items-center justify-center text-[10px] font-semibold text-white">{initial}</div>
                </div>
              ))}
            </div>
            <div className="proof-text text-[12.5px] text-slate-500 dark:text-[#a0c8e6a6] leading-[1.4]">
              <strong className="text-slate-900 dark:text-[#b4d7f0e6] font-medium">1,400+ doulas</strong> already trust HymyMom<br />
              ★★★★★ rated across all reviews
            </div>
          </div>
        </motion.div>

        {/* Right: Floating Cards */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          viewport={{ once: true }}
          className="cards-area relative w-[420px] h-[420px] hidden lg:block"
        >
          {/* Card: Payment */}
          <motion.div 
            style={{ x: card1X, y: card1Y, rotate: card1Rotate }}
            className="glass-card card-payment absolute top-[60px] left-0 w-[190px] bg-white/[0.04] backdrop-blur-[20px] border border-white/[0.09] rounded-[20px] p-[20px_22px] shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.07)]"
          >
            <div className="card-label text-[10px] font-semibold tracking-widest uppercase text-[#8cbef699] mb-3">Payment</div>
            <div className="payment-amount flex items-baseline gap-1 mb-2.5">
              <span className="pay-currency text-base text-[#8cc3e1b3] font-normal">$</span>
              <span className="pay-number text-[32px] font-semibold text-[#c8e4ff] leading-none">320</span>
            </div>
            <span className="pay-badge inline-block bg-[#50c3821f] border border-[#50c38233] text-[#6ed6a8] text-[10.5px] font-medium px-2 py-1 rounded-full mb-3">✓ Received</span>
            <div className="status-row flex items-center gap-2 p-[8px_10px] bg-[#64c88c14] border border-[#64c88c26] rounded-[10px]">
              <div className="status-dot w-[7px] h-[7px] bg-[#5ecea0] rounded-full animate-pulse"></div>
              <span className="status-text text-xs text-[#a0e1bee6]">Session with Leila confirmed</span>
            </div>
          </motion.div>

          {/* Card: Today's Visits */}
          <motion.div 
            style={{ x: card2X, y: card2Y, rotate: card2Rotate }}
            className="glass-card card-visits absolute top-[20px] left-[80px] w-[200px] bg-white/[0.04] backdrop-blur-[20px] border border-white/[0.09] rounded-[20px] p-[20px_22px] shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.07)]"
          >
            <div className="card-label text-[10px] font-semibold tracking-widest uppercase text-[#8cbef699] mb-3">Today's visits</div>
            <div className="visit-avatars flex gap-1.5 mb-2.5">
              {['SA', 'MR', 'JK'].map((init, i) => (
                <div key={i} className="va w-[26px] h-[26px] rounded-full text-[9px] font-semibold text-white flex items-center justify-center" style={{ background: i === 0 ? 'linear-gradient(135deg,#5ba3d9,#3a85c5)' : i === 1 ? 'linear-gradient(135deg,#8ec8f0,#5ba3d9)' : 'linear-gradient(135deg,#7bb5e0,#4a95cc)' }}>{init}</div>
              ))}
            </div>
            <div className="card-title text-[13px] font-medium text-[#c8e1f5e6] mb-1.5">3 visits scheduled</div>
            <div className="card-sub text-[11.5px] text-[#8cb9dcb3] mb-3.5">Next: 10:30 AM · Sarah A.</div>
            <div className="mini-bars flex items-end gap-1 h-9">
              {[40, 65, 90, 55, 30, 75, 50].map((h, i) => (
                <div key={i} className={`mini-bar flex-1 rounded-t-[3px] ${i === 2 ? 'bg-[#64a5dca6]' : 'bg-[#64a5dc33]'}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </motion.div>

          {/* Card: Wellbeing Score */}
          <motion.div 
            style={{ x: card3X, y: card3Y, rotate: card3Rotate }}
            className="glass-card card-metrics absolute top-[140px] left-[160px] w-[220px] bg-white/[0.04] backdrop-blur-[20px] border border-white/[0.09] rounded-[20px] p-[20px_22px] shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.07)]"
          >
            <div className="card-label text-[10px] font-semibold tracking-widest uppercase text-[#8cbef699] mb-3">Wellbeing score</div>
            <div className="ring-wrap flex items-center gap-3.5">
              <svg className="ring-svg w-[52px] h-[52px]" viewBox="0 0 52 52">
                <circle cx="26" cy="26" r="20" fill="none" stroke="rgba(100,160,220,0.15)" strokeWidth="6" />
                <circle cx="26" cy="26" r="20" fill="none" stroke="#5ba3d9" strokeWidth="6" strokeDasharray="125.6" strokeDashoffset="28" strokeLinecap="round" transform="rotate(-90 26 26)" />
                <text x="26" y="30" textAnchor="middle" fill="#c8e4ff" fontSize="11" fontWeight="600">78%</text>
              </svg>
              <div className="ring-info text-xs text-[#96c3e6b3] leading-[1.5]">
                <strong className="text-[#c8e1f5f2] block text-[15px] font-semibold">Sarah Ahmed</strong>
                Week 34 · On track<br />
                Last update 2h ago
              </div>
            </div>
          </motion.div>

          {/* Card: Reminder */}
          <motion.div 
            style={{ x: card4X, y: card4Y, rotate: card4Rotate }}
            className="glass-card card-reminder absolute top-[290px] left-[90px] w-[200px] bg-white/[0.04] backdrop-blur-[20px] border border-white/[0.09] rounded-[20px] p-[20px_22px] shadow-[0_4px_24px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.07)]"
          >
            <div className="card-label text-[10px] font-semibold tracking-widest uppercase text-[#8cbef699] mb-3">Reminder</div>
            <div className="reminder-row flex items-center gap-2.5 p-2 bg-[#64a0dc12] border border-[#64a0dc21] rounded-[10px] mt-1">
              <div className="reminder-icon w-7 h-7 bg-[#64a0dc26] rounded-lg flex items-center justify-center text-[13px] flex-shrink-0">🔔</div>
              <div className="reminder-text text-[11.5px] text-[#a0c8e6cc] leading-tight">
                <strong className="text-[#bedcf5f2] font-medium">Postpartum check-in</strong><br />
                Maya · Tomorrow 9:00 AM
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll hint */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="scroll-hint absolute bottom-7 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-[#8cb4d766] text-[11px] tracking-widest uppercase z-10"
      >
        <div className="scroll-line w-[1px] h-9 bg-gradient-to-b from-[#78aad266] to-transparent animate-bounce"></div>
        scroll
      </motion.div>
    </section>
  );
}
