import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTweets } from '../context/TweetContext';
import { useSocial } from '../context/SocialContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Calendar, 
  MapPin, 
  Link as LinkIcon, 
  ChevronLeft, 
  Settings, 
  Edit3,
  ShieldCheck,
  Zap,
  Grid,
  Heart,
  MessageSquare,
  Repeat2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TweetCard from '../components/TweetCard';

export default function ProfilePage() {
  const { uid } = useParams();
  const { user: currentUser } = useAuth();
  const { tweets, toggleLike, retweet, deleteTweet } = useTweets();
  const { followUser, unfollowUser, isFollowing, getFollowersCount, getFollowingCount } = useSocial();
  
  const [profileUser, setProfileUser] = useState<any>(null);
  const [following, setFollowing] = useState(false);
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('signals');

  const isMe = currentUser?.uid === uid;

  useEffect(() => {
    const loadProfile = async () => {
      if (!uid) return;
      setLoading(true);
      const userSnap = await getDoc(doc(db, 'users', uid));
      if (userSnap.exists()) {
        setProfileUser(userSnap.data());
      }
      
      const [fol, followersCount, followingCount] = await Promise.all([
        isFollowing(uid),
        getFollowersCount(uid),
        getFollowingCount(uid)
      ]);
      
      setFollowing(fol);
      setCounts({ followers: followersCount, following: followingCount });
      setLoading(false);
    };

    loadProfile();
  }, [uid, currentUser]);

  const handleFollow = async () => {
    if (!uid) return;
    if (following) {
      await unfollowUser(uid);
      setFollowing(false);
      setCounts(prev => ({ ...prev, followers: prev.followers - 1 }));
    } else {
      await followUser(uid);
      setFollowing(true);
      setCounts(prev => ({ ...prev, followers: prev.followers + 1 }));
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
       <div className="w-10 h-10 border-2 border-white/5 border-t-jtweet-cyan animate-spin rounded-full" />
    </div>
  );

  if (!profileUser) return <div className="p-20 text-center text-white/40">Entity not found in current sector.</div>;

  const userTweets = tweets.filter(t => t.authorId === uid);

  return (
    <div className="min-h-screen pb-20">
      <header className="sticky top-0 z-10 glass border-b border-white/5 p-4 flex items-center gap-6">
        <Link to="/" className="p-2 hover:bg-white/5 rounded-full text-jtweet-cyan transition-colors">
          <ChevronLeft />
        </Link>
        <div>
           <h2 className="text-xl font-display font-bold flex items-center gap-2">
             {profileUser.name}
             {profileUser.role === 'admin' && <ShieldCheck size={18} className="text-jtweet-cyan shadow-cyan" />}
           </h2>
           <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{userTweets.length} Signal Nodes</p>
        </div>
      </header>

      {/* Banner */}
      <div className="h-48 bg-jtweet-black relative overflow-hidden">
         <div className="absolute inset-0 bg-gradient-to-b from-jtweet-cyan/20 to-transparent flex items-center justify-center">
            <Zap size={64} className="text-jtweet-cyan/10 animate-pulse" />
         </div>
         {/* Profile Pic Placement */}
         <div className="absolute -bottom-16 left-6 p-1 bg-jtweet-black rounded-full border-4 border-jtweet-black z-10">
            <img src={profileUser.avatar} className="w-32 h-32 rounded-full shadow-2xl" alt="" />
            {profileUser.role === 'admin' && (
              <div className="absolute bottom-2 right-2 bg-jtweet-black p-1.5 rounded-full border border-white/10">
                 <ShieldCheck size={16} className="text-jtweet-cyan" />
              </div>
            )}
         </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end p-4 gap-3 mt-4">
         {isMe ? (
           <>
             <button className="px-6 py-2 rounded-full border border-white/10 hover:bg-white/5 transition-all text-xs font-bold uppercase tracking-widest">
                Edit Bio
             </button>
             <Link to="/settings" className="p-2.5 rounded-full border border-white/10 hover:bg-white/5 text-white/60">
                <Settings size={18} />
             </Link>
           </>
         ) : (
           <>
             <button className="p-2.5 rounded-full border border-white/10 hover:bg-white/5 text-white/60">
                <MessageSquare size={18} />
             </button>
             <button 
               onClick={handleFollow}
               className={`px-8 py-2.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${following ? 'border border-white/10 text-white/60 hover:border-red-400 hover:text-red-400' : 'bg-jtweet-cyan text-jtweet-black shadow-cyan'}`}
             >
                {following ? 'Unlink' : 'Connect'}
             </button>
           </>
         )}
      </div>

      {/* Profile Info */}
      <div className="px-6 mt-8 space-y-4">
         <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">{profileUser.name}</h1>
            <p className="text-jtweet-cyan font-mono text-sm">@internal_node_{profileUser.uid.slice(0, 8)}</p>
         </div>

         <p className="text-white/80 max-w-lg leading-relaxed">{profileUser.bio || 'This intelligence hasn\'t declared a protocol objective yet.'}</p>

         <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/40 text-xs font-bold uppercase tracking-wide">
            <div className="flex items-center gap-1.5"><MapPin size={14} /> Neutral Sector</div>
            <div className="flex items-center gap-1.5 text-jtweet-cyan"><LinkIcon size={14} /> source_link.neo</div>
            <div className="flex items-center gap-1.5"><Calendar size={14} /> Joined {profileUser.createdAt?.toDate ? profileUser.createdAt.toDate().getFullYear() : '2026'}</div>
         </div>

         <div className="flex gap-6 pt-4">
            <div className="flex items-center gap-1.5 group cursor-pointer">
               <span className="font-bold text-white text-lg">{counts.following}</span>
               <span className="text-xs text-white/40 uppercase font-bold group-hover:text-jtweet-cyan transition-colors">Following</span>
            </div>
            <div className="flex items-center gap-1.5 group cursor-pointer">
               <span className="font-bold text-white text-lg">{counts.followers}</span>
               <span className="text-xs text-white/40 uppercase font-bold group-hover:text-jtweet-cyan transition-colors">Followers</span>
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="mt-8 border-b border-white/5 flex">
         <ProfileTab active={activeTab === 'signals'} onClick={() => setActiveTab('signals')} label="Signals" icon={<Grid size={16} />} />
         <ProfileTab active={activeTab === 'media'} onClick={() => setActiveTab('media')} label="Media" icon={<Repeat2 size={16} />} />
         <ProfileTab active={activeTab === 'likes'} onClick={() => setActiveTab('likes')} label="Energy" icon={<Heart size={16} />} />
      </div>

      {/* Content */}
      <div className="divide-y divide-white/5">
         {activeTab === 'signals' && (
           userTweets.map(t => (
             <TweetCard 
               key={t.id} 
               tweet={t} 
               onLike={() => toggleLike(t.id)} 
               onRetweet={() => retweet(t.id)} 
               onDelete={() => deleteTweet(t.id)} 
             />
           ))
         )}
         {userTweets.length === 0 && (
           <div className="p-20 text-center text-white/20 uppercase font-bold tracking-[0.3em] text-xs">
              No pulses detected.
           </div>
         )}
      </div>
    </div>
  );
}

function ProfileTab({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon: React.ReactNode }) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 p-4 flex items-center justify-center gap-2 transition-all relative group ${active ? 'text-jtweet-cyan' : 'text-white/40 hover:text-white'}`}
    >
       {icon}
       <span className="text-xs font-bold uppercase tracking-widest">{label}</span>
       {active && (
         <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-jtweet-cyan shadow-cyan" />
       )}
    </button>
  );
}
