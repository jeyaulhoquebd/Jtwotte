import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTweets } from '../context/TweetContext';
import { useSocial } from '../context/SocialContext';
import { useMessages } from '../context/MessageContext';
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
  Repeat2,
  Crown,
  BadgeCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import TweetCard from '../components/TweetCard';
import EditProfileModal from '../components/EditProfileModal';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const { startConversation } = useMessages();
  const navigate = useNavigate();

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

  const handleMessage = async () => {
    if (!uid) return;
    const convId = await startConversation(uid);
    navigate('/messages');
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
      <header className="sticky top-0 z-20 glass border-b border-white/5 p-4 flex items-center gap-6">
        <Link to="/" className="p-2 hover:bg-white/5 rounded-full text-jtweet-cyan transition-colors">
          <ChevronLeft />
        </Link>
        <div>
           <h2 className="text-xl font-display font-bold flex items-center gap-2">
             {profileUser.name}
             {profileUser.role === 'founder' && (
                <div className="flex items-center gap-1 bg-gradient-to-r from-yellow-400/20 to-amber-600/20 px-2 py-0.5 rounded-full border border-yellow-400/30">
                  <Crown size={14} className="text-yellow-400" />
                  <span className="text-[10px] font-bold text-yellow-400 uppercase tracking-widest">Founder</span>
                </div>
              )}
              {(profileUser.role === 'admin' || profileUser.role === 'founder') && <BadgeCheck size={18} className="text-blue-400 fill-blue-400/20" />}
           </h2>
           <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{userTweets.length} Signal Nodes</p>
        </div>
      </header>

      {/* Banner */}
      <div className="h-40 md:h-64 bg-jtweet-black relative overflow-hidden group">
         {profileUser.cover ? (
           <img src={profileUser.cover} className="w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-1000" alt="Cover" referrerPolicy="no-referrer" />
         ) : (
           <div className="absolute inset-0 bg-gradient-to-br from-jtweet-cyan/20 via-jtweet-black to-jtweet-black flex items-center justify-center">
              <Zap size={80} className="text-jtweet-cyan/5 animate-pulse" />
           </div>
         )}
         <div className="absolute inset-0 bg-gradient-to-t from-jtweet-black to-transparent" />
         
         {/* Profile Pic Placement */}
         <div className="absolute -bottom-10 md:-bottom-16 left-4 md:left-8 p-1 md:p-1.5 bg-jtweet-black rounded-2xl md:rounded-[32px] border-4 border-jtweet-black z-10 shadow-2xl overflow-hidden">
            <div className="w-20 h-20 md:w-32 md:h-32 rounded-xl md:rounded-[28px] overflow-hidden relative group/avatar">
              <img src={profileUser.avatar} className="w-full h-full object-cover transition-transform group-hover/avatar:scale-110" alt="Avatar" referrerPolicy="no-referrer" />
              {profileUser.role === 'founder' && (
                <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-gradient-to-br from-yellow-400 to-amber-600 p-1 md:p-1.5 rounded-lg md:rounded-xl border border-white/20 shadow-[0_0_15px_rgba(251,191,36,0.5)]">
                  <Crown size={14} className="text-white md:size-5" />
                </div>
              )}
              {(profileUser.role === 'admin' || profileUser.role === 'founder') && (
                <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 bg-jtweet-black/80 backdrop-blur-md p-1 md:p-1.5 rounded-lg md:rounded-xl border border-blue-400/30">
                  <BadgeCheck size={12} className="text-blue-400 md:size-4" />
                </div>
              )}
            </div>
         </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end p-4 md:p-6 gap-2 md:gap-3 pt-3 md:pt-4">
         {isMe ? (
           <>
             <button 
               onClick={() => setIsEditModalOpen(true)}
               className="px-6 py-2.5 rounded-2xl border border-white/10 hover:border-jtweet-cyan/50 hover:bg-jtweet-cyan/5 transition-all text-xs font-bold uppercase tracking-widest group"
             >
                <span className="flex items-center gap-2 group-hover:text-jtweet-cyan">
                  <Edit3 size={14} /> Synchronize Profile
                </span>
             </button>
             <Link to="/settings" className="p-3 rounded-2xl border border-white/10 hover:bg-white/5 text-white/40 hover:text-white transition-all">
                <Settings size={18} />
             </Link>
           </>
         ) : (
           <>
             <button 
               onClick={handleMessage}
               className="p-3 rounded-2xl border border-white/10 hover:bg-jtweet-cyan/10 text-white/40 hover:text-jtweet-cyan transition-all"
             >
                <MessageSquare size={18} />
             </button>
             <button 
               onClick={handleFollow}
               className={`px-10 py-3 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all ${following ? 'border border-white/10 text-white/40 hover:border-red-400 hover:text-red-400 hover:bg-red-400/5' : 'bg-jtweet-cyan text-jtweet-black shadow-cyan hover:brightness-110 active:scale-95'}`}
             >
                {following ? 'Disengage' : 'Establish Link'}
             </button>
           </>
         )}
      </div>

      <EditProfileModal user={profileUser} isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />


      {/* Profile Info */}
      <div className="px-6 mt-8 space-y-4">
         <div>
            <h1 className="text-3xl font-display font-bold tracking-tight">{profileUser.name}</h1>
            <p className="text-jtweet-cyan font-mono text-sm">@internal_node_{profileUser.uid.slice(0, 8)}</p>
         </div>

         <p className="text-white/80 max-w-lg leading-relaxed">{profileUser.bio || 'This intelligence hasn\'t declared a protocol objective yet.'}</p>

         <div className="flex flex-wrap gap-x-6 gap-y-2 text-white/40 text-xs font-bold uppercase tracking-wide">
            <div className="flex items-center gap-1.5"><MapPin size={14} /> {profileUser.location || 'Unknown Sector'}</div>
            {profileUser.website ? (
              <a href={profileUser.website} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-jtweet-cyan hover:underline transition-all">
                <LinkIcon size={14} /> {profileUser.website.replace(/^https?:\/\//, '')}
              </a>
            ) : (
              <div className="flex items-center gap-1.5 opacity-30"><LinkIcon size={14} /> No Source</div>
            )}
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
