import React, { useState } from 'react';
import { useTweets } from '../context/TweetContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  Users, 
  MessageSquare, 
  Zap, 
  ShieldAlert, 
  TrendingUp, 
  Activity,
  ArrowUpRight,
  ShieldCheck,
  Send,
  Trash2,
  BadgeCheck
} from 'lucide-react';
import { motion } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const data = [
  { name: 'Mon', pulses: 400 },
  { name: 'Tue', pulses: 300 },
  { name: 'Wed', pulses: 600 },
  { name: 'Thu', pulses: 800 },
  { name: 'Fri', pulses: 500 },
  { name: 'Sat', pulses: 900 },
  { name: 'Sun', pulses: 1100 },
];

export default function AdminDashboard() {
  const { tweets, deleteAllTweets } = useTweets();
  const { user } = useAuth();
  const { broadcastMessage } = useNotifications();
  const [broadcastText, setBroadcastText] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  if (user?.role !== 'admin' && user?.role !== 'founder') {
    return <div className="p-8 text-center text-red-400 font-bold">Unauthorized Access: Neural Block Active</div>;
  }

  const handleBroadcast = async () => {
    if (!broadcastText.trim()) return;
    setIsBroadcasting(true);
    await broadcastMessage(broadcastText);
    setBroadcastText('');
    setIsBroadcasting(false);
    alert("Global transmission successful.");
  };

  return (
    <div className="p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center justify-between">
         <div>
            <h1 className="text-3xl font-display font-bold tracking-tight flex items-center gap-2">
               Intelligence Hub
               <BadgeCheck className="text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
            </h1>
            <p className="text-white/40 text-sm mt-1 uppercase tracking-widest font-bold">Root Protocol Interface</p>
         </div>
         <div className="flex gap-4 items-center">
            <button 
              onClick={deleteAllTweets}
              className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-400 rounded-full text-[10px] font-bold uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all flex items-center gap-2"
            >
              <Trash2 size={12} /> Purge Network
            </button>
            <div className="px-4 py-2 glass rounded-full border-white/10 flex items-center gap-2">
               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
               <span className="text-xs font-bold uppercase tracking-wider">System Optimal</span>
            </div>
         </div>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard 
            title="Total Pulses" 
            value={tweets.length.toLocaleString()} 
            icon={<MessageSquare className="text-jtweet-cyan" />} 
            trend="+12% from last node"
         />
         <StatCard 
            title="Active Entities" 
            value="1,284" 
            icon={<Users className="text-purple-400" />} 
            trend="+5% growth"
         />
         <StatCard 
            title="Global Energy" 
            value="84.2%" 
            icon={<Zap className="text-yellow-400" />} 
            trend="Peak performance"
         />
      </div>

      {/* Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <div className="glass p-6 rounded-[32px] border-white/5 space-y-6">
            <div className="flex items-center justify-between">
               <h3 className="font-bold flex items-center gap-2 uppercase tracking-wider text-xs text-white/40">
                  <TrendingUp size={14} /> Network Traffic
               </h3>
               <button className="text-[10px] font-bold text-jtweet-cyan hover:underline">View Raw Logs</button>
            </div>
            <div className="h-64">
               <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                     <defs>
                        <linearGradient id="colorPulses" x1="0" y1="0" x2="0" y2="1">
                           <stop offset="5%" stopColor="#00f2ff" stopOpacity={0.3}/>
                           <stop offset="95%" stopColor="#00f2ff" stopOpacity={0}/>
                        </linearGradient>
                     </defs>
                     <Area type="monotone" dataKey="pulses" stroke="#00f2ff" fillOpacity={1} fill="url(#colorPulses)" strokeWidth={3} />
                     <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(10,10,10,0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px' }}
                        itemStyle={{ color: '#00f2ff' }}
                     />
                  </AreaChart>
               </ResponsiveContainer>
            </div>
         </div>

         <div className="glass p-6 rounded-[32px] border-white/5 space-y-6">
            <h3 className="font-bold flex items-center gap-2 uppercase tracking-wider text-xs text-white/40">
               <Activity size={14} /> System Health
            </h3>
            <div className="space-y-4">
               <HealthLine label="Database Latency" value="14ms" status="good" />
               <HealthLine label="CDN Propagation" value="99.9%" status="good" />
               <HealthLine label="AI Inference Time" value="240ms" status="warning" />
               <HealthLine label="Mod Queue Depth" value="0" status="good" />
            </div>
         </div>
      </div>

      {/* Action Tools */}
      <div className="glass p-8 rounded-[32px] border-white/5 bg-jtweet-cyan/5 border-jtweet-cyan/10">
         <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-jtweet-cyan/20 rounded-2xl">
               <ShieldAlert className="text-jtweet-cyan" />
            </div>
            <div>
               <h3 className="font-bold text-xl">Protocol Control</h3>
               <p className="text-white/40 text-sm">Advanced platform-wide administrative functions.</p>
            </div>
         </div>
         <div className="space-y-6">
            <div className="flex gap-4">
              <input 
                type="text" 
                placeholder="Synchronize global announcement..." 
                className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 focus:ring-1 focus:ring-jtweet-cyan/50 text-sm"
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
              />
              <button 
                onClick={handleBroadcast}
                disabled={isBroadcasting}
                className="bg-jtweet-cyan text-jtweet-black font-bold px-6 py-3 rounded-2xl hover:shadow-cyan transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isBroadcasting ? "Syncing..." : <><Send size={18} /> Broadcast</>}
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               <AdminTool label="Global Notice" active />
               <AdminTool label="Purge Cache" />
               <AdminTool label="Sync Nodes" />
               <AdminTool label="Export Data" />
            </div>
         </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="glass p-6 rounded-[32px] border-white/5 hover:bg-white/5 transition-all group">
      <div className="flex items-center justify-between mb-4">
         <div className="p-3 glass rounded-2xl border-white/5 group-hover:scale-110 transition-transform">
            {icon}
         </div>
         <ArrowUpRight size={16} className="text-white/20 group-hover:text-jtweet-cyan transition-colors" />
      </div>
      <div>
         <p className="text-xs font-bold text-white/40 uppercase tracking-widest">{title}</p>
         <h4 className="text-2xl font-display font-bold mt-1">{value}</h4>
         <p className="text-[10px] text-jtweet-cyan mt-2 font-bold">{trend}</p>
      </div>
    </div>
  );
}

function HealthLine({ label, value, status }: { label: string, value: string, status: 'good' | 'warning' | 'danger' }) {
  const colors = {
    good: 'bg-green-400',
    warning: 'bg-yellow-400',
    danger: 'bg-red-400'
  };

  return (
    <div className="flex items-center justify-between p-3 glass rounded-2xl border-white/5">
       <span className="text-sm text-white/60">{label}</span>
       <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold">{value}</span>
          <div className={`w-2 h-2 rounded-full ${colors[status]}`} />
       </div>
    </div>
  );
}

function AdminTool({ label, active }: { label: string, active?: boolean }) {
  return (
    <button className={`p-4 glass rounded-2xl transition-all font-bold text-xs uppercase tracking-widest ${active ? 'border-jtweet-cyan bg-jtweet-cyan/10 text-jtweet-cyan ring-1 ring-jtweet-cyan/20' : 'border-white/5 hover:border-jtweet-cyan/30 hover:bg-jtweet-cyan/10'}`}>
       {label}
    </button>
  );
}
