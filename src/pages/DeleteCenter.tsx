import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Trash2, 
  Search, 
  Filter, 
  ChevronRight, 
  Activity, 
  MessageCircle, 
  Eye, 
  Heart,
  Image as ImageIcon, 
  Video, 
  FileText, 
  ShieldAlert,
  X,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ExternalLink,
  Edit3
} from 'lucide-react';
import { useTweets } from '../context/TweetContext';
import { useAuth } from '../context/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

type FilterType = 'all' | 'text' | 'images' | 'videos' | 'drafts' | 'scheduled';
type SortType = 'newest' | 'oldest' | 'most-viewed' | 'most-liked';

export default function DeleteCenter() {
  const { tweets, deleteTweet, loading: tweetsLoading } = useTweets();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [activeSort, setActiveSort] = useState<SortType>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showConfirm, setShowConfirm] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'founder' || user?.email === 'jeyaulbooks@gmail.com';
  const isFounder = user?.role === 'founder' || user?.email === 'jeyaulbooks@gmail.com';

  const userPosts = useMemo(() => {
    // Admins see everything, users see only their own
    let base = isAdmin ? tweets : tweets.filter(t => t.authorId === user?.uid);

    // Filter by type
    if (activeFilter === 'text') base = base.filter(t => !t.media);
    if (activeFilter === 'images') base = base.filter(t => t.media?.images && t.media.images.length > 0);
    if (activeFilter === 'videos') base = base.filter(t => t.media?.youtubeId || t.media?.facebookVideoId || t.media?.tiktokId);
    
    // Search
    if (search) {
      const s = search.toLowerCase();
      base = base.filter(t => t.content.toLowerCase().includes(s) || t.author?.name.toLowerCase().includes(s));
    }

    // Sort
    return [...base].sort((a, b) => {
      if (activeSort === 'newest') return (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0);
      if (activeSort === 'oldest') return (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0);
      if (activeSort === 'most-viewed') return (b.impressions || 0) - (a.impressions || 0);
      if (activeSort === 'most-liked') return (b.likesCount || 0) - (a.likesCount || 0);
      return 0;
    });
  }, [tweets, user, isAdmin, activeFilter, activeSort, search]);

  const handleDelete = async (tweetId: string) => {
    setDeletingId(tweetId);
    try {
      await deleteTweet(tweetId);
      setSuccessToast(true);
      setTimeout(() => setSuccessToast(false), 3000);
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingId(null);
      setShowConfirm(null);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="p-6 md:p-8 border-b border-white/5 relative overflow-hidden glass sticky top-0 z-30">
        <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-[0_0_20px_rgba(239,44,44,0.2)]">
                <ShieldAlert size={28} />
             </div>
             <div>
                <h1 className="text-2xl font-bold uppercase tracking-widest leading-none">Delete Center</h1>
                <p className="text-[10px] text-white/40 uppercase font-mono mt-2 tracking-widest">
                  Signal Purge & Neural Buffer Management
                </p>
             </div>
          </div>

          <div className="flex items-center gap-3">
             <div className="flex-1 md:w-64 relative group">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-red-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Filter signals..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-xs font-mono focus:border-red-500/50 transition-all outline-none"
                />
             </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-1">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 border-r border-white/5 p-6 space-y-8 bg-[#080808]/50 backdrop-blur-xl">
           <div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Filter size={10} /> 
                Entity Type
              </p>
              <div className="space-y-1">
                 <FilterButton active={activeFilter === 'all'} label="Total Network" onClick={() => setActiveFilter('all')} icon={<Activity size={14}/>} />
                 <FilterButton active={activeFilter === 'text'} label="Raw Scripts" onClick={() => setActiveFilter('text')} icon={<FileText size={14}/>} />
                 <FilterButton active={activeFilter === 'images'} label="Visual Buffers" onClick={() => setActiveFilter('images')} icon={<ImageIcon size={14}/>} />
                 <FilterButton active={activeFilter === 'videos'} label="Neural Streams" onClick={() => setActiveFilter('videos')} icon={<Video size={14}/>} />
              </div>
           </div>

           <div>
              <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                <Activity size={10} /> 
                Neural Ranking
              </p>
              <div className="space-y-1">
                 <FilterButton active={activeSort === 'newest'} label="Latest Signal" onClick={() => setActiveSort('newest')} />
                 <FilterButton active={activeSort === 'oldest'} label="Deep Archive" onClick={() => setActiveSort('oldest')} />
                 <FilterButton active={activeSort === 'most-viewed'} label="High Amplitude" onClick={() => setActiveSort('most-viewed')} />
                 <FilterButton active={activeSort === 'most-liked'} label="Resonant Nodes" onClick={() => setActiveSort('most-liked')} />
              </div>
           </div>

           {isFounder && (
             <div className="pt-6 border-t border-white/5">
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl">
                   <p className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-2 mb-2">
                      <ShieldAlert size={12} />
                      Master Access
                   </p>
                   <p className="text-[9px] text-white/40 leading-relaxed uppercase">
                      Admin node detected. All platform signals are visible and modifiable.
                   </p>
                </div>
             </div>
           )}
        </aside>

        {/* Main List */}
        <main className="flex-1 p-4 md:p-8">
           {tweetsLoading ? (
             <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-red-500" size={32} />
             </div>
           ) : userPosts.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-20 border border-dashed border-white/10 rounded-3xl opacity-40">
                <AlertCircle size={48} className="mb-4" />
                <p className="text-sm font-bold uppercase tracking-widest">No signals detected in this range</p>
             </div>
           ) : (
             <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                {userPosts.map(tweet => (
                  <PostCard 
                    key={tweet.id} 
                    tweet={tweet} 
                    isDeleting={deletingId === tweet.id}
                    onDelete={() => setShowConfirm(tweet.id)}
                    onView={() => navigate(`/profile/${tweet.authorId}`)}
                  />
                ))}
             </div>
           )}
        </main>
      </div>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
             <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               onClick={() => setShowConfirm(null)}
               className="absolute inset-0 bg-black/80 backdrop-blur-sm"
             />
             <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="w-full max-w-md glass border border-red-500/30 rounded-3xl p-8 relative shadow-[0_0_50px_rgba(239,44,44,0.15)]"
             >
                <div className="flex flex-col items-center text-center">
                   <div className="w-16 h-16 rounded-2xl bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-500 mb-6 animate-pulse">
                      <Trash2 size={32} />
                   </div>
                   <h2 className="text-xl font-bold uppercase tracking-widest mb-2">Signal Redaction</h2>
                   <p className="text-sm text-white/60 leading-relaxed mb-8">
                     Are you sure you want to permanently erase this signal and all associated neural traces from the network? This action is irreversible.
                   </p>
                   
                   <div className="grid grid-cols-2 gap-4 w-full">
                      <button 
                        onClick={() => setShowConfirm(null)}
                        className="py-4 rounded-xl border border-white/10 text-xs font-bold uppercase tracking-[0.2em] hover:bg-white/5 transition-all"
                      >
                        Abort
                      </button>
                      <button 
                        onClick={() => handleDelete(showConfirm)}
                        className="py-4 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold uppercase tracking-[0.2em] shadow-red transition-all"
                      >
                        Purge Now
                      </button>
                   </div>
                </div>
             </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Success Toast */}
      <AnimatePresence>
        {successToast && (
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 50, opacity: 0 }}
            className="fixed bottom-8 right-8 z-[110]"
          >
             <div className="glass px-6 py-4 rounded-2xl border border-green-500/30 shadow-[0_0_30px_rgba(34,197,94,0.1)] flex items-center gap-4">
                <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">
                   <CheckCircle2 size={16} />
                </div>
                <div>
                   <p className="text-[10px] font-bold text-white uppercase tracking-widest">Signal Erased</p>
                   <p className="text-[9px] text-white/40 uppercase">Neural traces cleared successfully</p>
                </div>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function FilterButton({ active, label, onClick, icon }: { active: boolean, label: string, onClick: () => void, icon?: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-[10px] uppercase font-bold tracking-widest transition-all ${
        active ? 'bg-red-500/10 text-red-500 border border-red-500/20 shadow-[inset_0_0_10px_rgba(239,44,44,0.05)]' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      {icon && icon}
      {label}
    </button>
  );
}

function PostCard({ tweet, isDeleting, onDelete, onView }: { tweet: any, isDeleting: boolean, onDelete: () => void, onView: () => void }) {
  const timestamp = tweet.timestamp?.seconds ? formatDistanceToNow(new Date(tweet.timestamp.seconds * 1000), { addSuffix: true }) : 'unknown';
  const type = tweet.media?.youtubeId || tweet.media?.facebookVideoId ? 'Video' : tweet.media?.images?.length ? 'Image' : 'Text';

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -2 }}
      className="relative group/card"
    >
      {/* Mobile Swipe Layers */}
      <div className="absolute inset-0 rounded-2xl flex items-center justify-between px-6 pointer-events-none">
         <div className="flex items-center gap-2 text-blue-500/40 font-bold text-[10px] uppercase">
            <Edit3 size={16} /> Edit Mode
         </div>
         <div className="flex items-center gap-2 text-red-500/40 font-bold text-[10px] uppercase">
            Delete Signal <Trash2 size={16} />
         </div>
      </div>

      <motion.div 
        drag="x"
        dragConstraints={{ left: -100, right: 100 }}
        onDragEnd={(_, info) => {
          if (info.offset.x < -80) onDelete();
          if (info.offset.x > 80) alert("Accessing Neural Editor...");
        }}
        className="p-4 rounded-2xl border border-white/5 bg-white/2 hover:border-white/10 transition-all flex gap-4 relative z-10 glass cursor-grab active:cursor-grabbing"
      >
        <div className="w-20 h-20 rounded-xl bg-white/5 border border-white/10 shrink-0 overflow-hidden relative shadow-lg">
            {tweet.media?.images?.[0] ? (
              <img src={tweet.media.images[0]} className="w-full h-full object-cover" />
            ) : (tweet.media?.youtubeId || tweet.media?.facebookVideoId) ? (
              <div className="w-full h-full flex items-center justify-center bg-red-500/10 text-red-500">
                <Video size={24} />
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-white/20">
                <FileText size={24} />
              </div>
            )}
            <div className="absolute top-1 right-1 px-1.5 py-0.5 bg-black/80 backdrop-blur-md rounded-md text-[7px] font-bold uppercase tracking-tighter border border-white/10 text-red-500">
              {type}
            </div>
        </div>

        <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] font-mono text-white/40 uppercase truncate">ID: {tweet.id.substring(0, 12)}...</span>
              <span className="text-[9px] text-white/20 uppercase font-bold">{timestamp}</span>
            </div>
            <p className="text-xs text-white/80 mb-4 line-clamp-2 leading-relaxed">
              {tweet.content || "Empty signal data..."}
            </p>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-[10px] font-mono text-white/40">
                  <span className="flex items-center gap-1.5"><Eye size={10} className="text-jtweet-cyan"/> {tweet.impressions || 0}</span>
                  <span className="flex items-center gap-1.5"><Heart size={10} className="text-red-500"/> {tweet.likesCount || 0}</span>
                  <span className="flex items-center gap-1.5"><MessageCircle size={10} className="text-blue-500"/> {tweet.repliesCount || 0}</span>
              </div>
              
              <div className="flex items-center gap-2 opacity-100 md:opacity-0 group-hover/card:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onView(); }}
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-jtweet-cyan border border-white/5 transition-colors"
                  >
                    <ExternalLink size={14} />
                  </button>
                  <button 
                    className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-blue-500 border border-white/5 transition-colors"
                  >
                    <Edit3 size={14} />
                  </button>
                  <button 
                    disabled={isDeleting}
                    onClick={(e) => { e.stopPropagation(); onDelete(); }}
                    className="p-2 rounded-lg bg-white/10 hover:bg-red-600 text-red-500 hover:text-white border border-red-500/20 transition-all shadow-[0_0_15px_rgba(239,44,44,0.1)] active:scale-90"
                  >
                    {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  </button>
              </div>
            </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
