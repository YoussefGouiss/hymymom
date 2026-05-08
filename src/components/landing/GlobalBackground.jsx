'use client';

import React, { useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

export default function GlobalBackground() {
  const [stars, setStars] = useState([]);
  
  // Mouse Parallax Values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 30, stiffness: 100 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Generate stars
    const newStars = Array.from({ length: 80 }).map((_, i) => ({
      id: i,
      size: Math.random() * 1.5 + 0.5,
      top: Math.random() * 100,
      left: Math.random() * 100,
      dur: (Math.random() * 3 + 2).toFixed(1),
      del: (Math.random() * -3).toFixed(1),
    }));
    setStars(newStars);

    const handleMouseMove = (e) => {
      const x = (e.clientX / window.innerWidth) - 0.5;
      const y = (e.clientY / window.innerHeight) - 0.5;
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none transition-colors duration-1000 bg-[#F1F5F9] dark:bg-[#0a0f1e]">
      {/* Mesh Gradients / Background Texture */}
      <div className="absolute inset-0 bg-mesh opacity-100 dark:opacity-0 transition-opacity duration-1000"></div>
      <div className="absolute inset-0 bg-gradient opacity-100 dark:opacity-100 transition-opacity duration-1000"></div>
      
      {/* Grid Pattern - Subtle in light mode */}
      <div className="absolute inset-0 opacity-[0.03] dark:opacity-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat transition-opacity duration-1000"></div>
      <div className="absolute inset-0 opacity-[0.15] dark:opacity-0" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

      {/* Stars - Only visible in dark mode */}
      <div className="stars absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-1000">
        {stars.map((star) => (
          <div
            key={star.id}
            className="star"
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: `${star.top}%`,
              left: `${star.left}%`,
              '--dur': `${star.dur}s`,
              '--del': `${star.del}s`,
            }}
          />
        ))}
      </div>

      {/* Floating Orbs with Parallax */}
      <motion.div 
        style={{ 
          x: smoothMouseX.get() * 60,
          y: smoothMouseY.get() * 40
        }}
        className="orb orb-1"
      />
      <motion.div 
        style={{ 
          x: smoothMouseX.get() * -40,
          y: smoothMouseY.get() * -30
        }}
        className="orb orb-2"
      />
      <motion.div 
        style={{ 
          x: smoothMouseX.get() * 30,
          y: smoothMouseY.get() * 50
        }}
        className="orb orb-3"
      />

      <style jsx>{`
        .bg-mesh {
          position: absolute;
          inset: 0;
          background-color: #F1F5F9;
          background-image: 
            radial-gradient(at 0% 0%, hsla(200, 100%, 90%, 1) 0, transparent 50%), 
            radial-gradient(at 50% 0%, hsla(210, 100%, 95%, 1) 0, transparent 50%), 
            radial-gradient(at 100% 0%, hsla(190, 100%, 92%, 1) 0, transparent 50%), 
            radial-gradient(at 50% 100%, hsla(205, 100%, 93%, 1) 0, transparent 50%);
          filter: blur(40px);
        }

        .bg-gradient {
          position: absolute;
          inset: 0;
          background: radial-gradient(ellipse 80% 60% at 20% 30%, rgba(137, 207, 240, 0.25) 0%, transparent 60%),
                      radial-gradient(ellipse 60% 50% at 80% 70%, rgba(127, 181, 230, 0.2) 0%, transparent 55%),
                      radial-gradient(ellipse 100% 80% at 50% 50%, transparent 0%, rgba(241, 245, 249, 0.5) 100%);
        }

        :global(.dark) .bg-gradient {
          background: radial-gradient(ellipse 80% 60% at 20% 30%, rgba(100, 160, 220, 0.18) 0%, transparent 60%),
                      radial-gradient(ellipse 60% 50% at 80% 70%, rgba(140, 190, 240, 0.12) 0%, transparent 55%),
                      radial-gradient(ellipse 100% 80% at 50% 50%, rgba(20, 40, 80, 0.9) 0%, #0a0f1e 80%);
        }

        .orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          pointer-events: none;
          transition: background-color 1s ease;
        }
        
        .orb-1 {
          width: 600px; height: 600px;
          background: rgba(137, 207, 240, 0.2);
          top: -150px; left: -150px;
        }
        :global(.dark) .orb-1 {
          background: rgba(100, 160, 230, 0.13);
        }

        .orb-2 {
          width: 500px; height: 500px;
          background: rgba(127, 181, 230, 0.15);
          bottom: -100px; right: -100px;
        }
        :global(.dark) .orb-2 {
          background: rgba(160, 210, 255, 0.1);
        }

        .orb-3 {
          width: 400px; height: 400px;
          background: rgba(186, 230, 253, 0.15);
          top: 30%; left: 50%;
        }
        :global(.dark) .orb-3 {
          background: rgba(200, 230, 255, 0.08);
        }

        .star {
          position: absolute;
          background: #c8e4ff;
          border-radius: 50%;
          animation: twinkle var(--dur, 3s) ease-in-out infinite var(--del, 0s);
        }
        @keyframes twinkle {
          0%,100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.4); }
        }
      `}</style>
    </div>
  );
}
