import React from 'react';
import { motion } from 'motion/react';
import { Zap, Activity, Brain, ArrowUpRight, Sparkles } from 'lucide-react';

const TRENDS = [
  { topic: "#GenerativeAI", count: "1.2M signals", density: "Critical", trend: "+42%" },
  { topic: "#FutureTech", count: "840K signals", density: "High", trend: "+12%" },
  { topic: "#NeuralLink", count: "520K signals", density: "Stable", trend: "+5%" },
  { topic: "#QuantumSocial", count: "310K signals", density: "Rising", trend: "+18%" }
];

function TrendingTopic({ topic, count, density, trend }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="glass p-5 md:p-6 rounded-[24px] border border-white/5 hover:border-jtweet-cyan/30 hover:bg-jtweet-cyan/5 transition-all cursor-pointer group flex justify-between items-center overflow-hidden relative"
    >
      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
         <ArrowUpRight size={24} className="text-jtweet-cyan" />
      </div>
      
      <div className="flex gap-4 items-center">
         <div className="w-12 h-12 rounded-2xl bg-white/2 flex items-center justify-center text-white/20 group-hover:text-jtweet-cyan group-hover:bg-jtweet-cyan/10 transition-all border border-white/5">
            <Zap size={20} />
         </div>
         <div>
            <h4 className="font-display font-bold text-lg text-white group-hover:text-jtweet-cyan transition-colors">{topic}</h4>
            <div className="flex items-center gap-3 mt-1.5">
               <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">{count}</span>
               <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                 density === 'Critical' ? 'bg-red-400/10 text-red-400 border border-red-400/20' : 
                 density === 'High' ? 'bg-jtweet-cyan/10 text-jtweet-cyan border border-jtweet-cyan/20' : 
                 'bg-white/5 text-white/40 border border-white/10'
               }`}>
                 {density} Node
               </span>
            </div>
         </div>
      </div>
      
      <div className="text-right hidden sm:block">
         <p className="text-[10px] font-bold text-white/60 uppercase tracking-tighter">Growth</p>
         <p className="text-sm font-mono font-bold text-jtweet-cyan">{trend}</p>
      </div>
    </motion.div>
  );
}

export default function ExplorePage() {
  return (
    <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
      <header className="relative py-8 md:py-12 overflow-hidden rounded-[32px] glass border border-white/5 px-6 md:px-10">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-jtweet-cyan/10 blur-[100px] rounded-full" />
        <div className="relative z-10">
           <div className="flex items-center gap-2 mb-4 text-jtweet-cyan">
              <Sparkles size={20} className="animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em]">Synaptic Distribution</span>
           </div>
           <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight leading-none mb-4">
             Intelligence <span className="text-jtweet-cyan">Streams</span>
           </h2>
           <p className="text-white/40 uppercase tracking-widest text-[10px] md:text-xs font-bold flex items-center gap-2">
             Global Signal Distribution <Activity size={12} className="text-jtweet-cyan" />
           </p>
           
           <div className="mt-8 max-w-xl">
              <p className="text-xs md:text-sm text-white/50 leading-relaxed font-medium">
                The Neural Mesh prioritizes information flow by analyzing the heuristic weight of incoming signals. These streams work by measuring the <span className="text-white">synaptic resonance</span> between disparate nodes, ensuring that the most critical collective movements are unified into a single global signal distribution.
              </p>
           </div>
        </div>
      </header>
      
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
           <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-jtweet-cyan flex items-center gap-2">
             <Brain size={16} />
             Active Trending Nodes
           </h3>
           <div className="flex items-center gap-2 text-[10px] font-bold text-white/20 uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-jtweet-cyan animate-pulse" />
              Live Feedback
           </div>
        </div>
        
        <div className="grid gap-4">
          {TRENDS.map((trend, i) => (
            <TrendingTopic key={i} {...trend} />
          ))}
        </div>
      </div>

      <div className="glass p-6 rounded-[24px] border border-white/5 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative group">
         <div className="absolute inset-0 bg-jtweet-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity" />
         <div className="flex-1 space-y-2 relative z-10">
            <h4 className="font-display font-bold text-lg">Why these Nodes?</h4>
            <p className="text-xs text-white/40 leading-relaxed">
              Our heuristic engine identifies patterns not just by volume, but by the "Impact Factor"—the rate at which a signal triggers subsequent node activations across the mesh. This prevents noise from overwhelming the signal and highlights true evolutionary shifts in the global discourse.
            </p>
         </div>
         <button className="whitespace-nowrap px-8 py-3 bg-white text-jtweet-black font-bold uppercase tracking-widest text-[10px] rounded-full shadow-lg hover:bg-jtweet-cyan transition-all active:scale-95 relative z-10">
            Calibrate Filters
         </button>
      </div>
    </div>
  );
}
