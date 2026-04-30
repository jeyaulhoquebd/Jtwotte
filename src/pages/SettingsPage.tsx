import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useSocial } from '../context/SocialContext';
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
  Save
} from 'lucide-react';
import { motion } from 'motion/react';

export default function SettingsPage() {
  const { user, logout } = useAuth();
  const { updateProfile } = useSocial();
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleUpdate = async () => {
    setIsSaving(true);
    await updateProfile({ name, bio });
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen">
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
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 focus:ring-1 focus:ring-jtweet-cyan/50 transition-all"
                         value={name}
                         onChange={(e) => setName(e.target.value)}
                      />
                   </div>
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] text-white/40 uppercase font-bold tracking-widest ml-4">Protocol Bio</label>
                   <textarea 
                      className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 focus:ring-1 focus:ring-jtweet-cyan/50 min-h-[100px] transition-all"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                   />
                </div>
                <button 
                  onClick={handleUpdate}
                  disabled={isSaving}
                  className="w-full py-3 bg-jtweet-cyan text-jtweet-black font-bold uppercase tracking-widest text-xs rounded-2xl hover:shadow-cyan transition-all flex items-center justify-center gap-2"
                >
                   {isSaving ? <div className="w-4 h-4 border-2 border-jtweet-black border-t-transparent animate-spin rounded-full" /> : <Save size={16} />}
                   Update Kernel
                </button>
            </div>
         </section>

         <section className="space-y-4">
            <h3 className="text-xs font-bold text-jtweet-cyan uppercase tracking-widest px-2">Module Configuration</h3>
            <div className="glass rounded-[32px] border-white/5 divide-y divide-white/5 overflow-hidden">
               <SettingsItem icon={<Lock className="text-purple-400" />} label="Neural Shield" description="Encryption and password params" />
               <SettingsItem icon={<Eye className="text-green-400" />} label="Visibility Matrix" description="Who can track your signal" />
               <SettingsItem icon={<Palette className="text-pink-400" />} label="Visual Interface" description="Cyber, Dark, or Plasma themes" />
               <SettingsItem icon={<Bell className="text-yellow-400" />} label="Alert Frequency" description="Configure incoming signal logs" />
               <SettingsItem icon={<Globe className="text-blue-400" />} label="Regional Mesh" description="Local language and region nodes" />
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
               <ChevronRight size={18} className="text-white/20" />
            </button>
         </section>
      </div>
    </div>
  );
}

function SettingsItem({ icon, label, description }: { icon: React.ReactNode, label: string, description: string }) {
  return (
    <div className="p-4 flex items-center justify-between hover:bg-white/5 transition-all cursor-pointer group">
       <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white/5 rounded-xl group-hover:bg-white/10 transition-colors">
             {icon}
          </div>
          <div>
             <h4 className="font-bold text-white text-sm">{label}</h4>
             <p className="text-[10px] text-white/40 font-bold uppercase tracking-tighter">{description}</p>
          </div>
       </div>
       <ChevronRight size={18} className="text-white/20 group-hover:text-jtweet-cyan transition-colors" />
    </div>
  );
}
