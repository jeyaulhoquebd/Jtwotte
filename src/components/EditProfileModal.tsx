import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Camera, ShieldCheck, Zap, UploadCloud } from 'lucide-react';
import { useSocial } from '../context/SocialContext';

interface EditProfileModalProps {
  user: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function EditProfileModal({ user, isOpen, onClose }: EditProfileModalProps) {
  const { updateProfile } = useSocial();
  const [formData, setFormData] = useState({
    name: user.name || '',
    bio: user.bio || '',
    location: user.location || '',
    website: user.website || '',
    avatar: user.avatar || '',
    cover: user.cover || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'cover') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile(formData);
      onClose();
    } catch (error) {
      console.error(error);
      alert("System synchronization failure.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-jtweet-black/80 backdrop-blur-md"
          />
          
          <motion.div 
            initial={{ scale: 0.9, y: 20, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.9, y: 20, opacity: 0 }}
            className="relative w-full max-w-xl glass rounded-[40px] border border-white/10 overflow-hidden shadow-2xl"
          >
            <div className="p-6 flex items-center justify-between border-b border-white/5">
               <h3 className="text-xl font-display font-bold text-jtweet-cyan flex items-center gap-2">
                 <Zap size={24} className="fill-jtweet-cyan shadow-cyan" />
                 Protocol Update
               </h3>
               <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                 <X size={20} />
               </button>
            </div>

            <div className="max-h-[80vh] md:max-h-[70vh] overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6 md:space-y-8">
              {/* Cover Upload */}
              <div className="relative group">
                 <div className="h-32 md:h-40 glass rounded-3xl overflow-hidden relative">
                    {formData.cover ? (
                      <img src={formData.cover} className="w-full h-full object-cover" alt="Cover" />
                    ) : (
                      <div className="w-full h-full bg-white/5 flex items-center justify-center text-white/20">
                         <UploadCloud size={32} />
                      </div>
                    )}
                 </div>
                 <button 
                   onClick={() => coverInputRef.current?.click()}
                   className="absolute inset-0 bg-jtweet-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all rounded-3xl"
                 >
                    <div className="bg-jtweet-black/60 p-3 rounded-2xl backdrop-blur-md border border-white/20">
                       <Camera className="text-jtweet-cyan" />
                    </div>
                 </button>
                 <input type="file" ref={coverInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'cover')} />
                 
                 {/* Avatar Upload */}
                 <div className="absolute -bottom-10 left-8">
                    <div className="relative group/avatar">
                       <div className="w-24 h-24 rounded-3xl bg-jtweet-black p-1 border-4 border-jtweet-black glass overflow-hidden shadow-2xl">
                          <img src={formData.avatar} className="w-full h-full object-cover rounded-2xl" alt="Avatar" />
                       </div>
                       <button 
                         onClick={() => avatarInputRef.current?.click()}
                         className="absolute inset-0 bg-jtweet-black/60 rounded-3xl flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-all"
                       >
                          <Camera className="text-jtweet-cyan" />
                       </button>
                    </div>
                    <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, 'avatar')} />
                 </div>
              </div>

              <div className="mt-16 space-y-4">
                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-jtweet-cyan uppercase tracking-widest ml-4">Identity String</label>
                    <input 
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-white/5 border border-white/5 focus:border-jtweet-cyan/50 focus:ring-1 focus:ring-jtweet-cyan/20 rounded-2xl px-6 py-3 transition-all" 
                      placeholder="Display Name"
                    />
                 </div>

                 <div className="space-y-1">
                    <label className="text-[10px] font-bold text-jtweet-cyan uppercase tracking-widest ml-4">Neural Bio</label>
                    <textarea 
                      value={formData.bio}
                      onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                      className="w-full bg-white/5 border border-white/5 focus:border-jtweet-cyan/50 focus:ring-1 focus:ring-jtweet-cyan/20 rounded-2xl px-6 py-3 min-h-[100px] transition-all resize-none" 
                      placeholder="Describe your intelligence protocol..."
                    />
                 </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-jtweet-cyan uppercase tracking-widest ml-4">Sector Location</label>
                       <input 
                         type="text" 
                         value={formData.location}
                         onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                         className="w-full bg-white/5 border border-white/5 focus:border-jtweet-cyan/50 focus:ring-1 focus:ring-jtweet-cyan/20 rounded-2xl px-6 py-3 transition-all" 
                         placeholder="E.g. Neo Tokyo"
                       />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[10px] font-bold text-jtweet-cyan uppercase tracking-widest ml-4">Source Link</label>
                       <input 
                         type="text" 
                         value={formData.website}
                         onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                         className="w-full bg-white/5 border border-white/5 focus:border-jtweet-cyan/50 focus:ring-1 focus:ring-jtweet-cyan/20 rounded-2xl px-6 py-3 transition-all" 
                         placeholder="https://..."
                       />
                    </div>
                 </div>
              </div>
            </div>

            <div className="p-6 border-t border-white/5 bg-white/2 flex gap-4">
               <button onClick={onClose} className="flex-1 py-4 font-bold text-white/40 hover:text-white transition-all">Cancel</button>
               <button 
                 onClick={handleSave}
                 disabled={isSaving}
                 className="flex-1 bg-jtweet-cyan text-jtweet-black font-bold py-4 rounded-2xl shadow-cyan hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2"
               >
                 {isSaving ? "Syncing..." : <><ShieldCheck size={18} /> Update Matrix</>}
               </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
