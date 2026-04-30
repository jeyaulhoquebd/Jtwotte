import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Repeat2, ShieldCheck, Image as ImageIcon, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTweets } from '../context/TweetContext';
import { suggestTweet } from '../services/geminiService';
import TweetCard from '../components/TweetCard';
import { TweetSkeleton } from '../components/Skeleton';

type FeedType = 'for-you' | 'following' | 'trending';

export default function HomeFeed() {
  const { user } = useAuth();
  const { tweets, postTweet, loading, toggleLike, retweet, deleteTweet } = useTweets();
  const [newTweet, setNewTweet] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [retweetModal, setRetweetModal] = useState<{ id: string, name: string } | null>(null);
  const [retweetCaption, setRetweetCaption] = useState('');
  const [activeFeed, setActiveFeed] = useState<FeedType>('for-you');
  const [selectedMedia, setSelectedMedia] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const filteredTweets = useMemo(() => {
    let base = [...tweets];
    
    if (activeFeed === 'trending') {
      return base.sort((a, b) => (b.likesCount + b.retweetsCount) - (a.likesCount + a.retweetsCount));
    }
    
    if (activeFeed === 'for-you') {
      // Enhanced sorting algorithm: 
      // score = (likes * 0.4) + (retweets * 0.3) + (replies * 0.2) + (impressions * 0.1)
      // also factor in time decay
      return base.sort((a, b) => {
        const scoreA = (a.likesCount * 0.4) + (a.retweetsCount * 0.3) + (a.repliesCount * 0.2) + (a.impressions * 0.1);
        const scoreB = (b.likesCount * 0.4) + (b.retweetsCount * 0.3) + (b.repliesCount * 0.2) + (b.impressions * 0.1);
        
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : Date.now();
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : Date.now();
        
        // Weight relative to current time (simple linear decay)
        const ageFactorA = Math.max(0, 1 - (Date.now() - timeA) / (1000 * 60 * 60 * 24)); // 24h decay
        const ageFactorB = Math.max(0, 1 - (Date.now() - timeB) / (1000 * 60 * 60 * 24));
        
        return (scoreB * (0.5 + ageFactorB)) - (scoreA * (0.5 + ageFactorA));
      });
    }
    
    return base;
  }, [tweets, activeFeed]);

  const handleMediaSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedMedia(file);
      const reader = new FileReader();
      reader.onloadend = () => setMediaPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePost = async () => {
    if (!newTweet.trim() && !mediaPreview) return;
    
    // In a real app, you'd upload the file to storage here and get a URL.
    // We'll pass the mediaPreview (dataURL) for simulation or storage.
    const media = mediaPreview ? { url: mediaPreview, type: selectedMedia?.type.startsWith('video') ? 'video' : 'image' } : undefined;
    
    await postTweet(newTweet, media);
    setNewTweet('');
    setSuggestions([]);
    setSelectedMedia(null);
    setMediaPreview(null);
  };

  const handleRetweetSubmit = async () => {
    if (!retweetModal) return;
    await retweet(retweetModal.id, retweetCaption);
    setRetweetModal(null);
    setRetweetCaption('');
  };

  const handleSuggest = async () => {
    setIsSuggesting(true);
    const result = await suggestTweet(newTweet || "innovation and future tech");
    if (Array.isArray(result)) {
      setSuggestions(result);
    }
    setIsSuggesting(false);
  };

  return (
    <div className="relative">
      <header className="sticky top-0 z-10 glass backdrop-blur-md border-b border-white/5">
        <div className="p-4 flex items-center justify-between">
          <h2 className="text-xl font-display font-bold tracking-tight flex items-center gap-2">
            Main Protocol
            {user?.role === 'admin' && <ShieldCheck size={18} className="text-jtweet-cyan shadow-cyan" />}
          </h2>
          <div className="flex gap-2">
             <button className="text-[10px] font-bold text-jtweet-cyan px-2 py-0.5 rounded-full bg-jtweet-cyan/10 border border-jtweet-cyan/20 uppercase tracking-widest">Live</button>
          </div>
        </div>
        <div className="flex px-4 divide-x divide-white/5 border-t border-white/5">
           <FeedTab active={activeFeed === 'for-you'} label="For You" onClick={() => setActiveFeed('for-you')} />
           <FeedTab active={activeFeed === 'following'} label="Following" onClick={() => setActiveFeed('following')} />
           <FeedTab active={activeFeed === 'trending'} label="Trending" onClick={() => setActiveFeed('trending')} />
        </div>
      </header>

      {/* Retweet Modal Placeholder */}
      <AnimatePresence>
        {retweetModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-jtweet-black/80 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="glass p-6 rounded-[32px] w-full max-w-md border-white/10"
            >
              <h3 className="text-sm font-bold text-jtweet-cyan mb-4 uppercase tracking-widest">Share Pulse</h3>
              <textarea 
                className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder-white/20 resize-none min-h-[100px]"
                placeholder="Add your commentary (optional)..."
                autoFocus
                value={retweetCaption}
                onChange={(e) => setRetweetCaption(e.target.value)}
              />
              <div className="p-3 glass rounded-2xl border-white/5 bg-white/2 mb-6">
                <p className="text-[10px] text-white/40 mb-1">Retweeting from {retweetModal.name}</p>
                <p className="text-xs truncate text-white/60">Broadcast original signal to your feed.</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setRetweetModal(null)} className="flex-1 py-3 font-bold text-white/40 hover:text-white transition-colors">Cancel</button>
                <button onClick={handleRetweetSubmit} className="flex-1 bg-jtweet-cyan text-jtweet-black font-bold py-3 rounded-2xl hover:brightness-110 shadow-cyan">Retweet</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Composer */}
      <div className="p-4 border-b border-white/10">
        <div className="flex gap-4">
          <img src={user?.avatar} alt="Avatar" className="w-12 h-12 rounded-full h-12" referrerPolicy="no-referrer" />
          <div className="flex-1">
            <textarea 
              className="w-full bg-transparent border-none focus:ring-0 text-xl placeholder-white/20 resize-none min-h-[100px]"
              placeholder="Synchronize your thoughts..."
              value={newTweet}
              onChange={(e) => setNewTweet(e.target.value)}
            />
            
            {mediaPreview && (
              <div className="relative mb-4 group">
                {selectedMedia?.type.startsWith('video') ? (
                   <video src={mediaPreview} className="rounded-2xl w-full max-h-[300px] object-cover border border-white/10" controls />
                ) : (
                   <img src={mediaPreview} alt="Preview" className="rounded-2xl w-full max-h-[300px] object-cover border border-white/10" />
                )}
                <button 
                  onClick={() => { setSelectedMedia(null); setMediaPreview(null); }}
                  className="absolute top-2 right-2 p-1.5 bg-jtweet-black/60 backdrop-blur-md rounded-full text-white hover:bg-red-400 transition-colors"
                >
                  <X size={16} />
                </button>
              </div>
            )}
            {suggestions.length > 0 && (
              <div className="mb-4 space-y-2">
                <p className="text-[10px] font-bold text-jtweet-cyan flex items-center gap-1 uppercase tracking-widest bg-jtweet-cyan/10 w-fit px-2 py-0.5 rounded-full mb-2">
                  <Sparkles size={10} /> AI Enhanced Flow
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {suggestions.map((s, i) => (
                    <button key={i} onClick={() => setNewTweet(s)} className="block w-full text-left p-3 text-sm glass rounded-xl hover:bg-jtweet-cyan/5 transition-all text-white/60 hover:text-white border-white/5">{s}</button>
                  ))}
                </div>
              </div>
            )}
            <div className="flex items-center justify-between pt-4 border-t border-white/5">
              <div className="flex items-center gap-1">
                <button 
                  onClick={handleSuggest}
                  disabled={isSuggesting}
                  className="p-2 transition-all disabled:opacity-50 text-jtweet-cyan hover:bg-jtweet-cyan/10 rounded-full"
                >
                  {isSuggesting ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}><Sparkles size={20} /></motion.div> : <Sparkles size={20} />}
                </button>
                <label className="p-2 cursor-pointer text-jtweet-cyan hover:bg-jtweet-cyan/10 rounded-full transition-all">
                   <ImageIcon size={20} />
                   <input type="file" className="hidden" accept="image/*,video/*" onChange={handleMediaSelect} />
                </label>
              </div>
              <button 
                onClick={handlePost}
                disabled={(!newTweet.trim() && !mediaPreview) || loading}
                className="bg-white text-jtweet-black font-bold px-8 py-2 rounded-full hover:scale-105 active:scale-95 disabled:opacity-50 transition-all shadow-white/20 shadow-lg"
              >
                Broadcast
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Feed List */}
      <div className="divide-y divide-white/5">
        {loading && tweets.length === 0 ? (
          <div className="space-y-0">
            <TweetSkeleton />
            <TweetSkeleton />
            <TweetSkeleton />
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTweets.map((tweet) => (
              <TweetCard 
                key={tweet.id} 
                tweet={tweet} 
                onLike={() => toggleLike(tweet.id)} 
                onRetweet={() => setRetweetModal({ id: tweet.id, name: tweet.author?.name || 'User' })}
                onDelete={() => deleteTweet(tweet.id)}
              />
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

function FeedTab({ active, label, onClick }: { active: boolean, label: string, onClick: () => void }) {
  return (
    <button onClick={onClick} className={`flex-1 py-4 text-sm font-bold transition-all relative ${active ? 'text-jtweet-cyan' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
      {label}
      {active && <motion.div layoutId="activeTabHead" className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-jtweet-cyan shadow-cyan rounded-full" />}
    </button>
  );
}
