import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
import { useTweets } from '../context/TweetContext';
import { 
  User, 
  Lock, 
  Eye, 
  Palette, 
  Bell, 
  Globe, 
  LogOut, 
  ChevronRight,
  ShieldCheck,
  Smartphone,
  Save,
  Moon,
  Sun,
  Zap,
  Activity,
  UserCheck,
  UserX,
  Languages
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { updateProfile } = useSocial();
  const { theme, setTheme } = useTweets();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);
  const [activeModule, setActiveModule] = useState<string | null>(null);

  const handleUpdate = async () => {
    setIsSaving(true);
    await updateProfile({ name, bio });
    setIsSaving(false);
  };

  const [shieldActive, setShieldActive] = useState(true);
  const [visibility, setVisibility] = useState('public');
  const [alerts, setAlerts] = useState({
    mentions: true,
    flux: true,
    nodes: false
  });

  const modules = [
    { 
      id: 'shield', 
      icon: <Lock className="text-purple-400" />, 
      label: 'Neural Shield', 
      description: 'Encryption and password parameters',
      content: (
        <div className="space-y-4 p-4">
          <div className="flex items-center justify-between p-3 border border-white/5 rounded-xl bg-white/5">
             <div className="flex flex-col">
               <span className="text-sm font-bold">Two-Factor Auth</span>
               <span className="text-[10px] text-white/40 uppercase font-bold">Biometric verification required</span>
             </div>
             <button 
               onClick={() => setShieldActive(!shieldActive)}
               className={`w-10 h-5 rounded-full relative transition-colors ${shieldActive ? 'bg-jtweet-cyan/40' : 'bg-white/10'}`}
             >
               <motion.div 
                 animate={{ x: shieldActive ? 22 : 2 }}
                 className={`absolute top-1 w-3 h-3 rounded-full shadow-sm ${shieldActive ? 'bg-jtweet-cyan shadow-cyan' : 'bg-white/40'}`} 
               />
             </button>
          </div>
          <button 
            onClick={() => alert("SIGNAL LOG: Regenerating neural access keys... Cluster re-indexing initiated.")}
            className="w-full py-2 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-widest border border-white/10 transition-all active:scale-95"
          >
            Cycle Access Keys
          </button>
        </div>
      )
    },
    { 
      id: 'visibility', 
      icon: <Eye className="text-green-400" />, 
      label: 'Visibility Matrix', 
      description: 'Who can track your signal',
      content: (
        <div className="space-y-2 p-4">
          <VisibilityOption 
            icon={<UserCheck size={14}/>} 
            label="Public Trace" 
            description="Visible to all neural nodes" 
            active={visibility === 'public'} 
            onClick={() => setVisibility('public')}
          />
          <VisibilityOption 
            icon={<Activity size={14}/>} 
            label="Linked Nodes" 
            description="Only following nodes can track" 
            active={visibility === 'linked'} 
            onClick={() => setVisibility('linked')}
          />
          <VisibilityOption 
            icon={<UserX size={14}/>} 
            label="Shadow Mode" 
            description="Full signal stealth" 
            active={visibility === 'shadow'} 
            onClick={() => setVisibility('shadow')}
          />
        </div>
      )
    },
    { 
      id: 'interface', 
      icon: <Palette className="text-pink-400" />, 
      label: 'Visual Interface', 
      description: 'Cyber, Dark, or Plasma themes',
      content: (
        <div className="grid grid-cols-3 gap-2 p-4">
          <ThemeOption active={theme === 'cyber'} id="cyber" label="Cyber" icon={<Zap size={14} className="text-jtweet-cyan shadow-cyan"/>} onClick={() => setTheme('cyber')} />
          <ThemeOption active={theme === 'dark'} id="dark" label="Dark" icon={<Moon size={14} className="text-white"/>} onClick={() => setTheme('dark')} />
          <ThemeOption active={theme === 'plasma'} id="plasma" label="Plasma" icon={<Activity size={14} className="text-[#ff00ff] shadow-[0_0_10px_#ff00ff]"/>} onClick={() => setTheme('plasma')} />
        </div>
      )
    },
    { 
      id: 'frequency', 
      icon: <Bell className="text-yellow-400" />, 
      label: 'Alert Frequency', 
      description: 'Configure incoming signal logs',
      content: (
        <div className="space-y-3 p-4">
           {[
             { id: 'mentions', label: 'Neural Mentions' },
             { id: 'flux', label: 'Signal High Flux' },
             { id: 'nodes', label: 'New Node Connections' }
           ].map(opt => (
             <div key={opt.id} className="flex items-center justify-between">
                <span className="text-[11px] font-bold opacity-60 uppercase">{opt.label}</span>
                <button 
                  onClick={() => setAlerts(prev => ({ ...prev, [opt.id]: !prev[opt.id as keyof typeof alerts] }))}
                  className={`w-8 h-4 rounded-full relative transition-colors ${alerts[opt.id as keyof typeof alerts] ? 'bg-jtweet-cyan/20' : 'bg-white/10'}`}
                >
                   <motion.div 
                     animate={{ x: alerts[opt.id as keyof typeof alerts] ? 18 : 2 }}
                     className={`absolute top-1 w-2 h-2 rounded-full ${alerts[opt.id as keyof typeof alerts] ? 'bg-jtweet-cyan shadow-cyan' : 'bg-white/40'}`} 
                   />
                </button>
             </div>
           ))}
        </div>
      )
    },
    { 
      id: 'mesh', 
      icon: <Globe className="text-blue-400" />, 
      label: 'Regional Mesh', 
      description: 'Local language and region nodes',
      content: (
        <div className="p-4 space-y-4">
           <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/10 font-mono text-[10px] uppercase">
              <Languages size={14} className="text-blue-400" />
              <div className="flex flex-col">
                <span className="text-white/40">Current Node</span>
                <span className="text-white">EN-US / Pacific Alpha</span>
              </div>
           </div>
           <button 
             onClick={() => alert("ACCESS DENIED: Regional master nodes are currently locked in your quadrant.")}
             className="w-full py-2 text-[10px] font-bold border border-white/5 rounded-xl opacity-40 hover:opacity-100 transition-opacity uppercase tracking-widest"
           >
             Select Different Mesh
           </button>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen pb-24">
      <header className="sticky top-0 z-10 glass border-b border-white/5 p-4">
         <h2 className="text-xl font-display font-bold">System Parameters</h2>
         <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Neural core configuration</p>
      </header>

      <div className="p-4 space-y-8">
         <section className="space-y-4">
            <h3 className="text-xs font-bold text-jtweet-cyan uppercase tracking-widest px-2">Identity Core</h3>
            <div className="glass rounded-[32px] border-white/5 p-6 space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest ml-4">Full Identity Name</label>
                   <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={18} />
                      <input 
                         type="text" 
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-1 focus:ring-jtweet-cyan/50 transition-all font-bold"
                         value={name}
                         placeholder="Sync identity name..."
                         onChange={(e) => setName(e.target.value)}
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest ml-4">Protocol Bio</label>
                   <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:ring-1 focus:ring-jtweet-cyan/50 min-h-[100px] transition-all text-sm font-medium"
                      value={bio}
                      placeholder="Input neural signature or purpose..."
                      onChange={(e) => setBio(e.target.value)}
                   />
                </div>
                <button 
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="w-full py-3 bg-jtweet-cyan text-jtweet-black font-bold uppercase tracking-widest text-xs rounded-2xl hover:shadow-cyan transition-all flex items-center justify-center gap-2 group"
                >
                   {isSaving ? <div className="w-4 h-4 border-2 border-jtweet-black border-t-transparent animate-spin rounded-full" /> : <Save size={16} className="group-hover:scale-125 transition-transform" />}
                   Update Kernel
                </button>
            </div>
         </section>

         <section className="space-y-4">
            <h3 className="text-xs font-bold text-jtweet-cyan uppercase tracking-widest px-2">Module Configuration</h3>
            <div className="glass rounded-[32px] border-white/5 divide-y divide-white/5 overflow-hidden">
               {modules.map((m) => (
                 <div key={m.id} className="transition-all">
                    <button 
                      onClick={() => setActiveModule(activeModule === m.id ? null : m.id)}
                      className={`w-full p-4 flex items-center justify-between hover:bg-white/5 transition-all text-left group ${activeModule === m.id ? 'bg-white/5' : ''}`}
                    >
                       <div className="flex items-center gap-4">
                          <div className={`p-2.5 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors ${activeModule === m.id ? 'bg-white/10 shadow-sm shadow-white/5' : ''}`}>
                             {m.icon}
                          </div>
                          <div>
                             <h4 className="font-bold text-white text-sm">{m.label}</h4>
                             <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">{m.description}</p>
                          </div>
                       </div>
                       <ChevronRight size={18} className={`text-white/20 group-hover:text-jtweet-cyan transition-transform ${activeModule === m.id ? 'rotate-90 text-jtweet-cyan' : ''}`} />
                    </button>
                    <AnimatePresence>
                       {activeModule === m.id && (
                         <motion.div 
                           initial={{ height: 0, opacity: 0 }}
                           animate={{ height: 'auto', opacity: 1 }}
                           exit={{ height: 0, opacity: 0 }}
                           className="overflow-hidden bg-black/20"
                         >
                            {m.content}
                         </motion.div>
                       )}
                    </AnimatePresence>
                 </div>
               ))}
            </div>
         </section>

         <section className="space-y-4">
            <h3 className="text-xs font-bold text-red-500 uppercase tracking-widest px-2">Termination Logic</h3>
            <button 
               onClick={logout}
               className="w-full glass border border-red-500/10 hover:bg-red-500/5 p-4 rounded-2xl flex items-center justify-between group transition-all"
            >
               <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-red-500/10 rounded-xl">
                     <LogOut className="text-red-500" size={20} />
                  </div>
                  <div className="text-left">
                     <h4 className="font-bold text-white group-hover:text-red-500">De-authenticate</h4>
                     <p className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Terminate active session</p>
                  </div>
               </div>
               <ChevronRight size={18} className="text-white/20 group-hover:text-red-500 transition-colors" />
            </button>
         </section>
      </div>
    </div>
  );
}

function VisibilityOption({ icon, label, description, active = false, onClick }: { icon: React.ReactNode, label: string, description: string, active?: boolean, onClick?: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`p-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${active ? 'bg-jtweet-cyan/5 border-jtweet-cyan/20' : 'bg-transparent border-white/5 hover:border-white/10 opacity-40 hover:opacity-100'}`}
    >
       <div className="flex items-center gap-3">
          <div className={`${active ? 'text-jtweet-cyan' : 'text-white/20'}`}>
             {icon}
          </div>
          <div className="flex flex-col">
             <span className="text-[11px] font-bold uppercase">{label}</span>
             <span className="text-[9px] opacity-40 font-bold">{description}</span>
          </div>
       </div>
       {active && <div className="w-1.5 h-1.5 rounded-full bg-jtweet-cyan shadow-cyan" />}
    </div>
  );
}

function ThemeOption({ icon, label, id, active, onClick }: { icon: React.ReactNode, label: string, id: string, active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all group ${active ? 'bg-white/10 border-jtweet-cyan shadow-sm shadow-jtweet-cyan/20' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
    >
       <div className={`transition-transform group-hover:scale-125 ${active ? 'scale-110' : 'opacity-40'}`}>
          {icon}
       </div>
       <span className={`text-[9px] font-bold uppercase tracking-widest ${active ? 'text-jtweet-cyan' : 'text-white/20'}`}>{label}</span>
    </button>
  );
}
