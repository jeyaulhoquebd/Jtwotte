import React from 'react';
import { motion } from 'motion/react';

export default function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const scale = size === 'sm' ? 0.6 : size === 'lg' ? 1.5 : 1;

  return (
    <div className="flex items-center gap-3 select-none" style={{ transform: `scale(${scale})`, transformOrigin: 'left' }}>
      <div className="relative w-10 h-10">
        {/* Abstract Emblem */}
        <motion.div
           initial={{ opacity: 0 }}
           animate={{ opacity: 1 }}
           className="absolute inset-0 shadow-[0_0_20px_rgba(0,242,255,0.4)]"
        >
          <svg viewBox="0 0 100 100" className="w-full h-full">
             <defs>
               <linearGradient id="cyanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                 <stop offset="0%" stopColor="white" />
                 <stop offset="100%" stopColor="var(--color-jtweet-cyan)" />
               </linearGradient>
             </defs>
             
             {/* Background pulse ring */}
             <motion.circle 
               cx="50" cy="50" r="45" 
               stroke="var(--color-jtweet-cyan)" 
               strokeWidth="0.5" 
               fill="none"
               animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.3, 0.1] }}
               transition={{ duration: 4, repeat: Infinity }}
             />

             {/* Connection Nodes */}
             {[
               { x: 25, y: 30 }, { x: 75, y: 30 }, 
               { x: 50, y: 50 }, 
               { x: 25, y: 70 }, { x: 75, y: 70 }
             ].map((pos, i) => (
               <motion.circle
                 key={i}
                 cx={pos.x} cy={pos.y} r="2"
                 fill="white"
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: i * 0.1 }}
               />
             ))}

             {/* Flow Lines */}
             <motion.path
                d="M 25 30 L 50 50 L 75 70"
                stroke="url(#cyanGradient)"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
             />
             <motion.path
                d="M 75 30 L 50 50 L 25 70"
                stroke="white"
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 1.5, delay: 0.3, ease: "easeInOut" }}
             />

             {/* Core Glow */}
             <motion.circle
                cx="50" cy="50" r="3"
                fill="var(--color-jtweet-cyan)"
                animate={{ 
                  filter: ["blur(0px)", "blur(4px)", "blur(0px)"],
                  scale: [1, 1.5, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
             />
          </svg>
        </motion.div>
      </div>

      <h1 className="font-display font-bold text-2xl tracking-tighter flex items-baseline">
        <span className="text-jtweet-cyan cyan-glow">J</span>
        <span className="text-white">Tweet</span>
      </h1>
    </div>
  );
}
